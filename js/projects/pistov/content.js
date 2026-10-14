// Editorial content of the Pístov site (subpages + home teasers).
// Only verified facts from the supplied documents are stated as facts; anything the developer still has to
// supply is marked `pending` and rendered as "doplní developer". Do not turn placeholders into claims.

export const site = {
  name: "Pístov",
  claim: "Pozemky a rodinné domy",
  realisation: { label: "IMP net", url: "https://www.impnet.cz" },
  developer: { name: "START Zelený s.r.o.", address: "Široká 376, 588 32 Brtnice", role: "Zadavatel projektu (podle katalogu)" },
  architect: { name: "TAM architekti s.r.o.", address: "Fibichova 23, 586 01 Jihlava", role: "Autoři urbanistického návrhu a typových domů" },
  salesContact: { pending: true, note: "Kontaktní osobu pro prodej doplní developer." },
  location: { lat: 49.38015, lon: 15.567753, label: "Pístov u Jihlavy" },
};

// News – real events of the project materials only.
export const news = [
  {
    slug: "web-prezentace-projektu", date: "2026-10-14", category: "Prodej",
    title: "Spouštíme interaktivní prezentaci Pístova",
    perex: "Vyberte si parcelu, typový dům i materiál a podívejte se, jak by mohl dům na konkrétním místě stát.",
    body: [
      "Nová prezentace propojuje situační plán lokality s katalogem typových domů. U každé parcely uvidíte její výměru, stav a domy, které na ni lze umístit.",
      "V režimu Můj návrh se vybraný dům na parcele „postaví“ – od obrysu přes hmotu domu až po vizualizaci architektů. Hotovou kombinaci můžete rovnou poptat.",
      "Ceny pozemků a orientační ceny domů doplníme, jakmile je developer zveřejní.",
    ],
    image: "aerial", cta: { label: "Prozkoumat lokalitu", href: "index.html#explorer" },
  },
  {
    slug: "dronove-snimky-lokality", date: "2026-10-13", category: "Lokalita",
    title: "Lokalitu jsme nafotili z dronu",
    perex: "Šest panoramat 360° z pěti míst ukazuje dnešní stav pozemků i výhledy na okolní krajinu.",
    body: [
      "Nad lokalitou jsme pořídili sérii dronových panoramat – ze středu budoucí zástavby ve výšce 30 a 60 metrů, od rybníků na východě, z polí na jihu a nad obcí na západě a severu.",
      "Panoramata najdete v interaktivní lokalitě v pohledu Panorama 360°. Hranice parcel jsou do nich promítnuté podle situačního plánu, takže je vidět, kde přesně budete bydlet.",
      "Snímky zachycují stav před výstavbou.",
    ],
    image: "drone-ponds", cta: { label: "Otevřít panorama 360°", href: "index.html?pohled=pano" },
  },
  {
    slug: "katalog-rodinnych-domu", date: "2026-04", dateLabel: "duben 2026", category: "Projekt",
    title: "Architekti připravili katalog typových domů",
    perex: "Čtyři typologie A–D s dispozičními a materiálovými variantami od TAM architekti.",
    body: [
      "Katalog rodinných domů pro Pístov zpracovali TAM architekti. Obsahuje situační plán lokality, řezy terénem a čtyři typové domy.",
      "Dům A je základní typologie s garáží (170 m² obestavěné plochy), dům B kratší varianta (143 m²), dům C minimalistická varianta (107 m², podvarianta C2 106 m²) a dům D varianta s plochou střechou (156 m²).",
      "Každý typ má několik materiálových řešení – omítku, cihlu i dřevo, pálenou tašku nebo plechovou krytinu.",
    ],
    image: "A-garden-warm", cta: { label: "Prohlédnout typové domy", href: "index.html#domy" },
  },
];

