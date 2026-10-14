# Pístov — interaktivní prezentace pozemků a rodinných domů

Funkční prototyp: letecká vizualizace lokality s klikatelnými parcelami,
provázání parcel s typovými domy A–D, výběr dispozice a materiálu, „stavba“ domu přímo na vybrané parcele,
detail domu a předvyplněná poptávka.

```
Úvod (výkres → vizualizace) → lokalita → parcela → typový dům → dispozice / materiál
→ PARCELA + DŮM (timelapse) → detail domu → poptávka
```

## Spuštění

Bez buildu, bez závislostí v prohlížeči (čisté ES moduly). Potřeba je jen Node ≥ 20.

```bash
npm run dev        # http://localhost:5291
npm test           # testy dat a logiky (node --test)
```

Statický web — složku lze nasadit 1 : 1 na GitHub Pages / jakýkoli hosting (kromě `podklady/` a `tools/node_modules`).

Užitečné URL parametry: `?parcela=12&dum=A&dispozice=A1&material=A-m2&rezim=navrh&stav=dum` (sdílitelná konfigurace),
`?pohled=plan`, `?detail=B`, `?demo=stavy` (ukázka prodaných parcel, s viditelným štítkem), `?fixture=timelapse`
(technický test přehrávače sekvence snímků).

## Struktura

```
index.html                     sémantická kostra hlavní stránky
*.html (galerie, aktuality, …) podstránky – generuje tools/build-pages.mjs ze společné šablony
css/tokens.css                 design tokeny (barvy z katalogu, typografie, motion, z-index)
css/app.css                    komponenty hlavní stránky
css/pages.css                  hlavička, menu, patička, cookies, podstránky, upoutávky na HP
js/core/                       obecný engine – znovupoužitelný pro další developery
  store.js                     jediný stav výběru + synchronizace s URL a historií
  viewer.js                    pan/zoom nad obrázkem; parcely sdílí souřadnice obrázku → vždy sedí
  plotLayer.js                 SVG vrstva parcel (stavy, hover, fokus, výběr)
  compat.js                    pravidla parcela ↔ typ domu
  pricing.js                   souhrn cen (nikdy nevymýšlí chybějící hodnoty)
  timelapse.js                 PARCELA ↔ PARCELA + DŮM, přehrávače video / sekvence / schéma
  schematic.js                 výkres parcely + 2.5D hmota domu z rozměrů katalogu
js/projects/pistov/            vše specifické pro Pístov (data)
  plots.generated.js           parcely – generováno z plánu (tools/build-data.mjs)
  houseTypes.js                typy A–D, dispozice, fakta z katalogu
  houseVariants.js             materiálové varianty + sloty pro animace výstavby
  plotHouseCompatibility.js    pravidla přiřazení (UKÁZKOVÁ)
  statusOverrides.demo.js      ukázkové stavy jen pro ?demo=stavy
  project.js                   konfigurace projektu (pohledy, texty cen, zdroje)
  content.js                   aktuality, časté otázky, financování, galerie, kontakty (jen ověřená fakta)
js/site/                       společné pro všechny stránky: chrome (hlavička, menu, patička, cookies),
                               collections (oblíbené + porovnání v localStorage), items, teasers, ui
js/pages/                      skript každé podstránky
js/ui/                         komponenty rozhraní (explorer, hero, panel, stage, catalog, detail, enquiry)
tools/                         pipeline: extrakce z PDF, trasování parcel, homografie, optimalizace obrázků
tests/                         node testy + testovací fixture
podklady/                      zdrojové PDF a mezivýstupy (nenasazovat)
```

Nový projekt = nová složka `js/projects/<nazev>/` se stejnou strukturou a import v `js/main.js`.

## Dvě verze webu: Ateliér a Studio

| | Ateliér (`/`) | Studio (`/studio/`) |
|---|---|---|
| Výraz | výtvarná verze podle ručně kresleného katalogu TAM architekti (papír, skica, ruční poznámky) | současná verze zaměřená na přehlednost a rychlý výběr parcely |
| Homepage | konfigurátor hned v úvodu, úvodní film, ruční poznámky na mapě | vyprávění v 10 kapitolách, mapa parcel s náhledem, smyčka domu A (Higgsfield) |
| Nabídka | na homepage (`#explorer`) | `studio/nabidka.html` – **stejná aplikace** (`js/main.js`), blok se přebírá z `index.html` |
| Typové domy | karty na homepage | `studio/domy.html#dum-a…d` |

