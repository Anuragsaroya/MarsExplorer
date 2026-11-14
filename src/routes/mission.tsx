import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, Flag, Loader2, MapPin, Snowflake } from "lucide-react";
import { MarsMap, type UV } from "@/components/mars/MarsMap";
import { LayerPanel, type LayerState } from "@/components/mars/LayerPanel";
import { RoutePanel } from "@/components/mars/RoutePanel";
import { InspectorPanel } from "@/components/mars/InspectorPanel";
import { SimulatorPanel } from "@/components/mars/SimulatorPanel";
import { MissionPlannerPanel } from "@/components/mars/MissionPlannerPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_ORDER, SITES, toLatLon, type SiteId } from "@/lib/mars/sites";
import { generateTerrain, navCell, type Terrain } from "@/lib/mars/terrain";
import { planAll, type RouteMode } from "@/lib/mars/planner";
import { LAYER_INFO, LAYER_ORDER, type LayerId } from "@/lib/mars/render";
import { sampleAt } from "@/lib/mars/assistant";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mission")({
  validateSearch: (s: Record<string, unknown>): { site?: SiteId } => {
    const v = s["site"];
    return typeof v === "string" && v in SITES ? { site: v as SiteId } : {};
  },
  head: () => ({
    meta: [
      { title: "Mission Console — Mars Explorer AI" },
      {
        name: "description",
        content:
          "Plan a Marswalk on Mars: layered NASA-style maps, hazard zones, water-ice finder, four route options and an EVA simulator.",
      },
      { property: "og:title", content: "Mission Console — Mars Explorer AI" },
      {
        property: "og:description",
        content:
          "Layered Mars map with ice detection, hazard zones, route planning and a Marswalk simulator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionPage,
});

function MissionPage() {
  const { site = "arcadia" } = Route.useSearch();
  const navigate = useNavigate({ from: "/mission" });
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="hud-label">Mission console</p>
          <h1 className="text-2xl font-semibold">{SITES[site].name}</h1>
          <p className="text-sm text-muted-foreground">{SITES[site].tagline}</p>
        </div>
        <div
          className="flex rounded-md border border-border p-0.5"
          role="tablist"
          aria-label="Landing site"
        >
          {SITE_ORDER.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={id === site}
              type="button"
              onClick={() => navigate({ search: { site: id } })}
              className={cn(
                "rounded px-3 py-1.5 text-sm",
                id === site
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SITES[id].short}
            </button>
          ))}
        </div>
      </div>
      <Console key={site} siteId={site} />
    </div>
  );
}

interface Point {
  uv: UV;
  name: string;
}

const initialLayers = (): Record<LayerId, LayerState> => {
  const out = {} as Record<LayerId, LayerState>;
  for (const id of LAYER_ORDER)
    out[id] = { on: id === "ice" || id === "contours", opacity: LAYER_INFO[id].defaultOpacity };
  return out;
};

