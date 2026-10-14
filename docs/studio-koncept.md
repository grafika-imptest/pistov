# Pístov · verze Studio – koncept a specifikace

Druhá verze celého webu vedle verze **Ateliér** (výtvarná, podle ručně kresleného katalogu TAM architekti).
**Studio** nerespektuje grafiku katalogu. Je současná, maximálně přehledná a vede k výběru parcely.
Obě verze sdílejí data, logiku i funkce. Přepínač „Vzhled webu“ je v hlavičce, v menu a v patičce a vždy otevře
stejnou stránku ve druhé verzi, včetně rozpracované konfigurace (parcela, dům, dispozice, materiál).

Adresy: `/` (Ateliér) · `/studio/` (Studio).

---

## 1. UX audit původního webu (Ateliér)

| Zjištění | Dopad | Řešení ve Studiu |
|---|---|---|
| Úvod je 10s film a mapa přes celou obrazovku. Nabídka je hned pod ním, ale bez přehledu čísel. | Návštěvník neví, kolik parcel je volných a v jakém rozsahu. | Hero s živými čísly z dat: volné parcely, rozsah výměr, typy, panoramata. |
| Silná výtvarná řeč (papír, skica, Caveat) je pro část publika „hravá“ a hůř se čte na mobilu. | Riziko nízké důvěry u racionálně rozhodujících kupců. | Střídmý grotesk, technické mono popisky, jedna akcentní barva. |
| Konfigurátor je hned v úvodu. Vysvětlení konceptu (parcela + dům) přichází až po něm. | Uživatel klikne na mapu dřív, než pochopí, co si vybírá. | Vyprávění: projekt → architektura → typy → nabídka → lokalita → důvody → developer. |
| Typové domy jsou v kartách na homepage, bez samostatné stránky. | Chybí stránka s detailem domu (dispozice, výkresy, vhodné parcely), kterou jde poslat. | Samostatná stránka `domy.html` s kotvami A–D, galerií, výkresy, dispozicemi a CTA. |
| Lokalita je jen panorama. Mapa je až v Kontaktech. | Kupec nevidí, kde lokalita leží. | Mapa s obrysy parcel přímo v kapitole Lokalita a fakta jen z plánu. |
| Dlouhá homepage bez jasného „co dál“ v každém bodě. | Ztráta konverze. | Každá kapitola končí jedním CTA. Hlavička má trvale „Vybrat parcelu“. |

## 2. Kreativní směr

**„Architektonický list“.** Bílý papír se mění v kostní tón, tužka v grafit a červený inkoust architekta v barvu pálené tašky
z vizualizací. Architektura je hlavní postava: velké vizualizace přes celou šířku, asymetrické kompozice a tichý,
přesný interface. Technické údaje (výměry, plochy, stav) jsou psané monospace písmem jako kóty ve výkresu. Projekt není
luxusní rezidence, proto žádné zlato ani patos. Má působit sebevědomě, konkrétně a vlídně.

## 3. Informační architektura

```
Studio
├─ Projekt (studio/)            příběh: hero → projekt → architektura → typy → nabídka → lokalita → proč → developer → financování+FAQ → aktuality → kontakt
├─ Nabídka (nabidka.html)       interaktivní mapa parcel, filtry, seznam, detail parcely, Můj návrh (dům na parcele), panorama 360°, poptávka s předvyplněním
├─ Domy (domy.html#dum-a…d)     typ → galerie + výkresy → parametry → dispozice → CTA „Vybrat parcelu pro dům X“ (otevře nabídku s filtrem)
├─ Lokalita (studio/#lokalita)
├─ Financování · Galerie · Aktuality · FAQ · Developer · Kontakt
└─ Nástroje: Oblíbené · Porovnání (počty v hlavičce)
```
Parcela, dům a kombinace se vždy otevírají v nabídce s vybraným stavem v URL. Odkaz jde poslat i uložit.

## 4. Sekce homepage

