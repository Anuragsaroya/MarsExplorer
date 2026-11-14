import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Route as RouteIcon,
  Snowflake,
} from "lucide-react";
import { ROUTE_META, type PlannedRoute, type RiskLevel, type RouteMode } from "@/lib/mars/planner";
import {
  routeComparisonSummary,
  scienceTargetsForRoute,
  iceDepositsForRoute,
} from "@/lib/mars/intelligence";
import type { Poi } from "@/lib/mars/sites";
import type { Terrain } from "@/lib/mars/terrain";
import { cn } from "@/lib/utils";

const SWATCH: Record<RouteMode, string> = {
  shortest: "bg-route-shortest",
  safest: "bg-route-safest",
  science: "bg-route-science",
  water: "bg-route-water",
};
const RISK: Record<RiskLevel, string> = {
  Low: "bg-safe/15 text-safe",
  Medium: "bg-caution/15 text-caution",
  High: "bg-danger/15 text-danger",
};

export const km = (m: number) => `${(m / 1000).toFixed(2)} km`;
export const hrs = (h: number) =>
  h < 1 ? `${Math.round(h * 60)} min` : `${Math.floor(h)} h ${Math.round((h % 1) * 60)} min`;

export function RoutePanel({
  routes,
  selected,
  onSelect,
  pois,
  terrain,
}: {
  routes: PlannedRoute[];
  selected: RouteMode | null;
  onSelect: (m: RouteMode) => void;
  pois: Poi[];
  terrain?: Terrain;
}) {
  const sel = routes.find((r) => r.mode === selected);

  // Intelligence analysis for selected route
  const sciTargets = terrain && sel ? scienceTargetsForRoute(terrain, sel, pois) : [];
  const iceTargets = terrain && sel ? iceDepositsForRoute(terrain, sel) : [];
  const compSummary = sel ? routeComparisonSummary(sel, routes) : "";

  return (
    <section className="hud-panel p-3">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <RouteIcon className="size-4 text-primary" /> Route options
      </h2>
      {!routes.length && (
        <p className="text-xs text-muted-foreground">
          No route found between these points. Try moving A or B.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {routes.map((r) => (
          <button
            key={r.mode}
            type="button"
            onClick={() => onSelect(r.mode)}
            className={cn(
              "rounded-md border p-2 text-left transition-colors",
              r.mode === selected
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={cn("h-1 w-4 rounded-full", SWATCH[r.mode])} />
              {ROUTE_META[r.mode].label}
            </span>
            <span className="mt-1.5 block font-mono text-sm">{km(r.metrics.distanceM)}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              {hrs(r.metrics.hours)}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1">
              <span
                className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", RISK[r.metrics.risk])}
              >
                {r.metrics.risk} risk
              </span>
              {r.metrics.iceStops > 0 && (
                <span className="flex items-center gap-0.5 rounded bg-ice/15 px-1.5 py-0.5 font-mono text-[10px] text-ice">
                  <Snowflake className="size-2.5" />
                  {r.metrics.iceStops}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      {sel && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{ROUTE_META[sel.mode].blurb}</p>
          {sel.steep && (
            <p className="flex items-start gap-1.5 rounded-md bg-danger/10 p-2 text-xs text-danger">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> No route avoids ground steeper
              than 28°. This path crosses a steep section — rope team required.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <Stat
              k="Climb / descent"
              v={`+${sel.metrics.climbM.toFixed(0)} / −${sel.metrics.descentM.toFixed(0)} m`}
            />
            <Stat k="Max slope" v={`${sel.metrics.maxSlope.toFixed(0)}°`} />
            <Stat
              k="Caution / danger"
              v={`${sel.metrics.cautionPct.toFixed(0)}% / ${sel.metrics.dangerPct.toFixed(0)}%`}
            />
            <Stat k="O₂ used (one way)" v={`${sel.metrics.o2Pct.toFixed(0)}%`} />
            <Stat k="Battery (one way)" v={`${sel.metrics.batteryPct.toFixed(0)}%`} />
            <Stat k="Radiation dose" v={`${sel.metrics.doseMGy.toFixed(3)} mGy`} />
            <Stat k="Coldest point" v={`${sel.metrics.minTemp.toFixed(0)} °C`} />
            <Stat k="Ice underfoot" v={`${sel.metrics.iceCells} cells`} />
          </dl>
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs",
              sel.metrics.returnFeasible ? "text-safe" : "text-danger",
            )}
          >
            {sel.metrics.returnFeasible ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertTriangle className="size-3.5" />
            )}
            {sel.metrics.returnFeasible
              ? "Round trip + 1 h work fits suit O₂ and battery."
              : "Round trip exceeds suit O₂ or battery — use a rover."}
          </p>
          {sel.metrics.poisPassed.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Passes:{" "}
              {sel.metrics.poisPassed
                .map((id) => pois.find((p) => p.id === id)?.name ?? id)
                .join(", ")}
            </p>
          )}

          {/* Route Intelligence section */}
          {compSummary && (
            <div className="rounded-md border border-border bg-secondary/20 p-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Route comparison: </span>
              {compSummary}
            </div>
          )}

          {sciTargets.length > 0 &&
            sciTargets[0] !== "No high-priority science targets identified along this route." && (
              <div className="rounded-md border border-route-science/20 bg-route-science/5 p-2">
                <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-route-science">
                  <FlaskConical className="size-3" /> Science targets on route
                </p>
                <ul className="space-y-1">
                  {sciTargets.slice(0, 3).map((t, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground">
                      · {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {iceTargets.length > 0 && (
            <div className="rounded-md border border-ice/20 bg-ice/5 p-2">
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-ice">
                <Snowflake className="size-3" /> Ice targets on route
              </p>
              <ul className="space-y-1">
                {iceTargets.slice(0, 3).map((d, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">
                    · {d.evidence}
                    {d.depth !== null && d.depth > 0 && ` (~${d.depth.toFixed(1)} m deep)`}
                    <span
                      className={cn(
                        "ml-1 font-mono text-[10px]",
                        d.confidence === "high"
                          ? "text-safe"
                          : d.confidence === "moderate"
                            ? "text-caution"
                            : "text-muted-foreground",
                      )}
                    >
                      [{d.confidence}]
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
