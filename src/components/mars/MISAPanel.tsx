import { useState } from "react";
import {
  Brain,
  Shield,
  Droplets,
  Zap,
  Navigation,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  PlaneLanding,
} from "lucide-react";
import type { CellReport } from "@/lib/mars/assistant";
import { iceStatus, ICE_STATUS_LABEL, fieldNotes } from "@/lib/mars/assistant";
import { NO_ICE, MINERAL_LABEL } from "@/lib/mars/terrain";
import { cn } from "@/lib/utils";

export function MISAPanel({ report }: { report: CellReport | null }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    water: true,
    hazard: true,
    landing: false,
    energy: false,
    route: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!report) {
    return (
      <section className="hud-panel p-3">
        <div className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
          <Brain className="size-4 animate-pulse text-primary" />
          <span>MISA Decision Support System</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Mars Intelligent Survival Assistant is on telemetry standby. Click or hover on any terrain
          point to generate AI mission recommendations.
        </p>
      </section>
    );
  }

  // Intelligence calculations
  const status = iceStatus(report);
  const notes = fieldNotes(report);

  // 1. Water probability
  let waterProb = 0;
  let waterAnalysis = "No surface or shallow ice detected at this location.";
  if (status === "surface") {
    waterProb = 98;
    waterAnalysis = "Exposed surface water ice confirmed. Direct scoop extraction possible.";
  } else if (status === "shallow") {
    waterProb = 85;
    waterAnalysis = `Shallow buried ice layer detected at ${report.iceDepth.toFixed(1)}m. High recovery feasibility.`;
  } else if (status === "buried") {
    waterProb = 55;
    waterAnalysis = `Deep ice-cemented regolith at ${report.iceDepth.toFixed(1)}m. Requires mechanical drill rig.`;
  } else if (status === "bound") {
    waterProb = 40;
    waterAnalysis =
      "Hydrated clay/carbonate minerals present. High-temperature thermal extraction required.";
  }

  // 2. Hazard Assessment
  const isExtremeHazard = report.hazardClass === 2 || report.slope > 25 || report.temp < -85;
  const isCautionHazard = report.hazardClass === 1 || report.slope > 12 || report.temp < -60;

  // 3. Landing Site Safety
  const landingScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        100 -
          report.slope * 2.8 -
          (report.hazardClass === 2 ? 45 : report.hazardClass === 1 ? 20 : 0),
      ),
    ),
  );
  const landingVerdict =
    landingScore >= 75
      ? "Optimal Landing Zone"
      : landingScore >= 50
        ? "Marginal Landing Zone"
        : "Unacceptable Landing Hazard";

  // 4. Energy cost
  const baseDrillKWh =
    status === "surface"
      ? 0.5
      : status === "shallow"
        ? report.iceDepth * 3.5
        : status === "buried"
          ? report.iceDepth * 8.2
          : 0;
  const suitHeatingKWh = report.temp < -80 ? 1.8 : report.temp < -50 ? 1.1 : 0.6;
  const totalOpEnergy = Math.round((baseDrillKWh + suitHeatingKWh) * 10) / 10;

  // Overall Advisory Verdict
  const verdict = isExtremeHazard
    ? { title: "ADVISORY: ABORT / AVOID", cls: "bg-danger/20 text-danger border-danger/50" }
    : isCautionHazard
      ? {
          title: "ADVISORY: PROCEED WITH CAUTION",
          cls: "bg-caution/20 text-caution border-caution/50",
        }
      : { title: "ADVISORY: PROCEED NOMINAL", cls: "bg-safe/20 text-safe border-safe/50" };

  return (
    <section className="hud-panel p-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="size-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-safe animate-ping" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
              MISA Intelligence
              <span className="rounded bg-primary/20 px-1.5 py-0.2 font-mono text-[9px] text-primary">
                v2.6
              </span>
            </h2>
          </div>
        </div>
        <span
          className={cn(
            "rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider",
            verdict.cls,
          )}
        >
          {verdict.title}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {notes.headline}. AI synthesis evaluated {report.slope.toFixed(0)}° slope,{" "}
        {report.temp.toFixed(0)}°C surface thermal inertia, and {report.waterLitresPerM3} L/m³ ice
        yield.
      </p>

      {/* 5 Collapsible Intelligence Categories */}
      <div className="mt-3 space-y-2">
        {/* Category 1: Water Resource Intelligence */}
        <div className="rounded border border-border/60 bg-secondary/30">
          <button
            type="button"
            onClick={() => toggleSection("water")}
            className="flex w-full items-center justify-between p-2 text-left text-xs font-semibold hover:bg-secondary/50"
          >
            <span className="flex items-center gap-1.5 text-ice">
              <Droplets className="size-3.5" /> 1. Water Extraction Probability ({waterProb}%)
            </span>
            {openSections["water"] ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {openSections["water"] && (
            <div className="border-t border-border/40 p-2 text-xs space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-ice transition-all"
                  style={{ width: `${waterProb}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{waterAnalysis}</p>
              {waterProb > 0 && (
                <div className="font-mono text-[10px] text-ice">
                  Resource Yield: ~{report.waterLitresPerM3} L potable H₂O / m³ excavation
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category 2: Hazard Identification */}
        <div className="rounded border border-border/60 bg-secondary/30">
          <button
            type="button"
            onClick={() => toggleSection("hazard")}
            className="flex w-full items-center justify-between p-2 text-left text-xs font-semibold hover:bg-secondary/50"
          >
            <span className="flex items-center gap-1.5 text-caution">
              <Shield className="size-3.5" /> 2. AI Danger & Risk Prediction
            </span>
            {openSections["hazard"] ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {openSections["hazard"] && (
            <div className="border-t border-border/40 p-2 text-xs space-y-1">
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground">
                {report.slope > 15 ? (
                  <li className="text-danger">
                    Slope {report.slope.toFixed(1)}° exceeds nominal rover traction. Risk of
                    sliding.
                  </li>
                ) : (
                  <li>Slope {report.slope.toFixed(1)}° is manageable for astronaut traverse.</li>
                )}
                {report.temp < -75 ? (
                  <li className="text-caution">
                    Severe cold ({report.temp.toFixed(0)} °C) accelerates battery discharge rates.
                  </li>
                ) : (
                  <li>
                    Thermal environment ({report.temp.toFixed(0)} °C) within nominal operational
                    limits.
                  </li>
                )}
                {report.iceDepth <= 0.05 && (
                  <li className="text-caution">
                    Surface ice presents friction reduction. EVA suit crampons recommended.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Category 3: Landing Safety */}
        <div className="rounded border border-border/60 bg-secondary/30">
          <button
            type="button"
            onClick={() => toggleSection("landing")}
            className="flex w-full items-center justify-between p-2 text-left text-xs font-semibold hover:bg-secondary/50"
          >
            <span className="flex items-center gap-1.5 text-primary">
              <PlaneLanding className="size-3.5" /> 3. Landing Feasibility ({landingScore}/100)
            </span>
            {openSections["landing"] ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {openSections["landing"] && (
            <div className="border-t border-border/40 p-2 text-xs space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Evaluation:</span>
                <span className="font-semibold text-foreground">{landingVerdict}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Touchdown slope limit is 12°. Current terrain gradient is {report.slope.toFixed(1)}
                °. Roughness penalty factor: {report.hazard.toFixed(2)}.
              </p>
            </div>
          )}
        </div>

        {/* Category 4: Energy Cost */}
        <div className="rounded border border-border/60 bg-secondary/30">
          <button
            type="button"
            onClick={() => toggleSection("energy")}
            className="flex w-full items-center justify-between p-2 text-left text-xs font-semibold hover:bg-secondary/50"
          >
            <span className="flex items-center gap-1.5 text-foreground">
              <Zap className="size-3.5 text-primary" /> 4. Mission Energy Budget (~{totalOpEnergy}{" "}
              kWh)
            </span>
            {openSections["energy"] ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {openSections["energy"] && (
            <div className="border-t border-border/40 p-2 text-xs space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Drill / Extraction draw:</span>
                <span className="text-foreground">{baseDrillKWh.toFixed(1)} kWh</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Suit thermal life-support:</span>
                <span className="text-foreground">{suitHeatingKWh.toFixed(1)} kWh/hr</span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t border-border/30 pt-1">
                <span className="font-semibold text-foreground">Estimated Excursion Draw:</span>
                <span className="font-semibold text-primary">{totalOpEnergy} kWh</span>
              </div>
            </div>
          )}
        </div>

        {/* Category 5: Tactical Recommendation */}
        <div className="rounded border border-border/60 bg-secondary/30">
          <button
            type="button"
            onClick={() => toggleSection("route")}
            className="flex w-full items-center justify-between p-2 text-left text-xs font-semibold hover:bg-secondary/50"
          >
            <span className="flex items-center gap-1.5 text-safe">
              <Navigation className="size-3.5" /> 5. Tactical Excursion Advisory
            </span>
            {openSections["route"] ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          {openSections["route"] && (
            <div className="border-t border-border/40 p-2 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <p>
                {report.hazardClass === 0
                  ? "Direct approach along the shortest or science route is cleared by MISA navigation safety models."
                  : report.hazardClass === 1
                    ? "Recommend selecting the 'Safest Route' mode to navigate around moderate terrain scarps and boulder clusters."
                    : "Reroute mandatory: approach coordinates via low-slope ramps on eastern/southern perimeter."}
              </p>
              {notes.samples.length > 0 && (
                <div className="font-mono text-[10px] text-foreground">
                  <span className="text-primary font-semibold">Priority Samples: </span>
                  {notes.samples.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-primary" /> Autonomous decision guidance
        </span>
        <span>Astro Intel Mission Protocol</span>
      </div>
    </section>
  );
}
