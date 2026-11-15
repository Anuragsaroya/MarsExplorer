import {
  AlertTriangle,
  Mountain,
  Thermometer,
  RadioTower,
  Snowflake,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { CellReport } from "@/lib/mars/assistant";
import { cn } from "@/lib/utils";

export function DangerAnalysis({ report }: { report: CellReport | null }) {
  if (!report) {
    return (
      <div className="rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
        Select or hover over a location on the Martian surface to analyze environmental hazards.
      </div>
    );
  }

  // Factor 1: Slope
  const isHighSlope = report.slope > 20;
  const isModSlope = report.slope > 10;
  const slopeRisk = isHighSlope ? "High" : isModSlope ? "Moderate" : "Low";
  const slopeDesc = isHighSlope
    ? `Steep terrain (${report.slope.toFixed(1)}°) — anchor lines mandatory, risk of rover rollover`
    : isModSlope
      ? `Moderate gradient (${report.slope.toFixed(1)}°) — elevated suit exertion, loose regolith slip risk`
      : `Gentle incline (${report.slope.toFixed(1)}°) — nominal astronaut locomotion`;

  // Factor 2: Thermal
  const isExtremeCold = report.temp < -80;
  const isCold = report.temp < -50;
  const tempRisk = isExtremeCold ? "High" : isCold ? "Moderate" : "Nominal";
  const tempDesc = isExtremeCold
    ? `Extreme cold (${report.temp.toFixed(0)} °C) — suit life-support heating draw increases by 45%`
    : isCold
      ? `Sub-freezing (${report.temp.toFixed(0)} °C) — standard thermal insulation required`
      : `Temperate Martian range (${report.temp.toFixed(0)} °C) — optimal EVA conditions`;

  // Factor 3: Radiation
  const isElevatedRad = report.radiation > 0.72;
  const radRisk = isElevatedRad ? "Elevated" : "Baseline";
  const radDesc = isElevatedRad
    ? `Dose ${report.radiation.toFixed(2)} mGy/day exceeds baseline — thin atmosphere shielding`
    : `Dose ${report.radiation.toFixed(2)} mGy/day — consistent with MSL RAD baseline`;

  // Factor 4: Surface Traction / Ice
  const isSurfaceIce = report.iceDepth <= 0.05;
  const iceTractionRisk = isSurfaceIce ? "Caution" : "Stable";
  const iceTractionDesc = isSurfaceIce
    ? "Exposed water ice sheet — severe slipping hazard, micro-spikes/crampons required"
    : "Dry regolith crust — adequate footing traction";

  // Hazard Class & Verdict
  const hzCls = report.hazardClass; // 0: safe, 1: caution, 2: danger
  const verdictTitle =
    hzCls === 2 ? "HIGH RISK ENVIRONMENT" : hzCls === 1 ? "MODERATE RISK ZONE" : "LOW RISK TERRAIN";

  const verdictSummary =
    hzCls === 2
      ? `${report.slope.toFixed(0)}° slope + ${report.temp.toFixed(0)}°C cold + rugged terrain = Danger. Limit duration or deploy tethered rovers.`
      : hzCls === 1
        ? `Moderate slope (${report.slope.toFixed(0)}°) with caution-level terrain roughness. Proceed with active monitoring.`
        : "Nominal surface conditions. Terrain is stable for standard EVA operations.";

  return (
    <div className="rounded-md border border-border bg-card/80 p-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-foreground">
          {hzCls === 2 ? (
            <ShieldAlert className="size-4 text-danger animate-pulse" />
          ) : (
            <ShieldCheck className="size-4 text-primary" />
          )}
          AI Hazard Breakdown
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
            hzCls === 2
              ? "bg-danger/20 text-danger border border-danger/40"
              : hzCls === 1
                ? "bg-caution/20 text-caution border border-caution/40"
                : "bg-safe/20 text-safe border border-safe/40",
          )}
        >
          {verdictTitle}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{verdictSummary}</p>

      <div className="mt-3 space-y-2">
        {/* Slope Row */}
        <div className="rounded border border-border/50 bg-secondary/30 p-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <Mountain className="size-3.5 text-muted-foreground" />
              Slope Gradient: <span className="font-mono">{report.slope.toFixed(1)}°</span>
            </span>
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                isHighSlope ? "text-danger" : isModSlope ? "text-caution" : "text-safe",
              )}
            >
              {slopeRisk}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{slopeDesc}</p>
        </div>

        {/* Temperature Row */}
        <div className="rounded border border-border/50 bg-secondary/30 p-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <Thermometer className="size-3.5 text-muted-foreground" />
              Thermal Inertia: <span className="font-mono">{report.temp.toFixed(0)} °C</span>
            </span>
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                isExtremeCold ? "text-danger" : isCold ? "text-caution" : "text-safe",
              )}
            >
              {tempRisk}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{tempDesc}</p>
        </div>

        {/* Radiation Row */}
        <div className="rounded border border-border/50 bg-secondary/30 p-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <RadioTower className="size-3.5 text-muted-foreground" />
              Radiation Flux: <span className="font-mono">{report.radiation.toFixed(2)} mGy/d</span>
            </span>
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                isElevatedRad ? "text-caution" : "text-safe",
              )}
            >
              {radRisk}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{radDesc}</p>
        </div>

        {/* Ice / Traction Row */}
        <div className="rounded border border-border/50 bg-secondary/30 p-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <Snowflake className="size-3.5 text-ice" />
              Surface Traction:{" "}
              <span className="font-mono">{isSurfaceIce ? "Exposed Ice" : "Dry Regolith"}</span>
            </span>
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                isSurfaceIce ? "text-caution" : "text-safe",
              )}
            >
              {iceTractionRisk}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{iceTractionDesc}</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-caution" />
        <span>
          Safety Protocol: Multi-hazard AI evaluates combined synergistic risks. High slopes
          combined with low temperatures drastically accelerate astronaut metabolic exhaustion.
        </span>
      </div>
    </div>
  );
}
