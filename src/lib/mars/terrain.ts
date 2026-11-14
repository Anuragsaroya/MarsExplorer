/**
 * Procedural terrain model per site. Fields mimic the NASA dataset types
 * (MOLA/HiRISE elevation, THEMIS thermal, CRISM minerals, SHARAD/SWIM ice, RAD dose)
 * so the planner can be exercised end-to-end; they are modelled, not real rasters.
 */
import { clamp, fbm, makeNoise, mulberry32, smoothstep, type Noise2D } from "./noise";
import { SITES, WINDOW_H_M, WINDOW_W_M, type SiteDef, type SiteId } from "./sites";

export const FINE_W = 600;
export const FINE_H = 420;
export const NAV_W = 200;
export const NAV_H = 140;
export const NAV_BLOCK = FINE_W / NAV_W; // 3
export const FINE_CELL_M = WINDOW_W_M / FINE_W;
export const NAV_CELL_M = WINDOW_W_M / NAV_W;

/** No ice detected within 10 m. */
export const NO_ICE = 999;

export enum Mineral {
  Dust = 0,
  Olivine = 1,
  Clay = 2,
  Carbonate = 3,
  Sulfate = 4,
  Basalt = 5,
  WaterIce = 6,
}

export const MINERAL_LABEL: Record<Mineral, string> = {
  [Mineral.Dust]: "Dust / regolith",
  [Mineral.Olivine]: "Olivine",
  [Mineral.Clay]: "Clay (phyllosilicate)",
  [Mineral.Carbonate]: "Carbonate",
  [Mineral.Sulfate]: "Sulfate",
  [Mineral.Basalt]: "Basalt",
  [Mineral.WaterIce]: "Water ice",
};

interface Sample {
  elev: number;
  rock: number;
  dune: number;
  mineral: Mineral;
  hydration: number;
  iceDepth: number;
  iceFrac: number;
  albedo: [number, number, number];
  science: number;
}

interface Crater {
  u: number;
  v: number;
  r: number; // km
  ice?: boolean;
}

export interface FieldSet {
  w: number;
  h: number;
  cellM: number;
  elevation: Float32Array;
  slope: Float32Array; // degrees
  aspect: Float32Array; // radians, downslope direction
  rock: Float32Array;
  dune: Float32Array;
  mineral: Uint8Array;
  hydration: Float32Array;
  iceDepth: Float32Array;
  iceFrac: Float32Array;
  temp: Float32Array; // °C mean midday surface
  radiation: Float32Array; // mGy/day
  hazard: Float32Array; // 0..1
  science: Float32Array; // 0..1
  water: Float32Array; // 0..1 water-resource value
}

export interface Terrain {
  site: SiteDef;
  fine: FieldSet & { albedo: Float32Array };
  nav: FieldSet & { passable: Uint8Array };
  elevMin: number;
  elevMax: number;
  tempMin: number;
  tempMax: number;
  radMin: number;
  radMax: number;
}

const kmDist = (u: number, v: number, cu: number, cv: number) =>
  Math.hypot((u - cu) * (WINDOW_W_M / 1000), (v - cv) * (WINDOW_H_M / 1000));

/** Simple-crater profile: bowl depth ≈ 0.2 D, rim ≈ 0.04 D. Returns metres and normalised radius. */
function crater(u: number, v: number, c: Crater) {
  const d = kmDist(u, v, c.u, c.v);
  const r = d / c.r;
  const D = c.r * 2000;
  const depth = 0.2 * D;
  const rim = 0.04 * D;
  let h = 0;
  if (r < 1) h = rim - (depth + rim) * (1 - r * r);
  else if (r < 3) h = rim * Math.exp(-(((r - 1) / 0.45) ** 2));
  return { h, r };
}

