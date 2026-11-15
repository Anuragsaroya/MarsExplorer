import { Droplets, Zap, Pickaxe, Beaker, Fuel, Snowflake, CheckCircle2 } from "lucide-react";
import type { CellReport } from "@/lib/mars/assistant";
import { iceStatus, ICE_STATUS_LABEL } from "@/lib/mars/assistant";
import { NO_ICE } from "@/lib/mars/terrain";
import { cn } from "@/lib/utils";

export function WaterExtractionPanel({ report }: { report: CellReport | null }) {
  if (!report) {
    return (
      <div className="rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
        Select a map location to inspect water ice extraction feasibility.
      </div>
    );
  }

  const status = iceStatus(report);
  const hasIce = report.iceDepth < NO_ICE || report.hydration >= 0.4;

  if (!hasIce || status === "none") {
    return (
      <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <Snowflake className="size-4 text-muted-foreground" />
          <span className="font-semibold">No Extractable Water Ice Detected</span>
        </div>
        <p className="mt-1 text-[11px]">
          Radar and thermal inertia signatures indicate dry basaltic/dust regolith with negligible
          hydrogen concentration at this coordinate.
        </p>
      </div>
    );
  }

  // Calculate parameters
  const depth = report.iceDepth;
  const isSurface = depth <= 0.05;
  const isShallow = depth > 0.05 && depth < 1.0;
  const isBuried = depth >= 1.0 && depth < NO_ICE;
  const isBound = status === "bound";

  // Drilling Equipment
  let drillMethod = "Direct Surface Scraping & Shoveling";
  let drillTime = "15 – 45 min";
  let energyKWh = 0.5;
  let accessibilityScore = 95;

  if (isShallow) {
    drillMethod = "Hand-portable Core Auger Drill (< 1m)";
    drillTime = "1.5 – 3.0 hours";
    energyKWh = Math.round((depth * 3.2 + 0.8) * 10) / 10;
    accessibilityScore = Math.max(50, Math.round(90 - depth * 35));
  } else if (isBuried) {
    drillMethod = "Powered Rotary Percussion Drill (1–3m)";
    drillTime = "4.0 – 8.0 hours";
    energyKWh = Math.round((depth * 7.5 + 2.0) * 10) / 10;
    accessibilityScore = Math.max(20, Math.round(60 - depth * 12));
  } else if (isBound) {
    drillMethod = "High-Temperature Thermal Kiln (400°C Dehydration)";
    drillTime = "6.0 – 12.0 hours per batch";
    energyKWh = 18.5;
    accessibilityScore = 30;
  }

  // Water Yield and ISRU conversions
  const waterL = report.waterLitresPerM3;
  // Electrolysis: 2 H2O -> 2 H2 + O2 (18g H2O yields 16g O2 and 2g H2 -> 88.8% O2, 11.2% H2)
  const oxygenKg = Math.round(waterL * 0.888 * 10) / 10;
  const hydrogenKg = Math.round(waterL * 0.112 * 10) / 10;
  // Methane production with atmospheric CO2 via Sabatier: CO2 + 4H2 -> CH4 + 2H2O
  // 1 kg H2 produces approx 2 kg CH4
  const methaneKg = Math.round(hydrogenKg * 2.0 * 10) / 10;

  return (
    <div className="rounded-md border border-ice/50 bg-ice/10 p-3 shadow-ice">
      <div className="flex items-center justify-between border-b border-ice/30 pb-2">
        <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-ice">
          <Droplets className="size-4" /> Smart Water Extraction Planner
        </span>
        <span className="rounded bg-ice/20 px-2 py-0.5 font-mono text-[10px] text-ice">
          {ICE_STATUS_LABEL[status]}
        </span>
      </div>

      {/* Extraction Feasibility Score */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Accessibility Score</span>
          <span className="text-ice font-semibold">{accessibilityScore} / 100</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-ice transition-all duration-300"
            style={{ width: `${accessibilityScore}%` }}
          />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="rounded border border-ice/30 bg-background/50 p-2">
          <dt className="text-[10px] text-muted-foreground">Ice Overburden Depth</dt>
          <dd className="text-xs font-semibold text-foreground">
            {isSurface
              ? "0.0 m (Exposed)"
              : isBound
                ? "In Mineral Lattice"
                : `${depth.toFixed(2)} m`}
          </dd>
        </div>
        <div className="rounded border border-ice/30 bg-background/50 p-2">
          <dt className="text-[10px] text-muted-foreground">Ice Purity / Fraction</dt>
          <dd className="text-xs font-semibold text-ice">
            {isBound ? "Hydrated Clays" : `${Math.round(report.iceFrac * 100)}% by volume`}
          </dd>
        </div>
        <div className="rounded border border-ice/30 bg-background/50 p-2">
          <dt className="text-[10px] text-muted-foreground">Estimated Water Yield</dt>
          <dd className="text-xs font-semibold text-foreground">{waterL} L / m³ ground</dd>
        </div>
        <div className="rounded border border-ice/30 bg-background/50 p-2">
          <dt className="text-[10px] text-muted-foreground">Drill Energy Required</dt>
          <dd className="text-xs font-semibold text-primary">~{energyKWh} kWh / m³</dd>
        </div>
      </dl>

      {/* Drilling Requirements */}
      <div className="mt-3 rounded border border-ice/30 bg-background/40 p-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Pickaxe className="size-3.5 text-ice" />
          <span>Extraction Method: {drillMethod}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Estimated Operation Time:</span>
          <span className="font-mono text-foreground">{drillTime}</span>
        </div>
      </div>

      {/* In-Situ Resource Utilization (ISRU) Potential */}
      <div className="mt-3 border-t border-ice/20 pt-2">
        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
          <Beaker className="size-3 text-ice" /> ISRU Conversion Potential (per 1 m³ melted)
        </span>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
          <div className="rounded bg-ice/15 p-1.5 border border-ice/30">
            <Droplets className="mx-auto size-3 text-ice mb-0.5" />
            <div className="text-ice font-bold">{waterL} L</div>
            <div className="text-[9px] text-muted-foreground">Potable H₂O</div>
          </div>
          <div className="rounded bg-primary/15 p-1.5 border border-primary/30">
            <Zap className="mx-auto size-3 text-primary mb-0.5" />
            <div className="text-primary font-bold">{oxygenKg} kg</div>
            <div className="text-[9px] text-muted-foreground">Breathing O₂</div>
          </div>
          <div className="rounded bg-route-water/15 p-1.5 border border-route-water/30">
            <Fuel className="mx-auto size-3 text-route-water mb-0.5" />
            <div className="text-route-water font-bold">{methaneKg} kg</div>
            <div className="text-[9px] text-muted-foreground">Rocket CH₄</div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        Note: Extraction models calibrated to SWIM v3 shallow ice depth distributions and standard
        Sabatier electrolysis efficiencies.
      </p>
    </div>
  );
}
