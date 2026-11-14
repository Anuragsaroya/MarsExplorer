/** Mission site definitions. Coordinates of points of interest are fractions (u,v) of the map window. */
export type SiteId = "jezero" | "arcadia" | "korolev";

export type PoiKind = "base" | "science" | "ice" | "water" | "rover";

export interface Poi {
  id: string;
  name: string;
  kind: PoiKind;
  u: number;
  v: number;
  note: string;
}

export interface SiteDef {
  id: SiteId;
  name: string;
  short: string;
  lat: number;
  lon: number;
  tagline: string;
  summary: string;
  iceSummary: string;
  missions: string[];
  pois: Poi[];
  defaultStart: string;
  defaultEnd: string;
}

/** Map window size in metres (10 km × 7 km). */
export const WINDOW_W_M = 10_000;
export const WINDOW_H_M = 7_000;

export const SITES: Record<SiteId, SiteDef> = {
  jezero: {
    id: "jezero",
    name: "Jezero Crater — Delta Front",
    short: "Jezero",
    lat: 18.44,
    lon: 77.45,
    tagline: "Ancient lake delta explored by Perseverance",
    summary:
      "A 3.5-billion-year-old river delta inside a 45 km crater. Clay and carbonate layers hold the best record of Mars' watery past.",
    iceSummary:
      "No shallow ground ice is predicted this close to the equator. Water here is locked inside hydrated clays and carbonates — it can be baked out of the rock.",
    missions: ["Perseverance (Mastcam-Z, SuperCam)", "HiRISE", "CRISM", "CTX", "MOLA", "MEDA"],
    pois: [
      {
        id: "base",
        name: "Mars Base Alpha",
        kind: "base",
        u: 0.8,
        v: 0.36,
        note: "Habitat & rover garage on smooth crater floor.",
      },
      {
        id: "delta",
        name: "Delta Front Sample Site",
        kind: "science",
        u: 0.385,
        v: 0.52,
        note: "Layered sediments with clay & carbonate — biosignature target.",
      },
      {
        id: "belva",
        name: "Belva Crater Rim",
        kind: "science",
        u: 0.22,
        v: 0.255,
        note: "Impact exposed ~100 m of delta layers in cross-section.",
      },
      {
        id: "seitah",
        name: "Séítah Olivine Outcrop",
        kind: "science",
        u: 0.7,
        v: 0.77,
        note: "Olivine-rich igneous rock among sand ridges.",
      },
      {
        id: "margin",
        name: "Carbonate Margin (bound water)",
        kind: "water",
        u: 0.12,
        v: 0.15,
        note: "Hydrated carbonates: ~3–6 % water by weight, extractable by heating.",
      },
      {
        id: "rover",
        name: "Perseverance Track Marker",
        kind: "rover",
        u: 0.6,
        v: 0.5,
        note: "Rover traverse — ground-truth imagery available.",
      },
    ],
    defaultStart: "base",
    defaultEnd: "delta",
  },
  arcadia: {
    id: "arcadia",
    name: "Arcadia Planitia — Shallow Ice Plains",
    short: "Arcadia",
    lat: 46.2,
    lon: 192.4,
    tagline: "Top candidate landing zone: frozen water just below the dust",
    summary:
      "Smooth, low plains in the northern mid-latitudes. Radar and fresh impacts show water ice within a metre of the surface — drinkable water, oxygen and rocket fuel for a crew.",
    iceSummary:
      "SWIM (SHARAD + thermal + neutron) maps show excess water ice 0.3–2 m deep across most of the plain. Fresh craters and a debris-covered glacier expose bare ice.",
    missions: [
      "SHARAD (MRO radar)",
      "Mars Odyssey neutron spectrometer",
      "HiRISE",
      "THEMIS",
      "MOLA",
      "SWIM project",
    ],
    pois: [
      {
        id: "base",
        name: "Habitat Site Bravo",
        kind: "base",
        u: 0.62,
        v: 0.6,
        note: "Flat, low-rock landing ellipse over shallow ice.",
      },
      {
        id: "icecraterA",
        name: "Fresh Ice Crater A",
        kind: "ice",
        u: 0.352,
        v: 0.715,
        note: "2023-style impact excavated bright ice blocks — pure water ice at the surface.",
      },
      {
        id: "scarp",
        name: "Exposed Ice Scarp",
        kind: "ice",
        u: 0.3,
        v: 0.25,
        note: "Glacier edge: debris-covered ice sheet exposed in a 40 m cliff.",
      },
      {
        id: "polygons",
        name: "Polygon Field Drill Site",
        kind: "science",
        u: 0.83,
        v: 0.27,
        note: "Thermal-contraction polygons — ice ~0.5 m below; core drilling target.",
      },
      {
        id: "icecraterB",
        name: "Ice Crater B",
        kind: "ice",
        u: 0.875,
        v: 0.82,
        note: "Small crater with ice-rich ejecta.",
      },
    ],
    defaultStart: "base",
    defaultEnd: "icecraterA",
  },
  korolev: {
    id: "korolev",
    name: "Korolev Crater — Frozen Ice Lake",
    short: "Korolev",
    lat: 73.3,
    lon: 164.6,
    tagline: "An 82 km crater filled with a 1.8 km thick dome of frozen water ice",
    summary:
      "A permanent ice deposit near the north pole. Its cold floor traps water vapour, keeping ~2,200 km³ of ice frozen year-round — a natural ice reservoir.",
    iceSummary:
      "The crater interior is bare water ice, up to 1.8 km thick. The outer rim is ice-cemented ground. Expect extreme cold and low-traction ice surfaces.",
    missions: ["Mars Express HRSC", "SHARAD", "HiRISE", "MOLA", "Mars Climate Sounder"],
    pois: [
      {
        id: "base",
        name: "Rim Camp Charlie",
        kind: "base",
        u: 0.9,
        v: 0.22,
        note: "Outside the rim on stable ice-cemented ground.",
      },
      {
        id: "edge",
        name: "Ice Dome Edge — Layered Ice",
        kind: "ice",
        u: 0.47,
        v: 0.5,
        note: "Annual ice layers record Mars climate over millions of years.",
      },
      {
        id: "drill",
        name: "Ice Core Drill Site",
        kind: "ice",
        u: 0.22,
        v: 0.62,
        note: "Clean water ice on the dome — water extraction pilot.",
      },
      {
        id: "moat",
        name: "Moat Outcrop",
        kind: "science",
        u: 0.62,
        v: 0.82,
        note: "Dark trough between ice and rim; exposed rim bedrock.",
      },
    ],
    defaultStart: "base",
    defaultEnd: "edge",
  },
};

export const SITE_ORDER: SiteId[] = ["jezero", "arcadia", "korolev"];

const DEG_PER_KM = 360 / (2 * Math.PI * 3389.5);

export function toLatLon(site: SiteDef, u: number, v: number) {
  const lat = site.lat + (0.5 - v) * (WINDOW_H_M / 1000) * DEG_PER_KM;
  const lon =
    site.lon + ((u - 0.5) * (WINDOW_W_M / 1000) * DEG_PER_KM) / Math.cos((lat * Math.PI) / 180);
  return { lat, lon };
}
