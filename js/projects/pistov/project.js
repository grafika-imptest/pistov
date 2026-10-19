// Pístov project configuration – everything project-specific lives in this folder.
// The engine in js/core and js/ui only consumes this object, so another development can be added
// as js/projects/<name>/project.js with the same shape.
import { plotsSource, reservedBlock, PLAN_SIZE, AERIAL_SIZE, PLAN_M_PER_PX, AERIAL_HOMOGRAPHY } from "./plots.generated.js";
import { houseTypes, siteRules } from "./houseTypes.js";
import { houseVariants } from "./houseVariants.js";
import { plotHouseCompatibility } from "./plotHouseCompatibility.js";
import { demoStatusOverrides } from "./statusOverrides.demo.js";
import { panoramas, PLAN_GEOREF } from "./panoramas.generated.js";

const IMG = "assets/img/";

// Plot records = traced geometry + business data. Prices are not part of the supplied documents.
const plots = plotsSource.map((p) => ({
  ...p,
  price: null, // Kč incl. VAT – to be supplied by the developer
  statusSource: "Situační plán, katalog duben 2026",
}));

// Hand-written notes that take turns over the aerial view in the hero. Only facts from the plan / plot data;
// anchors in aerial-view pixels, by plot number(s) or by panorama station.
const nf = (v) => new Intl.NumberFormat("cs-CZ").format(v);
const reserved = plots.filter((p) => p.status === "reserved").map((p) => p.no).sort((a, b) => a - b);
const biggestFree = plots.filter((p) => p.status === "available").reduce((a, p) => (p.area > a.area ? p : a));
const heroNotes = [
  { lines: ["z výkresu architekta", "až k budoucí ulici"], at: "centre" },
  { lines: ["rybníky a pás", "veřejné zeleně"], at: [2520, 470] },
  { lines: ["rezervované parcely", `${reserved[0]}–${reserved[reserved.length - 1]}`], at: { plots: reserved } },
  { lines: ["největší volná parcela", `č. ${biggestFree.no} · ${nf(biggestFree.area)} m²`], at: { plot: biggestFree.no } },
  { lines: ["odsud jsme fotili", "panorama 360°"], at: { station: "stred-60" } },
  { lines: ["stávající", "zástavba obce"], at: [1480, 228] },
  { lines: ["čtyři typy domů", "od TAM architekti"], at: { plot: 14 } },
  { lines: ["pole a krajina", "kolem lokality"], at: [2900, 1760] },
];

export const project = {
  id: "pistov",
  name: "Pístov",
  claim: "Vaše místo. Váš dům. Vaše budoucnost.",
  source: "Pístov – katalog rodinných domů, TAM architekti s.r.o., duben 2026",
  developer: "Horák & Vetchý s.r.o.",
  architect: "TAM architekti s.r.o.",
  currency: "Kč",
  plots,
  reservedBlock,
  houseTypes,
  houseVariants,
  siteRules,
  compatibility: plotHouseCompatibility,
  demoStatusOverrides,
  planMetersPerPx: PLAN_M_PER_PX,
  panoramas,
  planGeoref: PLAN_GEOREF,
  defaultStation: "stred-60",
  heroNotes,
  // Terrain per plot (slope + its own terrain section). TODO: the architect supplies a section and a slope
  // figure for EVERY plot – until then the detail shows the catalogue sections as illustration.
  terrain: {
    perPlot: {},               // { 12: { slope: "mírný, cca 4 %", text: "…", section: "section-12" } }
    fallbackSections: ["section-1", "section-2"],
    note: "Ke každé parcele doplníme vlastní řez terénem a údaj o sklonu. Zatím ukazujeme ilustrační řez z katalogu.",
  },
  planNote: "Situační plán je předběžný – developer ho ještě upraví.",
  pricing: {
    plotPriceNote: "Cena pozemku bude doplněna",
    housePriceNote: "Orientační cena domu bude doplněna",
    disclaimer: "Ceny domů budou orientační; konečnou cenu stanoví vybraný dodavatel stavby.",
  },
  // Views of the locality ("oko"). Interactive views carry plot geometry under the same key.
  views: [
    {
      id: "aerial", label: "Letecký pohled", kind: "image", interactive: true, geometryKey: "aerial",
      size: AERIAL_SIZE,
      sources: [[800, IMG + "aerial-800.webp"], [1400, IMG + "aerial-1400.webp"], [2200, IMG + "aerial-2200.webp"], [3400, IMG + "aerial-3400.webp"]],
      caption: "Vizualizace zástavby · hranice parcel promítnuty orientačně",
      homography: AERIAL_HOMOGRAPHY, // plan px → this view px (used for compass + hero overlay)
      overlay: { src: IMG + "plan-cutout-1682.webp", scale: 3364 / 1682 },
    },
    {
      id: "plan", label: "Situační plán", kind: "image", interactive: true, geometryKey: "plan",
      size: PLAN_SIZE,
      sources: [[900, IMG + "plan-900.webp"], [1800, IMG + "plan-1800.webp"], [3364, IMG + "plan-3364.webp"]],
      caption: "Situační plán M 1 : 2000 · předběžná verze – plán se ještě upraví",
      north: 0,
    },
    // terrain sections are no longer views – they belong to each plot's detail (see terrain below)
    { id: "pano", label: "Panorama 360° · dnes", kind: "panorama", interactive: true, caption: "Dronové panorama 13. 10. 2026 · stav před výstavbou · parcely promítnuty orientačně" },
    { id: "street", label: "Pohled z ulice", kind: "image", interactive: true, pending: "Čeká na podklady" },
  ],
  defaultView: "aerial",
  // Intro film – AI illustration (Higgsfield, Kling 3.0) built from the architects' aerial visualisation:
  // prepared plots → houses rise → fly-through → back to the overview. Its last frame = the aerial view cropped to
  // endBox, so the interactive scene takes over seamlessly.
  introVideo: {
    src: { hd: "assets/video/intro-1080.mp4", sd: "assets/video/intro-720.mp4" },
    poster: "assets/video/intro-poster.webp",
    endBox: { x: 0, y: 58, w: 3419, h: 1923 },
    caption: "Ilustrační vizualizace (AI) podle návrhu TAM architekti",
  },
  img: (name, w) => `${IMG}${name}-${w}.webp`,
  imgSet: (name, widths) => widths.map((w) => `${IMG}${name}-${w}.webp ${w}w`).join(", "),
};
