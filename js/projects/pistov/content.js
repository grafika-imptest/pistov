// Editorial content of the Pístov site (subpages + home teasers).
// Only verified facts from the supplied documents are stated as facts; anything the developer still has to
// supply is marked `pending` and rendered as "doplní developer". Do not turn placeholders into claims.

export const site = {
  name: "Pístov",
  claim: "Stavební parcely",
  realisation: { label: "IMP net", url: "https://www.impnet.cz" },
  // Prodejce – Horák & Vetchý zastupuje prodávajícího (vzor rezervační smlouvy, 11/2026)
  seller: {
    name: "Horák & Vetchý s.r.o.", brand: "Horák & Vetchý reality", role: "Prodejce – zajišťuje prodej parcel",
    address: "17. listopadu 5904/1a, 586 01 Jihlava", ico: "14443112", dic: "CZ14443112", register: "Krajský soud v Brně, oddíl C, vložka 128347",
    phone: "+420 603 841 123", email: "info@hvreality.cz", web: "https://hvreality.cz",
    logo: { dark: "assets/img/hv-logo-dark.png", light: "assets/img/hv-logo-light.png", darkTrim: "assets/img/hv-logo-dark-trim.png", lightTrim: "assets/img/hv-logo-light-trim.png" },
    // icons only – the client fills the profile URLs in the CMS (an empty URL renders the icon without a link)
    social: { facebook: "", instagram: "" },
  },
  // Developer – prodávající je projektová společnost skupiny START Zelený (vzory smluv, 11/2026)
  developer: {
    name: "START Zelený Pístov s.r.o.", brand: "START Zelený", role: "Developer projektu",
    address: "Široká 376, 588 32 Brtnice", ico: "03826546", register: "Krajský soud v Brně, oddíl C, vložka 140204",
    web: "https://www.zeleny.cz",
  },
  // Kontaktní osoby prodeje (zadání klienta 11/2026; tituly podle viladomy-dobrovodska.cz)
  // social: icons only until the client fills the profile URLs in the CMS
  contacts: [
    { name: "Monika Zelená", role: "Hlavní makléřka · pomoc s financováním", phone: "+420 731 984 866", email: "zelena@hvreality.cz", photo: "person-zelena", social: { facebook: "", instagram: "" } },
    { name: "Ing. Pavel Vetchý", role: "Makléř · jednatel Horák & Vetchý", phone: "+420 603 841 123", email: "vetchy@hvreality.cz", photo: "person-vetchy", social: { facebook: "", instagram: "" } },
  ],
  architect: { name: "TAM architekti s.r.o.", address: "Fibichova 23, 586 01 Jihlava", role: "Autoři urbanistického návrhu a typových domů" },
  location: { lat: 49.38015, lon: 15.567753, label: "Pístov u Jihlavy" },
};

// Harmonogram projektu (zadání klienta 11/2026; odpovídá vzoru rezervační smlouvy)
export const schedule = [
  { date: "11/2026", title: "Zahájení prodeje", text: "Rezervace parcel podle orientačního plánu." },
  { date: "11/2027", title: "Geometrický plán a zaměření", text: "Parcely dostanou konečná čísla a výměry v katastru." },
  { date: "03/2029", title: "Kolaudace a dokončení", text: "Hotové komunikace, inženýrské sítě a terénní úpravy." },
  { date: "06/2029", title: "Předání pozemků", text: "Po zaplacení kupní ceny můžete začít stavět." },
];