| # | Účel | Kompozice | Obsah / assety | Interakce a pohyb | CTA | Mobil |
|---|---|---|---|---|---|---|
| Hero | První dojem a cesta k nabídce | Video přes celou plochu, titulek vlevo dole, statistiky v liště | Úvodní film (AI, označeno), poster | Film jednou, pak zůstane na posledním snímku. Titulek vyjíždí po slovech | Prohlédnout nabídku · Typové domy | Statistiky 2×2, výřez videa posunutý doprava |
| 01 Projekt | Vysvětlit koncept | 12sloupcová mřížka: titulek 8/12, text 5/12, plán 6/12 | Situační plán (světlá verze bez černých ploch) | Odhalení obrazu zdola | – | Jeden sloupec |
| 02 Architektura | Emoce | Smyčka přes celou šířku + asymetrická mřížka tří vizualizací | Higgsfield smyčka domu A (AI, označeno), vizualizace TAM | Mírný parallax, odhalení obrazu | Galerie | Bez parallaxu při omezeném pohybu |
| 03 Typy domů | Rychlé srovnání A–D | Seznam vlevo, obraz se drží na místě a mění se vpravo | Data z katalogu (plocha, dispozice, střecha, vhodné parcely*) | Aktivní typ podle středu obrazovky | Detail domu · Parcely pro dům | Obraz v každé položce |
| 04 Nabídka | Ukázka výběru | Tmavá sekce, text 4/12, mapa 8/12 | SVG parcel nad leteckou vizualizací | Najetí ukáže výměru, stav a domy. Klik otevře nabídku. Mapa jde ovládat klávesnicí | Otevřít nabídku · Panorama | Mapa nad textem |
| 05 Lokalita | Kde to je | Dronová fotka, fakta + mapa | Dron 13. 10. 2026, OSM + obrysy parcel | Parallax fotky, mapa se načte až při zobrazení | Panorama | Mapa pod fakty |
| 06 Proč Pístov | Čtyři konkrétní výhody | 4 sloupce | Jen ověřitelné body | Postupné objevení | Spočítat splátku | 2 → 1 sloupec |
| 07 Developer | Důvěra | Foto zakladatelů + text | hvreality.cz (logo, foto) | – | O developerovi | Pod sebou |
| 08 Financování + FAQ | Odpovědi | Karta + harmonika | Ilustrace, FAQ z obsahu | Rozbalení odpovědi | Splátka · Všechny otázky | Pod sebou |
| 09 Aktuality | Život projektu | 3 karty | Aktuality | Zoom obrazu po najetí | Všechny aktuality | 1 sloupec |
| 10 Kontakt | Další krok | Velký titulek, tlačítka, telefon a e-mail | Kontakt developera | – | Nabídka · Poptávka | Pod sebou |

## 5. Pohyb

| Prvek | Spouštěč | Trvání | Easing | Omezený pohyb |
|---|---|---|---|---|
| Titulky po slovech | 15 % ve výřezu | 1000 ms, +40 ms na slovo | `cubic-bezier(.16,1,.3,1)` | Text hned viditelný |
| Odhalení obrazu (clip-path) + zmenšení 1,12 → 1 | 15 % ve výřezu | 1200 / 1600 ms | expo-out | Bez efektu |
| Najetí bloků (opacity + 28 px) | 15 % ve výřezu | 900 ms | expo-out | Bez efektu |
| Parallax médií (±6 %) | Scroll, jen ve výřezu | – | lineární | Vypnutý |
| Počítání čísel | 60 % ve výřezu | 1100 ms | ease-out cubic | Hodnota hned |
| Hlavička: schová se při scrollu dolů, vrátí nahoru | Scroll > 160 px | 450 ms | expo-out | Stejné (nejde o animaci obsahu) |
| Smyčky videa | Hraje jen ve výřezu, zdroj se načte líně | – | – | Jen poster |

Žádné přebírání scrollu (scroll-jacking), vlastní kurzor ani WebGL navíc. Panorama 360° zůstává jen v nabídce.

## 6. Typografie

| Role | Písmo | Velikost | Řez / řádkování / prostrkání |
|---|---|---|---|
| Hero | Schibsted Grotesk | clamp(3rem, 1.2rem + 6.6vw, 8.5rem) | 500 / 0.92 / −0.05em |
| H1 podstránky | Schibsted Grotesk | clamp(2.6rem, 1.2rem + 4.4vw, 6.2rem) | 500 / 0.92 / −0.055em |
| H2 | Schibsted Grotesk | clamp(2.1rem, 1.2rem + 3.4vw, 4.75rem) | 500 / 1.0 / −0.04em |
| H3 | Schibsted Grotesk | clamp(1.25rem, 1.05rem + .6vw, 1.6rem) | 500 / 1.2 / −0.02em |
| Perex | Inter | clamp(1.06rem, .98rem + .35vw, 1.3rem) | 400 / 1.55 |
| Text | Inter | 1rem | 400 / 1.6 |
| Popisky a data | IBM Plex Mono | 0.6875–0.75rem | 500, verzálky, +0.06–0.08em |

Česká typografie: jednopísmenné předložky a spojky se automaticky váží k dalšímu slovu.

## 7. Barvy

