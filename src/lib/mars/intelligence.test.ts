import { describe, expect, it } from "vitest";
import { generateTerrain, navCell } from "./terrain";
import { SITES } from "./sites";
import { planAll } from "./planner";
import {
  analyzeMission,
  routeComparisonSummary,
  scienceTargetsForRoute,
  iceDepositsForRoute,
} from "./intelligence";
import { NASA_DATASETS, ICE_DATASETS, getDatasetsForSite } from "./nasa-datasets";

describe("Mission Intelligence Engine", () => {
  const t = generateTerrain("jezero");
  const pStart = SITES.jezero.pois.find((p) => p.id === "base")!;
  const pGoal = SITES.jezero.pois.find((p) => p.id === "delta")!;
  const cStart = navCell(pStart.u, pStart.v);
  const cGoal = navCell(pGoal.u, pGoal.v);
  const startIdx = cStart.y * 100 + cStart.x;
  const goalIdx = cGoal.y * 100 + cGoal.x;
  const routes = planAll(t, cStart, cGoal, SITES.jezero.pois);

  it("generates a complete mission briefing", () => {
    const briefing = analyzeMission(
      t,
      { index: startIdx, name: pStart.name },
      { index: goalIdx, name: pGoal.name },
      routes,
      SITES.jezero.pois,
    );

    expect(briefing.missionTitle).toContain("Traverse Briefing");
    expect(briefing.missionOverview).toBeTruthy();
    expect(briefing.feasibilityScore).toBeGreaterThanOrEqual(0);
    expect(briefing.feasibilityScore).toBeLessThanOrEqual(100);
    expect(briefing.recommendedRoute).toBeDefined();
    expect(briefing.routeComparisons.length).toBe(routes.length);
    expect(briefing.resourceRequirements.walkingKm).toBeGreaterThan(0);
  });

  it("compares routes accurately", () => {
    const safest = routes.find((r) => r.mode === "safest")!;
    const summary = routeComparisonSummary(safest, routes);
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("string");
  });

  it("identifies science targets along route", () => {
    const scienceRoute = routes.find((r) => r.mode === "science")!;
    const targets = scienceTargetsForRoute(t, scienceRoute, SITES.jezero.pois);
    expect(Array.isArray(targets)).toBe(true);
  });

  it("detects ice along routes in ice-rich sites", () => {
    const arcadiaTerrain = generateTerrain("arcadia");
    const aStart = SITES.arcadia.pois.find((p) => p.id === "base")!;
    const aGoal = SITES.arcadia.pois.find((p) => p.id === "scarp")!;
    const aRoutes = planAll(
      arcadiaTerrain,
      navCell(aStart.u, aStart.v),
      navCell(aGoal.u, aGoal.v),
      SITES.arcadia.pois,
    );
    const waterRoute = aRoutes.find((r) => r.mode === "water")!;
    const ice = iceDepositsForRoute(arcadiaTerrain, waterRoute);
    expect(ice.length).toBeGreaterThan(0);
    expect(ice[0].confidence).toBeDefined();
  });
});

describe("NASA Dataset Registry", () => {
  it("contains all critical datasets with complete provenance", () => {
    expect(NASA_DATASETS.length).toBeGreaterThanOrEqual(10);

    for (const ds of NASA_DATASETS) {
      expect(ds.id).toBeTruthy();
      expect(ds.name).toBeTruthy();
      expect(ds.instrument).toBeTruthy();
      expect(ds.mission).toBeTruthy();
      expect(ds.spatialResolution).toBeTruthy();
      expect(["modelled", "referenced", "planned"]).toContain(ds.status);
      expect(ds.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it("identifies ice datasets properly", () => {
    expect(ICE_DATASETS.length).toBeGreaterThan(0);
    for (const ds of ICE_DATASETS) {
      expect(ds.appLayer).toContain("ice");
    }
  });

  it("filters datasets by landing site", () => {
    const jezeroSets = getDatasetsForSite("jezero");
    const arcadiaSets = getDatasetsForSite("arcadia");
    const korolevSets = getDatasetsForSite("korolev");

    expect(jezeroSets.length).toBeGreaterThan(0);
    expect(arcadiaSets.length).toBeGreaterThan(0);
    expect(korolevSets.length).toBeGreaterThan(0);
  });
});
