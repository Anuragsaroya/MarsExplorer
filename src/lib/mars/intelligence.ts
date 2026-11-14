/**
 * Mission Intelligence Engine — hybrid AI + rule-based mission analysis.
 *
 * Every statement is derived from the modelled terrain fields and route metrics.
 * Scientific wording stays hedged ("consistent with", "may", "modelled").
 */
import type { Terrain } from "./terrain";
import { NAV_W, NAV_H, NAV_CELL_M, NO_ICE, MINERAL_LABEL, Mineral } from "./terrain";
import type { Poi } from "./sites";
import {
  ROUTE_MODES,
  ROUTE_META,
  SUIT_O2_HOURS,
  SUIT_BATTERY_HOURS,
  SITE_WORK_HOURS,
  type RouteMode,
  type PlannedRoute,
  type RouteMetrics,
} from "./planner";

/* ── Types ──────────────────────────────────────────────────────── */

export type MissionObjective = "explore" | "ice-extraction" | "science-survey" | "reconnaissance";

export const MISSION_OBJECTIVE_LABELS: Record<MissionObjective, string> = {
  explore: "General Exploration",
  "ice-extraction": "Ice Extraction",
  "science-survey": "Science Survey",
  reconnaissance: "Reconnaissance",
};

export interface EnvironmentalRisk {
  type: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
}

export interface WaterIceDiscovery {
  location: string;
  evidence: string;
  depth: number | null;
  confidence: "high" | "moderate" | "low" | "theoretical";
  accessibility: number; // 0–100
}

export interface ResourceRequirements {
  o2Hours: number;
  batteryHours: number;
  walkingKm: number;
}

export interface RouteComparison {
  mode: RouteMode;
  label: string;
  distanceKm: number;
  hours: number;
  risk: string;
  explanation: string;
}

export interface MissionBriefing {
  missionTitle: string;
  missionOverview: string;
  destinationAnalysis: string[];
  recommendedRoute: RouteMode;
  recommendedRouteExplanation: string;
  environmentalRisks: EnvironmentalRisk[];
  scienceObjectives: string[];
  waterIceDiscoveries: WaterIceDiscovery[];
  resourceRequirements: ResourceRequirements;
  emergencyReturnAssessment: string;
  feasibilityScore: number; // 0–100
  warnings: string[];
  routeComparisons: RouteComparison[];
}

/* ── Helpers ────────────────────────────────────────────────────── */

function navUV(index: number): { u: number; v: number } {
  return {
    u: ((index % NAV_W) + 0.5) / NAV_W,
    v: (((index / NAV_W) | 0) + 0.5) / NAV_H,
  };
}

function iceAtCell(t: Terrain, i: number): { depth: number; frac: number } {
  return { depth: t.nav.iceDepth[i], frac: t.nav.iceFrac[i] };
}

function mineralAtCell(t: Terrain, i: number): Mineral {
  return t.nav.mineral[i] as Mineral;
}

/* ── Analysis Functions ─────────────────────────────────────────── */

function analyzeDestination(t: Terrain, goalIdx: number): string[] {
  const lines: string[] = [];
  const idx = Math.max(0, Math.min(t.nav.w * t.nav.h - 1, Math.floor(goalIdx) || 0));
  const elev = t.nav.elevation[idx] ?? 0;
  const slope = t.nav.slope[idx] ?? 0;
  const hz = t.nav.hazard[idx] ?? 0;
  const temp = t.nav.temp[idx] ?? -60;
  const ice = iceAtCell(t, idx);
  const mineral = mineralAtCell(t, idx);

  lines.push(`Elevation at destination: ${elev.toFixed(0)} m, slope ${slope.toFixed(1)}°.`);

  if (slope > 20) lines.push("Terrain is steep — crew should anchor lines before sampling.");
  else if (slope > 10) lines.push("Moderate slope — proceed with caution on approach.");
  else lines.push("Relatively flat terrain suitable for extended operations.");

  if (hz > 0.6) lines.push("Destination is within a hazard zone — minimise time on site.");
  else if (hz > 0.3) lines.push("Caution-level hazards present; watch for loose rock.");

  if (temp < -80)
    lines.push(
      `Extreme cold (${temp.toFixed(0)} °C) — suit battery drain may be higher than nominal.`,
    );
  else if (temp < -50)
    lines.push(`Cold surface (${temp.toFixed(0)} °C) — standard EVA thermal protocols apply.`);

  if (ice.depth <= 0.05) {
    lines.push(
      "Surface water ice detected — consistent with exposed ice deposit. Direct sampling may be possible.",
    );
  } else if (ice.depth < 1) {
    lines.push(
      `Shallow subsurface ice modelled at ~${ice.depth.toFixed(1)} m depth — may be reachable with a hand drill.`,
    );
  } else if (ice.depth < NO_ICE) {
    lines.push(
      `Ice-cemented ground modelled at ~${ice.depth.toFixed(1)} m — powered drill required for extraction.`,
    );
  }

  if (mineral === Mineral.Clay || mineral === Mineral.Carbonate) {
    lines.push(`${MINERAL_LABEL[mineral]} signature — consistent with ancient aqueous alteration.`);
  } else if (mineral === Mineral.Olivine) {
    lines.push(
      "Olivine-rich terrain — may record volcanic history and lack of prolonged water exposure.",
    );
  }

  return lines;
}

