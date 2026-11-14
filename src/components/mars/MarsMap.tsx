import { useEffect, useMemo, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import {
  Beaker,
  Flag,
  House,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Snowflake,
  Droplets,
  Bot,
  Grid3X3,
} from "lucide-react";
import { NAV_H, NAV_W, type Terrain } from "@/lib/mars/terrain";
import { renderLayer, renderOptical, type LayerId, LAYER_ORDER } from "@/lib/mars/render";
import type { PlannedRoute, RouteMode } from "@/lib/mars/planner";
import { toLatLon, type Poi, type PoiKind } from "@/lib/mars/sites";
import { cn } from "@/lib/utils";

export interface UV {
  u: number;
  v: number;
}

const ROUTE_STROKE: Record<RouteMode, string> = {
  shortest: "stroke-route-shortest",
  safest: "stroke-route-safest",
  science: "stroke-route-science",
  water: "stroke-route-water",
};

const POI_ICON: Record<PoiKind, typeof House> = {
  base: House,
  science: Beaker,
  ice: Snowflake,
  water: Droplets,
  rover: Bot,
};

const POI_STYLE: Record<PoiKind, string> = {
  base: "border-primary bg-background text-primary",
  science: "border-route-science bg-background text-route-science",
  ice: "border-ice bg-ice text-ice-foreground shadow-ice",
  water: "border-ice bg-background text-ice",
  rover: "border-muted-foreground bg-background text-muted-foreground",
};

const layerCache = new Map<string, HTMLCanvasElement>();
function cachedLayer(t: Terrain, id: LayerId | "optical") {
  const key = `${t.site.id}:${id}`;
  let c = layerCache.get(key);
  if (!c) {
    c = id === "optical" ? renderOptical(t) : renderLayer(t, id);
    layerCache.set(key, c);
  }
  return c;
}

interface Props {
  terrain: Terrain;
  layers: Partial<Record<LayerId, number>>;
  routes: PlannedRoute[];
  selected: RouteMode | null;
  start: UV;
  goal: UV;
  astronaut: UV | null;
  inspect: UV | null;
  clickMode: "inspect" | "start" | "goal";
  onPick: (p: UV) => void;
  onHover: (p: UV | null) => void;
  onPoi: (poi: Poi) => void;
}

export function MarsMap({
  terrain,
  layers,
  routes,
  selected,
  start,
  goal,
  astronaut,
  inspect,
  clickMode,
  onPick,
  onHover,
  onPoi,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [hoverUV, setHoverUV] = useState<UV | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(cachedLayer(terrain, "optical"), 0, 0);
    for (const id of LAYER_ORDER) {
      const op = layers[id];
      if (op === undefined) continue;
      ctx.globalAlpha = op;
      ctx.drawImage(cachedLayer(terrain, id), 0, 0);
    }
    ctx.globalAlpha = 1;
  }, [terrain, layers]);

  const lines = useMemo(
    () =>
      routes.map((r) => ({
        mode: r.mode,
        points: r.path.map((i) => `${(i % NAV_W) + 0.5},${((i / NAV_W) | 0) + 0.5}`).join(" "),
      })),
    [routes],
  );
  const ordered = [...lines].sort(
    (a, b) => (a.mode === selected ? 1 : 0) - (b.mode === selected ? 1 : 0),
  );

  const toUV = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { u: (e.clientX - rect.left) / rect.width, v: (e.clientY - rect.top) / rect.height };
  };

  return (
    <div className="relative aspect-[10/7] w-full overflow-hidden rounded-md border border-panel-edge bg-background">
      <TransformWrapper
        minScale={1}
        maxScale={6}
        wheel={{ step: 0.15 }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <div
                className={cn(
                  "relative h-full w-full",
                  clickMode === "inspect" ? "cursor-crosshair" : "cursor-copy",
                )}
                onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
                onClick={(e) => {
                  const d = down.current;
                  if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
                  onPick(toUV(e));
                }}
                onMouseMove={(e) => {
                  const uv = toUV(e);
                  setHoverUV(uv);
                  onHover(uv);
                }}
                onMouseLeave={() => {
                  setHoverUV(null);
                  onHover(null);
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={420}
                  className="absolute inset-0 h-full w-full"
                />
                <svg
                  viewBox={`0 0 ${NAV_W} ${NAV_H}`}
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {showGrid && (
                    <g className="stroke-foreground/25 opacity-40">
                      {[20, 40, 60, 80].map((x) => (
                        <line
                          key={`vx-${x}`}
                          x1={x}
                          y1={0}
                          x2={x}
                          y2={NAV_H}
                          strokeWidth={0.5}
                          strokeDasharray="1.5 2.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {[17.5, 35, 52.5].map((y) => (
                        <line
                          key={`hy-${y}`}
                          x1={0}
                          y1={y}
                          x2={NAV_W}
                          y2={y}
                          strokeWidth={0.5}
                          strokeDasharray="1.5 2.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </g>
                  )}
                  {ordered.map((l) => {
                    const active = l.mode === selected;
                    return (
                      <g key={l.mode}>
                        {active && (
                          <polyline
                            points={l.points}
                            fill="none"
                            className="stroke-background"
                            strokeWidth={7}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            opacity={0.7}
                          />
                        )}
                        <polyline
                          points={l.points}
                          fill="none"
                          className={cn(ROUTE_STROKE[l.mode], active && "animate-dash")}
                          strokeWidth={active ? 3.5 : 2}
                          strokeDasharray={active ? "10 6" : "3 5"}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          opacity={active ? 1 : 0.55}
                        />
                      </g>
                    );
                  })}
                </svg>
                {terrain.site.pois.map((p) => {
                  const Icon = POI_ICON[p.kind];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={p.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPoi(p);
                      }}
                      className={cn(
                        "group absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-transform hover:scale-125",
                        POI_STYLE[p.kind],
                      )}
                      style={{ left: `${p.u * 100}%`, top: `${p.v * 100}%` }}
                    >
                      <Icon className="size-3.5" />
                      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-foreground opacity-0 group-hover:opacity-100">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
                <Marker uv={start} label="A" className="bg-route-safest text-background" />
                <Marker uv={goal} label="B" className="bg-primary text-primary-foreground" icon />
                {inspect && (
                  <div
                    className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
                    style={{ left: `${inspect.u * 100}%`, top: `${inspect.v * 100}%` }}
                  />
                )}
                {astronaut && (
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${astronaut.u * 100}%`, top: `${astronaut.v * 100}%` }}
                  >
                    <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
                    <span className="relative flex size-5 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground">
                      <Navigation className="size-3" />
                    </span>
                  </div>
                )}
              </div>
            </TransformComponent>
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              <MapBtn onClick={() => zoomIn()} label="Zoom in">
                <Plus />
              </MapBtn>
              <MapBtn onClick={() => zoomOut()} label="Zoom out">
                <Minus />
              </MapBtn>
              <MapBtn onClick={() => resetTransform()} label="Reset view">
                <RotateCcw />
              </MapBtn>
              <MapBtn onClick={() => setShowGrid((g) => !g)} label="Toggle Lat/Lon Grid">
                <Grid3X3
                  className={cn(
                    "transition-colors",
                    showGrid ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </MapBtn>
            </div>
          </>
        )}
      </TransformWrapper>
      <div className="pointer-events-none absolute bottom-2 left-2 hud-panel flex items-center gap-3 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1 w-10 bg-foreground" /> 1 km
        </span>
        <span>N ↑</span>
        <span>10 × 7 km</span>
        {hoverUV ? (
          (() => {
            const ll = toLatLon(terrain.site, hoverUV.u, hoverUV.v);
            return (
              <span className="text-foreground font-semibold">
                {ll.lat.toFixed(4)}° N · {ll.lon.toFixed(4)}° E
              </span>
            );
          })()
        ) : (
          <span className="text-muted-foreground/70">
            {terrain.site.lat.toFixed(2)}° N · {terrain.site.lon.toFixed(2)}° E
          </span>
        )}
      </div>
    </div>
  );
}

function MapBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="hud-panel flex size-8 items-center justify-center text-foreground hover:border-primary [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function Marker({
  uv,
  label,
  className,
  icon,
}: {
  uv: UV;
  label: string;
  className: string;
  icon?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${uv.u * 100}%`, top: `${uv.v * 100}%` }}
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full rounded-bl-none -rotate-45 border-2 border-background font-mono text-[11px] font-bold shadow-glow",
          className,
        )}
      >
        <span className="rotate-45">{icon ? <Flag className="size-3" /> : label}</span>
      </div>
    </div>
  );
}