function randomCraters(
  seed: number,
  n: number,
  minR: number,
  maxR: number,
  avoid?: (u: number, v: number) => boolean,
) {
  const rnd = mulberry32(seed);
  const out: Crater[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const u = rnd();
    const v = rnd();
    if (avoid?.(u, v)) continue;
    const r = minR + (maxR - minR) * rnd() ** 2.2;
    out.push({ u, v, r });
  }
  return out;
}

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const DUST: [number, number, number] = [0.66, 0.4, 0.25];
const DARK: [number, number, number] = [0.36, 0.23, 0.17];
const BASALT: [number, number, number] = [0.5, 0.31, 0.22];
const PALE: [number, number, number] = [0.76, 0.56, 0.4];
const ICE: [number, number, number] = [0.9, 0.94, 0.97];
const ICE_DIRTY: [number, number, number] = [0.74, 0.7, 0.66];

type Model = (u: number, v: number) => Sample;

function jezeroModel(n: Noise2D, m: Noise2D): Model {
  const belva: Crater = { u: 0.22, v: 0.32, r: 0.45 };
  const smalls = randomCraters(11, 26, 0.03, 0.16, (u, v) => kmDist(u, v, belva.u, belva.v) < 1.2);
  return (u, v) => {
    const bx = 0.41 + 0.07 * Math.sin(v * 5.2 + 0.6) + 0.05 * (fbm(n, v * 5, 3.1, 3) - 0.5);
    // the delta front is a steep scarp with two gentler ramps (sediment fans) a crew can climb
    const ramp = Math.max(
      Math.exp(-(((v - 0.62) / 0.06) ** 2)),
      Math.exp(-(((v - 0.18) / 0.05) ** 2)),
    );
    const halfW = 0.026 + 0.06 * ramp;
    const delta = smoothstep(bx + halfW, bx - halfW, u);
    const scarp = Math.exp(-(((u - bx) / (halfW * 1.2)) ** 2)) * (1 - 0.6 * ramp);
    let elev = -2560 + 35 * (fbm(n, u * 4, v * 4) - 0.5) + 8 * (fbm(m, u * 30, v * 30, 3) - 0.5);
    elev += delta * (110 + 30 * (fbm(m, u * 6, v * 6) - 0.5));
    // inverted channels on the delta top
    for (let i = 0; i < 3; i++) {
      const cv = 0.25 + i * 0.22 + 0.05 * Math.sin(u * 9 + i);
      elev += delta * 12 * Math.exp(-(((v - cv) / 0.012) ** 2));
    }
    // layering terraces on scarp
    elev += scarp * 2.5 * Math.sin(v * 220 + u * 40);
    const seitahT = smoothstep(0.24, 0.12, kmDist(u, v, 0.72, 0.8) / 10);
    const ridges = 0.5 + 0.5 * Math.sin((u * 0.8 + v * 0.35) * 160 + fbm(n, u * 10, v * 10) * 8);
    const dune = seitahT * ridges * smoothstep(0.35, 0.7, fbm(m, u * 12, v * 12));
    elev += dune * 7 + seitahT * 10;

    let rimRock = 0;
    let craterSci = 0;
    for (const c of [belva, ...smalls]) {
      const { h, r } = crater(u, v, c);
      elev += h;
      if (r < 1.5)
        rimRock = Math.max(rimRock, smoothstep(1.6, 0.9, r) * (c === belva ? 0.85 : 0.6));
      if (c === belva && r > 0.7 && r < 1.3) craterSci = 0.9;
    }

    const margin = smoothstep(0.2, 0.08, Math.hypot(u - 0.1, (v - 0.14) * 0.7));
    let mineral: Mineral = Mineral.Basalt;
    let hydration = 0.06;
    let albedo = BASALT;
    if (delta > 0.5) {
      mineral = fbm(m, u * 9, v * 9) > 0.58 ? Mineral.Carbonate : Mineral.Clay;
      hydration = 0.55 + 0.25 * fbm(n, u * 7, v * 7);
      albedo = lerp3(PALE, DUST, fbm(m, u * 20, v * 20));
    } else if (seitahT > 0.4) {
      mineral = Mineral.Olivine;
      hydration = 0.15;
      albedo = lerp3(DARK, BASALT, 1 - dune);
    } else {
      albedo = lerp3(BASALT, DUST, fbm(n, u * 14, v * 14));
    }
    if (margin > 0.4) {
      mineral = Mineral.Carbonate;
      hydration = Math.max(hydration, 0.75);
    }
    const rock = clamp(
      0.12 + 0.35 * (fbm(m, u * 25, v * 25) - 0.4) + scarp * 0.65 + rimRock + seitahT * 0.15,
    );
    const science = clamp(
      0.15 +
        scarp * 0.8 +
        delta * 0.25 +
        craterSci +
        margin * 0.7 +
        seitahT * 0.4 +
        (mineral === Mineral.Carbonate ? 0.15 : 0),
    );
    return { elev, rock, dune, mineral, hydration, iceDepth: NO_ICE, iceFrac: 0, albedo, science };
  };
}