// News – real events of the project materials only.
export const news = [
  {
    slug: "web-prezentace-projektu", date: "2026-10-14", category: "Prodej",
    title: "Spouštíme interaktivní prezentaci Pístova",
    perex: "Vyberte si parcelu, typový dům i materiál a podívejte se, jak by mohl dům na konkrétním místě stát.",
    body: [
      "Nová prezentace propojuje situační plán lokality s katalogem typových domů. U každé parcely uvidíte její výměru, cenu a stav a pro inspiraci i typové domy, které se na ni vejdou. Postavit si můžete jakýkoli dům podle svého.",
      "V režimu Můj návrh se pro inspiraci na parcele „postaví“ vybraný typový dům – od obrysu přes hmotu domu až po vizualizaci architektů. Prodáváme pouze pozemky; typové domy ukazují, jak může zástavba vypadat.",
      "Pozemky stojí 6 500 Kč za m² včetně DPH, cenu každé parcely uvidíte přímo v nabídce.",
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
    perex: "Čtyři typologie A–D s dispozičními a materiálovými variantami.",
    body: [
      "Katalog rodinných domů pro Pístov obsahuje situační plán lokality, řezy terénem a čtyři typové domy.",
      "Dům A je základní typologie s garáží (170 m² obestavěné plochy), dům B kratší varianta (143 m²), dům C minimalistická varianta (107 m², podvarianta C2 106 m²) a dům D varianta s plochou střechou (156 m²).",
      "Každý typ má několik materiálových řešení – omítku, cihlu i dřevo, pálenou tašku nebo plechovou krytinu.",
    ],
    image: "A-garden-warm", cta: { label: "Prohlédnout typové domy", href: "index.html#domy" },
  },
];

export const faq = [
  { cat: "Parcely", q: "Kolik parcel je v nabídce?", a: "Opravený situační plán (říjen 2026) obsahuje 62 parcel a všech 62 je k prodeji. Aktuální dostupnost vám potvrdíme v odpovědi na poptávku." },
  { cat: "Parcely", q: "Jak velké jsou parcely?", a: "Výměry parcel jsou od 499 do 1 067 m², většina se pohybuje mezi 560 a 700 m². U každé parcely najdete výměru v interaktivní lokalitě." },
  { cat: "Parcely", q: "Co ukazují dronová panoramata?", a: "Dnešní stav lokality z 13. 10. 2026, tedy před výstavbou. Hranice parcel jsou do panoramat promítnuté podle situačního plánu – jde o orientační zobrazení." },
  { cat: "Typové domy", q: "Jaké domy si mohu vybrat?", a: "Katalog nabízí čtyři typologie: A – základní typologie s garáží, B – kratší varianta, C – minimalistická varianta (včetně podvarianty C2) a D – varianta s plochou střechou, také v přízemních variantách." },
  { cat: "Typové domy", q: "Jsou uvedené plochy užitné?", a: "Ne. U domů uvádíme obestavěnou plochu podle katalogu. Plochy jednotlivých místností najdete v půdorysech v detailu domu." },
  { cat: "Typové domy", q: "Musím stavět jeden z typových domů?", a: "Ne. Na parcele si můžete postavit jakýkoli rodinný dům podle svého – vlastní projekt nebo dům od libovolného dodavatele, v souladu s regulativy lokality. Typové domy A–D jsou jen inspirace; u každé parcely ukazujeme, které z nich se na ni vejdou." },
  { cat: "Typové domy", q: "Mohu si vybrat fasádu a střechu?", a: "Katalog ukazuje u každého domu několik materiálových řešení – světlou omítku, režnou nebo světlou cihlu, dřevěný obklad, pálenou tašku nebo plechovou krytinu. Konkrétní možnosti potvrdí dodavatel stavby." },
  { cat: "Ceny a financování", q: "Kolik stojí parcela?", a: "Pozemky stojí 6 500 Kč za m² včetně DPH – například parcela o výměře 600 m² vyjde na 3 900 000 Kč. Cenu každé parcely najdete v interaktivní lokalitě. Konečná cena se určí podle výměry zapsané v katastru." },
  { cat: "Typové domy", q: "Mohu si u vás objednat i dům?", a: "Ne, prodáváme pouze pozemky. Typové domy slouží jako inspirace – ukazují, jak může dům na konkrétní parcele vypadat." },
  { cat: "Ceny a financování", q: "Pomůžete mi s financováním?", a: "Ano. S hypotékou a ověřením možností financování vám pomůže Monika Zelená z Horák & Vetchý (+420 731 984 866, zelena@hvreality.cz). Orientační splátku si spočítáte na stránce Financování." },
  { cat: "Postup a termíny", q: "Jaký je harmonogram?", a: "Prodej začíná v listopadu 2026, geometrický plán a zaměření pozemků je plánované na listopad 2027, kolaudace a dokončení na březen 2029 a předání pozemků na červen 2029. Stavět dům můžete po kolaudaci a předání pozemku." },
  { cat: "Ceny a financování", q: "Kolik se platí při rezervaci?", a: "Rezervační poplatek je 400 000 Kč. Doplatek kupní ceny se hradí až po kolaudaci, po podpisu kupní smlouvy. Vzory obou smluv najdete na stránce Financování." },
  { cat: "Postup a termíny", q: "Jak pošlu poptávku?", a: "Vyberte parcelu v interaktivní lokalitě a klikněte na „Mám zájem o parcelu“. Číslo parcely doplníme do formuláře za vás. Napsat nám můžete i obecně přes stránku Kontakty." },
  { cat: "Postup a termíny", q: "Kdo je developerem projektu?", a: "Developerem a prodávajícím je START Zelený Pístov s.r.o. ze skupiny START Zelený – stavební firmy z Brtnice, která se stavební výrobou zabývá od roku 2002. Prodej parcel zajišťuje Horák & Vetchý reality z Jihlavy." },
  { cat: "Vizualizace", q: "Je vizualizace domu na parcele přesná?", a: "Jde o ilustraci. Hmota domu vychází z rozměrů v katalogu a umístění ze situačního plánu, fotorealistické obrázky jsou vizualizace architektů. Úvodní film na hlavní stránce je ilustrační vizualizace vytvořená pomocí AI." },
];

export const financing = {
  reservationFee: 400000,
  terms: [
    ["Rezervační poplatek", "400 000 Kč", "do 3 pracovních dní od podpisu rezervační smlouvy"],
    ["Doplatek kupní ceny", "po kolaudaci", "po podpisu kupní smlouvy, rezervační poplatek se započítá"],
    ["Cena pozemku", "6 500 Kč/m²", "včetně DPH, podle konečné výměry zapsané v katastru"],
  ],
  docs: [
    { title: "Vzor rezervační smlouvy", href: "assets/docs/pistov-vzor-rezervacni-smlouvy.pdf", size: "PDF · 6 stran" },
    { title: "Vzor kupní smlouvy", href: "assets/docs/pistov-vzor-kupni-smlouvy.pdf", size: "PDF · 5 stran" },
  ],
  docsNote: "Vzory smluv jsou orientační – konečné znění se upraví podle zápisu pozemku do katastru a podmínek konkrétního obchodu.",
  steps: [
    { title: "Výběr parcely", text: "V interaktivní lokalitě si vyberete parcelu, pro inspiraci si na ní můžete prohlédnout typový dům, a pošlete poptávku." },
    { title: "Rezervace", text: "Podepíšete rezervační smlouvu a do 3 pracovních dní zaplatíte rezervační poplatek." },
    { title: "Financování", text: "S hypotékou a ověřením možností financování vám pomůže Monika Zelená." },
    { title: "Kupní smlouva", text: "Po kolaudaci dostanete návrh kupní smlouvy s konečnou výměrou a cenou." },
    { title: "Doplatek", text: "Doplatíte kupní cenu sníženou o rezervační poplatek – z vlastních zdrojů nebo z úvěru." },
    { title: "Předání pozemku", text: "Pozemek převezmete a můžete začít stavět dům podle svého." },
  ],
  stepsNote: "Postup podle vzorů rezervační a kupní smlouvy. Termíny jsou plánované.",
  // example values for the calculator – explicitly NOT prices of Pístov
  calculator: { example: { price: 3900000, own: 780000, rate: 4.9, years: 30 } },
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
    ["aerial", "Vizualizace budoucí zástavby, 11/2026"], ["aerial-plots", "Rozdělení lokality na 62 parcel – vizualizace s čísly parcel"], ["aerial-wide", "Lokalita v širším okolí – vizualizace, 11/2026"], ["drone-ponds", "Rybníky a pole na východ od lokality – dron, 13. 10. 2026"],
    ["drone-site-south", "Plocha budoucích parcel od jihu – dron, 13. 10. 2026"], ["drone-site-centre", "Střed lokality, stav před výstavbou – dron, 13. 10. 2026"],
    ["drone-village", "Obec a rybník na sever od lokality – dron, 13. 10. 2026"], ["drone-east", "Pohled od východu přes rybníky – dron, 13. 10. 2026"],
  ] },
  { cat: "Výkresy", items: [
    ["plan", "Situační plán lokality"], ["section-1", "Řez terénem 1"], ["section-2", "Řez terénem 2"],
    ["A-plans", "Dům A – půdorysy"], ["A-site", "Dům A – situace"], ["B-plans", "Dům B – půdorysy"], ["C-plans", "Dům C – půdorysy"], ["C2-plans", "Dům C2 – půdorysy"],
    ["D-plans", "Dům D – půdorysy"], ["D-plans-v23", "Dům D – přízemní varianty"],
  ] },
];

