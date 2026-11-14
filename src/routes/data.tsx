import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ExternalLink,
  Info,
  Snowflake,
  Satellite,
  Layers,
  FlaskConical,
  Radiation,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  NASA_DATASETS,
  ICE_DATASETS,
  STATUS_LABEL,
  STATUS_DESCRIPTION,
  type NasaDataset,
} from "@/lib/mars/nasa-datasets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data Sources — Mars Explorer AI" },
      {
        name: "description",
        content:
          "The NASA and ESA Mars datasets each map layer is modelled on: MOLA, HiRISE, THEMIS, CRISM, SHARAD, SWIM, Odyssey GRS, MSL RAD and more.",
      },
      { property: "og:title", content: "Data Sources — Mars Explorer AI" },
      {
        property: "og:description",
        content: "Which Mars mission datasets power each layer of the Mars Explorer AI planner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataPage,
});

type FilterMode = "all" | "ice" | "elevation" | "mineral" | "thermal" | "radiation" | "imagery";

const STATUS_BADGE: Record<string, string> = {
  modelled: "bg-caution/15 text-caution border border-caution/30",
  referenced: "bg-primary/15 text-primary border border-primary/30",
  planned: "bg-muted text-muted-foreground border border-border",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-safe/15 text-safe",
  moderate: "bg-caution/15 text-caution",
  low: "bg-danger/15 text-danger",
  theoretical: "bg-muted text-muted-foreground",
};

const SITE_COVERAGE: { id: "jezero" | "arcadia" | "korolev"; name: string; description: string }[] =
  [
    {
      id: "jezero",
      name: "Jezero Crater",
      description:
        "Best-covered site: Perseverance has ground-truth imagery, CRISM maps clay/carbonate layers, HiRISE resolves boulder fields and scarp structure. MOLA gives global elevation context.",
    },
    {
      id: "arcadia",
      name: "Arcadia Planitia",
      description:
        "Top ice candidate: SWIM synthesis (SHARAD + THEMIS + GRS) confirms shallow ice 0.3–2 m deep across most of the plain. HiRISE shows fresh impact craters with exposed ice blocks.",
    },
    {
      id: "korolev",
      name: "Korolev Crater",
      description:
        "ESA Mars Express HRSC and MARSIS/SHARAD radar define the 1.8 km-thick ice dome geometry. MOLA elevation confirms the crater depth and rim structure.",
    },
  ];

function filterDatasets(datasets: NasaDataset[], mode: FilterMode): NasaDataset[] {
  if (mode === "all") return datasets;
  if (mode === "ice")
    return datasets.filter(
      (d) =>
        d.appLayer.toLowerCase().includes("ice") ||
        ["swim", "sharad", "grs", "marsis"].includes(d.id),
    );
  if (mode === "elevation")
    return datasets.filter(
      (d) =>
        d.appLayer.toLowerCase().includes("elevation") ||
        d.id === "mola" ||
        d.id === "hirise-dtm" ||
        d.id === "hrsc",
    );
  if (mode === "mineral")
    return datasets.filter(
      (d) => d.appLayer.toLowerCase().includes("mineral") || ["crism", "omega"].includes(d.id),
    );
  if (mode === "thermal") return datasets.filter((d) => d.id === "themis");
  if (mode === "radiation") return datasets.filter((d) => d.id === "rad");
  if (mode === "imagery")
    return datasets.filter((d) =>
      ["ctx", "hirise-dtm", "hrsc", "perseverance", "curiosity", "mars-trek"].includes(d.id),
    );
  return datasets;
}

const FILTER_TABS: { id: FilterMode; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All datasets", icon: <Layers className="size-3.5" /> },
  { id: "ice", label: "Ice & Water", icon: <Snowflake className="size-3.5" /> },
  { id: "elevation", label: "Elevation", icon: <Satellite className="size-3.5" /> },
  { id: "mineral", label: "Mineralogy", icon: <FlaskConical className="size-3.5" /> },
  { id: "thermal", label: "Thermal", icon: <Layers className="size-3.5" /> },
  { id: "radiation", label: "Radiation", icon: <Radiation className="size-3.5" /> },
  { id: "imagery", label: "Imagery", icon: <Satellite className="size-3.5" /> },
];