function arcadiaModel(n: Noise2D, m: Noise2D): Model {
  const iceCraters: Crater[] = [
    { u: 0.33, v: 0.72, r: 0.16, ice: true },
    { u: 0.86, v: 0.82, r: 0.1, ice: true },
    { u: 0.52, v: 0.2, r: 0.07, ice: true },
  ];
  const smalls = randomCraters(23, 16, 0.03, 0.14, (u, v) => u < 0.35 && v < 0.35);
  const rnd = mulberry32(77);
  const pts: [number, number][] = [];
  for (let i = 0; i < 70 * 50; i++) pts.push([rnd(), rnd()]);
  const PX = 70;
  const PY = 50;
  const voronoiEdge = (u: number, v: number) => {
    const gx = u * PX;
    const gy = v * PY;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    let f1 = 9;
    let f2 = 9;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        if (cx < 0 || cy < 0 || cx >= PX || cy >= PY) continue;
        const p = pts[cy * PX + cx];
        const d = Math.hypot(cx + p[0] - gx, cy + p[1] - gy);
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
    return f2 - f1;
  };
  return (u, v) => {
    let elev = -3950 + 18 * (fbm(n, u * 3, v * 3) - 0.5) + 3 * (fbm(m, u * 25, v * 25, 3) - 0.5);
    // debris-covered glacier (lobate apron) in the NW corner
    const apronD =
      Math.hypot((u - 0.12) * 1.0, (v - 0.12) * 1.3) + 0.04 * (fbm(m, u * 8, v * 8) - 0.5);
    const apron = smoothstep(0.3, 0.2, apronD);
    const apronEdge = Math.exp(-(((apronD - 0.25) / 0.03) ** 2));
    elev += apron * 90;
    const poly = voronoiEdge(u, v);
    const trough = smoothstep(0.12, 0.0, poly);
    elev -= trough * 1.5 * (1 - apron);

    let iceDepth = 0.35 + 1.4 * fbm(n, u * 5 + 3, v * 5 - 2);
    let iceFrac = 0.45 + 0.35 * fbm(m, u * 4, v * 4);
    let rockAdd = 0;
    let sci = 0.25 + trough * 0.15;
    let isIceSurface = 0;
    for (const c of [...iceCraters, ...smalls]) {
      const { h, r } = crater(u, v, c);
      elev += h;
      if (r < 1.6) rockAdd = Math.max(rockAdd, smoothstep(1.7, 1.0, r) * 0.45);
      if (c.ice && r < 1.8) {
        const t = smoothstep(1.8, 0.9, r);
        isIceSurface = Math.max(isIceSurface, t * (fbm(m, u * 60, v * 60) > 0.35 ? 1 : 0.6));
        sci = Math.max(sci, 0.95 * t);
      }
    }
    if (apron > 0.3) {
      iceDepth = 0.6 + 2 * fbm(n, u * 9, v * 9);
      iceFrac = 0.85;
      sci = Math.max(sci, 0.6);
    }
    if (apronEdge > 0.5 && v > 0.18 && v < 0.45) {
      isIceSurface = Math.max(isIceSurface, apronEdge);
      sci = Math.max(sci, 0.95);
    }
    if (isIceSurface > 0.5) {
      iceDepth = 0;
      iceFrac = 0.95;
    }
    const dust = lerp3(DUST, PALE, fbm(n, u * 10, v * 10) * 0.6);
    let albedo = lerp3(dust, DARK, trough * 0.35);
    if (apron > 0.3) albedo = lerp3(albedo, ICE_DIRTY, 0.35);
    albedo = lerp3(albedo, ICE, isIceSurface);
    const rock = clamp(0.06 + 0.2 * (fbm(m, u * 30, v * 30) - 0.45) + rockAdd + apronEdge * 0.5);
    return {
      elev,
      rock,
      dune: 0,
      mineral: iceDepth === 0 ? Mineral.WaterIce : Mineral.Basalt,
      hydration: 0.1,
      iceDepth,
      iceFrac,
      albedo,
      science: clamp(sci),
    };
  };
}

