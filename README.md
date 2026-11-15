# Mars Explorer AI — Interplanetary Survival Guide: Martian Map
**NASA Space Apps Challenge 2026** · Team Astro Intel  
**Live reference**:  https://mars-explorer-ebon.vercel.app/

---

## Overview

**Mars Explorer AI** is an interactive, scientifically grounded Martian surface exploration and astronaut survival planning platform. It synthesizes orbital and rover remote sensing data from NASA and ESA into an operational map interface for planning safe astronaut extravehicular activities (EVAs), discovering usable water-ice deposits, and assessing terrain risks.

### Core Capabilities

1. **Multi-Instrument Planetary Data Layers**
   - **MOLA Topography**: Digital elevation models with 200 m contour lines and slope calculations.
   - **THEMIS Thermal Infrared**: Midday and diurnal temperature variance for suit heating budgeting.
   - **CRISM & OMEGA Mineralogy**: Hydrated clays, carbonates, and olivine spectral signatures.
   - **SWIM & SHARAD Subsurface Radar**: Shallow ice depth, bare ice exposures, and bound hydration fraction.
   - **MSL RAD Radiation Field**: Galactic cosmic ray and solar energetic particle dose rate mapping.
   - **Optical Basemaps**: Calibrated against high-resolution MRO HiRISE and CTX visual mosaics.

2. **Three Diverse Exploration Sites**
   - **Jezero Crater (18.44° N, 77.45° E)**: Ancient river delta with clay minerals and high biosignature potential.
   - **Arcadia Planitia (46.2° N, 192.4° E)**: Widespread sheet ice buried 0.3–2 m below dust, ideal for in-situ resource extraction.
   - **Korolev Crater (73.3° N, 164.6° E)**: Massive 1.8 km-thick permanent water-ice deposit.

3. **Multi-Criteria A* Route Planner**
   - **Shortest**: Minimizes metric traverse distance.
   - **Safest**: Penalizes steep slopes (>14° caution, >20° impassable) and loose dunes.
   - **Science**: Optimizes visits to geological POIs, crater rims, and mineral outcrops.
   - **Water / Ice**: Prioritizes routes maximizing shallow water-ice proximity.

4. **Real-Time EVA Marswalk Simulator**
   - Tracks metabolic oxygen consumption, suit battery drain in subzero temperatures (-120°C to -20°C), and cumulative radiation exposure.
   - Enforces the **15% life-support reserve abort limit** for emergency return to base.

5. **Rule-Based Mission Intelligence Briefing**
   - Automated mission analysis generating feasibility scores (0–100), destination assessments, environmental risk matrices, and contingency recommendations.

6. **NASA Data Sources & Provenance Registry**
   - Complete inventory of 15+ planetary science instruments with spatial resolutions, observation methods, coordinate frames, and links to the [NASA Planetary Data System (PDS)](https://pds.nasa.gov/).

---

## Tech Stack

- **Framework**: React 19, TypeScript
- **Routing**: TanStack Router (TanStack Start)
- **Styling**: Tailwind CSS v4, shadcn/ui, Radix UI
- **Rendering**: HTML5 Canvas + Scaled SVG Overlay with Pan/Zoom (`react-zoom-pan-pinch`)
- **Testing**: Vitest (14 automated unit tests)

---

## Local Development

```sh
# Install dependencies (Node.js or Bun)
bun install # or npm install

# Start development server
bun run dev # or npm run dev

# Run unit tests
bun test # or npm test

# Production build
bun run build # or npm run build
```

---

## Data Provenance & Scientific Disclaimer

All surface terrain models, hazard maps, and mineral fields are procedurally generated and calibrated to match the scientific parameter ranges reported by published NASA, ESA, and SWIM datasets. Values are designed for astronaut planning simulation and Space Apps demonstration and should not be used as flight-certified mission software.
