import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Orbit, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoScenarioDialog } from "@/components/mars/DemoScenario";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/mission", label: "Mission console" },
  { to: "/data", label: "Data sources" },
] as const;

export function SiteHeader() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-gradient-mars text-primary-foreground">
              <Orbit className="size-4" />
            </span>
            <span className="font-display text-base font-semibold leading-none">
              Mars Explorer <span className="text-primary">AI</span>
              <span className="hud-label mt-0.5 block">Team Astro Intel</span>
            </span>
          </Link>

          <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] text-primary md:inline-flex">
            NASA Space Apps 2026
          </span>

          <nav className="ml-auto flex items-center gap-1.5 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {n.label}
              </Link>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoOpen(true)}
              className="ml-1 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">Guided</span> Demo
            </Button>
          </nav>
        </div>
      </header>

      <DemoScenarioDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">
            Mars Explorer AI — Team Astro Intel · NASA Space Apps Challenge 2026
          </p>
          <p className="mt-0.5">
            Interplanetary Survival Guide: Martian Map · Multi-instrument planetary science
            integration.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 md:items-end">
          <p>
            Terrain, mineralogy & atmospheric models synthesized from NASA PDS & ESA planetary
            archives.
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="https://www.spaceappschallenge.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Space Apps Challenge <ExternalLink className="size-3" />
            </a>
            <span>·</span>
            <a
              href="https://pds.nasa.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              NASA Planetary Data System <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
