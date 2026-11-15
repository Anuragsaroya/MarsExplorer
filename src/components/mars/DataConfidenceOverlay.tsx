import { Database, ShieldCheck, CheckCircle2, HelpCircle } from "lucide-react";
import type { CellReport } from "@/lib/mars/assistant";
import { type ConfidenceLevel, type DataStatus } from "@/lib/mars/nasa-datasets";
import { NO_ICE } from "@/lib/mars/terrain";
import { cn } from "@/lib/utils";

export function getFieldConfidence(field: string, siteId: string): ConfidenceLevel {
  const conf: Record<string, Record<string, ConfidenceLevel>> = {
    elevation: { jezero: "high", arcadia: "high", korolev: "high" },
    slope: { jezero: "high", arcadia: "high", korolev: "high" },
    temperature: { jezero: "high", arcadia: "high", korolev: "high" },
    mineral: { jezero: "high", arcadia: "moderate", korolev: "moderate" },
    ice: { jezero: "low", arcadia: "high", korolev: "high" },
    radiation: { jezero: "high", arcadia: "moderate", korolev: "moderate" },
    science: { jezero: "high", arcadia: "moderate", korolev: "moderate" },
    hazard: { jezero: "moderate", arcadia: "moderate", korolev: "moderate" },
  };
  return conf[field]?.[siteId] ?? "moderate";
}

const CONFIDENCE_BADGE: Record<ConfidenceLevel, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-safe/20 text-safe border border-safe/40" },
  moderate: { label: "Moderate", cls: "bg-caution/20 text-caution border border-caution/40" },
  low: { label: "Low", cls: "bg-danger/20 text-danger border border-danger/40" },
  theoretical: { label: "Simulated", cls: "bg-muted text-muted-foreground border border-border" },
};

const STATUS_BADGE: Record<DataStatus | "derived", { label: string; cls: string }> = {
  modelled: { label: "Modelled", cls: "text-caution" },
  referenced: { label: "Referenced", cls: "text-safe" },
  planned: { label: "Planned", cls: "text-muted-foreground" },
  derived: { label: "Derived", cls: "text-primary" },
};

export function DataConfidenceOverlay({
  report,
  siteId = "arcadia",
}: {
  report: CellReport | null;
  siteId?: "jezero" | "arcadia" | "korolev";
}) {
  if (!report) {
    return (
      <div className="rounded-md border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
        Select a coordinate to review scientific data confidence and NASA dataset provenance.
      </div>
    );
  }

  const items = [
    {
      field: "Elevation",
      val: `${report.elevation.toFixed(0)} m`,
      dataset: "MOLA MEGDR",
      conf: getFieldConfidence("elevation", siteId),
      status: "modelled" as const,
      note: "Referenced to global MOLA datum",
    },
    {
      field: "Slope",
      val: `${report.slope.toFixed(1)}°`,
      dataset: "MOLA-derived",
      conf: getFieldConfidence("slope", siteId),
      status: "derived" as const,
      note: "Computed across 50m cells",
    },
    {
      field: "Surface Temp",
      val: `${report.temp.toFixed(0)} °C`,
      dataset: "THEMIS IR",
      conf: getFieldConfidence("temperature", siteId),
      status: "modelled" as const,
      note: "Calibrated to diurnal thermal cycle",
    },
    {
      field: "Mineralogy",
      val: report.mineralLabel,
      dataset: siteId === "jezero" ? "CRISM Targeted" : "CRISM / OMEGA",
      conf: getFieldConfidence("mineral", siteId),
      status: "modelled" as const,
      note: "Based on published spectral band ratios",
    },
    {
      field: "Water Ice",
      val: report.iceDepth < NO_ICE ? `${report.iceDepth.toFixed(1)}m deep` : "None",
      dataset:
        siteId === "arcadia"
          ? "SWIM / GRS / SHARAD"
          : siteId === "korolev"
            ? "SHARAD / HRSC"
            : "Orbital Spectral",
      conf: getFieldConfidence("ice", siteId),
      status: "modelled" as const,
      note:
        siteId === "arcadia" ? "Multi-radar dielectric interface" : "Visual/structural estimate",
    },
    {
      field: "Radiation",
      val: `${report.radiation.toFixed(2)} mGy/d`,
      dataset: "MSL RAD",
      conf: getFieldConfidence("radiation", siteId),
      status: "referenced" as const,
      note: "Curiosity empirical surface dose baseline",
    },
  ];

  // Calculate overall reliability
  const scoreMap = { high: 100, moderate: 65, low: 30, theoretical: 15 };
  const avgScore = Math.round(
    items.reduce((acc, curr) => acc + scoreMap[curr.conf], 0) / items.length,
  );

  return (
    <div className="rounded-md border border-border bg-card/90 p-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-foreground">
          <Database className="size-4 text-primary" /> Data Confidence & Provenance
        </span>
        <span className="font-mono text-xs font-semibold text-primary">
          Reliability: {avgScore}%
        </span>
      </div>

      <div className="mt-2.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>Overall Confidence Index</span>
          <span className="text-foreground">
            {avgScore >= 80 ? "High Fidelity" : avgScore >= 60 ? "Moderate Fidelity" : "Estimated"}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              avgScore >= 75 ? "bg-safe" : avgScore >= 50 ? "bg-caution" : "bg-danger",
            )}
            style={{ width: `${avgScore}%` }}
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="border-b border-border text-left text-[10px] text-muted-foreground">
              <th className="pb-1 font-medium">Layer</th>
              <th className="pb-1 font-medium">Sample Value</th>
              <th className="pb-1 font-medium">NASA Source</th>
              <th className="pb-1 font-medium text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((it) => {
              const badge = CONFIDENCE_BADGE[it.conf];
              const st = STATUS_BADGE[it.status];
              return (
                <tr key={it.field} className="hover:bg-muted/30">
                  <td className="py-1.5 font-medium text-foreground">{it.field}</td>
                  <td className="py-1.5 text-muted-foreground">{it.val}</td>
                  <td className="py-1.5 text-[10px]">
                    <span className="text-foreground">{it.dataset}</span>
                    <span className={cn("ml-1 font-semibold", st.cls)}>({st.label})</span>
                  </td>
                  <td className="py-1.5 text-right">
                    <span
                      className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold", badge.cls)}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
        <CheckCircle2 className="inline mr-1 size-3 text-safe" />
        Data provenance: Terrain layers are procedurally populated within published peer-reviewed
        ranges from MGS MOLA, MRO CRISM/SHARAD, and Odyssey THEMIS.
      </p>
    </div>
  );
}
