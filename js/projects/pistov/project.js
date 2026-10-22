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
export const PRICE_PER_M2 = 6000; // Kč za m² pozemku (informace developera, 10/2026)
const plots = plotsSource.map((p) => ({
  ...p,
  price: p.area * PRICE_PER_M2, // Kč – developer's price per m² (10/2026)
  statusSource: "Opravený situační plán, říjen 2026",
}));

// Hand-written notes that take turns over the aerial view in the hero. Only facts from the plan / plot data;
// anchors in aerial-view pixels, by plot number(s) or by panorama station.
const nf = (v) => new Intl.NumberFormat("cs-CZ").format(v);
const biggestFree = plots.filter((p) => p.status === "available").reduce((a, p) => (p.area > a.area ? p : a));
const heroNotes = [
  { lines: ["z výkresu architekta", "až k budoucí ulici"], at: "centre" },
  { lines: ["rybníky a pás", "veřejné zeleně"], at: [2520, 470] },
  { lines: ["největší volná parcela", `č. ${biggestFree.no} · ${nf(biggestFree.area)} m²`], at: { plot: biggestFree.no } },
  { lines: ["odsud jsme fotili", "panorama 360°"], at: { station: "stred-60" } },
  { lines: ["stávající", "zástavba obce"], at: [1480, 228] },
  { lines: ["čtyři typy domů", "pro inspiraci"], at: { plot: 14 } },
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
  pricing: {
    plotPriceNote: "Cena pozemku bude doplněna",
    perM2: PRICE_PER_M2,
    housePriceNote: "Orientační cena domu bude doplněna",
    disclaimer: "Ceny domů budou orientační; konečnou cenu stanoví vybraný dodavatel stavby.",
  },
  // Views of the locality ("oko"). Interactive views carry plot geometry under the same key.
  views: [
    {
      id: "aerial", label: "Letecký pohled", kind: "image", interactive: true, geometryKey: "aerial",
      size: AERIAL_SIZE,
      // empty plots (houses removed from the architects' visualisation with Magnific); the intro keeps the built one
      sources: [[800, IMG + "aerial-empty-800.webp"], [1400, IMG + "aerial-empty-1400.webp"], [2200, IMG + "aerial-empty-2200.webp"], [3400, IMG + "aerial-empty-3400.webp"]],
      // surroundings outpainted in Adobe Firefly, registered to this view (scene px), shown when zoomed out
      surround: { src: IMG + "aerial-surround-2000.webp", box: [-853.5, -420.3, 5126, 2876] },
      introSources: [[800, IMG + "aerial-800.webp"], [1400, IMG + "aerial-1400.webp"], [2200, IMG + "aerial-2200.webp"], [3400, IMG + "aerial-3400.webp"]],
      menuMeta: "s výběrem parcel · po výběru domu se spustí jeho animace",
      caption: "Letecký pohled · parcely před výstavbou (upravená vizualizace) · hranice promítnuty orientačně",
      homography: AERIAL_HOMOGRAPHY, // plan px → this view px (used for compass + hero overlay)
      overlay: { src: IMG + "plan-cutout-1682.webp", scale: 3364 / 1682 },
    },
    {
      id: "plan", label: "Situační plán", kind: "image", interactive: true, geometryKey: "plan",
      size: PLAN_SIZE,
      sources: [[900, IMG + "plan-frame-900.webp"], [1800, IMG + "plan-frame-1800.webp"], [3364, IMG + "plan-frame-3364.webp"]],
      caption: "Situační plán · opravená verze 10/2026",
      north: 0,
      hidden: true, // not offered in the views menu; still used for geometry and the compass
    },
    // terrain sections are no longer views – they belong to each plot's detail (see terrain below)
    { id: "pano", label: "360° · samotné pozemky", kind: "panorama", interactive: true, menuMeta: "dronové panorama, parcely před výstavbou", caption: "Dronové panorama 13. 10. 2026 · stav před výstavbou · parcely promítnuty orientačně" },
    // TODO podklady: vizualizace zástavby do panoramat (stations[].future) a vizualizace z ulice
    { id: "pano-future", label: "360° · vizualizace zastavěných pozemků", kind: "panorama", interactive: true, pending: "Čeká na vizualizaci zástavby do panoramat" },
    { id: "street", label: "Pohled z ulice · vizualizace", kind: "image", interactive: true, pending: "Čeká na vizualizace z ulice" },
  ],
  defaultView: "aerial",
  // Intro film – AI illustration (Higgsfield, Kling 3.0) built from the architects' aerial visualisation:
  // prepared plots → houses rise → fly-through → back to the overview. Its last frame = the aerial view cropped to
  // endBox, so the interactive scene takes over seamlessly.
  introVideo: {
    src: { hd: "assets/video/intro-1080.mp4", sd: "assets/video/intro-720.mp4" },
    poster: "assets/video/intro-poster.webp",
    endBox: { x: 0, y: 58, w: 3419, h: 1923 },
    caption: "Ilustrační AI video animace",
  },
  img: (name, w) => `${IMG}${name}-${w}.webp`,
  imgSet: (name, widths) => widths.map((w) => `${IMG}${name}-${w}.webp ${w}w`).join(", "),
};