// Prodejce page – Horák & Vetchý. Facts and quotes from hvreality.cz (October 2026); projects listed there are
// developments they represent / sell, not necessarily projects they built – worded accordingly.
export const seller = {
  lead: "Prodej parcel v Pístově zajišťuje Horák & Vetchý reality – realitní společnost z Jihlavy. Pomůže vám s celou koupí – od výběru parcely přes financování až po podpis smluv.",
  facts: [
    ["20 let", "v manažerských pozicích v bankovnictví a realitách"],
    ["7 poboček", "Jihlava, Brno, Praha, Olomouc, Ostrava, Znojmo, Žďár n. S."],
    ["20+", "makléřů v týmu"],
  ],
  values: [
    { title: "Spolehlivost", text: "„Náš zákazník je pro nás absolutní priorita.“ Měřítkem spolehlivosti je pro ně současnost a budoucnost, ne jen minulé zkušenosti." },
    { title: "Komfort", text: "„Dokážeme změnit složitou situaci v jednoduché řešení.“ Zajistí celý proces koupě a pomohou vybrat nejvhodnější financování i pojištění." },
    { title: "Profesionalita", text: "Velká síť bonitních klientů napříč Českou republikou a dlouhodobé kontakty jim umožňují rychle reagovat na nabídku i poptávku." },
    { title: "Dostupnost", text: "„Úspěch stavíme na rychlosti, efektivitě a spokojenosti všech stran.“ Jsou k zastižení online každý den." },
  ],
  services: [
    { title: "Developerské projekty", text: "Podpora projektu od prvního plánování až po předání klíčů – výhradní zastoupení, marketing a prodejní strategie na míru." },
    { title: "Prodej a pronájem", text: "Profesionální poradenství a kompletní servis při prodeji i pronájmu nemovitostí." },
    { title: "Financování nemovitostí", text: "Poradenství k hypotékám, úvěrům a dalším možnostem financování vlastního bydlení.", href: "financovani.html" },
    { title: "Oceňování nemovitostí", text: "Ocenění vycházející z analýzy trhu." },
    { title: "Správa nemovitostí", text: "Správa bytových domů a dalších komplexů – komunikace s nájemníky, právní i technické poradenství." },
    { title: "Prezentace a reklama", text: "Profesionální fotografie, videoprezentace a cílené digitální kampaně." },
  ],
  projects: [
    { name: "Panorama Znojmo", place: "Znojmo", note: "7 etap, energetická třída A a B", url: "https://panoramaznojmo.cz", image: "hv-proj-panorama-znojmo" },
    { name: "Viladomy Dobrovodská", place: "České Budějovice", note: "32 bytů 1+kk až 3+kk", url: "https://www.viladomy-dobrovodska.cz", image: "hv-proj-viladomy" },
    { name: "Bydlení za školou", place: "Dačice", note: "5 rodinných domů a 6 bytů", url: "https://bydlenidacice.cz", image: "hv-proj-dacice" },
    { name: "Dům u Hájku", place: "Brno", note: "byty a ateliéry blízko centra", url: "https://dumuhajku.cz", image: "hv-proj-dum-u-hajku" },
    { name: "Rezidence Zahrada", place: "Hrušovany nad Jevišovkou", note: "II. etapa, energetická třída A", url: "https://rezidencezahrada.cz", image: "hv-proj-rezidence-zahrada" },
    { name: "Bytové domy Zahrádky", place: "Moravské Budějovice", note: "57 bytů 1+kk až 3+kk", url: "https://bytymbudejovice.cz" },
  ],
  branches: ["Jihlava", "Brno", "Praha", "Olomouc", "Ostrava", "Znojmo", "Žďár nad Sázavou"],
  // photos and logo from hvreality.cz (supplied by the developer's own website)
  logo: { dark: "assets/img/hv-logo-dark.png", light: "assets/img/hv-logo-light.png", alt: "Horák & Vetchý reality" },
  founders: { image: "hv-founders", caption: "Stanislav Horák a Pavel Vetchý" },
  financingImage: { image: "hv-financing", alt: "Realitní makléř analyzuje možnosti financování nemovitosti" },
  branchPhotos: [["hv-branch-jihlava", "Jihlava"], ["hv-branch-olomouc", "Olomouc"], ["hv-branch-znojmo", "Znojmo"], ["hv-branch-ostrava", "Ostrava"]],
  source: "Údaje, logo a fotografie z webu hvreality.cz, říjen 2026. Vizualizace projektů patří jejich developerům.",
};

