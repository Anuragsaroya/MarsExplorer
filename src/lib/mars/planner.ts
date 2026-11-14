/** Terrain-aware A* route planner + EVA mission metrics. */
import { hazardClass, NAV_CELL_M, NAV_H, NAV_W, type Terrain } from "./terrain";
import type { Poi } from "./sites";

export type RouteMode = "shortest" | "safest" | "science" | "water";

export const ROUTE_META: Record<RouteMode, { label: string; blurb: string }> = {
  shortest: { label: "Shortest", blurb: "Least distance; only avoids impassable ground." },
  safest: { label: "Safest", blurb: "Minimises slope, boulders and soft sand." },
  science: { label: "Science", blurb: "Bends toward high-value geology." },
  water: { label: "Ice / Water", blurb: "Passes over shallow ice & hydrated rock." },
};

export const ROUTE_MODES: RouteMode[] = ["safest", "shortest", "science", "water"];

/** Per-step cost multiplier for a nav cell. Always ≥ MIN_MULT so the heuristic stays admissible. */
export const MIN_MULT = 0.3;
export function cellMultiplier(t: Terrain, i: number, mode: RouteMode) {
  const hz = t.nav.hazard[i];
  const sl = Math.min(1, t.nav.slope[i] / 25);
  switch (mode) {
    case "shortest":
      return 1 + 0.05 * sl;
    case "safest":
      return 1 + 9 * hz ** 1.4 + 2.5 * sl + (hz >= 0.6 ? 25 : 0);
    case "science":
      return Math.max(MIN_MULT, (1 + 2.2 * hz + sl) * (1 - 0.62 * t.nav.science[i]));
    case "water":
      return Math.max(MIN_MULT, (1 + 2.2 * hz + sl) * (1 - 0.66 * t.nav.water[i]));
  }
}

class MinHeap {
  ids: number[] = [];
  pri: number[] = [];
  push(id: number, p: number) {
    const a = this.ids;
    const b = this.pri;
    a.push(id);
    b.push(p);
    let i = a.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (b[par] <= b[i]) break;
      [a[par], a[i]] = [a[i], a[par]];
      [b[par], b[i]] = [b[i], b[par]];
      i = par;
    }
  }
  pop(): number | undefined {
    const a = this.ids;
    const b = this.pri;
    if (!a.length) return undefined;
    const top = a[0];
    const lastId = a.pop()!;
    const lastP = b.pop()!;
    if (a.length) {
      a[0] = lastId;
      b[0] = lastP;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && b[l] < b[m]) m = l;
        if (r < a.length && b[r] < b[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        [b[m], b[i]] = [b[i], b[m]];
        i = m;
      }
    }
    return top;
  }
  get size() {
    return this.ids.length;
  }
}

const DIRS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
] as const;

export interface Cell {
  x: number;
  y: number;
}

/** A* over the nav grid. Returns the list of cell indices from start to goal, or null. */
export function findPath(
  t: Terrain,
  start: Cell,
  goal: Cell,
  mode: RouteMode,
  soft = false,
): number[] | null {
  const N = NAV_W * NAV_H;
  const g = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const s = start.y * NAV_W + start.x;
  const goalI = goal.y * NAV_W + goal.x;
  const minMult = mode === "shortest" ? 1 : mode === "safest" ? 1 : MIN_MULT;
  const h = (x: number, y: number) => Math.hypot(x - goal.x, y - goal.y) * minMult;
  const heap = new MinHeap();
  g[s] = 0;
  heap.push(s, h(start.x, start.y));
  while (heap.size) {
    const cur = heap.pop()!;
    if (cur === goalI) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % NAV_W;
    const cy = (cur / NAV_W) | 0;
    for (const [dx, dy, dist] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= NAV_W || ny >= NAV_H) continue;
      const ni = ny * NAV_W + nx;
      if (closed[ni]) continue;
      const blocked = !t.nav.passable[ni] && ni !== goalI;
      if (blocked && !soft) continue;
      const step =
        (blocked ? 40 * dist : 0) +
        dist * 0.5 * (cellMultiplier(t, cur, mode) + cellMultiplier(t, ni, mode)) +
        dist * Math.abs(t.nav.elevation[ni] - t.nav.elevation[cur]) * 0.004;
      const ng = g[cur] + step;
      if (ng < g[ni]) {
        g[ni] = ng;
        came[ni] = cur;
        heap.push(ni, ng + h(nx, ny));
      }
    }
  }
  if (came[goalI] === -1 && goalI !== s) return null;
  const path: number[] = [];
  for (let c = goalI; c !== -1; c = came[c]) path.push(c);
  return path.reverse();
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface RouteMetrics {
  distanceM: number;
  climbM: number;
  descentM: number;
  maxSlope: number;
  meanHazard: number;
  cautionPct: number;
  dangerPct: number;
  risk: RiskLevel;
  hours: number;
  o2Pct: number;
  batteryPct: number;
  doseMGy: number;
  minTemp: number;
  iceCells: number;
  iceStops: number;
  scienceScore: number;
  poisPassed: string[];
  returnFeasible: boolean;
}

/** EVA consumable model (assumption): 8 h suit O₂, 10 h battery, 1 h on-site work, return by same route. */
export const SUIT_O2_HOURS = 8;
export const SUIT_BATTERY_HOURS = 10;
export const SITE_WORK_HOURS = 1;