function korolevModel(n: Noise2D, m: Noise2D): Model {
  const smalls = randomCraters(41, 10, 0.03, 0.1, (u) => u < 0.62);
  return (u, v) => {
    const edge = 0.55 + 0.07 * Math.sin(v * 4.3 + 1.2) + 0.04 * (fbm(n, v * 6, 1.7, 3) - 0.5);
    const ice = smoothstep(edge + 0.02, edge - 0.03, u);
    const rimStart = edge + 0.12;
    const rampK = Math.exp(-(((v - 0.4) / 0.08) ** 2));
    const rimT = smoothstep(rimStart, rimStart + 0.24 + 0.2 * rampK, u);
    let elev = -2300 + 40 * (fbm(n, u * 3, v * 3) - 0.5);
    // ice dome rises gently westward; moat between dome and rim
    elev += ice * (80 + (edge - u) * 900) + ice * 6 * (fbm(m, u * 18, v * 18) - 0.5);
    elev += rimT * 420 + rimT * 40 * (fbm(m, u * 8, v * 8) - 0.5);
    // terraces on rim wall
    elev += rimT * (1 - rimT) * 10 * Math.sin(u * 70);
    let rockAdd = 0;
    for (const c of smalls) {
      const { h, r } = crater(u, v, c);
      elev += h;
      if (r < 1.5) rockAdd = Math.max(rockAdd, smoothstep(1.6, 1.0, r) * 0.5);
    }
    const iceBand = 0.5 + 0.5 * Math.sin(elev * 0.18);
    const moat = (1 - ice) * (1 - rimT);
    const rimWall = rimT * (1 - rimT) * 4;
    let iceDepth = ice > 0.5 ? 0 : 0.4 + 6 * rimT + 1.5 * fbm(n, u * 6, v * 6);
    const iceFrac = ice > 0.5 ? 0.97 : 0.5 - 0.3 * rimT;
    if (moat > 0.5) iceDepth = Math.min(iceDepth, 0.5);
    let albedo = lerp3(lerp3(DARK, BASALT, rimT), DUST, rimT * 0.5);
    albedo = lerp3(albedo, lerp3(ICE, [0.84, 0.88, 0.94], iceBand * 0.4), ice);
    const rock = clamp(
      0.08 + rimWall * 0.5 + rockAdd + 0.2 * (fbm(m, u * 25, v * 25) - 0.45) * (1 - ice),
    );
    const iceEdge = Math.exp(-(((u - edge) / 0.04) ** 2));
    return {
      elev,
      rock,
      dune: 0,
      mineral: ice > 0.5 ? Mineral.WaterIce : rimT > 0.3 ? Mineral.Basalt : Mineral.Sulfate,
      hydration: ice > 0.5 ? 0.95 : 0.2,
      iceDepth,
      iceFrac,
      albedo,
      science: clamp(0.2 + iceEdge * 0.75 + moat * 0.45 + ice * 0.3),
    };
  };
}