function Console({ siteId }: { siteId: SiteId }) {
  const site = SITES[siteId];
  const poiPoint = (id: string): Point => {
    const p = site.pois.find((x) => x.id === id)!;
    return { uv: { u: p.u, v: p.v }, name: p.name };
  };
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [start, setStart] = useState<Point>(() => poiPoint(site.defaultStart));
  const [goal, setGoal] = useState<Point>(() => poiPoint(site.defaultEnd));
  const [layers, setLayers] = useState(initialLayers);
  const [selected, setSelected] = useState<RouteMode>("safest");
  const [clickMode, setClickMode] = useState<"inspect" | "start" | "goal">("inspect");
  const [hover, setHover] = useState<UV | null>(null);
  const [inspect, setInspect] = useState<UV | null>(null);
  const [astronaut, setAstronaut] = useState<UV | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setTerrain(generateTerrain(siteId)), 30);
    return () => clearTimeout(id);
  }, [siteId]);

  const routes = useMemo(
    () =>
      terrain
        ? planAll(
            terrain,
            navCell(start.uv.u, start.uv.v),
            navCell(goal.uv.u, goal.uv.v),
            site.pois,
          )
        : [],
    [terrain, start, goal, site.pois],
  );
  const route = routes.find((r) => r.mode === selected) ?? routes[0];
  const mapLayers = useMemo(() => {
    const out: Partial<Record<LayerId, number>> = {};
    for (const id of LAYER_ORDER) if (layers[id].on) out[id] = layers[id].opacity;
    return out;
  }, [layers]);
  const readAt = hover ?? inspect;
  const report = terrain && readAt ? sampleAt(terrain, readAt.u, readAt.v) : null;
  const onAstronaut = useCallback((p: UV | null) => setAstronaut(p), []);

  const waypoint = (uv: UV): Point => {
    const { lat, lon } = toLatLon(site, uv.u, uv.v);
    return { uv, name: `Waypoint ${lat.toFixed(2)}°, ${lon.toFixed(2)}°` };
  };

  const pick = (uv: UV) => {
    if (clickMode === "start") setStart(waypoint(uv));
    else if (clickMode === "goal") setGoal(waypoint(uv));
    else setInspect(uv);
    setClickMode("inspect");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[270px_minmax(0,1fr)_350px]">
      <div className="space-y-3 md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            {(
              [
                ["inspect", "Inspect", Crosshair],
                ["start", "Set start A", MapPin],
                ["goal", "Set goal B", Flag],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => setClickMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5",
                  clickMode === m
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
          <PoiSelect
            label="A"
            value={start}
            pois={site.pois}
            onChange={(id) => setStart(poiPoint(id))}
          />
          <PoiSelect
            label="B"
            value={goal}
            pois={site.pois}
            onChange={(id) => setGoal(poiPoint(id))}
          />
        </div>
        {clickMode !== "inspect" && (
          <p className="text-xs text-accent">
            Click the map to place{" "}
            {clickMode === "start" ? "the start point A" : "the destination B"}.
          </p>
        )}
        {terrain ? (
          <MarsMap
            terrain={terrain}
            layers={mapLayers}
            routes={routes}
            selected={route?.mode ?? null}
            start={start.uv}
            goal={goal.uv}
            astronaut={astronaut}
            inspect={inspect}
            clickMode={clickMode}
            onPick={pick}
            onHover={setHover}
            onPoi={(p) => {
              const pt = { uv: { u: p.u, v: p.v }, name: p.name };
              if (clickMode === "start") setStart(pt);
              else setGoal(pt);
              setInspect(pt.uv);
              setClickMode("inspect");
            }}
          />
        ) : (
          <div className="flex aspect-[10/7] w-full items-center justify-center rounded-md border border-panel-edge bg-grid text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Building terrain model…
          </div>
        )}
        <InspectorPanel report={report} pinned={!hover && !!inspect} />
      </div>

      <div className="space-y-3 xl:col-start-1 xl:row-start-1">
        <section className="rounded-md border border-ice/50 bg-ice/10 p-3 shadow-ice">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ice">
            <Snowflake className="size-4" /> Water & ice at {site.short}
          </h2>
          <p className="mt-1 text-xs text-foreground/85">{site.iceSummary}</p>
          <ul className="mt-2 space-y-1">
            {site.pois
              .filter((p) => p.kind === "ice" || p.kind === "water")
              .map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => (
                      setGoal({ uv: { u: p.u, v: p.v }, name: p.name }),
                      setSelected("water")
                    )}
                    className="text-left text-xs text-ice underline-offset-2 hover:underline"
                  >
                    → Route to {p.name}
                  </button>
                </li>
              ))}
          </ul>
        </section>
        <LayerPanel state={layers} onChange={(id, s) => setLayers((l) => ({ ...l, [id]: s }))} />
      </div>

      <div className="space-y-3 xl:col-start-3 xl:row-start-1">
        <RoutePanel
          routes={routes}
          selected={route?.mode ?? null}
          onSelect={setSelected}
          pois={site.pois}
          terrain={terrain ?? undefined}
        />
        {terrain && route && (
          <SimulatorPanel
            key={`${route.mode}-${route.path[0]}-${route.path.at(-1)}-${route.path.length}`}
            terrain={terrain}
            route={route}
            startName={start.name}
            goalName={goal.name}
            onAstronaut={onAstronaut}
          />
        )}
        {terrain && routes.length > 0 && (
          <MissionPlannerPanel
            terrain={terrain}
            routes={routes}
            start={start.uv}
            goal={goal.uv}
            startName={start.name}
            goalName={goal.name}
            pois={site.pois}
          />
        )}
      </div>
    </div>
  );
}

function PoiSelect({
  label,
  value,
  pois,
  onChange,
}: {
  label: string;
  value: Point;
  pois: typeof SITES.jezero.pois;
  onChange: (id: string) => void;
}) {
  const match = pois.find((p) => p.u === value.uv.u && p.v === value.uv.v);
  return (
    <Select value={match?.id ?? ""} onValueChange={onChange}>
      <SelectTrigger
        className="h-8 w-auto max-w-[220px] gap-1.5 text-xs"
        aria-label={`Point ${label}`}
      >
        <span className="font-mono text-muted-foreground">{label}</span>
        <SelectValue placeholder={value.name} />
      </SelectTrigger>
      <SelectContent>
        {pois.map((p) => (
          <SelectItem key={p.id} value={p.id} className="text-xs">
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