function assessRisks(t: Terrain, route: PlannedRoute): EnvironmentalRisk[] {
  const risks: EnvironmentalRisk[] = [];
  const m = route.metrics;

  if (m.maxSlope > 28) {
    risks.push({
      type: "Excessive slope",
      severity: "critical",
      description: `Maximum slope of ${m.maxSlope.toFixed(0)}° exceeds 28° passable limit — rope team required.`,
    });
  } else if (m.maxSlope > 20) {
    risks.push({
      type: "Steep terrain",
      severity: "high",
      description: `Maximum slope of ${m.maxSlope.toFixed(0)}° — risk of slipping, especially on loose regolith.`,
    });
  }

  if (m.dangerPct > 4) {
    risks.push({
      type: "Hazard zone exposure",
      severity: "high",
      description: `${m.dangerPct.toFixed(1)}% of the route passes through danger-class terrain.`,
    });
  } else if (m.dangerPct > 0.5) {
    risks.push({
      type: "Hazard zone exposure",
      severity: "moderate",
      description: `${m.dangerPct.toFixed(1)}% of the route passes through danger-class terrain.`,
    });
  }

  if (m.doseMGy > 0.5) {
    risks.push({
      type: "Radiation",
      severity: "high",
      description: `Cumulative dose of ${m.doseMGy.toFixed(3)} mGy exceeds 0.5 mGy mission threshold.`,
    });
  } else if (m.doseMGy > 0.3) {
    risks.push({
      type: "Radiation",
      severity: "moderate",
      description: `Cumulative dose of ${m.doseMGy.toFixed(3)} mGy — approaching threshold.`,
    });
  }

  if (m.minTemp < -80) {
    risks.push({
      type: "Extreme cold",
      severity: "high",
      description: `Coldest point on route is ${m.minTemp.toFixed(0)} °C — extended exposure may affect suit systems.`,
    });
  }

  if (!m.returnFeasible) {
    risks.push({
      type: "Resource deficit",
      severity: "critical",
      description:
        "Round-trip + 1 h work exceeds suit O₂ or battery capacity — rover transport required.",
    });
  }

  if (m.o2Pct > 35) {
    risks.push({
      type: "High O₂ consumption",
      severity: "moderate",
      description: `One-way O₂ usage is ${m.o2Pct.toFixed(0)}% — limited margin for delays.`,
    });
  }

  if (m.iceCells > 0 && route.path.some((i) => t.nav.iceDepth[i] <= 0.05)) {
    risks.push({
      type: "Surface ice traction",
      severity: "low",
      description: "Route crosses bare ice — reduced traction. Use crampons or ice poles.",
    });
  }

  return risks;
}

