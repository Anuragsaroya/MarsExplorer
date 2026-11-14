/** Rasterises terrain fields into canvas layers (browser only). */
import {
  FINE_CELL_M,
  FINE_H,
  FINE_W,
  HAZARD_CAUTION,
  HAZARD_DANGER,
  Mineral,
  NO_ICE,
  type Terrain,
} from "./terrain";

export type LayerId =
  "topo" | "contours" | "thermal" | "spectral" | "hazard" | "radiation" | "ice" | "science";

type Stop = [number, [number, number, number]];

// Scientific colour ramps for data layers (map pixels, not UI chrome).
export const RAMPS = {
  topo: [
    [0, [38, 70, 140]],
    [0.25, [40, 150, 160]],
    [0.5, [120, 190, 90]],
    [0.75, [230, 200, 80]],
    [1, [240, 110, 60]],
  ] as Stop[],
  thermal: [
    [0, [20, 12, 60]],
    [0.3, [110, 30, 120]],
    [0.6, [220, 70, 50]],
    [0.85, [250, 170, 40]],
    [1, [255, 245, 170]],
  ] as Stop[],
  radiation: [
    [0, [50, 30, 90]],
    [0.5, [40, 140, 130]],
    [1, [240, 230, 70]],
  ] as Stop[],
  science: [
    [0, [40, 20, 10]],
    [0.5, [200, 110, 40]],
    [1, [255, 235, 140]],
  ] as Stop[],
};

export const MINERAL_RGB: Record<Mineral, [number, number, number]> = {
  [Mineral.Dust]: [170, 120, 90],
  [Mineral.Olivine]: [120, 200, 80],
  [Mineral.Clay]: [70, 170, 210],
  [Mineral.Carbonate]: [235, 110, 160],
  [Mineral.Sulfate]: [240, 210, 80],
  [Mineral.Basalt]: [110, 110, 120],
  [Mineral.WaterIce]: [210, 245, 255],
};

export const HAZARD_RGB: [number, number, number][] = [
  [70, 200, 110],
  [245, 205, 60],
  [235, 70, 55],
];

export function rampCss(stops: Stop[]) {
  return `linear-gradient(90deg, ${stops.map(([p, c]) => `rgb(${c.join(",")}) ${p * 100}%`).join(", ")})`;
}

function ramp(stops: Stop[], t: number): [number, number, number] {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [p, c] = stops[i];
    if (t <= p) {
      const [p0, c0] = stops[i - 1];
      const k = (t - p0) / (p - p0);
      return [c0[0] + (c[0] - c0[0]) * k, c0[1] + (c[1] - c0[1]) * k, c0[2] + (c[2] - c0[2]) * k];
    }
  }
  return stops[stops.length - 1][1];
}

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = FINE_W;
  c.height = FINE_H;
  return c;
}

