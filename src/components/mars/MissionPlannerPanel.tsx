/**
 * Mission Planner Panel — Mars Explorer AI
 * Team Astro Intel | NASA Space Apps Challenge 2026
 *
 * Displays AI-generated mission briefing for the selected route and site.
 * All analysis is rule-based; no external AI service is required.
 */
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Droplets,
  FlaskConical,
  Map,
  ShieldAlert,
  Snowflake,
  Zap,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyzeMission,
  MISSION_OBJECTIVE_LABELS,
  type MissionObjective,
  type MissionBriefing,
} from "@/lib/mars/intelligence";
import type { PlannedRoute } from "@/lib/mars/planner";
import type { Poi } from "@/lib/mars/sites";
import type { Terrain } from "@/lib/mars/terrain";
import { ROUTE_META } from "@/lib/mars/planner";
import { NAV_W, NAV_H } from "@/lib/mars/terrain";
import type { UV } from "./MarsMap";
import { cn } from "@/lib/utils";

const OBJECTIVES: MissionObjective[] = [
  "explore",
  "ice-extraction",
  "science-survey",
  "reconnaissance",
];

const OBJECTIVE_ICONS: Record<MissionObjective, React.ReactNode> = {
  explore: <Map className="size-4" />,
  "ice-extraction": <Snowflake className="size-4" />,
  "science-survey": <FlaskConical className="size-4" />,
  reconnaissance: <Zap className="size-4" />,
};

const SEVERITY_CLS = {
  low: "text-safe",
  medium: "text-caution",
  high: "text-danger",
  critical: "text-danger",
};

interface Props {
  terrain: Terrain;
  routes: PlannedRoute[];
  start: UV;
  goal: UV;
  startName: string;
  goalName: string;
  pois: Poi[];
}

