import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  HAZARD_RGB,
  LAYER_INFO,
  LAYER_ORDER,
  MINERAL_RGB,
  RAMPS,
  rampCss,
  type LayerId,
} from "@/lib/mars/render";
import { MINERAL_LABEL, Mineral } from "@/lib/mars/terrain";
import { cn } from "@/lib/utils";

export interface LayerState {
  on: boolean;
  opacity: number;
}

const rgb = (c: [number, number, number]) => `rgb(${c.join(",")})`;

/** Extra provenance metadata shown when a layer row is expanded */
const LAYER_PROVENANCE: Record<
  LayerId,
  { resolution: string; dataStatus: "observed" | "derived" | "simulated"; statusNote: string }
> = {
  ice: {
    resolution: "1–4 km/pixel (SWIM synthesis)",
    dataStatus: "simulated",
    statusNote:
      "Procedurally generated within SWIM/SHARAD published ice-depth ranges for each site.",
  },
  topo: {
    resolution: "~463 m/pixel (MOLA MEGDR)",
    dataStatus: "simulated",
    statusNote:
      "Elevation values referenced to published MOLA site means; fine detail is procedural.",
  },
  contours: {
    resolution: "Derived from modelled elevation",
    dataStatus: "derived",
    statusNote: "Contour interval auto-scales (5/10/25 m) based on local relief.",
  },
  thermal: {
    resolution: "~100 m/pixel (THEMIS IR)",
    dataStatus: "simulated",
    statusNote: "Temperature ranges calibrated to published THEMIS nighttime IR site measurements.",
  },
  spectral: {
    resolution: "~18 m/pixel (CRISM targeted)",
    dataStatus: "simulated",
    statusNote: "Mineral assignments follow published CRISM/OMEGA site characterisations.",
  },
  hazard: {
    resolution: "~1 m/pixel (HiRISE rock counts)",
    dataStatus: "derived",
    statusNote: "Hazard score derived from modelled slope, rock density, and dune cover.",
  },
  radiation: {
    resolution: "Point measurement (MSL RAD)",
    dataStatus: "derived",
    statusNote:
      "Scaled from RAD baseline of 0.67 mGy/day (Hassler et al. 2014). Modelled elevation correction applied.",
  },
  science: {
    resolution: "Derived from mission objectives",
    dataStatus: "derived",
    statusNote:
      "Science value combines mineral signature, hydration, crater proximity, and POI classification.",
  },
};

const DATA_STATUS_BADGE: Record<string, string> = {
  observed: "bg-safe/15 text-safe",
  derived: "bg-primary/15 text-primary",
  simulated: "bg-caution/15 text-caution",
};

function Legend({ id }: { id: LayerId }) {
  if (id === "ice")
    return (
      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        {[
          ["rgb(235,252,255)", "Bare ice (surface)"],
          ["rgb(120,220,245)", "Ice < 1 m deep"],
          ["rgb(60,140,230)", "Ice 1–3 m deep"],
          ["rgb(40,70,180)", "Ice > 3 m deep"],
          ["rgb(90,210,200)", "Water in minerals"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    );
  if (id === "hazard")
    return (
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        {["Safe", "Caution", "Danger"].map((l, i) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: rgb(HAZARD_RGB[i]!) }} />
            {l}
          </span>
        ))}
      </div>
    );
  if (id === "spectral")
    return (
      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        {[
          Mineral.Clay,
          Mineral.Carbonate,
          Mineral.Olivine,
          Mineral.Sulfate,
          Mineral.WaterIce,
          Mineral.Basalt,
        ].map((m) => (
          <span key={m} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: rgb(MINERAL_RGB[m]) }} />
            {MINERAL_LABEL[m]}
          </span>
        ))}
      </div>
    );
  const ramp =
    id === "topo"
      ? RAMPS.topo
      : id === "thermal"
        ? RAMPS.thermal
        : id === "radiation"
          ? RAMPS.radiation
          : id === "science"
            ? RAMPS.science
            : null;
  if (!ramp) return null;
  const [lo, hi] =
    id === "topo"
      ? ["Low", "High"]
      : id === "thermal"
        ? ["Cold", "Warm"]
        : id === "radiation"
          ? ["Lower dose", "Higher"]
          : ["Low", "High value"];
  return (
    <div>
      <div className="h-1.5 rounded-full" style={{ background: rampCss(ramp) }} />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

export function LayerPanel({
  state,
  onChange,
}: {
  state: Record<LayerId, LayerState>;
  onChange: (id: LayerId, s: LayerState) => void;
}) {
  const [expandedInfo, setExpandedInfo] = useState<LayerId | null>(null);

  return (
    <section className="hud-panel p-3">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Layers className="size-4 text-primary" /> Data layers
      </h2>
      <ul className="space-y-2">
        {LAYER_ORDER.map((id) => {
          const info = LAYER_INFO[id];
          const s = state[id];
          const ice = id === "ice";
          const prov = LAYER_PROVENANCE[id];
          const infoOpen = expandedInfo === id;
          return (
            <li
              key={id}
              className={cn(
                "rounded-md border p-2 transition-colors",
                s.on
                  ? ice
                    ? "border-ice/60 bg-ice/5"
                    : "border-border bg-secondary/40"
                  : "border-transparent",
              )}
            >
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={s.on}
                  onCheckedChange={(on) => onChange(id, { ...s, on })}
                  aria-label={info.label}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-xs font-medium", ice && "text-ice")}>
                    {info.label}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {info.source}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedInfo(infoOpen ? null : id);
                  }}
                  className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Dataset info"
                >
                  {infoOpen ? <ChevronDown className="size-3.5" /> : <Info className="size-3.5" />}
                </button>
              </label>
              {infoOpen && (
                <div className="mt-2 ml-11 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px]",
                        DATA_STATUS_BADGE[prov.dataStatus],
                      )}
                    >
                      {prov.dataStatus}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {prov.resolution}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {prov.statusNote}
                  </p>
                </div>
              )}
              {s.on && (
                <div className="mt-2 space-y-2 pl-11">
                  <Slider
                    value={[s.opacity]}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onValueChange={(v) => onChange(id, { ...s, opacity: v[0] ?? s.opacity })}
                    aria-label={`${info.label} opacity`}
                  />
                  <Legend id={id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