// Developer page – START Zelený. Facts from zeleny.cz (listopad 2026) and the contract templates supplied by
// the client; reference photos from zeleny.cz/realizovane-projekty. Nothing beyond those sources is claimed.
export const builder = {
  logo: "assets/img/start-zeleny-logo.png",
  claim: "Váš partner ve stavebnictví",
  lead: "Pístov připravuje START Zelený – stavební firma z Brtnice. Lokalitu staví od základu: komunikace, inženýrské sítě i terénní úpravy.",
  facts: [
    ["od 2002", "se věnují stavební výrobě"],
    ["30+ let", "rozvíjí firma své služby"],
    ["69", "realizovaných staveb na webu zeleny.cz"],
  ],
  pistov: [
    { title: "Asfaltová komunikace", text: "Každý pozemek bude přístupný z asfaltové komunikace." },
    { title: "Přípojky", text: "Každý pozemek dostane přípojku elektřiny, vody a kanalizace." },
    { title: "Terénní úpravy", text: "Lokalitu developer připraví tak, abyste po předání mohli začít stavět." },
  ],
  focus: [
    { title: "Generální dodávky staveb", text: "Doménou firmy jsou generální dodávky staveb podle individuálních požadavků klienta." },
    { title: "Bytová a administrativní výstavba", text: "Hlavní oblastí je pozemní stavitelství – bytové domy, školy, haly i administrativní budovy." },
    { title: "Rekonstrukce památek", text: "Rekonstrukce památkově chráněných objektů, mimo jiné zámků a klášterů na Vysočině." },
    { title: "Úspory energie", text: "Snižování energetické náročnosti budov – zateplení, okna, fasády." },
    { title: "Vodohospodářské stavby", text: "Vodohospodářské projekty, rybníky a související infrastruktura." },
    { title: "Vlastní technika a betonárka", text: "Vlastní stroje s vyškolenou obsluhou, betonárka a stavebniny v Jihlavě a Brtnici." },
  ],
  projects: [
    { name: "Lokalita Z11 „U robotné louky“", note: "příprava lokality, 2025", image: "sz-z11" },
    { name: "Bytový dům „U Dubu – H“", note: "Jihlava, 2021–2023", image: "sz-dub-h" },
    { name: "Základní škola Puklice", note: "Puklice, 2024–2025", image: "sz-puklice" },
    { name: "Mateřská škola Dlouhá Brtnice", note: "Dlouhá Brtnice, 2021–2022", image: "sz-ms-brtnice" },
    { name: "Revitalizace dvorního traktu Gymnázia Jihlava", note: "Jihlava, 2023–2024", image: "sz-gymnazium" },
    { name: "Cyklostezka Hodice – Třešť – Kostelec", note: "Vysočina, 2020–2022", image: "sz-cyklostezka" },
  ],
  company: [["Developer a prodávající", "START Zelený Pístov s.r.o."], ["IČO", "038 26 546"], ["Sídlo", "Široká 376, 588 32 Brtnice"], ["Obchodní rejstřík", "Krajský soud v Brně, oddíl C, vložka 140204"]],
  web: "https://www.zeleny.cz/stavebni-vyroba",
  source: "Údaje, logo a fotografie referencí z webu zeleny.cz (listopad 2026) a ze vzorů smluv projektu Pístov.",
};