function DatasetRow({ d }: { d: NasaDataset }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="cursor-pointer border-t border-border align-top hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="p-3 font-medium">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-[10px] text-muted-foreground">{expanded ? "▾" : "▸"}</span>
            <div>
              {d.sourceUrl ? (
                <a
                  href={d.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {d.name} <ExternalLink className="size-3" />
                </a>
              ) : (
                d.name
              )}
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">{d.acronym}</div>
            </div>
          </div>
        </td>
        <td className="p-3 text-muted-foreground text-sm">{d.mission}</td>
        <td className="p-3">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px]",
              d.appLayer.toLowerCase().includes("ice")
                ? "bg-ice/15 text-ice"
                : "bg-secondary text-foreground",
            )}
          >
            {d.appLayer}
          </span>
        </td>
        <td className="p-3 font-mono text-[11px] text-muted-foreground">{d.spatialResolution}</td>
        <td className="p-3">
          <span
            title={STATUS_DESCRIPTION[d.status]}
            className={cn("rounded px-2 py-0.5 font-mono text-[10px]", STATUS_BADGE[d.status])}
          >
            {STATUS_LABEL[d.status]}
          </span>
        </td>
        <td className="p-3">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px]",
              CONFIDENCE_BADGE[d.confidence],
            )}
          >
            {d.confidence}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-border/50 bg-secondary/20">
          <td colSpan={6} className="px-8 py-3">
            <div className="grid gap-3 text-xs md:grid-cols-2">
              <div>
                <p className="hud-label mb-1">Scientific Purpose</p>
                <p className="text-muted-foreground">{d.scientificPurpose}</p>
              </div>
              <div>
                <p className="hud-label mb-1">Application Notes</p>
                <p className="text-muted-foreground">{d.notes}</p>
              </div>
              {d.keyFindings && (
                <div className="md:col-span-2 rounded border border-primary/20 bg-primary/5 p-2">
                  <p className="hud-label mb-1 text-primary">Key Published Findings</p>
                  <p className="text-muted-foreground">{d.keyFindings}</p>
                </div>
              )}
              <div>
                <p className="hud-label mb-1">Coordinate System</p>
                <p className="font-mono text-muted-foreground">{d.coordinateSystem}</p>
              </div>
              <div>
                <p className="hud-label mb-1">Coverage Period</p>
                <p className="font-mono text-muted-foreground">{d.temporalCoverage}</p>
              </div>
              {d.sitesCovered.length > 0 && (
                <div>
                  <p className="hud-label mb-1">Sites Covered</p>
                  <div className="flex flex-wrap gap-1">
                    {d.sitesCovered.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {d.pdsUrl && (
                <div>
                  <p className="hud-label mb-1">PDS Archive</p>
                  <a
                    href={d.pdsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    NASA PDS <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DataPage() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = filterDatasets(NASA_DATASETS, filter);
  const visible = filtered.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.acronym.toLowerCase().includes(q) ||
      d.instrument.toLowerCase().includes(q) ||
      d.mission.toLowerCase().includes(q) ||
      d.scientificPurpose.toLowerCase().includes(q) ||
      d.appLayer.toLowerCase().includes(q) ||
      d.dataType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12">
      <p className="hud-label">Data sources</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">The missions behind every layer</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Each map layer mirrors a type of real NASA/ESA Mars dataset. Click any row to expand full
        details. Ice sources are highlighted.
      </p>

      {/* Disclaimer */}
      <div className="mt-6 flex gap-3 rounded-md border border-caution/40 bg-caution/10 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-caution" />
        <p>
          <strong>Important:</strong> This application generates terrain procedurally using
          published parameter ranges from each dataset — it is <em>not</em> displaying actual
          downloaded raster imagery. Routes, risk scores, ice depths and resource estimates are
          planning aids based on stated modelling assumptions, not mission safety certification.
          Never use this tool as a substitute for professional mission planning.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4 rounded-lg overflow-hidden">
        {[
          ["15+", "NASA / ESA datasets"],
          ["4", "agencies represented"],
          ["8", "map layers powered"],
          ["3", "exploration sites"],
        ].map(([v, l]) => (
          <div key={l} className="bg-card py-4 px-5">
            <div className="font-display text-2xl font-semibold text-primary">{v}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      {/* Site coverage cards */}
      <h2 className="mt-10 text-xl font-semibold">Instrument coverage by site</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {SITE_COVERAGE.map((site) => {
          const datasets = NASA_DATASETS.filter((d) => d.sitesCovered.includes(site.id));
          return (
            <div key={site.id} className="hud-panel p-4">
              <h3 className="font-semibold">{site.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{site.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {datasets.map((d) => (
                  <span
                    key={d.id}
                    className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px]"
                  >
                    {d.acronym}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ice datasets highlight */}
      <h2 className="mt-10 flex items-center gap-2 text-xl font-semibold">
        <Snowflake className="size-5 text-ice" /> Water ice datasets
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        These instruments provide the evidence base for the ice layer and water-resource analysis.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ICE_DATASETS.map((d) => (
          <div key={d.id} className="rounded-md border border-ice/30 bg-ice/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ice">{d.acronym}</p>
                <p className="text-xs text-muted-foreground">{d.mission}</p>
              </div>
              <span
                className={cn("rounded px-2 py-0.5 font-mono text-[10px]", STATUS_BADGE[d.status])}
              >
                {STATUS_LABEL[d.status]}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{d.scientificPurpose}</p>
            {d.keyFindings && (
              <p className="mt-2 text-xs text-ice/80">
                <strong>Key finding:</strong> {d.keyFindings}
              </p>
            )}
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              Resolution: {d.spatialResolution}
            </p>
          </div>
        ))}
      </div>

      {/* Full dataset table */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold">Full dataset registry</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a row to expand details. Click column headers to filter.
        </p>

        {/* Filter tabs & Search */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                  filter === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by keyword, sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-card border-border"
            />
          </div>
        </div>

        {visible.length === 0 && (
          <div className="mt-4 rounded-lg border border-border p-8 text-center text-xs text-muted-foreground">
            No datasets match the current filter and search query.
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-3 font-medium">Dataset / Instrument</th>
                <th className="p-3 font-medium">Mission</th>
                <th className="p-3 font-medium">App Layer</th>
                <th className="p-3 font-medium">Resolution</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <DatasetRow key={d.id} d={d} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No datasets match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planning assumptions */}
      <h2 className="mt-12 text-xl font-semibold">Planning assumptions</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[
          {
            title: "Suit consumables",
            items: [
              "Suit oxygen: 8 hours total (source: EMU/PLSS analog specifications)",
              "Battery: 10 hours total",
              "Site work allowance: 1 hour at destination",
              "Return-trip O₂ reserve: 15% minimum (triggers emergency return warning)",
            ],
          },
          {
            title: "Walking speed model",
            items: [
              "Base model: Tobler's hiking function × 0.5 (spacesuit mass penalty)",
              "Mars gravity correction: 0.38 g reduces energy cost but suit inertia dominates",
              "Nominal EVA pace: ~2–3 km/h on flat terrain",
              "Hazardous ground: additional O₂ consumption proportional to hazard score",
            ],
          },
          {
            title: "Terrain passability",
            items: [
              "Maximum passable slope: 28° (from published rover mobility limits)",
              "Bare ice: caution class — reduced traction, speed penalty",
              "Boulder density: hazard score from published HiRISE rock count statistics",
              "Soft dunes: additional energy cost modelled",
            ],
          },
          {
            title: "Ice depth classification",
            items: [
              "Surface (≤0.05 m): bare ice — direct collection",
              "Shallow (< 1 m): hand drill accessible",
              "Buried (1–3 m): powered rotary drill required",
              "Deep (> 3 m): ice-cemented ground, impractical for field extraction",
              "Bound: water locked in mineral lattice, extractable by pyrolysis",
            ],
          },
          {
            title: "Radiation model",
            items: [
              "Baseline: 0.67 mGy/day (Hassler et al. 2014, MSL RAD at Gale Crater)",
              "Elevation correction: +0.0012 mGy/100 m above MOLA datum",
              "Latitude correction: not modelled (marginal at EVA timescales)",
              "Solar events: not modelled — real EVA planning requires space weather monitoring",
            ],
          },
          {
            title: "Data provenance",
            items: [
              "All terrain is procedurally generated — not actual imagery",
              "Ice depths are within SWIM/SHARAD published ranges, not from raster data",
              "Mineral assignments follow published CRISM/OMEGA site characterisations",
              "Temperature ranges calibrated to published THEMIS site measurements",
            ],
          },
        ].map(({ title, items }) => (
          <div key={title} className="hud-panel p-4">
            <p className="text-sm font-semibold">{title}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
        <Link to="/mission" className="text-primary hover:underline">
          Open the mission console →
        </Link>
        <a
          href="https://pds.nasa.gov/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          NASA PDS <ExternalLink className="size-3" />
        </a>
        <a
          href="https://trek.nasa.gov/mars/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          NASA Mars Trek <ExternalLink className="size-3" />
        </a>
        <a
          href="https://swim.psi.edu/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          SWIM Ice Maps <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
