/**
 * Rule-based field-geologist briefing for one map point. Every statement is derived from the
 * modelled data fields at that point, and wording stays hedged ("may", "consistent with").
 */
import {
  FINE_H,
  FINE_W,
  MINERAL_LABEL,
  Mineral,
  NO_ICE,
  hazardClass,
  type Terrain,
} from "./terrain";
import { toLatLon } from "./sites";

export interface CellReport {
  lat: number;
  lon: number;
  elevation: number;
  slope: number;
  temp: number;
  radiation: number;
  mineral: Mineral;
  mineralLabel: string;
  hydration: number;
  iceDepth: number;
  iceFrac: number;
  /** Litres of liquid water per cubic metre of ground if the ice were melted. */
  waterLitresPerM3: number;
  hazard: number;
  hazardClass: 0 | 1 | 2;
  science: number;
  water: number;
}

/** 1 m³ of pure water ice (917 kg) melts to ~917 L of water. */
export const ICE_DENSITY_KG_M3 = 917;

export function sampleAt(t: Terrain, u: number, v: number): CellReport {
  const x = Math.min(FINE_W - 1, Math.max(0, Math.floor(u * FINE_W)));
  const y = Math.min(FINE_H - 1, Math.max(0, Math.floor(v * FINE_H)));
  const i = y * FINE_W + x;
  const f = t.fine;
  const { lat, lon } = toLatLon(t.site, u, v);
  const iceDepth = f.iceDepth[i];
  const iceFrac = iceDepth >= NO_ICE ? 0 : f.iceFrac[i];
  const mineral = f.mineral[i] as Mineral;
  return {
    lat,
    lon,
    elevation: f.elevation[i],
    slope: f.slope[i],
    temp: f.temp[i],
    radiation: f.radiation[i],
    mineral,
    mineralLabel: MINERAL_LABEL[mineral],
    hydration: f.hydration[i],
    iceDepth,
    iceFrac,
    waterLitresPerM3: Math.round(iceFrac * ICE_DENSITY_KG_M3),
    hazard: f.hazard[i],
    hazardClass: hazardClass(f.hazard[i]),
    science: f.science[i],
    water: f.water[i],
  };
}

export type IceStatus = "surface" | "shallow" | "buried" | "bound" | "none";

export function iceStatus(r: Pick<CellReport, "iceDepth" | "hydration">): IceStatus {
  if (r.iceDepth <= 0.05) return "surface";
  if (r.iceDepth < 1) return "shallow";
  if (r.iceDepth < NO_ICE) return "buried";
  if (r.hydration >= 0.4) return "bound";
  return "none";
}

export const ICE_STATUS_LABEL: Record<IceStatus, string> = {
  surface: "Bare water ice at surface",
  shallow: "Shallow buried ice (< 1 m)",
  buried: "Deep ice-cemented ground",
  bound: "Water bound in minerals",
  none: "No ice detected",
};

export interface FieldNotes {
  headline: string;
  notes: string[];
  samples: string[];
}

export function fieldNotes(r: CellReport): FieldNotes {
  const notes: string[] = [];
  const samples: string[] = [];
  const ice = iceStatus(r);
  let headline = "Ordinary regolith — low priority stop";

  if (ice === "surface") {
    headline = "Frozen water ice exposed at the surface";
    notes.push(
      `Surface reads as ~${Math.round(r.iceFrac * 100)}% water ice — about ${r.waterLitresPerM3} L of water per m³ if melted.`,
    );
    samples.push("Ice block in a sealed, cold-chain container");
  } else if (ice === "shallow") {
    headline = `Buried ice ~${r.iceDepth.toFixed(1)} m below the dust`;
    notes.push(
      `Radar-style signal suggests ice at ${r.iceDepth.toFixed(1)} m (~${r.waterLitresPerM3} L water per m³). Reachable with a hand drill.`,
    );
    samples.push(`Drill core to ${(r.iceDepth + 0.5).toFixed(1)} m`);
  } else if (ice === "buried") {
    notes.push(
      `Ice-cemented ground likely ~${r.iceDepth.toFixed(1)} m down — needs a powered drill.`,
    );
  }

  if (r.mineral === Mineral.Clay || r.mineral === Mineral.Carbonate) {
    if (ice === "none" || ice === "bound")
      headline = `${r.mineralLabel} — evidence of ancient water`;
    notes.push(
      `${r.mineralLabel} signature is consistent with long-lived liquid water in the past; may preserve biosignatures.`,
    );
    samples.push("Rock core from fresh, layered outcrop");
    if (ice === "bound")
      notes.push(
        `Water is locked in the mineral structure; heating could release a few percent water by weight.`,
      );
  } else if (r.mineral === Mineral.Sulfate) {
    notes.push("Sulfates often form when salty water evaporates — a clue to past water chemistry.");
    samples.push("Loose sulfate-rich soil scoop");
  } else if (r.mineral === Mineral.Olivine) {
    if (ice === "none") headline = "Olivine-rich igneous rock";
    notes.push(
      "Olivine records volcanic history; it weathers quickly when water is present, so fresh olivine marks a dry past here.",
    );
    samples.push("Igneous rock chip");
  }

  if (r.science >= 0.7) notes.push("High science value on the mission target list.");

  if (r.hazardClass === 2)
    notes.push(
      `Danger zone: ${r.slope.toFixed(0)}° slope or boulders — approach only on the planned route.`,
    );
  else if (r.hazardClass === 1)
    notes.push(`Caution: uneven ground (${r.slope.toFixed(0)}° slope).`);

  if (r.temp < -80)
    notes.push(
      `Extreme cold (${r.temp.toFixed(0)} °C) — limit stop time to protect suit batteries.`,
    );

  if (!notes.length) notes.push("No notable mineral or ice signal in the available layers.");
  return { headline, notes, samples };
}
