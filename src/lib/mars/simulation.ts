/** Precomputes a Marswalk timeline (cumulative consumables + event log) along a planned path. */
import { hazardClass, NAV_CELL_M, NAV_H, NAV_W, type Terrain } from "./terrain";
import { SUIT_O2_HOURS, walkSpeedKmh } from "./planner";
import type { Poi } from "./sites";

export type SimEventKind = "info" | "caution" | "danger" | "ice" | "science" | "done";

export interface SimEvent {
  k: number;
  kind: SimEventKind;
  text: string;
}

export interface Timeline {
  hours: Float32Array;
  o2: Float32Array; // % remaining
  dose: Float32Array; // mGy cumulative
  events: SimEvent[];
}

function hazardCause(t: Terrain, i: number) {
  if (t.nav.slope[i] > 14) return `steep slope ${t.nav.slope[i].toFixed(0)}°`;
  if (t.nav.rock[i] > 0.45) return "boulder field";
  if (t.nav.dune[i] > 0.3) return "soft sand ripples";
  if (t.nav.iceDepth[i] <= 0.05) return "low-traction bare ice";
  return "rough terrain";
}

export function buildTimeline(
  t: Terrain,
  path: number[],
  pois: Poi[],
  startName: string,
  endName: string,
): Timeline {
  const n = path.length;
  const hours = new Float32Array(n);
  const o2 = new Float32Array(n);
  const dose = new Float32Array(n);
  const events: SimEvent[] = [{ k: 0, kind: "info", text: `EVA start — departing ${startName}` }];
  let effort = 0;
  let lastClass = 0;
  let lastHazardK = -99;
  let iceSeen = false;
  let bareIceSeen = false;
  const seenPoi = new Set<string>();
  o2[0] = 100;
  for (let k = 0; k < n; k++) {
    const i = path[k];
    if (k > 0) {
      const p = path[k - 1];
      const run =
        Math.hypot((i % NAV_W) - (p % NAV_W), ((i / NAV_W) | 0) - ((p / NAV_W) | 0)) * NAV_CELL_M;
      const dz = t.nav.elevation[i] - t.nav.elevation[p];
      const h = run / 1000 / walkSpeedKmh(dz / run);
      hours[k] = hours[k - 1] + h;
      effort += h * (1 + t.nav.hazard[i] * 0.8);
      o2[k] = Math.max(0, 100 - (effort / SUIT_O2_HOURS) * 100);
      dose[k] = dose[k - 1] + (t.nav.radiation[i] / 24) * h;
    }
    const c = hazardClass(t.nav.hazard[i]);
    if (c > lastClass && k - lastHazardK > 12) {
      events.push({
        k,
        kind: c === 2 ? "danger" : "caution",
        text:
          c === 2
            ? `HAZARD — ${hazardCause(t, i)}. Slow down, use poles.`
            : `Caution — ${hazardCause(t, i)} ahead.`,
      });
      lastHazardK = k;
    }
    lastClass = c;
    const d = t.nav.iceDepth[i];
    if (!bareIceSeen && d <= 0.05) {
      bareIceSeen = true;
      events.push({
        k,
        kind: "ice",
        text: "Bare water ice underfoot — collect frozen ice sample.",
      });
    } else if (!iceSeen && d < 1 && d > 0.05) {
      iceSeen = true;
      const litres = Math.round(t.nav.iceFrac[i] * 917);
      events.push({
        k,
        kind: "ice",
        text: `Ground-penetrating radar: ice ${d.toFixed(1)} m down (~${litres} L water/m³).`,
      });
    }
    const x = i % NAV_W;
    const y = (i / NAV_W) | 0;
    for (const poi of pois) {
      if (seenPoi.has(poi.id) || poi.kind === "base") continue;
      if (Math.hypot(x - poi.u * NAV_W, y - poi.v * NAV_H) * NAV_CELL_M < 220) {
        seenPoi.add(poi.id);
        events.push({
          k,
          kind: poi.kind === "ice" || poi.kind === "water" ? "ice" : "science",
          text: `${poi.name} — ${poi.note}`,
        });
      }
    }
  }
  events.push({
    k: n - 1,
    kind: "done",
    text: `Arrived at ${endName}. Begin sampling; return O₂ reserve checked.`,
  });
  events.sort((a, b) => a.k - b.k);
  return { hours, o2, dose, events };
}