- Data, logika, oblíbené, porovnání i poptávka jsou společné. Přepínač „Verze …“ v hlavičce, v menu a v patičce otevře
  stejnou stránku ve druhé verzi včetně konfigurace v URL (`js/site/edition.js`).
- Studio stránky mají `<base href="../">`; odkazy se píšou v „ateliérových“ cestách a převádí je `edition.js`.
- Po změně `index.html` (konfigurátor) nebo `tools/studio/home.html` / `tools/site-pages.mjs`: `cd tools && node build-pages.mjs && node build-studio.mjs`.
- Ateliér má plynulé scrollování **Lenis 1.1.18** (`assets/vendor/lenis`, `js/site/smooth.js`, nastavení jako IKO Plzeň): jen desktop, ne při omezeném pohybu; vnořené scrollery a Ctrl+kolečko na mapě zůstávají nativní.
- Styl Studia: `css/studio.css` (přemapované tokeny + vlastní layout), pohyb `js/studio/motion.js`.
- Koncept, UX audit, specifikace a sebekritika: [docs/studio-koncept.md](docs/studio-koncept.md).

## Podstránky

| Stránka | Obsah |
|---|---|
| `galerie.html` | vizualizace, dron, výkresy; filtr kategorií (`?kategorie=`), prohlížeč s šipkami / klávesnicí / swipem |
| `aktuality.html`, `aktualita.html?id=` | novinky z `content.js` |
| `financovani.html` | obecný postup koupě + orientační anuitní kalkulačka (předvyplněné hodnoty jsou jen příklad) |
| `faq.html` | časté otázky s kategoriemi |
| `developer.html` | developer Horák & Vetchý s.r.o. – fakta, hodnoty, služby a projekty v jejich nabídce podle hvreality.cz (10/2026) |
| `kontakty.html` | developer, architekti, prodej (doplní developer), mapa OpenStreetMap, formulář (ukázkový) |
| `oblibene.html`, `porovnani.html` | uložené parcely / domy / kombinace; porovnání až 4 položek, pořadí přetažením |
| `ochrana-osobnich-udaju.html` | struktura zásad + cookies; finální text doplní správce |

Srdíčko a porovnání jsou u parcely, typového domu (panel i katalog) a kombinace v režimu Můj návrh.
Cookie lišta jen ukládá volbu – web zatím nespouští žádné analytické ani marketingové skripty.
Po změně šablony podstránek: `cd tools && node build-pages.mjs`.

## Odkud pochází data

| Údaj | Zdroj | Spolehlivost |
|---|---|---|
| Čísla parcel 1–73 (bez 59), výměry | situační plán, katalog str. 3 | přepsáno z plánu, ověřeno testem proti trasované ploše |
| Stav volná / rezervovaná | šrafování + legenda plánu (duben 2026) | rezervované 64–72, ostatní k prodeji |
| Hranice parcel v plánu | automatické trasování rastru plánu (`tools/trace-plots.mjs`) | 54 parcel přesně; 27/28, 34/35, 41/42, 47/48, 71/72 rozděleny podle poměru výměr (spojnice v rastru chybí) a 73 ručně – v UI označeno jako orientační |
| Rezervovaný blok 64–70 | obrys bloku ručně z plánu | jednotlivé hranice uvnitř bloku nejsou čitelné → parcely jen jako body |
| Hranice v letecké vizualizaci | promítnutí plánu homografií spárovanou na 36 domů (průměrná odchylka ≈ 15 px z 3 419 px) | orientační, popisek pohledu to uvádí |
| Umístění domu na parcele | footprint domu, který architekt zakreslil do plánu (osa + těžiště) | schéma |
| Typy A–D, obestavěné plochy, dispozice, texty | katalog str. 7–34 | doslova dle katalogu; chybějící hodnoty = `null` |
| Materiálové varianty | vizualizace v katalogu | názvy popisují, co je na renderu vidět |
| Obrázky, půdorysy, řezy | extrahováno z PDF (`tools/extract.mjs`, `build-assets.mjs`) | originální podklady TAM architekti |

