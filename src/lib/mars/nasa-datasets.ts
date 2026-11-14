/**
 * NASA Dataset Registry — Mars Explorer AI
 * Team Astro Intel | NASA Space Apps Challenge 2026
 *
 * This module documents the real NASA/ESA datasets whose published science
 * findings, resolution specs and instrument characteristics are used to shape
 * the terrain models in this application.
 *
 * DATA STATUS LEGEND
 *   "modelled"   — terrain generated procedurally, constrained by published
 *                  parameter ranges from the real dataset (not actual raster data)
 *   "referenced" — dataset informs layer design, constants, and colour scales
 *   "planned"    — integration target for a future version
 */

export type DataStatus = "modelled" | "referenced" | "planned";
export type ConfidenceLevel = "high" | "moderate" | "low" | "theoretical";

export interface NasaDataset {
  id: string;
  name: string;
  acronym: string;
  mission: string;
  agency: "NASA" | "ESA" | "Multi-mission";
  instrument: string;
  dataType: string;
  scientificPurpose: string;
  spatialResolution: string;
  temporalCoverage: string;
  coordinateSystem: string;
  sourceUrl: string;
  pdsUrl?: string;
  status: DataStatus;
  confidence: ConfidenceLevel;
  appLayer: string;
  /** Sites where this instrument has actual coverage */
  sitesCovered: ("jezero" | "arcadia" | "korolev")[];
  notes: string;
  keyFindings?: string;
}