function scienceObjectivesForRoute(t: Terrain, route: PlannedRoute, pois: Poi[]): string[] {
  const objs: string[] = [];
  const passed = new Set(route.metrics.poisPassed);

  for (const poi of pois) {
    if (passed.has(poi.id) && poi.kind !== "base") {
      objs.push(`${poi.name}: ${poi.note}`);
    }
  }

  // Check minerals along route
  const minerals = new Set<Mineral>();
  for (const i of route.path) {
    const m = mineralAtCell(t, i);
    if (m !== Mineral.Dust && m !== Mineral.Basalt) minerals.add(m);
  }
  for (const m of minerals) {
    if (m === Mineral.Clay)
      objs.push(
        "Clay (phyllosilicate) deposits along route — consistent with past aqueous alteration; may preserve biosignatures.",
      );
    if (m === Mineral.Carbonate)
      objs.push("Carbonate deposits along route — may record ancient water chemistry.");
    if (m === Mineral.Olivine) objs.push("Olivine outcrops along route — records igneous history.");
    if (m === Mineral.Sulfate)
      objs.push("Sulfate minerals along route — consistent with evaporative water processes.");
    if (m === Mineral.WaterIce)
      objs.push("Water ice signatures along route — potential ISRU target.");
  }

  if (!objs.length) objs.push("No high-priority science targets identified along this route.");
  return objs;
}

function discoverIceAlongRoute(t: Terrain, route: PlannedRoute): WaterIceDiscovery[] {
  const discoveries: WaterIceDiscovery[] = [];
  const seen = new Set<string>();

  for (const i of route.path) {
    const ice = iceAtCell(t, i);
    const uv = navUV(i);
    const key = `${Math.floor(uv.u * 20)}-${Math.floor(uv.v * 20)}`; // cluster nearby
    if (seen.has(key)) continue;

    if (ice.depth <= 0.05) {
      seen.add(key);
      discoveries.push({
        location: `u=${uv.u.toFixed(2)}, v=${uv.v.toFixed(2)}`,
        evidence: "Surface albedo and spectral signal consistent with bare water ice",
        depth: 0,
        confidence: "high",
        accessibility: 95,
      });
    } else if (ice.depth < 1) {
      seen.add(key);
      discoveries.push({
        location: `u=${uv.u.toFixed(2)}, v=${uv.v.toFixed(2)}`,
        evidence: "Modelled subsurface radar return suggests shallow ice layer",
        depth: ice.depth,
        confidence: "moderate",
        accessibility: Math.round(80 - ice.depth * 30),
      });
    } else if (ice.depth < 3 && ice.frac > 0.4) {
      seen.add(key);
      discoveries.push({
        location: `u=${uv.u.toFixed(2)}, v=${uv.v.toFixed(2)}`,
        evidence: "Modelled ice-cemented ground from thermal/neutron data",
        depth: ice.depth,
        confidence: "low",
        accessibility: Math.round(40 - ice.depth * 5),
      });
    }
  }

  return discoveries.slice(0, 8); // cap at 8 discoveries
}

function computeResourceRequirements(m: RouteMetrics): ResourceRequirements {
  // Round trip + site work
  const oneWayHours = m.hours;
  const roundTripHours = oneWayHours * 2 + SITE_WORK_HOURS;
  return {
    o2Hours: Math.min(SUIT_O2_HOURS, roundTripHours * (1 + m.meanHazard * 0.8)),
    batteryHours: Math.min(SUIT_BATTERY_HOURS, roundTripHours),
    walkingKm: (m.distanceM * 2) / 1000,
  };
}

function buildRouteExplanation(route: PlannedRoute, allRoutes: PlannedRoute[]): string {
  const m = route.metrics;
  const shortest = allRoutes.find((r) => r.mode === "shortest");
  const safest = allRoutes.find((r) => r.mode === "safest");

  switch (route.mode) {
    case "safest": {
      const extra = shortest ? (m.distanceM - shortest.metrics.distanceM) / 1000 : 0;
      const avoided = shortest ? shortest.metrics.dangerPct - m.dangerPct : 0;
      let expl = "Prioritises crew safety by minimising slope, boulder exposure, and soft sand.";
      if (extra > 0.1) expl += ` This adds ${extra.toFixed(2)} km compared to the shortest route`;
      if (avoided > 0.5) expl += ` but avoids ${avoided.toFixed(1)}% danger-class terrain`;
      return expl + ".";
    }
    case "shortest": {
      let expl = "Minimum distance — traverses the most direct path regardless of hazards.";
      if (m.dangerPct > 2)
        expl += ` Warning: ${m.dangerPct.toFixed(1)}% of the route crosses danger zones.`;
      return expl;
    }
    case "science": {
      const sciPois = m.poisPassed.length;
      let expl = "Routes through high-value geology and science targets.";
      if (sciPois > 0) expl += ` Passes ${sciPois} points of interest.`;
      if (m.scienceScore > 30) expl += ` Average science score: ${m.scienceScore.toFixed(0)}/100.`;
      return expl;
    }
    case "water": {
      let expl = "Optimised for water ice and hydrated mineral access.";
      if (m.iceCells > 0) expl += ` Crosses ${m.iceCells} ice-bearing cells.`;
      if (m.iceStops > 0) expl += ` Passes ${m.iceStops} ice POIs.`;
      return expl;
    }
  }
}