// Lokalita – piktogramy a stručné informace (zadání klienta 11/2026). Časy jsou údaje klienta; vzdálenosti
// k místům bez udaného času jsou vzdušnou čarou z OpenStreetMap. Body bez ověřeného údaje mají todo.
export const access = [
  { icon: "walk", title: "Pěšky", info: "zastávka Pístov, náves – cca 300 m", todo: false },
  { icon: "bus", title: "Autobus", info: "odjezd každou hodinu", todo: true },
  { icon: "car", title: "Autem", info: "silnice I/38, přivaděč k dálnici D1", todo: true },
  { icon: "bike", title: "Na kole", info: "cyklostezka přímo u pozemků", todo: true },
];

export const pois = {
  note: "Časy autem podle údajů prodejce, ostatní vzdálenosti vzdušnou čarou podle OpenStreetMap.",
  items: [
    { id: "skolka", name: "Mateřská škola, Telečská", cat: "Školka", icon: "kids", lat: 49.39139, lon: 15.58223, featured: true, info: "2 min autem" },
    { id: "skola", name: "ZŠ Seifertova", cat: "Škola", icon: "school", lat: 49.39376, lon: 15.58415, featured: true, info: "5 min autem" },
    { id: "centrum", name: "Centrum Jihlavy", cat: "Město", icon: "city", lat: 49.39543, lon: 15.59055, featured: true, info: "10 min autem" },
    { id: "albert", name: "Albert, U Slunce", cat: "Nákupy", icon: "shop", lat: 49.38932, lon: 15.59458, featured: true },
    { id: "aventin", name: "Obchodní centrum Aventin", cat: "Nákupy", icon: "mall", lat: 49.39362, lon: 15.552, featured: true },
  ],
};