const SITE_BASE_TEMP: Record<SiteId, number> = { jezero: -18, arcadia: -48, korolev: -88 };
const MODELS: Record<SiteId, (n: Noise2D, m: Noise2D) => Model> = {
  jezero: jezeroModel,
  arcadia: arcadiaModel,
  korolev: korolevModel,
};

function emptyFields(w: number, h: number, cellM: number): FieldSet {
  const N = w * h;
  return {
    w,
    h,
    cellM,
    elevation: new Float32Array(N),
    slope: new Float32Array(N),
    aspect: new Float32Array(N),
    rock: new Float32Array(N),
    dune: new Float32Array(N),
    mineral: new Uint8Array(N),
    hydration: new Float32Array(N),
    iceDepth: new Float32Array(N),
    iceFrac: new Float32Array(N),
    temp: new Float32Array(N),
    radiation: new Float32Array(N),
    hazard: new Float32Array(N),
    science: new Float32Array(N),
    water: new Float32Array(N),
  };
}

export function waterValue(iceDepth: number, hydration: number) {
  if (iceDepth <= 0.05) return 1;
  if (iceDepth < 1) return 0.85 - iceDepth * 0.2;
  if (iceDepth < 3) return 0.45;
  return clamp(hydration * 0.6);
}

export function hazardScore(slope: number, rock: number, dune: number, iceDepth: number) {
  const s = smoothstep(6, 25, slope);
  const r = smoothstep(0.35, 0.95, rock) * 0.85;
  const d = dune * 0.6;
  const i = iceDepth <= 0.05 ? 0.22 : 0;
  return 1 - (1 - s) * (1 - r) * (1 - d) * (1 - i);
}

export const HAZARD_CAUTION = 0.3;
export const HAZARD_DANGER = 0.6;
export function hazardClass(h: number): 0 | 1 | 2 {
  return h < HAZARD_CAUTION ? 0 : h < HAZARD_DANGER ? 1 : 2;
}
export const MAX_PASSABLE_SLOPE = 28;

const cache = new Map<SiteId, Terrain>();

