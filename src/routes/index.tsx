import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Beaker,
  Droplets,
  Flame,
  Gauge,
  Layers,
  Map,
  Route as RouteIcon,
  ShieldAlert,
  Snowflake,
  Satellite,
  Compass,
  Database,
  Sparkles,
  Activity,
  CheckCircle2,
  Brain,
  ShieldCheck,
  Pickaxe,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/mars-hero.jpg";
import iceImg from "@/assets/mars-ice.jpg";
import { SITE_ORDER, SITES, type SiteId } from "@/lib/mars/sites";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mars Explorer AI — Explore Mars. Predict the Risks. Protect Human Life." },
      {
        name: "description",
        content:
          "Team Astro Intel's autonomous astronaut survival platform: layered NASA maps, AI danger prediction, water-ice extraction planning, and safe Marswalk navigation.",
      },
      {
        property: "og:title",
        content: "Mars Explorer AI — Explore Mars. Predict the Risks. Protect Human Life.",
      },
      {
        property: "og:description",
        content:
          "Five intelligent systems. One mission: Make Mars exploration safer. NASA Space Apps Challenge 2026 by Team Astro Intel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ICE_BADGE: Record<SiteId, string> = {
  jezero: "Water bound in clays",
  arcadia: "Ice 0.3–2 m below surface",
  korolev: "1.8 km thick frozen ice lake",
};

const INTELLIGENCE_SYSTEMS = [
  {
    icon: Database,
    title: "Real Mars Data Explorer",
    text: "Click any Martian coordinate to inspect NASA-calibrated elevation, thermal inertia, mineralogy, and radar ice signatures with data provenance.",
  },
  {
    icon: ShieldAlert,
    title: "AI Hazard & Danger Prediction",
    text: "Our AI explains WHY a location is hazardous — combining 20°+ slopes, boulder counts, extreme temperatures, and ionizing radiation into actionable alerts.",
  },
  {
    icon: Snowflake,
    title: "Smart Water Extraction Planner",
    text: "Locate subsurface water ice, determine overburden depth, calculate required drilling energy (kWh), and estimate water and rocket fuel yields.",
  },
  {
    icon: RouteIcon,
    title: "Safe Route Optimization",
    text: "Four multi-criteria A* pathfinding modes — shortest, safest (slope-managed), science-rich, and water-yield — with complete risk comparisons.",
  },
  {
    icon: Brain,
    title: "Mission Survival AI (MISA)",
    text: "Mars Intelligent Survival Assistant evaluates EVA feasibility, tracks live suit consumables, and calculates automatic abort routes.",
  },
  {
    icon: Gauge,
    title: "Marswalk EVA Simulator",
    text: "Simulate field excursions with real-time metabolic O₂ draw, suit battery heating loads, cumulative radiation dosing, and safe return boundaries.",
  },
];

const AI_DECISION_STEPS = [
  {
    num: "01",
    title: "Planetary Surface Analysis",
    desc: "MOLA laser altimetry + HiRISE rock statistics calculate precise slope gradients, terrain roughness, and physical obstacles across the landing ellipse.",
  },
  {
    num: "02",
    title: "Ice Resource Pinpointing",
    desc: "SWIM multi-radar synthesis + Odyssey GRS neutron hydrogen measurements detect shallow buried ice sheets and evaluate extraction accessibility.",
  },
  {
    num: "03",
    title: "Synergistic Risk Modeling",
    desc: "Our AI computes composite hazard vectors: steep slopes combined with sub-zero extremes accelerate astronaut fatigue and trigger danger alerts.",
  },
  {
    num: "04",
    title: "Trajectory & Consumable Balancing",
    desc: "A* engine plans optimal traverse paths ensuring the crew maintains a 15% emergency oxygen reserve at every waypoint along the Martian traverse.",
  },
];

