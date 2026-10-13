// Pístov project configuration – everything project-specific lives in this folder.
// The engine in js/core and js/ui only consumes this object, so another development can be added
// as js/projects/<name>/project.js with the same shape.
import { plotsSource, reservedBlock, PLAN_SIZE, AERIAL_SIZE, PLAN_M_PER_PX, AERIAL_HOMOGRAPHY } from "./plots.generated.js";
import { houseTypes, siteRules } from "./houseTypes.js";
import { houseVariants } from "./houseVariants.js";
import { plotHouseCompatibility } from "./plotHouseCompatibility.js";
import { demoStatusOverrides } from "./statusOverrides.demo.js";

const IMG = "assets/img/";

// Plot records = traced geometry + business data. Prices are not part of the supplied documents.
const plots = plotsSource.map((p) => ({
  ...p,
  price: null, // Kč incl. VAT – to be supplied by the developer
  statusSource: "Situační plán, katalog duben 2026",
}));

export const project = {
  id: "pistov",
  name: "Pístov",
  claim: "Vaše místo. Váš dům. Vaše budoucnost.",
  source: "Pístov – katalog rodinných domů, TAM architekti s.r.o., duben 2026",
  developer: "START Zelený s.r.o.",
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
      caption: "Situační plán M 1 : 2000 · přesné hranice parcel",
      north: 0,
    },
    { id: "section-1", label: "Řez terénem 1", kind: "image", interactive: false, size: [4616, 3278], sources: [[1400, IMG + "section-1-1400.webp"], [2400, IMG + "section-1-2400.webp"]], caption: "Řez terénem 1 · M 1 : 200 · bez výběru parcel" },
    { id: "section-2", label: "Řez terénem 2", kind: "image", interactive: false, size: [4615, 3273], sources: [[1400, IMG + "section-2-1400.webp"], [2400, IMG + "section-2-2400.webp"]], caption: "Řez terénem 2 · M 1 : 200 · bez výběru parcel" },
    { id: "pano", label: "Panorama 360°", kind: "panorama", interactive: true, pending: "Čeká na panoramatické snímky" },
    { id: "street", label: "Pohled z ulice", kind: "image", interactive: true, pending: "Čeká na podklady" },
  ],
  defaultView: "aerial",
  img: (name, w) => `${IMG}${name}-${w}.webp`,
  imgSet: (name, widths) => widths.map((w) => `${IMG}${name}-${w}.webp ${w}w`).join(", "),
};