| Token | Hodnota | Použití |
|---|---|---|
| `--s-bg` / `-2` / `-3` | #f3f2ee / #e9e7e1 / #dcd9d1 | pozadí, střídání sekcí, plochy obrázků |
| `--s-ink` / `-2` / `--s-mute` | #0d0e0d / #2b2d2a / #6b6e69 | text, sekundární text, popisky |
| `--s-dark` / `-2` | #0f1110 / #1a1c1a | tmavé sekce (nabídka, developer, kontakt, patička) |
| `--s-accent` / `-ink` | #b94a28 / #9a3c1f | jediný akcent: CTA, aktivní stav, výběr (barva pálené tašky z vizualizací) |
| Stav parcel | #3b7d50 · #c48b2c · #4b4d48 | volná · rezervovaná · prodaná |
| Linky | rgba(13,14,13,.12 / .26) | oddělovače, rámečky |

Kontrast (WCAG): text #0d0e0d na #f3f2ee 17,3 : 1 · bílý text na akcentu #b94a28 5,2 : 1 · akcent jako text na #f3f2ee 4,6 : 1 · sekundární text #6b6e69 na #f3f2ee 4,6 : 1 – vše AA.

## 8. Komponenty

Hlavička (průhledná nad hero, rozmazaný podklad po scrollu, schová se při scrollu dolů) · přepínač verzí ·
tlačítka `s-btn` (accent, dark, glass, line, line-light, sm, lg) · popisek `s-label` s akcentní čárkou · tabulka
parametrů `s-specs` · mapa parcel `s-plotmap` + tooltip · karta typu `s-type` · galerie domu s náhledy a lightboxem ·
dispozice `details` · sticky podnavigace A–D · srdíčko / porovnání (sdílené) · harmonika FAQ (sdílená) ·
konfigurátor (sdílený, přestylovaný tokeny) · patička (sdílená).

## 9. Tokeny

Rozestupy: okraj `clamp(20px, 4vw, 64px)`, mezera sloupců `clamp(16px, 2vw, 32px)`, sekce `clamp(88px, 11vw, 184px)`.
Rádiusy: obrázky a plochy 0, formuláře a panely 2 px, tlačítka a čipy 999 px. Stíny jen u plovoucích prvků (panel,
tooltip). Pohyb: `--s-ease: cubic-bezier(.16,1,.3,1)`, `--s-dur: 900ms`.

## 10. Implementace

- Žádný framework ani build. Stejný stack jako Ateliér: statické HTML, ES moduly, `tools/*.mjs`.
- `tools/build-studio.mjs` generuje `/studio/*.html`. Nabídka přebírá blok konfigurátoru přímo z `index.html`,
  takže obě verze vždy běží na stejné aplikaci (`js/main.js`).
- `<base href="../">` ve Studiu, `js/site/edition.js` převádí odkazy mezi verzemi.
- `css/studio.css` nejdřív přemapuje sdílené tokeny (všechny sdílené komponenty se přizpůsobí) a pak přidá vlastní
  layout. Ateliérové CSS zůstává netknuté.
- Pohyb je vlastní, lehký (IntersectionObserver + CSS, `js/studio/motion.js`) a nezávisí na GSAP ani Lenis.
- Higgsfield: smyčka „Dům A“ (Kling 3.0 Pro, image-to-video, první = poslední snímek). Na webu je označená jako AI ilustrace.

## 11. Sebekritika

**Porota Awwwards.** Silný první dojem, výrazná typografie, rytmus světlých a tmavých sekcí. Slabina: chybí jeden „wow“
moment vlastní jen tomuto projektu. Kandidát: přechod z plánu do vizualizace na jedné ose scrollu (plán se pod parcelami
promění v leteckou vizualizaci). Nechali jsme ho záměrně na později, aby web zůstal rychlý.

**Realitní marketing.** Cesta k nabídce je viditelná v každém bodě, čísla jsou z dat a mapa parcel na homepage
vybízí ke kliknutí. Slabina: chybí ceny, jméno makléře a skutečné odeslání poptávky. Bez nich je konverze jen
poloviční. Musí je doplnit developer.

**Kupec.** Rychle pochopí, co si vybírá, uvidí dům na parcele i dnešní stav. Slabina: vybavenost a doprava v lokalitě nejsou
v podkladech (web to přiznává). Přiřazení domů k parcelám je ukázkové (označeno hvězdičkou).

**Co dál.** (1) ceny a stavy z tabulky developera, (2) napojení poptávek na e-mail / CRM, (3) fakta o lokalitě,
(4) případně druhá smyčka (dům D) a strukturovaná data (schema.org `Residence` / `Offer`) po zveřejnění cen.
