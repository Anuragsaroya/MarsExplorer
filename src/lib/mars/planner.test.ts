import { describe, expect, it } from "vitest";
import { generateTerrain, hazardClass, navCell } from "./terrain";
import { SITES } from "./sites";
import { findPath, planAll, riskLevel, walkSpeedKmh } from "./planner";

const poiCell = (site: keyof typeof SITES, id: string) => {
  const p = SITES[site].pois.find((x) => x.id === id)!;
  return navCell(p.u, p.v);
};

describe("route planner", () => {
  it("safest route crosses no more high-risk ground than the shortest route", () => {
    const t = generateTerrain("jezero");
    const routes = planAll(
      t,
      poiCell("jezero", "base"),
      poiCell("jezero", "delta"),
      SITES.jezero.pois,
    );
    const safest = routes.find((r) => r.mode === "safest")!;
    const shortest = routes.find((r) => r.mode === "shortest")!;
    expect(safest.metrics.dangerPct).toBeLessThanOrEqual(shortest.metrics.dangerPct);
    expect(shortest.metrics.distanceM).toBeLessThanOrEqual(safest.metrics.distanceM + 1);
  });

  it("never steps onto impassable cells except the destination", () => {
    const t = generateTerrain("korolev");
    const path = findPath(t, poiCell("korolev", "base"), poiCell("korolev", "edge"), "shortest")!;
    expect(path).not.toBeNull();
    for (const i of path.slice(1, -1)) expect(t.nav.passable[i]).toBe(1);
  });

  it("ice route in Arcadia crosses at least as much shallow ice as the shortest route", () => {
    const t = generateTerrain("arcadia");
    const routes = planAll(
      t,
      poiCell("arcadia", "base"),
      poiCell("arcadia", "scarp"),
      SITES.arcadia.pois,
    );
    const water = routes.find((r) => r.mode === "water")!;
    const shortest = routes.find((r) => r.mode === "shortest")!;
    expect(water.metrics.iceCells).toBeGreaterThanOrEqual(shortest.metrics.iceCells);
  });
});

describe("hazard & risk rules", () => {
  it("classifies hazard into green / yellow / red bands", () => {
    expect(hazardClass(0.1)).toBe(0);
    expect(hazardClass(0.45)).toBe(1);
    expect(hazardClass(0.8)).toBe(2);
  });
  it("rates a route High when more than 4% of it is red terrain", () => {
    expect(riskLevel(0.1, 5)).toBe("High");
    expect(riskLevel(0.1, 0)).toBe("Low");
  });
  it("walks slower uphill than on flat ground", () => {
    expect(walkSpeedKmh(0.2)).toBeLessThan(walkSpeedKmh(0));
  });
});