**Ceny** nejsou v podkladech → všude „Cena na vyžádání“ / „bude doplněna“, souhrn je výslovně neúplný.
**Pravidla přiřazení domů** jsou ukázková (A od 560 m², D od 540 m²) a v UI tak označená.
**Poptávkový formulář** nemá backend — validuje a zobrazí ukázkové potvrzení, výslovně uvádí, že nic nebylo odesláno.

## Animace výstavby — jak napojit

Každá materiálová varianta má v `houseVariants.js` slot `timelapse`. Stačí doplnit:

```js
timelapse: { kind: "video", src: "assets/timelapse/A-m1.mp4", srcWebm: "assets/timelapse/A-m1.webm",
             poster: "assets/timelapse/A-m1-empty.webp" }
// nebo sekvence snímků:
timelapse: { kind: "frames", fps: 24, frames: ["assets/timelapse/A-m1/0001.webp", …], poster: "…/0001.webp" }
```

Očekávání: první snímek = prázdná parcela (slouží i jako stav POUZE PARCELA), poslední = hotový dům ze stejné kamery,
bez smyčky, ideálně 3–5 s, 1600 px na šířku, H.264 MP4 (+ WebM). Přehrávač: start vždy od 0 při každém zapnutí
PARCELA + DŮM, drží poslední snímek, ruší rozběhnuté přehrávání při změně výběru, přednačítá ve stavu POUZE PARCELA,
při `prefers-reduced-motion` ukáže rovnou konečný stav, při chybě souboru spadne na statickou vizualizaci.
Dokud animace nejsou, použije se schematická stavba (obrys → hmota z rozměrů katalogu → render architektů);
vizualizace jiného domu se nikdy nepoužije.

Ověřeno v prohlížeči (schéma i sekvence snímků přes `?fixture=timelapse`): 1) parcela se otevře bez domu,
2) přepnutí spustí stavbu správného domu, 3) poslední stav zůstává, 4) návrat na prázdnou parcelu,
5) opětovné zapnutí přehraje vše od začátku, 6) jiný dům / dispozice / materiál = nová animace,
7) rychlé přepínání neskončí na zastaralém snímku.

## Úvodní film

Úvod webu přehrává 20s film (`assets/video/intro-1080.mp4`, mobil `intro-720.mp4`, poster `intro-poster.webp`):
dron nad připravenými parcelami → domy vyrostou → průlet k domu a skrz dům → návrat do výchozího záběru.
Poslední snímek filmu je letecká vizualizace oříznutá na `introVideo.endBox`, takže interaktivní scéna pod ním převezme
obraz bez skoku. Přeskočení, `prefers-reduced-motion` a vracející se návštěvníci film přeskočí; když prohlížeč video
nepřehraje, spustí se původní úvod (výkres položený do terénu).

- **Původ:** AI ilustrace (Higgsfield, Kling 3.0 Pro, 2× 10 s s první a poslední klapkou) z letecké vizualizace TAM architekti;
  snímek „před výstavbou“ je AI úprava téže vizualizace. Na webu je to tak i popsané.
- **Omezení:** dům a interiér v průletu jsou interpretace modelu, ne konkrétní typ z katalogu (interiér není součástí podkladů).
  Pro finální web doporučeno nahradit renderem z 3D modelu (stejný slot `introVideo`).
- Zdrojové klipy a snímky: `podklady/video/` (mimo repozitář).

## Panorama 360° — dnešní stav lokality

Šest dronových 360° panoramat (DJI, equirektangulární 14400×7200, 13. 10. 2026) z pěti míst: střed lokality ve 30 a 60 m,
východ za rybníky, jih v polích, západ a sever nad obcí. Na webu ve třech velikostech (`assets/pano/*-{1024,4096,8192}.webp`,
mobil dostává 4096 px), generuje `tools/build-pano.mjs`.

