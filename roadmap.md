# Roadmap — Mars Explorer AI (Team Astro Intel)
NASA Space Apps Challenge 2026 · Interplanetary Survival Guide

- [x] Terrain models for 3 exploration sites (Jezero Crater delta, Arcadia Planitia buried ice plains, Korolev Crater frozen ice lake)
- [x] Multi-criteria Route Planner (shortest / safest / science / ice-water) with slope constraints and terrain weighting
- [x] Mission Console page (`/mission`):
  - [x] Multi-instrument layered map with opacity controls & provenance badges
  - [x] Dedicated water ice classification & depth layer (bare ice, shallow ice, bound hydration)
  - [x] Dynamic slope, rock, dune, thermal & radiation hazard evaluation
  - [x] Lat/Lon coordinate HUD readout with toggleable grid overlay
  - [x] Inspector panel with instant point-by-point telemetry
  - [x] Real-time EVA Marswalk simulator with metabolic O₂, battery heating, and 15% emergency abort limit
  - [x] Automated Mission Planner panel with rule-based safety briefing & feasibility scoring
- [x] Landing Page (`/`):
  - [x] NASA Space Apps 2026 branding & Team Astro Intel credits
  - [x] 4-step mission workflow guide (Select Site → Inspect Layers → Calculate Routes → Simulate EVA)
  - [x] "Powered by NASA & ESA Datasets" registry preview
  - [x] Deep-dive water ice resource extraction module
  - [x] Interactive Guided Demo Scenario dialog
- [x] Data Sources & Provenance Page (`/data`):
  - [x] 15+ real planetary science datasets (MRO HiRISE/CTX/CRISM/SHARAD, Odyssey THEMIS/GRS, MGS MOLA, Mars Express HRSC/MARSIS, MSL RAD, Perseverance)
  - [x] Filterable dataset registry with instrument, agency, resolution, data status, and NASA PDS links
  - [x] Site coverage breakdown & planning assumptions documentation
- [x] Unit test suite (14 passing tests across routing, hazard rules, intelligence engine, and NASA dataset registry)
- [x] Production build verified with Vite & TanStack Start
