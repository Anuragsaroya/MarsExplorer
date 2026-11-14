import { Crosshair, FlaskConical, Snowflake } from "lucide-react";
import { fieldNotes, iceStatus, ICE_STATUS_LABEL, type CellReport } from "@/lib/mars/assistant";
import { cn } from "@/lib/utils";

const HAZ = [
  { label: "Safe", cls: "text-safe" },
  { label: "Caution", cls: "text-caution" },
  { label: "Danger", cls: "text-danger" },
] as const;

export function InspectorPanel({ report, pinned }: { report: CellReport | null; pinned: boolean }) {
  if (!report)
    return (
      <section className="hud-panel flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Crosshair className="size-4 text-primary" /> Hover or click the map to read every data
        layer at that point.
      </section>
    );
  const ice = iceStatus(report);
  const notes = fieldNotes(report);
  const hz = HAZ[report.hazardClass];
  return (
    <section className="hud-panel grid gap-3 p-3 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Crosshair className="size-4 text-primary" /> Point readout
          <span className="hud-label ml-auto">{pinned ? "pinned" : "hover"}</span>
        </h2>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
          <Row k="Lat / Lon" v={`${report.lat.toFixed(3)}°, ${report.lon.toFixed(3)}°`} />
          <Row k="Elevation" v={`${report.elevation.toFixed(0)} m`} />
          <Row k="Slope" v={`${report.slope.toFixed(1)}°`} />
          <Row k="Surface temp" v={`${report.temp.toFixed(0)} °C`} />
          <Row k="Mineral" v={report.mineralLabel} />
          <Row k="Radiation" v={`${report.radiation.toFixed(2)} mGy/day`} />
          <Row k="Science value" v={`${Math.round(report.science * 100)} / 100`} />
          <div>
            <dt className="text-[10px] text-muted-foreground">Hazard</dt>
            <dd className={hz.cls}>{hz.label}</dd>
          </div>
        </dl>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 rounded-md border p-2 text-xs",
            ice === "none"
              ? "border-border text-muted-foreground"
              : "border-ice/50 bg-ice/10 text-ice",
          )}
        >
          <Snowflake className="size-4 shrink-0" />
          <span>
            <b className="font-semibold">{ICE_STATUS_LABEL[ice]}</b>
            {(ice === "shallow" || ice === "buried") && ` · ${report.iceDepth.toFixed(1)} m deep`}
            {ice !== "none" && ice !== "bound" && ` · ~${report.waterLitresPerM3} L water/m³`}
          </span>
        </div>
      </div>
      <div className="rounded-md border border-border bg-secondary/30 p-3">
        <p className="hud-label flex items-center gap-1.5">
          <FlaskConical className="size-3" /> Science assistant
        </p>
        <p className="mt-1 font-display text-sm font-semibold">{notes.headline}</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {notes.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {notes.samples.length > 0 && (
          <p className="mt-2 text-xs">
            <span className="text-muted-foreground">Collect: </span>
            {notes.samples.join(" · ")}
          </p>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">
          Based on map layers only — confirm on site before claiming a discovery.
        </p>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  );
}