- **Kde v aplikaci:** pohled „Panorama 360° · dnes“ v menu oka (A), kroužky „360°“ v mapě na místech pořízení (B),
  „Výhled na parcelu dnes“ v detailu parcely – vybere stanoviště s nejlepším šikmým pohledem a natočí se na parcelu (C),
  ukázka s pomalou rotací v sekci Lokalita (D).
- **Parcely v panoramatu:** situační plán je zaměřený podle rybníků z OpenStreetMap (`tools/georef.mjs`, odchylka 2–4 m,
  plán je proti severu pootočený o ≈ 7°). Hranice parcel se z plánu přepočítají na metry a promítnou z polohy dronu
  (GPS + výška nad místem vzletu). Terén se bere jako rovina, proto je překryv orientační – v UI tak označený.
- **Natočení snímků** (sever ve sloupci obrazu) DJI neukládá; každé stanoviště je zkalibrované vizuálně proti obrysům
  rybníků a ploše parcel (`tools/pano-calib-sheet.mjs`, `tools/pano-calib-plots.mjs`, přesnost ≈ ±2°). Doladění
  přímo v prohlížeči: lokální server + `?pohled=pano&kalibrace=1`, klávesy `[` a `]` (±0,5°), výsledek v konzoli
  `__pistov.calibration()`.
- **Nebe:** pohled vzhůru je omezený (zenit dronových panoramat je rozmazaná výplň). Dodaná verze s upravenými mraky
  není použita – úprava není sférická a při pohledu nahoru vytváří vír.
- **Po dostavbě:** přepínač je připravený. Až budou panoramata s vizualizací zástavby (stejné stanoviště, stejná projekce
  a natočení), stačí v `tools/build-pano.mjs` doplnit `future` se stejnou strukturou jako `sources`.

Mapová data © přispěvatelé OpenStreetMap (ODbL) – použita jen ke kalibraci, na webu se nezobrazují.

## Ověřeno

- `npm test` – 27 testů (vč. podstránek, odkazů, obsahu, oblíbených/porovnání) (data parcel vs. plán, stavy, plochy domů, existence všech assetů, pravidla, ceny, validace, panoramata a zaměření).
- Prohlížeč 1440×900 a 375×812: úvod + přeskočení, výběr parcely myší / dotykem / klávesnicí (Tab, Enter, Esc),
  popup, filtry, pohledy (letecký, plán, řezy, nedostupné pohledy zašedlé), zoom/reset/kompas/nápověda/celá obrazovka,
  režimy Pozemky / Typové domy / Můj návrh, timelapse, detail domu (záložky půdorysy/situace/pohledy), Zpět v prohlížeči
  (výběr se neztrácí), poptávka a validace, panorama 360° (stanoviště z mapy, výhled na parcelu, lišta stanovišť,
  Zpět v prohlížeči, mobil, ukázka v sekci Lokalita). Konzole bez chyb.

## Podklady, které ještě chybí

1. Potvrzený seznam parcel a jejich aktuální stavy (katalog je z dubna 2026); jak se budou stavy aktualizovat (CMS, tabulka, API?).
2. Ceny pozemků a orientační ceny domů + kdo je spravuje a právní disclaimer.
3. Tabulka povolených typů domů pro každou parcelu.
4. Hranice jednotlivých parcel v rezervovaném bloku 64–70 a vektorový (DWG/DXF) situační plán – nahradí trasování z rastru.
5. Animace výstavby a/nebo stavy 1–4 pro každý typ × variantu; případně 3D modely.
6. Panoramata s vizualizací zástavby („po dostavbě“) ze stejných stanovišť; případně výškový model terénu pro přesnější překryv parcel.
7. Obestavěná plocha přízemních variant D2/D3, dispozice domů C a D (katalog je neuvádí), vizualizace podvariant A2, B2, C2, D2, D3.
8. Kontaktní osoba pro prodej, zpracovatel poptávek (e-mail / CRM), text zásad ochrany osobních údajů, případné měřicí nástroje pro cookies.
10. Podmínky prodeje, rezervace a partneři financování; další aktuality a fotografie z průběhu výstavby.
9. Ověřené informace o lokalitě (doprava, vybavenost, sítě, termíny) – záměrně nejsou uvedeny.
