// House typologies A–D – facts taken from "Pístov – katalog rodinných domů" (TAM architekti, duben 2026).
// builtUpArea = OBESTAVĚNÁ plocha (m²) exactly as stated in the catalogue – never usable floor area.
// Values the catalogue does not state are null and must not be invented.
// `massing` is a schematic footprint for the build-up transition only (derived from catalogue dimensions).

export const houseTypes = [
  {
    id: "A",
    name: "Dům A",
    tagline: "Základní typologie",
    character: "Klasický dům se sedlovou střechou a nízkým vedlejším traktem s garáží. Hlavní obytný prostor s kuchyní vychází na zahradu a zastíněné posezení.",
    builtUpArea: 170, builtUpLabel: "Obestavěná plocha domu s garáží",
    length: 17,
    roof: "sedlová",
    parking: "parkování před domem na vlastním pozemku a v garáži",
    catalogPages: [7, 16],
    sheets: { site: "A-site", elevations: ["A-elev-street", "A-elev-garden"] },
    layouts: [
      {
        id: "A1", name: "Základní varianta", disposition: "4+kk", sheet: "A-plans", catalogPage: 9,
        rooms: ["hlavní prostor – obývací pokoj s kuchyní se vstupem na zahradu (47 m²)", "master bedroom s vlastní koupelnou a šatnou (17 m²)", "2NP: dvě ložnice / obytné pokoje (29 m² a 25 m²)", "technická místnost / prádelna, špajz", "prostorná garáž", "zastíněné venkovní posezení"],
        massing: { main: { l: 17, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 }, wing: { along: [3.7, 10.2], out: 9, h: 3.3, roof: "flat" } },
      },
      {
        id: "A2", name: "Podvarianta se zastřešením obou traktů", disposition: "5+kk", sheet: "A-plans-v2", catalogPage: 12,
        rooms: ["zastřešení obou traktů stavby", "pokoj č. 1 (26 m²), pokoj č. 2 (25 m²), pokoj č. 3 (27 m²) podle výkresu Varianta 2"],
        massing: { main: { l: 17, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 }, wing: { along: [3.7, 10.2], out: 9, h: 3.3, roof: "gable", ridge: 6.2 } },
        renderNote: "Vizualizace zobrazují základní variantu domu A.",
      },
    ],
  },
  {
    id: "B",
    name: "Dům B",
    tagline: "Kratší varianta",
    character: "Kratší dům (13 m), vhodný na pozemky s komplikovanějším terénem. Vedlejší křídlo není obsazeno garáží, ale obývacím pokojem s kuchyní.",
    builtUpArea: 143, builtUpLabel: "Obestavěná plocha domu",
    length: 13,
    roof: "sedlová",
    parking: "parkování před domem na vlastním pozemku, zahradní domek pro kola, nářadí a zahradní nábytek",
    suitability: "Katalog: vhodný na pozemky s komplikovanějším terénem.",
    catalogPages: [17, 21],
    sheets: { site: "B-site" },
    layouts: [
      {
        id: "B1", name: "Základní varianta", disposition: "5+kk", sheet: "B-plans", catalogPage: 19,
        rooms: ["vedlejší křídlo s obývacím pokojem a kuchyní (41 m²)", "master bedroom s oknem do zahrady (16 m²)", "pracovna (10 m²)", "2NP: dvě ložnice / obytné pokoje (18 m² a 15 m²)", "technická místnost / prádelna, špajz", "zastíněné posezení"],
        massing: { main: { l: 13, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 }, wing: { along: [0, 6.5], out: 9, h: 3.3, roof: "flat" } },
      },
      {
        id: "B2", name: "Podvarianta s dispozicí D.2", disposition: "5+kk", sheet: "D-plans-v23", catalogPage: 19,
        rooms: ["katalog: „lze použít dispozici D.2 … podvarianta 5+kk“", "výkres dispozice viz Dům D – Varianta 2"],
        massing: { main: { l: 13, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 }, wing: { along: [0, 6.5], out: 9, h: 3.3, roof: "flat" } },
        renderNote: "Vizualizace zobrazují základní variantu domu B.",
      },
    ],
  },
  {
    id: "C",
    name: "Dům C",
    tagline: "Minimalistická varianta",
    character: "Nejmenší typologie domu, vhodná na pozemky s východojižní orientací – vedlejší trakt nebude stínit zahradě. Parkování řeší přístřešek pro auto, možná je i garáž.",
    builtUpArea: 107, builtUpLabel: "Obestavěná plocha domu",
    length: 16.5,
    roof: "sedlová",
    parking: "přístřešek pro auto (možná je i garáž), sjednocený vjezd a vstup v šíři 4,5 m",
    suitability: "Katalog: vhodné na pozemky s východojižní orientací.",
    catalogPages: [22, 28],
    sheets: { site: "C-site" },
    layouts: [
      {
        id: "C1", name: "Základní varianta", disposition: null, sheet: "C-plans", catalogPage: 24,
        rooms: ["hlavní prostor – obývací pokoj s kuchyní se vstupem na zahradu (35 m²)", "master bedroom s francouzským oknem do zahrady, vlastní koupelnou a šatnou (16 m²)", "2NP: dvě ložnice / obytné pokoje (18 m² a 24 m²)", "technická místnost / prádelna, špajz", "přístřešek pro auto, zastíněné posezení"],
        massing: { main: { l: 16.5, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 } },
      },
      {
        id: "C2", name: "Varianta C2 – větší zahrada", disposition: null, sheet: "C2-plans", site: "C2-site", catalogPage: 25,
        builtUpArea: 106, length: 14.5,
        rooms: ["nejmenší typologie domu + větší zahrada", "hlavní prostor s kuchyní (35 m²)", "master bedroom s vlastní koupelnou a šatnou (16 m²)", "2NP: dvě ložnice / obytné pokoje (18 m² a 15 m²)", "vstupní zádveří, samostatný vjezd 3,5 m a vstup 1 m"],
        massing: { main: { l: 14.5, w: 6.5, roof: "gable", eave: 4.2, ridge: 8.8 }, wing: { along: [2, 6], out: 3, h: 3, roof: "flat" } },
        renderNote: "Vizualizace zobrazují základní variantu domu C.",
      },
    ],
  },
  {
    id: "D",
    name: "Dům D",
    tagline: "Varianta s plochou střechou",
    character: "Kratší dům (15 m) s plochou střechou a uskočeným patrem. Vedlejší křídlo je obsazeno obývacím pokojem s kuchyní; katalog nabízí i přízemní varianty.",
    builtUpArea: 156, builtUpLabel: "Obestavěná plocha domu",
    length: 15,
    roof: "plochá",
    parking: "parkování před domem na vlastním pozemku, zahradní domek pro kola, nářadí a zahradní nábytek",
    catalogPages: [29, 34],
    sheets: { site: "D-site" },
    layouts: [
      {
        id: "D1", name: "Dům s uskočeným patrem", disposition: null, sheet: "D-plans", catalogPage: 31,
        rooms: ["vedlejší křídlo s obývacím pokojem a kuchyní (48 m²)", "master bedroom s oknem do zahrady (16 m²)", "pracovna (10 m²)", "2NP: dvě ložnice / obytné pokoje (16 m² a 18 m²)", "technická místnost / prádelna, zastíněné posezení"],
        massing: { main: { l: 15, w: 6.5, roof: "flat", eave: 6.6 }, wing: { along: [5, 14], out: 9, h: 3.4, roof: "flat" } },
      },
      {
        id: "D2", name: "Varianta 2 – přízemní dům s plochou střechou", disposition: null, sheet: "D-plans-v23", catalogPage: 32, builtUpArea: null,
        rooms: ["přízemní dům s plochou střechou", "obytný prostor 45 m², pokoje 10, 10 a 12 m² podle výkresu Varianta 2_1NP"],
        massing: { main: { l: 15, w: 6.5, roof: "flat", eave: 3.4 }, wing: { along: [5, 13.5], out: 8.5, h: 3.4, roof: "flat" } },
        renderNote: "Vizualizace zobrazují patrovou variantu domu D. Obestavěná plocha přízemních variant v katalogu uvedena není.",
      },
      {
        id: "D3", name: "Varianta 3 – přízemní dům", disposition: null, sheet: "D-plans-v23", catalogPage: 32, builtUpArea: null,
        rooms: ["přízemní dům s plochou střechou", "obytný prostor 38 m², pokoje 16, 12 a 10 m² podle výkresu Varianta_3_1NP"],
        massing: { main: { l: 14.5, w: 6.5, roof: "flat", eave: 3.4 }, wing: { along: [5, 13.5], out: 8.5, h: 3.4, roof: "flat" } },
        renderNote: "Vizualizace zobrazují patrovou variantu domu D. Obestavěná plocha přízemních variant v katalogu uvedena není.",
      },
    ],
  },
];

// Site rules printed on every "Situace" sheet of the catalogue.
export const siteRules = [
  "vedlejší trakt vždy 6 m od uliční čáry – pro odparkování min. 2 aut na vlastním pozemku",
  "umístění domu 2 m od severní nebo východní hrany pozemku",
  "umístění garáže 2,5 m od jižní nebo západní hrany pozemku (průjezd traktůrku, sekačky)",
  "plot ve výši 1,8 m, soukromá předzahrádka",
  "samostatný vstup v šíři 1 m, samostatný vjezd v šíři 3,5 m",
];