function buildRouteComparison(route: PlannedRoute, allRoutes: PlannedRoute[]): string {
  const shortest = allRoutes.find((r) => r.mode === "shortest");
  if (!shortest || route.mode === "shortest") return "";

  const deltaKm = (route.metrics.distanceM - shortest.metrics.distanceM) / 1000;
  const deltaHazard = shortest.metrics.dangerPct - route.metrics.dangerPct;
  const parts: string[] = [];

  if (deltaKm > 0.1) parts.push(`${deltaKm.toFixed(2)} km longer than the shortest route`);
  else if (deltaKm < -0.1) parts.push(`${Math.abs(deltaKm).toFixed(2)} km shorter`);
  else parts.push("same distance as the shortest route");

  if (deltaHazard > 1) parts.push(`avoids ${deltaHazard.toFixed(1)}% more danger zones`);
  if (route.metrics.iceStops > shortest.metrics.iceStops) {
    parts.push(`passes ${route.metrics.iceStops - shortest.metrics.iceStops} more ice targets`);
  }

  return `This route is ${parts.join(" but ")}.`;
}

function recommendRoute(routes: PlannedRoute[]): { mode: RouteMode; explanation: string } {
  if (!routes.length) return { mode: "safest", explanation: "No routes available." };

  // Score each route — safety-first with science bonus
  let best = routes[0];
  let bestScore = -Infinity;

  for (const r of routes) {
    const m = r.metrics;
    let score = 0;
    // Feasibility is mandatory
    if (m.returnFeasible) score += 40;
    else score -= 100;
    // Safety
    score -= m.dangerPct * 2;
    score -= m.maxSlope > 28 ? 30 : m.maxSlope > 20 ? 10 : 0;
    score -= m.meanHazard * 20;
    // Science bonus
    score += m.scienceScore * 0.2;
    score += m.iceStops * 5;
    // Efficiency
    score -= m.distanceM / 5000;

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  const mode = best.mode;
  let explanation = `The ${ROUTE_META[mode].label} route is recommended because it `;
  const parts: string[] = [];

  if (best.metrics.returnFeasible) parts.push("fits within suit O₂ and battery limits");
  if (best.metrics.risk === "Low") parts.push("maintains low risk throughout");
  else if (best.metrics.risk === "Medium") parts.push("keeps risk at a manageable level");
  if (best.metrics.iceStops > 0) parts.push(`passes ${best.metrics.iceStops} ice target(s)`);
  if (best.metrics.poisPassed.length > 0)
    parts.push(`reaches ${best.metrics.poisPassed.length} points of interest`);

  explanation += parts.join(", ") + ".";
  return { mode, explanation };
}

function computeFeasibility(m: RouteMetrics, risks: EnvironmentalRisk[]): number {
  let score = 100;

  if (!m.returnFeasible) score -= 40;
  score -= m.dangerPct * 1.5;
  score -= m.meanHazard * 15;
  if (m.maxSlope > 28) score -= 20;
  else if (m.maxSlope > 20) score -= 8;
  if (m.doseMGy > 0.5) score -= 10;
  if (m.minTemp < -80) score -= 5;
  if (m.o2Pct > 40) score -= 10;

  for (const r of risks) {
    if (r.severity === "critical") score -= 15;
    else if (r.severity === "high") score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* ── Main Export ─────────────────────────────────────────────────── */

export function analyzeMission(
  terrain: Terrain,
  start: { index: number; name: string },
  goal: { index: number; name: string },
  routes: PlannedRoute[],
  pois: Poi[],
): MissionBriefing {
  const rec = recommendRoute(routes);
  const bestRoute = routes.find((r) => r.mode === rec.mode) ?? routes[0];
  if (!bestRoute) {
    return {
      missionTitle: "EVA Briefing: No Viable Route",
      missionOverview: "Unable to generate mission briefing — no viable routes found.",
      destinationAnalysis: [],
      recommendedRoute: "safest",
      recommendedRouteExplanation: "No routes available for analysis.",
      environmentalRisks: [],
      scienceObjectives: [],
      waterIceDiscoveries: [],
      resourceRequirements: { o2Hours: 0, batteryHours: 0, walkingKm: 0 },
      emergencyReturnAssessment: "Cannot assess — no route data.",
      feasibilityScore: 0,
      warnings: ["No route found between the selected points."],
      routeComparisons: [],
    };
  }

  const m = bestRoute.metrics;
  const destAnalysis = analyzeDestination(terrain, goal.index);
  const risks = assessRisks(terrain, bestRoute);
  const sciObj = scienceObjectivesForRoute(terrain, bestRoute, pois);
  const iceDisc = discoverIceAlongRoute(terrain, bestRoute);
  const resources = computeResourceRequirements(m);
  const feasibility = computeFeasibility(m, risks);

  // Mission overview
  const distKm = (m.distanceM / 1000).toFixed(2);
  const overview = [
    `EVA traverse from ${start.name} to ${goal.name} at ${terrain.site.short}.`,
    `Recommended route (${ROUTE_META[rec.mode].label}): ${distKm} km one way, estimated ${m.hours.toFixed(1)} h walking time.`,
    m.returnFeasible
      ? "Round-trip is feasible within nominal suit consumables."
      : "WARNING: round-trip exceeds suit capacity — rover or resupply required.",
    `Feasibility score: ${feasibility}/100.`,
  ].join(" ");

  // Emergency return
  const returnO2 = 100 - m.o2Pct * 2 - (SITE_WORK_HOURS / SUIT_O2_HOURS) * 100;
  const emergencyReturn =
    returnO2 > 15
      ? `Emergency return from the destination to ${start.name} would leave approximately ${returnO2.toFixed(0)}% O₂ — above the 15% reserve threshold.`
      : `Emergency return would leave only ${Math.max(0, returnO2).toFixed(0)}% O₂ — below the 15% minimum reserve. Abort early if O₂ drops below 60% en route.`;

  // Warnings
  const warnings: string[] = [];
  if (!m.returnFeasible) warnings.push("Round trip exceeds suit consumables. Use rover transport.");
  if (m.maxSlope > 28)
    warnings.push("Route crosses slopes steeper than 28° — rope team mandatory.");
  if (m.dangerPct > 4)
    warnings.push("Significant danger-zone exposure — consider the safest route instead.");
  if (m.doseMGy > 0.5) warnings.push("Radiation dose exceeds 0.5 mGy threshold.");
  if (m.minTemp < -90)
    warnings.push("Extreme cold warning — suit heating will draw extra battery.");
  if (bestRoute.steep)
    warnings.push("No passable route avoids all steep ground — rope team required.");

  // Route comparisons
  const comparisons: RouteComparison[] = routes.map((r) => ({
    mode: r.mode,
    label: ROUTE_META[r.mode].label,
    distanceKm: r.metrics.distanceM / 1000,
    hours: r.metrics.hours,
    risk: r.metrics.risk,
    explanation: buildRouteExplanation(r, routes),
  }));

  return {
    missionTitle: `${start.name} → ${goal.name} Traverse Briefing`,
    missionOverview: overview,
    destinationAnalysis: destAnalysis,
    recommendedRoute: rec.mode,
    recommendedRouteExplanation: rec.explanation,
    environmentalRisks: risks,
    scienceObjectives: sciObj,
    waterIceDiscoveries: iceDisc,
    resourceRequirements: resources,
    emergencyReturnAssessment: emergencyReturn,
    feasibilityScore: feasibility,
    warnings,
    routeComparisons: comparisons,
  };
}

/**
 * Build a comparison summary for a specific route vs the others.
 * Suitable for display in the RoutePanel's intelligence section.
 */
export function routeComparisonSummary(route: PlannedRoute, allRoutes: PlannedRoute[]): string {
  return buildRouteComparison(route, allRoutes);
}

/**
 * Get science targets along a specific route.
 */
export function scienceTargetsForRoute(
  terrain: Terrain,
  route: PlannedRoute,
  pois: Poi[],
): string[] {
  return scienceObjectivesForRoute(terrain, route, pois);
}

/**
 * Get ice deposits accessible from a specific route.
 */
export function iceDepositsForRoute(terrain: Terrain, route: PlannedRoute): WaterIceDiscovery[] {
  return discoverIceAlongRoute(terrain, route);
}