export function generateTerrain(siteId: SiteId): Terrain {
  const hit = cache.get(siteId);
  if (hit) return hit;
  const site = SITES[siteId];
  const seed = { jezero: 101, arcadia: 202, korolev: 303 }[siteId];
  const model = MODELS[siteId](makeNoise(seed), makeNoise(seed * 7 + 3));
  const W = FINE_W;
  const H = FINE_H;
  const fine = { ...emptyFields(W, H, FINE_CELL_M), albedo: new Float32Array(W * H * 3) };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const s = model((x + 0.5) / W, (y + 0.5) / H);
      fine.elevation[i] = s.elev;
      fine.rock[i] = s.rock;
      fine.dune[i] = s.dune;
      fine.mineral[i] = s.mineral;
      fine.hydration[i] = s.hydration;
      fine.iceDepth[i] = s.iceDepth;
      fine.iceFrac[i] = s.iceFrac;
      fine.science[i] = s.science;
      fine.albedo[i * 3] = s.albedo[0];
      fine.albedo[i * 3 + 1] = s.albedo[1];
      fine.albedo[i * 3 + 2] = s.albedo[2];
    }
  }

  let elevMin = Infinity;
  let elevMax = -Infinity;
  for (const e of fine.elevation) {
    if (e < elevMin) elevMin = e;
    if (e > elevMax) elevMax = e;
  }

  const baseT = SITE_BASE_TEMP[siteId];
  const sunFacing = site.lat >= 0 ? Math.PI / 2 : -Math.PI / 2; // equator-facing (south in north hemisphere = +y)
  let tempMin = Infinity;
  let tempMax = -Infinity;
  let radMin = Infinity;
  let radMax = -Infinity;
  const elevMid = (elevMin + elevMax) / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const xl = Math.max(0, x - 1);
      const xr = Math.min(W - 1, x + 1);
      const yu = Math.max(0, y - 1);
      const yd = Math.min(H - 1, y + 1);
      const dzdx =
        (fine.elevation[y * W + xr] - fine.elevation[y * W + xl]) / ((xr - xl) * FINE_CELL_M);
      const dzdy =
        (fine.elevation[yd * W + x] - fine.elevation[yu * W + x]) / ((yd - yu) * FINE_CELL_M);
      const slopeRad = Math.atan(Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(-dzdy, -dzdx); // downslope direction in grid coords (+y = south)
      fine.slope[i] = (slopeRad * 180) / Math.PI;
      fine.aspect[i] = aspect;
      const lum = (fine.albedo[i * 3] + fine.albedo[i * 3 + 1] + fine.albedo[i * 3 + 2]) / 3;
      const facing = Math.sin(slopeRad) * Math.cos(aspect - sunFacing);
      const iceSurf = fine.iceDepth[i] <= 0.05 ? 1 : 0;
      const t =
        baseT +
        (0.55 - lum) * 40 +
        facing * 28 -
        iceSurf * 14 -
        (fine.elevation[i] - elevMid) * 0.003 +
        fine.dune[i] * 4;
      fine.temp[i] = t;
      if (t < tempMin) tempMin = t;
      if (t > tempMax) tempMax = t;
      // RAD-style dose: thinner air column at higher elevation → slightly higher dose; nearby walls shield a little.
      const rad = 0.67 + (fine.elevation[i] + 3000) * 0.000012 - Math.min(0.03, slopeRad * 0.04);
      fine.radiation[i] = rad;
      if (rad < radMin) radMin = rad;
      if (rad > radMax) radMax = rad;
      fine.hazard[i] = hazardScore(fine.slope[i], fine.rock[i], fine.dune[i], fine.iceDepth[i]);
      fine.water[i] = waterValue(fine.iceDepth[i], fine.hydration[i]);
    }
  }

  const nav = { ...emptyFields(NAV_W, NAV_H, NAV_CELL_M), passable: new Uint8Array(NAV_W * NAV_H) };
  const B = NAV_BLOCK;
  for (let y = 0; y < NAV_H; y++) {
    for (let x = 0; x < NAV_W; x++) {
      const i = y * NAV_W + x;
      let hz = 0;
      let sl = 0;
      let el = 0;
      let sci = 0;
      let wat = 0;
      for (let by = 0; by < B; by++)
        for (let bx = 0; bx < B; bx++) {
          const fi = (y * B + by) * W + (x * B + bx);
          hz = Math.max(hz, fine.hazard[fi]);
          sl = Math.max(sl, fine.slope[fi]);
          el += fine.elevation[fi];
          sci = Math.max(sci, fine.science[fi]);
          wat = Math.max(wat, fine.water[fi]);
        }
      const c = (y * B + 1) * W + (x * B + 1);
      nav.elevation[i] = el / (B * B);
      nav.slope[i] = sl;
      nav.hazard[i] = hz;
      nav.science[i] = sci;
      nav.water[i] = wat;
      nav.aspect[i] = fine.aspect[c];
      nav.rock[i] = fine.rock[c];
      nav.dune[i] = fine.dune[c];
      nav.mineral[i] = fine.mineral[c];
      nav.hydration[i] = fine.hydration[c];
      nav.iceDepth[i] = fine.iceDepth[c];
      nav.iceFrac[i] = fine.iceFrac[c];
      nav.temp[i] = fine.temp[c];
      nav.radiation[i] = fine.radiation[c];
      nav.passable[i] = sl <= MAX_PASSABLE_SLOPE && hz < 0.93 ? 1 : 0;
    }
  }

  const terrain: Terrain = { site, fine, nav, elevMin, elevMax, tempMin, tempMax, radMin, radMax };
  cache.set(siteId, terrain);
  return terrain;
}

/** Nav-grid cell for fractional map coords. */
export function navCell(u: number, v: number) {
  return {
    x: Math.min(NAV_W - 1, Math.max(0, Math.floor(u * NAV_W))),
    y: Math.min(NAV_H - 1, Math.max(0, Math.floor(v * NAV_H))),
  };
}