const NASA_INSTRUMENTS = [
  {
    code: "MOLA",
    mission: "Mars Global Surveyor",
    desc: "Topography & slope calculation across the 10 × 7 km landing ellipse.",
  },
  {
    code: "HiRISE & CTX",
    mission: "Mars Reconnaissance Orbiter",
    desc: "Sub-metre visual terrain basemap and boulder/crevasse obstacle identification.",
  },
  {
    code: "SWIM & SHARAD",
    mission: "MRO / Planetary Science Institute",
    desc: "Joint radar and thermal models pinpointing shallow subsurface ice at Arcadia.",
  },
  {
    code: "THEMIS",
    mission: "Mars Odyssey",
    desc: "Day/night thermal infrared mapping indicating surface temperature extremes & thermal inertia.",
  },
  {
    code: "CRISM & OMEGA",
    mission: "MRO / Mars Express",
    desc: "Spectral reflectance identifying clay, carbonate, and olivine mineral deposits.",
  },
  {
    code: "MSL RAD",
    mission: "Curiosity Rover",
    desc: "Empirical surface galactic cosmic ray dose rates for astronaut exposure limits.",
  },
];

function Index() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Astronaut standing on rust-red Martian terrain beside exposed water ice"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          width={1920}
          height={1088}
        />
        <div className="absolute inset-0 -z-10 bg-hero-fade" />
        <div className="mx-auto flex min-h-[82vh] max-w-[1600px] flex-col justify-end px-4 pb-16 pt-32">
          <div className="flex flex-wrap items-center gap-2">
            <p className="hud-label text-foreground/80">
              NASA Space Apps Challenge 2026 · Interplanetary Survival Guide
            </p>
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary">
              Team Astro Intel · Mohali, India
            </span>
          </div>

          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
            Explore Mars. Predict the Risks. <span className="text-ice">Protect Human Life.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-foreground/85 md:text-xl">
            Five intelligent systems. One mission: Make Mars exploration safer. Mars Explorer AI
            combines real NASA planetary datasets with predictive decision intelligence to guide
            astronaut surface excursions and locate life-sustaining water ice.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/mission">
                Launch Mission Console <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-ice/60 bg-background/40 text-ice hover:bg-ice/10 hover:text-ice"
            >
              <Link to="/mission" search={{ site: "arcadia" }}>
                <Snowflake className="mr-1.5 size-4" /> Explore Arcadia Water Ice
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card">
        <dl className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-4 md:grid-cols-4">
          {[
            ["5", "Intelligent Systems"],
            ["15+", "NASA/ESA Datasets"],
            ["4", "A* Route Optimization Modes"],
            ["< 1 m", "Ice Depth at Arcadia Planitia"],
          ].map(([v, l]) => (
            <div key={l} className="py-6">
              <dt className="font-display text-3xl font-semibold text-primary">{v}</dt>
              <dd className="text-sm text-muted-foreground">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Five Intelligence Systems Section */}
      <section className="border-b border-border bg-background py-20">
        <div className="mx-auto max-w-[1600px] px-4">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <p className="hud-label text-primary">Mission Architecture</p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Five Intelligent Systems for Martian Surface Survival
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            A comprehensive suite of planetary exploration tools designed for astronaut safety,
            resource extraction, and scientific return.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTELLIGENCE_SYSTEMS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="hud-panel p-5 transition-colors hover:border-primary/60">
                <Icon className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Our AI Makes Decisions Section */}
      <section className="border-b border-border bg-card/40 py-20">
        <div className="mx-auto max-w-[1600px] px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="hud-label text-primary">Autonomous Decision Pipeline</p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">How Our AI Makes Decisions</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            From raw orbital telemetry to astronaut life-support advisories — our autonomous
            pipeline translates planetary data into tactical mission intelligence.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_DECISION_STEPS.map((s) => (
              <div
                key={s.num}
                className="relative rounded-lg border border-border bg-card/80 p-5 transition-colors hover:border-primary/50"
              >
                <span className="font-mono text-2xl font-bold text-primary/40">{s.num}</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive AI Decision Demo Card */}
          <div className="mt-8 rounded-lg border border-primary/40 bg-secondary/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <span className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Brain className="size-4 text-primary" />
                MISA Decision Demonstration: Arcadia Planitia Coordinates [39.3° N, 189.7° E]
              </span>
              <span className="rounded bg-safe/20 px-2 py-0.5 font-mono text-[10px] font-bold text-safe">
                MISSION ADVISORY: PROCEED (WATER HARVEST NOMINAL)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground">Water Ice Probability</span>
                <p className="mt-1 text-sm font-bold text-ice">95% (0.4m depth)</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  SWIM v3 shallow radar return
                </p>
              </div>
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground">AI Danger Prediction</span>
                <p className="mt-1 text-sm font-bold text-safe">Low Risk (4.2° slope)</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Flat plains, smooth regolith
                </p>
              </div>
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground">Extraction Requirements</span>
                <p className="mt-1 text-sm font-bold text-primary">1.8 kWh (Hand Auger)</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Yield: ~412 L water / m³ ground
                </p>
              </div>
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground">Safe Return Margin</span>
                <p className="mt-1 text-sm font-bold text-safe">42% O₂ Reserve</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Far exceeds 15% abort threshold
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ice Deep-Dive */}
      <section className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 py-20 lg:grid-cols-2">
        <div>
          <p className="hud-label text-ice">Subsurface Resource Extraction</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Ice is the resource that makes Mars survivable
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every cubic metre of pure Martian water ice yields approximately 917 litres of
            life-sustaining water. Split it through electrolysis and astronauts obtain breathing
            oxygen and hydrogen to synthesize rocket propellant for the return voyage.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Droplets,
                t: "Drinking Water",
                d: "Melt, filter & mineralize for human consumption",
              },
              {
                icon: Beaker,
                t: "Breathing Oxygen",
                d: "Electrolysis: 2H₂O → 2H₂ + O₂ for suit life support",
              },
              {
                icon: Flame,
                t: "Methane Fuel",
                d: "H₂ + CO₂ → CH₄ via Sabatier reaction for return rocket",
              },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="rounded-md border border-ice/30 bg-ice/5 p-3">
                <Icon className="size-5 text-ice" />
                <p className="mt-2 text-sm font-semibold">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <img
          src={iceImg}
          alt="Astronaut drilling a frozen ice core from a Martian ice deposit"
          className="aspect-[4/3] w-full rounded-lg border border-ice/30 object-cover shadow-ice"
          loading="lazy"
          width={1280}
          height={960}
        />
      </section>

      {/* Sites Section */}
      <section className="mx-auto max-w-[1600px] px-4 pb-20">
        <h2 className="text-3xl font-semibold">Three Sites, Three Scientific Horizons</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each site represents a distinct planetary geological epoch and exploration challenge:
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SITE_ORDER.map((id) => {
            const s = SITES[id];
            return (
              <Link
                key={id}
                to="/mission"
                search={{ site: id }}
                className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <p className="hud-label">
                  {s.lat.toFixed(1)}° N · {s.lon.toFixed(1)}° E
                </p>
                <h3 className="mt-1 text-lg font-semibold">{s.name}</h3>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ice/15 px-2.5 py-1 text-xs text-ice">
                  <Snowflake className="size-3" /> {ICE_BADGE[id]}
                </span>
                <p className="mt-3 text-sm text-muted-foreground">{s.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                  Plan Mission{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Powered by NASA Datasets */}
      <section className="border-t border-border bg-card/60 py-20">
        <div className="mx-auto max-w-[1600px] px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Satellite className="size-4 text-primary" />
                <p className="hud-label text-primary">NASA & ESA Planetary Archives</p>
              </div>
              <h2 className="mt-2 text-3xl font-semibold">
                Calibrated to Real Space Agency Telemetry
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Mars Explorer AI calibrates its surface hazards, thermal models, mineral signatures,
                and subsurface ice distributions using published science data from NASA, ESA, and
                the Planetary Science Institute.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <Link to="/data">
                <Database className="mr-1.5 size-3.5" /> View Data Provenance Registry
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NASA_INSTRUMENTS.map((inst) => (
              <div key={inst.code} className="hud-panel p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground">{inst.code}</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {inst.mission}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{inst.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-grid py-16">
        <div className="mx-auto max-w-[1600px] px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Plan the Next Giant Leap?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Activate the interactive mission console, inspect all 8 data layers, and calculate safe
            astronaut walking routes.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/mission">
                Enter Mission Console <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="border-t border-border py-6 bg-card/30">
        <div className="mx-auto max-w-[1600px] px-4 text-center text-xs text-muted-foreground">
          <p>
            NASA Space Apps Challenge 2026 · Challenge: Interplanetary Survival Guide: Martian Map
          </p>
          <p className="mt-1">
            Team <span className="text-foreground font-semibold">Astro Intel</span> (Mohali, India):
            Anurag Saroya, Vivaan Panwar, Anuradha Rao, Inder Singh, Shreya Chaturvedi.
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            Independent competition entry — not officially affiliated with NASA or ESA.
          </p>
        </div>
      </footer>
    </div>
  );
}