function Section({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-secondary/30 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        {title}
        {open ? (
          <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function FeasibilityBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-safe" : score >= 50 ? "bg-caution" : "bg-danger";
  const label = score >= 75 ? "Feasible" : score >= 50 ? "Marginal" : "High risk";
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">Mission Feasibility</span>
        <span className={score >= 75 ? "text-safe" : score >= 50 ? "text-caution" : "text-danger"}>
          {score}/100 — {label}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function MissionPlannerPanel({
  terrain,
  routes,
  start,
  goal,
  startName,
  goalName,
  pois,
}: Props) {
  const [objective, setObjective] = useState<MissionObjective>("explore");
  const [briefing, setBriefing] = useState<MissionBriefing | null>(null);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const startIdx = useMemo(() => {
    const x = Math.min(NAV_W - 1, Math.max(0, Math.floor(start.u * NAV_W)));
    const y = Math.min(NAV_H - 1, Math.max(0, Math.floor(start.v * NAV_H)));
    return { index: y * NAV_W + x, name: startName };
  }, [start, startName]);

  const goalIdx = useMemo(() => {
    const x = Math.min(NAV_W - 1, Math.max(0, Math.floor(goal.u * NAV_W)));
    const y = Math.min(NAV_H - 1, Math.max(0, Math.floor(goal.v * NAV_H)));
    return { index: y * NAV_W + x, name: goalName };
  }, [goal, goalName]);

  function generate() {
    const result = analyzeMission(terrain, startIdx, goalIdx, routes, pois);
    setBriefing(result);
    setGenerated(true);
  }

  function handleCopy() {
    if (!briefing) return;
    const text = [
      `# ${briefing.missionTitle}`,
      `Site: ${terrain.site.name} (${terrain.site.lat.toFixed(2)}° N, ${terrain.site.lon.toFixed(2)}° E)`,
      `Objective: ${MISSION_OBJECTIVE_LABELS[objective]}`,
      `Feasibility Score: ${briefing.feasibilityScore}/100`,
      ``,
      `## Mission Overview`,
      briefing.missionOverview,
      ``,
      `## Recommended Route: ${briefing.recommendedRoute.toUpperCase()}`,
      briefing.recommendedRouteExplanation,
      ``,
      `## Consumables Budget`,
      `- Total Round-Trip Distance: ${briefing.resourceRequirements.walkingKm.toFixed(2)} km`,
      `- Required O₂: ${briefing.resourceRequirements.o2Hours.toFixed(1)} h equivalent`,
      `- Required Battery: ${briefing.resourceRequirements.batteryHours.toFixed(1)} h equivalent`,
      `- Emergency Abort Assessment: ${briefing.emergencyReturnAssessment}`,
      ``,
      `## Environmental Hazards & Risks`,
      ...(briefing.environmentalRisks.length > 0
        ? briefing.environmentalRisks.map(
            (r) => `- [${r.severity.toUpperCase()}] ${r.type}: ${r.description}`,
          )
        : ["- No critical environmental risks identified."]),
      ``,
      `## Water Ice Targets`,
      ...(briefing.waterIceDiscoveries.length > 0
        ? briefing.waterIceDiscoveries.map(
            (w) => `- ${w.location}: ${w.evidence} (${w.confidence} confidence)`,
          )
        : ["- No shallow ice targets detected on traverse."]),
      ``,
      `## Science Objectives`,
      ...(briefing.scienceObjectives.length > 0
        ? briefing.scienceObjectives.map((s) => `- ${s}`)
        : ["- Standard reconnaissance survey."]),
      ``,
      `---`,
      `Mars Explorer AI · Team Astro Intel · NASA Space Apps Challenge 2026`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    if (!briefing) return;
    const data = {
      metadata: {
        generatedAt: new Date().toISOString(),
        platform: "Mars Explorer AI",
        team: "Astro Intel",
        challenge: "NASA Space Apps Challenge 2026",
      },
      site: {
        id: terrain.site.id,
        name: terrain.site.name,
        lat: terrain.site.lat,
        lon: terrain.site.lon,
      },
      mission: {
        objective,
        start: { name: startName, uv: start },
        goal: { name: goalName, uv: goal },
        briefing,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mars-plan-${terrain.site.id}-${briefing.recommendedRoute}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="hud-panel">
      <div className="p-3">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="size-4 text-primary" /> Mission Planner
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          AI-assisted mission briefing based on terrain, routes and safety constraints.
        </p>

        {/* Objective selector */}
        <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Mission objective
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {OBJECTIVES.map((obj) => (
            <button
              key={obj}
              type="button"
              onClick={() => setObjective(obj)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                objective === obj
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {OBJECTIVE_ICONS[obj]}
              {MISSION_OBJECTIVE_LABELS[obj]}
            </button>
          ))}
        </div>

        <Button size="sm" className="mt-3 w-full" onClick={generate} disabled={routes.length === 0}>
          Generate Mission Brief
        </Button>
        {routes.length === 0 && (
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Select a route first to generate a brief.
          </p>
        )}
      </div>

      {/* Briefing output */}
      {generated && briefing && (
        <div className="border-t border-border">
          {/* Overview */}
          <div className="px-3 py-3">
            <p className="hud-label mb-1 text-primary">{briefing.missionTitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {briefing.missionOverview}
            </p>
            <div className="mt-3">
              <FeasibilityBar score={briefing.feasibilityScore} />
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 text-xs gap-1.5 border-border bg-card hover:bg-secondary/40"
              >
                {copied ? (
                  <Check className="size-3 text-safe" />
                ) : (
                  <Copy className="size-3 text-muted-foreground" />
                )}
                {copied ? "Copied" : "Copy Brief"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadJson}
                className="flex-1 text-xs gap-1.5 border-border bg-card hover:bg-secondary/40"
              >
                <Download className="size-3 text-muted-foreground" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Warnings */}
          {briefing.warnings.length > 0 && (
            <div className="mx-3 mb-3 rounded-md border border-danger/30 bg-danger/10 p-2">
              {briefing.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 text-xs text-danger">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Recommended route */}
          <Section icon={<Map className="size-4" />} title="Recommended Route" defaultOpen>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-2">
              <p className="text-xs font-semibold text-primary">
                {ROUTE_META[briefing.recommendedRoute].label} Route
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {briefing.recommendedRouteExplanation}
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {briefing.routeComparisons.map((rc) => (
                <div key={rc.mode} className="flex items-baseline gap-2 text-xs">
                  <span className="w-20 shrink-0 font-mono text-muted-foreground">
                    {ROUTE_META[rc.mode].label}
                  </span>
                  <span className="text-muted-foreground">{rc.explanation}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Destination analysis */}
          <Section icon={<Map className="size-4" />} title="Destination Analysis">
            <ul className="space-y-1">
              {briefing.destinationAnalysis.map((line, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 text-primary">·</span>
                  {line}
                </li>
              ))}
            </ul>
          </Section>

          {/* Environmental risks */}
          <Section icon={<ShieldAlert className="size-4" />} title="Environmental Risks">
            {briefing.environmentalRisks.length === 0 ? (
              <p className="flex items-center gap-1.5 text-xs text-safe">
                <CheckCircle2 className="size-3.5" /> No significant environmental risks identified.
              </p>
            ) : (
              <div className="space-y-2">
                {briefing.environmentalRisks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        SEVERITY_CLS[r.severity] ?? "text-muted-foreground",
                      )}
                    />
                    <div>
                      <span className={cn("font-semibold", SEVERITY_CLS[r.severity])}>
                        {r.type}
                      </span>
                      <span className="ml-1 text-muted-foreground">— {r.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Science objectives */}
          <Section icon={<FlaskConical className="size-4" />} title="Science Objectives">
            <ul className="space-y-1">
              {briefing.scienceObjectives.map((obj, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="text-route-science">◆</span> {obj}
                </li>
              ))}
            </ul>
          </Section>

          {/* Ice targets */}
          {briefing.waterIceDiscoveries.length > 0 && (
            <Section icon={<Snowflake className="size-4" />} title="Water Ice Targets">
              <div className="space-y-2">
                {briefing.waterIceDiscoveries.slice(0, 5).map((d, i) => (
                  <div key={i} className="rounded-md border border-ice/20 bg-ice/5 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-ice">{d.location}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px]",
                          d.confidence === "high"
                            ? "bg-safe/15 text-safe"
                            : d.confidence === "moderate"
                              ? "bg-caution/15 text-caution"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {d.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{d.evidence}</p>
                    {d.depth !== null && d.depth > 0 && (
                      <p className="mt-0.5 text-ice/80">Depth: ~{d.depth.toFixed(1)} m</p>
                    )}
                  </div>
                ))}
                {briefing.waterIceDiscoveries.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    + {briefing.waterIceDiscoveries.length - 5} more ice zones along route
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* Resources */}
          <Section icon={<Droplets className="size-4" />} title="Resource Requirements">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <div>
                <dt className="text-[10px] text-muted-foreground">Round-trip distance</dt>
                <dd>{briefing.resourceRequirements.walkingKm.toFixed(2)} km</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">O₂ needed (round trip)</dt>
                <dd>{briefing.resourceRequirements.o2Hours.toFixed(1)} h equivalent</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Battery needed</dt>
                <dd>{briefing.resourceRequirements.batteryHours.toFixed(1)} h equivalent</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {briefing.emergencyReturnAssessment}
            </p>
          </Section>

          <div className="p-3 pt-0">
            <p className="text-[10px] text-muted-foreground">
              Analysis based on modelled terrain data — not actual NASA measurements. All safety
              values are planning aids only.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