export const faq = [
  { cat: "Parcely", q: "Kolik parcel je v nabídce?", a: "Situační plán obsahuje 72 parcel. Podle katalogu z dubna 2026 je 63 k prodeji a 9 rezervovaných. Aktuální dostupnost vám potvrdíme v odpovědi na poptávku." },
  { cat: "Parcely", q: "Jak velké jsou parcely?", a: "Výměry parcel jsou od 499 do 1 423 m², většina se pohybuje mezi 560 a 700 m². U každé parcely najdete výměru v interaktivní lokalitě." },
  { cat: "Parcely", q: "Co ukazují dronová panoramata?", a: "Dnešní stav lokality z 13. 10. 2026, tedy před výstavbou. Hranice parcel jsou do panoramat promítnuté podle situačního plánu – jde o orientační zobrazení." },
  { cat: "Typové domy", q: "Jaké domy si mohu vybrat?", a: "Katalog nabízí čtyři typologie: A – základní typologie s garáží, B – kratší varianta, C – minimalistická varianta (včetně podvarianty C2) a D – varianta s plochou střechou, také v přízemních variantách." },
  { cat: "Typové domy", q: "Jsou uvedené plochy užitné?", a: "Ne. U domů uvádíme obestavěnou plochu podle katalogu. Plochy jednotlivých místností najdete v půdorysech v detailu domu." },
  { cat: "Typové domy", q: "Mohu si na každou parcelu postavit libovolný dům?", a: "Ke každé parcele zobrazujeme typy domů, které na ni lze umístit. Současná pravidla přiřazení jsou ukázková – finální vazbu domů na parcely potvrdí developer s architektem." },
  { cat: "Typové domy", q: "Mohu si vybrat fasádu a střechu?", a: "Katalog ukazuje u každého domu několik materiálových řešení – světlou omítku, režnou nebo světlou cihlu, dřevěný obklad, pálenou tašku nebo plechovou krytinu. Konkrétní možnosti potvrdí dodavatel stavby." },
  { cat: "Ceny a financování", q: "Kolik stojí pozemek a dům?", a: "Ceny pozemků a orientační ceny domů zatím nejsou zveřejněné. Pošlete poptávku a cenu vám sdělíme." },
  { cat: "Ceny a financování", q: "Pomůžete mi s financováním?", a: "Podmínky financování a partnery developer teprve připravuje. Orientační splátku si můžete spočítat na stránce Financování." },
  { cat: "Postup a termíny", q: "Kdy začne výstavba?", a: "Termíny přípravy a výstavby developer zatím nezveřejnil. Nové informace budeme průběžně uvádět v aktualitách." },
  { cat: "Postup a termíny", q: "Jak pošlu poptávku?", a: "Vyberte parcelu a dům v interaktivní lokalitě a klikněte na „Poptat tuto kombinaci“. Vaši volbu doplníme do formuláře za vás. Napsat nám můžete i obecně přes stránku Kontakty." },
  { cat: "Vizualizace", q: "Je vizualizace domu na parcele přesná?", a: "Jde o ilustraci. Hmota domu vychází z rozměrů v katalogu a umístění ze situačního plánu, fotorealistické obrázky jsou vizualizace architektů. Úvodní film na hlavní stránce je ilustrační vizualizace vytvořená pomocí AI." },
];

export const financing = {
  pending: "Konkrétní podmínky prodeje, platební kalendář a partnery financování doplní developer.",
  steps: [
    { title: "Výběr parcely a domu", text: "V interaktivní lokalitě si vyberete parcelu, typový dům, dispozici a materiál a pošlete poptávku." },
    { title: "Rezervace", text: "Rezervaci parcely a její podmínky stanoví developer." },
    { title: "Financování", text: "Pozemek i stavbu lze obvykle financovat hypotečním úvěrem; peníze na stavbu se čerpají postupně podle jejího průběhu." },
    { title: "Smlouvy", text: "Kupní smlouva na pozemek a smlouva o dílo s dodavatelem stavby." },
    { title: "Výstavba", text: "Stavba domu podle zvoleného typu a materiálového řešení." },
    { title: "Kolaudace a stěhování", text: "Po dokončení a kolaudaci se můžete stěhovat." },
  ],
  stepsNote: "Obecný postup při koupi pozemku se stavbou rodinného domu – nejde o podmínky projektu Pístov.",
  // example values for the calculator – explicitly NOT prices of Pístov
  calculator: { example: { price: 9000000, own: 1800000, rate: 4.9, years: 30 } },
};

// Gallery collections – all images exist in assets/img
export const gallery = [
  { cat: "Domy", items: [
    ["A-garden-warm", "Dům A – omítka, pálená taška, šedé dřevo"], ["A-street", "Dům A – pohled z ulice"], ["A-garden-larch", "Dům A – tmavá krytina, modřín"],
    ["A-mat-lightbrick", "Dům A – bílá cihla"], ["A-mat-redbrick", "Dům A – režná cihla"], ["A-mat-sandbrick", "Dům A – světlá cihla"], ["A-mat-white-tile", "Dům A – omítka, pálená taška"],
    ["B-garden-brick", "Dům B – režná cihla"], ["B-mat-white-tile", "Dům B – omítka, pálená taška"], ["B-mat-white-larch", "Dům B – omítka, dřevo"],
    ["C-garden-white-tile", "Dům C – omítka, pálená taška"], ["C-mat-redbrick", "Dům C – režná cihla"], ["C-mat-white-dark", "Dům C – omítka, tmavá krytina"],
    ["D-garden-white", "Dům D – bílá omítka"], ["D-mat-lightbrick", "Dům D – světlá cihla"], ["D-mat-redbrick", "Dům D – režná cihla"],
  ] },
  { cat: "Lokalita", items: [
    ["aerial", "Vizualizace budoucí zástavby"], ["drone-ponds", "Rybníky a pole na východ od lokality – dron, 13. 10. 2026"],
    ["drone-site-south", "Plocha budoucích parcel od jihu – dron, 13. 10. 2026"], ["drone-site-centre", "Střed lokality, stav před výstavbou – dron, 13. 10. 2026"],
    ["drone-village", "Obec a rybník na sever od lokality – dron, 13. 10. 2026"], ["drone-east", "Pohled od východu přes rybníky – dron, 13. 10. 2026"],
  ] },
  { cat: "Výkresy", items: [
    ["plan", "Situační plán lokality"], ["section-1", "Řez terénem 1"], ["section-2", "Řez terénem 2"],
    ["A-plans", "Dům A – půdorysy"], ["A-site", "Dům A – situace"], ["B-plans", "Dům B – půdorysy"], ["C-plans", "Dům C – půdorysy"], ["C2-plans", "Dům C2 – půdorysy"],
    ["D-plans", "Dům D – půdorysy"], ["D-plans-v23", "Dům D – přízemní varianty"],
  ] },
];
