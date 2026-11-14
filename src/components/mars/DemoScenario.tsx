/**
 * Guided Demo Scenario — Mars Explorer AI
 * Team Astro Intel | NASA Space Apps Challenge 2026
 *
 * Interactive walkthrough showcasing how to plan an excursion at Jezero Crater:
 * 1. Site Context & Objectives
 * 2. Multi-Layer Remote Sensing
 * 3. Route Tradeoff Analysis
 * 4. EVA Survival Simulation & Safety Limits
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  Layers,
  MapPin,
  Route,
  Activity,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldAlert,
  Snowflake,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: { title: string; detail: string }[];
  takeaway: string;
}

const STEPS: Step[] = [
  {
    title: "1. Select Exploration Target: Jezero Crater",
    badge: "Site Briefing",
    icon: MapPin,
    description:
      "Jezero Crater preserves an ancient Martian river delta where water once flowed into a 45-km lake. Our objective is an EVA traverse from Mars Base Alpha to the Delta Front sample site.",
    highlights: [
      {
        title: "Perseverance Ground Truth",
        detail:
          "Traverse area validated against NASA Perseverance rover Mastcam-Z and SuperCam data.",
      },
      {
        title: "Bound Water Signatures",
        detail:
          "Water here is chemically locked in smectite clays and hydrated carbonates (~3–6% H₂O by weight).",
      },
      {
        title: "High Biosignature Potential",
        detail:
          "Sedimentary fine-grained mudstones at the delta toe offer prime astrobiological research targets.",
      },
    ],
    takeaway:
      "Jezero offers world-class science, but delta scarps require strict slope management.",
  },
  {
    title: "2. Inspect Remote Sensing Layers",
    badge: "Planetary Science",
    icon: Layers,
    description:
      "Stack orbital sensor layers to uncover unseen terrain hazards and resources before astronauts step outside the airlock.",
    highlights: [
      {
        title: "MOLA & HiRISE Topography",
        detail:
          "Digital elevation models map 100 m cliffs, sand ripple fields, and steep delta escarpments.",
      },
      {
        title: "THEMIS & GRS Resource Mapping",
        detail:
          "Thermal inertia and epithermal neutron flux indicate regolith grain size and water-equivalent hydrogen.",
      },
      {
        title: "MSL RAD Radiation Field",
        detail:
          "Surface cosmic ray dose models highlight high-exposure plateaus vs. shielded crater depressions.",
      },
    ],
    takeaway: "Layer blending reveals hidden hazards that single optical cameras miss completely.",
  },
  {
    title: "3. Evaluate Multi-Criteria Routes",
    badge: "Pathfinding Engine",
    icon: Route,
    description:
      "Our A* algorithm calculates 4 distinct traverses between habitat and target, trading off distance, slope safety, science return, and water accessibility.",
    highlights: [
      {
        title: "Shortest vs. Safest",
        detail:
          "The shortest route cuts across 26° delta scarps (high slip hazard), while the Safest route contours around gentle 9° slopes.",
      },
      {
        title: "Science Route",
        detail:
          "Detours via Belva crater rim and Séítah olivine outcrops, maximizing geological diversity.",
      },
      {
        title: "Water / Ice Route",
        detail:
          "Directs crew through hydrated carbonate margins with highest potential water yield.",
      },
    ],
    takeaway:
      "For pedestrian EVA, the Safest route prevents fall trauma and keeps energy expenditure predictable.",
  },
  {
    title: "4. Simulate EVA Consumables & Return Limits",
    badge: "Survival Engine",
    icon: Activity,
    description:
      "Step through the Marswalk minute-by-minute with live suit telemetry tracking O₂ metabolic consumption, battery heating, and cosmic radiation.",
    highlights: [
      {
        title: "The 15% O₂ Abort Threshold",
        detail:
          "Emergency return calculations guarantee astronauts can jog back to base with 15% life-support margin intact.",
      },
      {
        title: "Cold-Induced Battery Drain",
        detail:
          "Nighttime lows (-85°C) increase suit heater load, depleting battery faster than oxygen reserves.",
      },
      {
        title: "NASA Radiation Limits",
        detail:
          "Dose accumulator ensures single-EVA exposure remains well below Career Equivalent Dose thresholds.",
      },
    ],
    takeaway:
      "Never allow one-way travel time to exceed 42% of suit consumables without rover backup.",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoScenarioDialog({ open, onOpenChange }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const current = STEPS[stepIndex];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-primary/30 bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-primary">
              <Sparkles className="size-4" />
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-primary">
              Guided Mission Scenario
            </span>
          </div>
          <DialogTitle className="text-xl font-display font-semibold">
            Jezero Crater: Delta Traverse Demonstration
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Astro Intel · NASA Space Apps Challenge 2026 Interactive Tour
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress indicators */}
        <div className="flex items-center gap-1.5 py-1">
          {STEPS.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setStepIndex(idx)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                idx === stepIndex ? "bg-primary" : idx < stepIndex ? "bg-primary/50" : "bg-muted"
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon className="size-4 text-primary" />
              {current.title}
            </h3>
            <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
              {current.badge}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{current.description}</p>

          <div className="space-y-2">
            {current.highlights.map((h) => (
              <div key={h.title} className="rounded-md border border-border/60 bg-card/60 p-2.5">
                <p className="text-xs font-semibold text-foreground">{h.title}</p>
                <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                  {h.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-md border border-safe/30 bg-safe/10 p-2.5">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-safe" />
            <p className="text-xs text-safe-foreground font-medium">
              <strong className="text-safe">Mission Rule:</strong> {current.takeaway}
            </p>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="text-xs"
          >
            <ChevronLeft className="mr-1 size-3.5" /> Back
          </Button>

          <div className="flex items-center gap-2">
            {stepIndex < STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="text-xs"
              >
                Next Step <ChevronRight className="ml-1 size-3.5" />
              </Button>
            ) : (
              <Button asChild size="sm" className="text-xs shadow-glow">
                <Link to="/mission" search={{ site: "jezero" }} onClick={() => onOpenChange(false)}>
                  Launch in Mission Console <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