export const NASA_DATASETS: NasaDataset[] = [
  // ICE DATASETS
  {
    id: "swim",
    name: "Subsurface Water Ice Mapping",
    acronym: "SWIM",
    mission: "MRO · Mars Odyssey · MGS (multi-mission synthesis)",
    agency: "Multi-mission",
    instrument: "SHARAD + THEMIS + GRS (combined)",
    dataType: "Probabilistic subsurface ice maps",
    scientificPurpose:
      "Probabilistic maps of where buried ice is likely and how deep, synthesising radar, thermal and neutron data.",
    spatialResolution: "~1–4 km/pixel (synthesised)",
    temporalCoverage: "2001–present (combined)",
    coordinateSystem: "IAU Mars 2000 / areocentric",
    sourceUrl: "https://swim.psi.edu/",
    status: "modelled",
    confidence: "high",
    appLayer: "Water ice",
    sitesCovered: ["arcadia"],
    notes:
      "SWIM v3 (2022) confirms excess ice 0.3–2 m deep across most of Arcadia Planitia. Ice depths in app are modelled within SWIM-published ranges.",
    keyFindings:
      "Arcadia Planitia is SWIM's highest-confidence shallow-ice region in the northern hemisphere.",
  },
  {
    id: "sharad",
    name: "SHAllow RADar",
    acronym: "SHARAD",
    mission: "Mars Reconnaissance Orbiter",
    agency: "NASA",
    instrument: "SHARAD (15 MHz sounding radar)",
    dataType: "Subsurface radar echograms",
    scientificPurpose:
      "Detects subsurface ice sheets and buried glaciers from ~15 m to ~1 km depth.",
    spatialResolution: "~300 m along-track, ~1–3 km cross-track",
    temporalCoverage: "2006–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://pds-geosciences.wustl.edu/missions/mro/sharad.htm",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/mro/sharad.htm",
    status: "modelled",
    confidence: "high",
    appLayer: "Water ice (deep)",
    sitesCovered: ["arcadia", "korolev"],
    notes:
      "SHARAD confirms the 1.8 km-thick Korolev ice dome. Arcadia Planitia glacier confirmed at ~20–50 m depth. Jezero has no confirmed SHARAD ice reflectors.",
    keyFindings: "Korolev ice volume estimated at ~2,200 km³ (Bramson et al. 2015).",
  },
  {
    id: "marsis",
    name: "Mars Advanced Radar for Subsurface and Ionosphere Sounding",
    acronym: "MARSIS",
    mission: "Mars Express",
    agency: "ESA",
    instrument: "MARSIS (1.8–5 MHz radar)",
    dataType: "Deep subsurface radar profiles",
    scientificPurpose:
      "Probes sub-km to multi-km depths; detected the Korolev ice dome basal structure.",
    spatialResolution: "~5–10 km",
    temporalCoverage: "2004–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/MARSIS",
    status: "referenced",
    confidence: "moderate",
    appLayer: "Water ice (structural)",
    sitesCovered: ["korolev"],
    notes:
      "MARSIS ice thickness estimates used to calibrate Korolev terrain model rim/dome geometry.",
  },
  {
    id: "grs",
    name: "Gamma Ray and Neutron Spectrometer",
    acronym: "GRS / NS",
    mission: "Mars Odyssey",
    agency: "NASA",
    instrument: "GRS + Neutron Spectrometer (HEND)",
    dataType: "Hydrogen abundance maps",
    scientificPurpose:
      "Detects hydrogen concentration in the top ~1 m of soil — a direct proxy for ground ice.",
    spatialResolution: "~300–600 km (global average)",
    temporalCoverage: "2001–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://grs.lpl.arizona.edu/",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/odyssey/grs.htm",
    status: "modelled",
    confidence: "high",
    appLayer: "Water ice (shallow)",
    sitesCovered: ["arcadia"],
    notes:
      "GRS/NS show Arcadia Planitia hydrogen content consistent with ~15–50% ice by volume in top metre.",
    keyFindings: "Feldman et al. (2004): northern plains ice confirmed by epithermal neutron flux.",
  },
  // ELEVATION DATASETS
  {
    id: "mola",
    name: "Mars Orbiter Laser Altimeter",
    acronym: "MOLA",
    mission: "Mars Global Surveyor",
    agency: "NASA",
    instrument: "MOLA (1064 nm laser)",
    dataType: "Laser altimetry elevation grid",
    scientificPurpose:
      "Global topographic reference — slope, roughness, elevation above MOLA datum.",
    spatialResolution: "~463 m/pixel (global gridded product, MEGDR)",
    temporalCoverage: "1997–2001",
    coordinateSystem: "IAU Mars 2000 / MOLA datum",
    sourceUrl: "https://pds-geosciences.wustl.edu/missions/mgs/mola.html",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/mgs/mola.html",
    status: "modelled",
    confidence: "high",
    appLayer: "Elevation · Contours",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes:
      "Elevation values in terrain model reference published MOLA mean elevations for each site. Jezero: ~−2460 m, Arcadia: ~−3950 m, Korolev: ~−2300 m.",
    keyFindings: "Smith et al. (2001): MOLA global topography at 1/128° (~463 m) resolution.",
  },
  {
    id: "hirise-dtm",
    name: "HiRISE Digital Terrain Model",
    acronym: "HiRISE DTM",
    mission: "Mars Reconnaissance Orbiter",
    agency: "NASA",
    instrument: "HiRISE (25 cm/pixel camera)",
    dataType: "Stereopair-derived DTM + orthoimage",
    scientificPurpose:
      "Site-specific 1 m/pixel elevation models; reveals boulders, scarps, dunes, fresh craters.",
    spatialResolution: "~1 m/pixel (DTM); 25 cm/pixel (image)",
    temporalCoverage: "2006–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://www.uahirise.org/",
    pdsUrl: "https://pds-imaging.jpl.nasa.gov/portal/mro_mission.html",
    status: "modelled",
    confidence: "high",
    appLayer: "Hazards · Optical base",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes:
      "Boulder density and terrain roughness in hazard layer shaped by published HiRISE rock count statistics.",
  },
  {
    id: "ctx",
    name: "Context Camera",
    acronym: "CTX",
    mission: "Mars Reconnaissance Orbiter",
    agency: "NASA",
    instrument: "CTX (6 m/pixel panchromatic)",
    dataType: "Wide-area context images",
    scientificPurpose: "30 km-wide context maps used as basemap reference for HiRISE targeting.",
    spatialResolution: "~6 m/pixel",
    temporalCoverage: "2006–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://pds-imaging.jpl.nasa.gov/portal/mro_mission.html",
    status: "referenced",
    confidence: "high",
    appLayer: "Optical base",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes: "CTX albedo patterns used to design optical layer colour variation in terrain model.",
  },
  // MINERAL DATASETS
  {
    id: "crism",
    name: "Compact Reconnaissance Imaging Spectrometer for Mars",
    acronym: "CRISM",
    mission: "Mars Reconnaissance Orbiter",
    agency: "NASA",
    instrument: "CRISM (VNIR + IR 362–3920 nm)",
    dataType: "Hyperspectral mineral maps",
    scientificPurpose:
      "Identifies clay, carbonate, sulfate, olivine and other hydrated minerals diagnostic of past water.",
    spatialResolution: "~18 m/pixel (targeted), ~200 m (survey)",
    temporalCoverage: "2006–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://crism.jhuapl.edu/",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/mro/crism.htm",
    status: "modelled",
    confidence: "high",
    appLayer: "Minerals · Science value",
    sitesCovered: ["jezero"],
    notes: "Jezero clay/carbonate distribution follows Mustard et al. (2008) CRISM analysis.",
    keyFindings: "Jezero delta: Fe/Mg smectites + Mg carbonates + olivine (Farley et al. 2020).",
  },
  {
    id: "omega",
    name: "Observatoire pour la Minéralogie, l'Eau, les Glaces et l'Activité",
    acronym: "OMEGA",
    mission: "Mars Express",
    agency: "ESA",
    instrument: "OMEGA (VNIR + SWIR 0.5–5.2 µm)",
    dataType: "Global mineral and ice maps",
    scientificPurpose: "Wide-area hydrated mineral maps and water/CO₂ ice detection.",
    spatialResolution: "~300 m to 4 km/pixel",
    temporalCoverage: "2004–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://www.cosmos.esa.int/web/psa/mars-express-instruments",
    status: "referenced",
    confidence: "moderate",
    appLayer: "Minerals (global context)",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes:
      "OMEGA global context used for mineral zone boundaries; CRISM used for site-specific Jezero detail.",
  },
  // THERMAL
  {
    id: "themis",
    name: "Thermal Emission Imaging System",
    acronym: "THEMIS",
    mission: "Mars Odyssey",
    agency: "NASA",
    instrument: "THEMIS (IR: 100 m/pixel; VIS: 18 m/pixel)",
    dataType: "Daytime/nighttime thermal IR images + thermal inertia",
    scientificPurpose:
      "Surface temperature, thermal inertia (rock vs dust), ice detection via anomalous cooling.",
    spatialResolution: "~100 m/pixel (IR) · 18 m/pixel (VIS)",
    temporalCoverage: "2001–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://themis.asu.edu/",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/odyssey/themis.htm",
    status: "modelled",
    confidence: "high",
    appLayer: "Surface temperature",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes:
      "Temperature layer uses THEMIS-derived surface thermal ranges per site. Jezero: −18 to +20°C, Arcadia: −48 to 0°C, Korolev: −88 to −40°C.",
    keyFindings:
      "THEMIS nighttime IR reveals ice-rich ground by anomalously low thermal inertia decay.",
  },
  // STEREO IMAGERY
  {
    id: "hrsc",
    name: "High Resolution Stereo Camera",
    acronym: "HRSC",
    mission: "Mars Express",
    agency: "ESA",
    instrument: "HRSC (12.5 m/pixel stereo)",
    dataType: "Colour stereo imagery + DTM",
    scientificPurpose: "Site-wide colour stereo mapping; documented Korolev crater ice dome.",
    spatialResolution: "12.5–50 m/pixel",
    temporalCoverage: "2004–present",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://www.dlr.de/hr/en/desktopdefault.aspx/tabid-2017/",
    status: "modelled",
    confidence: "high",
    appLayer: "Korolev optical · Elevation",
    sitesCovered: ["korolev"],
    notes:
      "Korolev terrain model rim geometry and ice dome calibrated against published HRSC imagery.",
    keyFindings: "HRSC first confirmed Korolev crater ice dome is perennial water ice (not CO₂).",
  },
  // RADIATION
  {
    id: "rad",
    name: "Radiation Assessment Detector",
    acronym: "RAD",
    mission: "Mars Science Laboratory (Curiosity)",
    agency: "NASA",
    instrument: "RAD (particle detector)",
    dataType: "Surface radiation dose measurements",
    scientificPurpose:
      "Measured actual surface radiation dose on Mars; baseline for EVA exposure estimates.",
    spatialResolution: "Point measurement (Gale Crater)",
    temporalCoverage: "2012–present",
    coordinateSystem: "N/A (point measurement)",
    sourceUrl: "https://www.swri.edu/rad",
    pdsUrl: "https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MSL-M-RAD-4-RDR-V1.0",
    status: "referenced",
    confidence: "high",
    appLayer: "Radiation dose",
    sitesCovered: ["jezero"],
    notes:
      "RAD surface average: ~0.67 mGy/day (Hassler et al. 2014). Radiation layer scaled from this baseline; higher elevation → slightly higher dose.",
    keyFindings:
      "Annual surface dose ~240 mGy — roughly 400× Earth background. Career risk limit ~200 days surface EVA.",
  },
  // PERSEVERANCE
  {
    id: "perseverance",
    name: "Mastcam-Z · SuperCam · PIXL · SHERLOC",
    acronym: "MZSP",
    mission: "Mars 2020 (Perseverance)",
    agency: "NASA",
    instrument: "Mastcam-Z + SuperCam + PIXL + SHERLOC",
    dataType: "High-res imagery, Raman spectroscopy, X-ray chemistry",
    scientificPurpose:
      "Ground-truth geology, rock chemistry, and biosignature search at Jezero delta.",
    spatialResolution: "cm-scale (rover cameras)",
    temporalCoverage: "2021–present",
    coordinateSystem: "Local site frame / SPICE",
    sourceUrl: "https://mars.nasa.gov/mars2020/",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/mars2020/",
    status: "referenced",
    confidence: "high",
    appLayer: "Jezero science value · POI ground truth",
    sitesCovered: ["jezero"],
    notes:
      "Perseverance confirmed clay-carbonate signatures at Jezero delta (Farley et al. 2022). POI locations informed by published mission reports.",
    keyFindings:
      "Organic matter detected in Jezero delta rocks; potential biosignature-bearing samples cached.",
  },
  // CURIOSITY
  {
    id: "curiosity",
    name: "Mars Science Laboratory",
    acronym: "MSL / Curiosity",
    mission: "Mars Science Laboratory",
    agency: "NASA",
    instrument: "ChemCam · SAM · MAHLI · MEDA",
    dataType: "Geological, chemical, atmospheric measurements",
    scientificPurpose:
      "Established Mars habitability, baseline radiation, and atmospheric conditions.",
    spatialResolution: "cm-scale (rover)",
    temporalCoverage: "2012–present",
    coordinateSystem: "Local site frame",
    sourceUrl: "https://mars.nasa.gov/msl/",
    pdsUrl: "https://pds-geosciences.wustl.edu/missions/msl/",
    status: "referenced",
    confidence: "high",
    appLayer: "Radiation · Science context",
    sitesCovered: [],
    notes:
      "RAD measurements from Gale Crater form the radiation baseline for all three sites, adjusted for latitude and elevation.",
  },
  // MARS TREK
  {
    id: "mars-trek",
    name: "NASA Mars Trek",
    acronym: "Trek",
    mission: "NASA JPL",
    agency: "NASA",
    instrument: "Web GIS (aggregates MOLA, HiRISE, CTX, THEMIS, CRISM, etc.)",
    dataType: "Interactive map browser",
    scientificPurpose: "Reference portal for multi-layer Mars datasets in a browser GIS.",
    spatialResolution: "Varies by dataset",
    temporalCoverage: "Various",
    coordinateSystem: "IAU Mars 2000",
    sourceUrl: "https://trek.nasa.gov/mars/",
    status: "referenced",
    confidence: "high",
    appLayer: "All (reference)",
    sitesCovered: ["jezero", "arcadia", "korolev"],
    notes:
      "Mars Trek used to verify site extents, POI coordinates, and layer appearance for all three exploration zones.",
  },
];

/** Datasets relevant to each site */
export function getDatasetsForSite(siteId: "jezero" | "arcadia" | "korolev") {
  return NASA_DATASETS.filter(
    (d) => d.sitesCovered.includes(siteId) || d.sitesCovered.length === 0,
  );
}

/** Datasets powering ice-related analysis */
export const ICE_DATASETS = NASA_DATASETS.filter(
  (d) =>
    d.appLayer.toLowerCase().includes("ice") || ["swim", "sharad", "grs", "marsis"].includes(d.id),
);

/** Status badge text */
export const STATUS_LABEL: Record<DataStatus, string> = {
  modelled: "Modelled after",
  referenced: "Referenced",
  planned: "Planned",
};

export const STATUS_DESCRIPTION: Record<DataStatus, string> = {
  modelled:
    "Terrain is generated procedurally, constrained by published parameter ranges from this dataset — not actual downloaded raster data.",
  referenced:
    "Published findings from this dataset directly informed layer design, constants, and colour scales.",
  planned: "Integration of actual raster data from this source is a planned future enhancement.",
};