function paint(fn: (i: number, x: number, y: number) => [number, number, number, number] | null) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(FINE_W, FINE_H);
  const d = img.data;
  for (let y = 0; y < FINE_H; y++)
    for (let x = 0; x < FINE_W; x++) {
      const i = y * FINE_W + x;
      const px = fn(i, x, y);
      if (!px) continue;
      d[i * 4] = px[0];
      d[i * 4 + 1] = px[1];
      d[i * 4 + 2] = px[2];
      d[i * 4 + 3] = px[3];
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function renderOptical(t: Terrain) {
  const f = t.fine;
  const ex = 2.2; // vertical exaggeration for shading
  const L = [-0.55, -0.55, 0.63]; // light from upper-left (NW)
  const ll = Math.hypot(L[0], L[1], L[2]);
  return paint((i, x, y) => {
    const xl = Math.max(0, x - 1);
    const xr = Math.min(FINE_W - 1, x + 1);
    const yu = Math.max(0, y - 1);
    const yd = Math.min(FINE_H - 1, y + 1);
    const dzdx =
      ((f.elevation[y * FINE_W + xr] - f.elevation[y * FINE_W + xl]) / ((xr - xl) * FINE_CELL_M)) *
      ex;
    const dzdy =
      ((f.elevation[yd * FINE_W + x] - f.elevation[yu * FINE_W + x]) / ((yd - yu) * FINE_CELL_M)) *
      ex;
    const nl = Math.hypot(dzdx, dzdy, 1);
    const shade = Math.max(0, (-dzdx * L[0] - dzdy * L[1] + L[2]) / (nl * ll));
    const k = 0.35 + 0.95 * shade;
    const grain = 0.94 + (0.12 * (((x * 73856093) ^ (y * 19349663)) % 100)) / 100;
    const r = f.albedo[i * 3] * 255 * k * grain;
    const g = f.albedo[i * 3 + 1] * 255 * k * grain;
    const b = f.albedo[i * 3 + 2] * 255 * k * grain;
    return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
  });
}

export function renderLayer(t: Terrain, id: LayerId): HTMLCanvasElement {
  const f = t.fine;
  switch (id) {
    case "topo":
      return paint((i) => {
        const c = ramp(RAMPS.topo, (f.elevation[i] - t.elevMin) / (t.elevMax - t.elevMin));
        return [c[0], c[1], c[2], 255];
      });
    case "contours": {
      const span = t.elevMax - t.elevMin;
      const interval = span > 400 ? 25 : span > 150 ? 10 : 5;
      return paint((i, x, y) => {
        if (x === 0 || y === 0) return null;
        const a = Math.floor(f.elevation[i] / interval);
        const b = Math.floor(f.elevation[i - 1] / interval);
        const c = Math.floor(f.elevation[i - FINE_W] / interval);
        if (a === b && a === c) return null;
        const major = a % 5 === 0;
        return [255, 240, 220, major ? 230 : 130];
      });
    }
    case "thermal":
      return paint((i) => {
        const c = ramp(RAMPS.thermal, (f.temp[i] - t.tempMin) / (t.tempMax - t.tempMin));
        return [c[0], c[1], c[2], 255];
      });
    case "radiation":
      return paint((i) => {
        const c = ramp(RAMPS.radiation, (f.radiation[i] - t.radMin) / (t.radMax - t.radMin));
        return [c[0], c[1], c[2], 255];
      });
    case "science":
      return paint((i) => {
        const s = f.science[i];
        if (s < 0.3) return null;
        const c = ramp(RAMPS.science, s);
        return [c[0], c[1], c[2], Math.round(255 * Math.min(1, (s - 0.3) * 2))];
      });
    case "spectral":
      return paint((i) => {
        const m = f.mineral[i] as Mineral;
        if (m === Mineral.Dust || m === Mineral.Basalt)
          return [...MINERAL_RGB[m], 70] as [number, number, number, number];
        const c = MINERAL_RGB[m];
        const a = 140 + 115 * Math.min(1, f.hydration[i]);
        return [c[0], c[1], c[2], a];
      });
    case "hazard":
      return paint((i) => {
        const h = f.hazard[i];
        const c = HAZARD_RGB[h < HAZARD_CAUTION ? 0 : h < HAZARD_DANGER ? 1 : 2];
        return [c[0], c[1], c[2], 255];
      });
    case "ice":
      return paint((i, x, y) => {
        const d = f.iceDepth[i];
        if (d >= NO_ICE) {
          // bound water in hydrated minerals, drawn as a sparse teal stipple
          const h = f.hydration[i];
          if (h < 0.4 || (x + y) % 3 !== 0) return null;
          return [90, 210, 200, Math.round(120 + 120 * h)];
        }
        if (d <= 0.05) return [235, 252, 255, 255];
        if (d < 1) return [120, 220, 245, Math.round(170 + 60 * (1 - d))];
        if (d < 3) return [60, 140, 230, 170];
        return [40, 70, 180, 110];
      });
  }
}

export const LAYER_INFO: Record<
  LayerId,
  { label: string; source: string; kind: string; defaultOpacity: number }
> = {
  ice: {
    label: "Water ice & frozen ground",
    source: "SHARAD · SWIM · Odyssey GRS",
    kind: "Subsurface",
    defaultOpacity: 0.7,
  },
  topo: {
    label: "Elevation",
    source: "MOLA · HiRISE DTM",
    kind: "Topographic",
    defaultOpacity: 0.55,
  },
  contours: { label: "Contour lines", source: "MOLA", kind: "Topographic", defaultOpacity: 0.7 },
  thermal: {
    label: "Surface temperature",
    source: "THEMIS IR",
    kind: "Thermal",
    defaultOpacity: 0.6,
  },
  spectral: { label: "Minerals", source: "CRISM · OMEGA", kind: "Spectral", defaultOpacity: 0.6 },
  hazard: {
    label: "Hazard zones",
    source: "HiRISE rocks · slope",
    kind: "Safety",
    defaultOpacity: 0.45,
  },
  radiation: {
    label: "Radiation dose",
    source: "MSL RAD (modelled)",
    kind: "Radiation",
    defaultOpacity: 0.5,
  },
  science: {
    label: "Science value",
    source: "Mission science goals",
    kind: "Science",
    defaultOpacity: 0.6,
  },
};

export const LAYER_ORDER: LayerId[] = [
  "ice",
  "hazard",
  "topo",
  "contours",
  "thermal",
  "spectral",
  "radiation",
  "science",
];