/** Suited walking speed (km/h): Tobler's hiking function × 0.5 for spacesuit & 0.38 g. */
export function walkSpeedKmh(grade: number) {
  return 0.5 * 6 * Math.exp(-3.5 * Math.abs(grade + 0.05));
}

export function riskLevel(meanHazard: number, dangerPct: number): RiskLevel {
  if (dangerPct > 4 || meanHazard > 0.4) return "High";
  if (dangerPct > 0.5 || meanHazard > 0.22) return "Medium";
  return "Low";
}

export function routeMetrics(t: Terrain, path: number[], pois: Poi[]): RouteMetrics {
  let distance = 0;
  let climb = 0;
  let descent = 0;
  let maxSlope = 0;
  let hzSum = 0;
  let caution = 0;
  let danger = 0;
  let hours = 0;
  let effortHours = 0;
  let dose = 0;
  let minTemp = Infinity;
  let ice = 0;
  let sci = 0;
  for (let k = 0; k < path.length; k++) {
    const i = path[k];
    const hz = t.nav.hazard[i];
    hzSum += hz;
    const c = hazardClass(hz);
    if (c === 1) caution++;
    if (c === 2) danger++;
    maxSlope = Math.max(maxSlope, t.nav.slope[i]);
    minTemp = Math.min(minTemp, t.nav.temp[i]);
    if (t.nav.iceDepth[i] < 1) ice++;
    sci += t.nav.science[i];
    if (k > 0) {
      const p = path[k - 1];
      const dx = (i % NAV_W) - (p % NAV_W);
      const dy = ((i / NAV_W) | 0) - ((p / NAV_W) | 0);
      const run = Math.hypot(dx, dy) * NAV_CELL_M;
      const dz = t.nav.elevation[i] - t.nav.elevation[p];
      if (dz > 0) climb += dz;
      else descent -= dz;
      distance += run;
      const hrs = run / 1000 / walkSpeedKmh(dz / run);
      hours += hrs;
      effortHours += hrs * (1 + hz * 0.8);
      dose += (t.nav.radiation[i] / 24) * hrs;
    }
  }
  const n = Math.max(1, path.length);
  const meanHazard = hzSum / n;
  const dangerPct = (danger / n) * 100;
  const passed = new Set<string>();
  const pathCells = path.map((i) => [i % NAV_W, (i / NAV_W) | 0] as const);
  for (const poi of pois) {
    const px = poi.u * NAV_W;
    const py = poi.v * NAV_H;
    for (const [x, y] of pathCells) {
      if (Math.hypot(x - px, y - py) * NAV_CELL_M < 220) {
        passed.add(poi.id);
        break;
      }
    }
  }
  // round trip + on-site work
  const tripO2 = (effortHours * 2 + SITE_WORK_HOURS) / SUIT_O2_HOURS;
  const tripBatt = (hours * 2 + SITE_WORK_HOURS) / SUIT_BATTERY_HOURS;
  let iceStops = 0;
  for (const poi of pois)
    if ((poi.kind === "ice" || poi.kind === "water") && passed.has(poi.id)) iceStops++;
  return {
    distanceM: distance,
    climbM: climb,
    descentM: descent,
    maxSlope,
    meanHazard,
    cautionPct: (caution / n) * 100,
    dangerPct,
    risk: riskLevel(meanHazard, dangerPct),
    hours,
    o2Pct: (effortHours / SUIT_O2_HOURS) * 100,
    batteryPct: (hours / SUIT_BATTERY_HOURS) * 100,
    doseMGy: dose,
    minTemp,
    iceCells: ice,
    iceStops,
    scienceScore: (sci / n) * 100,
    poisPassed: [...passed],
    returnFeasible: tripO2 <= 1 && tripBatt <= 1,
  };
}

export interface PlannedRoute {
  mode: RouteMode;
  /** True when no route exists without crossing ground steeper than the passable limit. */
  steep: boolean;
  path: number[];
  metrics: RouteMetrics;
}

/** Nearest passable nav cell (spiral search) so clicks on cliffs or boulders still plan. */
export function snapPassable(t: Terrain, c: Cell, radius = 8): Cell {
  if (t.nav.passable[c.y * NAV_W + c.x]) return c;
  let best = c;
  let bestD = Infinity;
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      const x = c.x + dx;
      const y = c.y + dy;
      if (x < 0 || y < 0 || x >= NAV_W || y >= NAV_H) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD && t.nav.passable[y * NAV_W + x]) {
        bestD = d;
        best = { x, y };
      }
    }
  return best;
}

export function planAll(t: Terrain, startRaw: Cell, goalRaw: Cell, pois: Poi[]): PlannedRoute[] {
  const start = snapPassable(t, startRaw);
  const goal = snapPassable(t, goalRaw);
  const out: PlannedRoute[] = [];
  for (const mode of ROUTE_MODES) {
    let steep = false;
    let path = findPath(t, start, goal, mode);
    if (!path) {
      path = findPath(t, start, goal, mode, true);
      steep = true;
    }
    if (path) out.push({ mode, path, steep, metrics: routeMetrics(t, path, pois) });
  }
  return out;
}
