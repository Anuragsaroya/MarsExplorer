import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Battery,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Siren,
  Snowflake,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_CELL_M, NAV_H, NAV_W, hazardClass, type Terrain } from "@/lib/mars/terrain";
import { SUIT_BATTERY_HOURS, ROUTE_META, type PlannedRoute } from "@/lib/mars/planner";
import { buildTimeline, type SimEventKind } from "@/lib/mars/simulation";
import type { UV } from "./MarsMap";
import { hrs, km } from "./RoutePanel";
import { cn } from "@/lib/utils";

const EVENT_CLS: Record<SimEventKind, string> = {
  info: "text-muted-foreground",
  caution: "text-caution",
  danger: "text-danger",
  ice: "text-ice",
  science: "text-route-science",
  done: "text-safe",
};

/** Turn back when the O₂ left after walking home would drop below this reserve. */
export const RETURN_RESERVE_PCT = 15;

const SPEEDS = [0.5, 1, 2, 4];

export function SimulatorPanel({
  terrain,
  route,
  startName,
  goalName,
  onAstronaut,
}: {
  terrain: Terrain;
  route: PlannedRoute;
  startName: string;
  goalName: string;
  onAstronaut: (p: UV | null) => void;
}) {
  const path = route.path;
  const n = path.length;
  const tl = useMemo(
    () => buildTimeline(terrain, path, terrain.site.pois, startName, goalName),
    [terrain, path, startName, goalName],
  );
  const dist = useMemo(() => {
    const d = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      const a = path[k - 1]!;
      const b = path[k]!;
      d[k] =
        d[k - 1]! +
        Math.hypot((b % NAV_W) - (a % NAV_W), ((b / NAV_W) | 0) - ((a / NAV_W) | 0)) * NAV_CELL_M;
    }
    return d;
  }, [path, n]);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPos((p) => {
        const next = p + (n / 24) * dt * speed;
        if (next >= n - 1) {
          setPlaying(false);
          return n - 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, n]);

  const k = Math.min(n - 1, Math.floor(pos));
  const cell = path[k]!;
  const started = pos > 0;
  useEffect(() => {
    onAstronaut(
      started
        ? { u: ((cell % NAV_W) + 0.5) / NAV_W, v: (((cell / NAV_W) | 0) + 0.5) / NAV_H }
        : null,
    );
  }, [cell, started, onAstronaut]);
  useEffect(() => () => onAstronaut(null), [onAstronaut]);

  const o2 = tl.o2[k]!;
  const used = 100 - o2;
  const o2AfterReturn = o2 - used;
  const battery = Math.max(0, 100 - (tl.hours[k]! / SUIT_BATTERY_HOURS) * 100);
  const mustReturn = started && k < n - 1 && o2AfterReturn < RETURN_RESERVE_PCT;
  const log = tl.events
    .filter((e) => e.k <= k)
    .slice(-6)
    .reverse();
  const next = tl.events.find((e) => e.k > k && (e.kind === "ice" || e.kind === "science"));
  const hz = hazardClass(terrain.nav.hazard[cell]!);

  return (
    <section className="hud-panel p-3">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Gauge className="size-4 text-primary" /> Marswalk simulator
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {ROUTE_META[route.mode].label} route · {startName} → {goalName}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => (pos >= n - 1 ? (setPos(0), setPlaying(true)) : setPlaying((p) => !p))}
        >
          {playing ? <Pause /> : <Play />}{" "}
          {playing ? "Pause" : pos >= n - 1 ? "Replay" : started ? "Resume" : "Start EVA"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-label="Reset"
          onClick={() => (setPlaying(false), setPos(0))}
        >
          <RotateCcw />
        </Button>
        <div className="ml-auto flex rounded-md border border-border">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "px-2 py-1 font-mono text-[11px]",
                s === speed ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={n - 1}
        value={k}
        onChange={(e) => (setPlaying(false), setPos(Number(e.target.value)))}
        className="mt-3 w-full accent-primary"
        aria-label="Mission progress"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Gaugebar label="Suit O₂" icon={<Wind className="size-3" />} pct={o2} />
        <Gaugebar label="Battery" icon={<Battery className="size-3" />} pct={battery} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell k="Travelled" v={km(dist[k]!)} />
        <Cell k="Remaining" v={km(dist[n - 1]! - dist[k]!)} />
        <Cell k="Elapsed" v={hrs(tl.hours[k]!)} />
        <Cell k="Dose" v={`${tl.dose[k]!.toFixed(3)} mGy`} />
        <Cell k="Temp" v={`${terrain.nav.temp[cell]!.toFixed(0)} °C`} />
        <Cell
          k="Terrain"
          v={["Safe", "Caution", "Danger"][hz]!}
          cls={["text-safe", "text-caution", "text-danger"][hz]}
        />
      </dl>
      {next && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Snowflake className="size-3 text-ice" /> Next waypoint in {km(dist[next.k]! - dist[k]!)}:{" "}
          <span className="truncate text-foreground">{next.text.split(" — ")[0]}</span>
        </p>
      )}
      {mustReturn ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-md bg-danger/15 p-2 text-xs text-danger">
          <Siren className="mt-0.5 size-3.5 shrink-0" /> Return now: walking back to {startName} (
          {km(dist[k]!)}) would leave only {Math.max(0, o2AfterReturn).toFixed(0)}% O₂.
        </p>
      ) : (
        started && (
          <p className="mt-2 text-xs text-muted-foreground">
            Emergency return to {startName}: {km(dist[k]!)}, ~{hrs(tl.hours[k]!)}, arrives with{" "}
            {Math.max(0, o2AfterReturn).toFixed(0)}% O₂.
          </p>
        )
      )}
      <ol className="mt-3 space-y-1 border-t border-border pt-2 text-xs">
        {log.map((e, i) => (
          <li
            key={`${e.k}-${i}`}
            className={cn("flex gap-2", EVENT_CLS[e.kind], i > 0 && "opacity-60")}
          >
            <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground">
              T+{hrs(tl.hours[e.k]!)}
            </span>
            {e.kind === "danger" && <AlertTriangle className="mt-0.5 size-3 shrink-0" />}
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Gaugebar({ label, icon, pct }: { label: string; icon: React.ReactNode; pct: number }) {
  const tone = pct > 50 ? "bg-safe" : pct > 25 ? "bg-caution" : "bg-danger";
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span className="text-foreground">{pct.toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width]", tone)}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function Cell({ k, v, cls }: { k: string; v: string; cls?: string | undefined }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{k}</dt>
      <dd className={cls}>{v}</dd>
    </div>
  );
}
