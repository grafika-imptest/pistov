// Generates the static subpages from one template (shared head, header, footer). usage: node build-pages.mjs
import fs from "node:fs";

const pages = [
  { file: "galerie.html", id: "galerie", title: "Galerie", desc: "Vizualizace typových domů, dronové snímky lokality a výkresy architektů projektu Pístov.", eyebrow: "Pístov v obrazech", h1: "Galerie", lead: "Vizualizace domů od TAM architekti, dronové snímky dnešní lokality a výkresy. Galerii budeme doplňovat o fotografie z průběhu přípravy a výstavby.", body: `<div class="wrap"><div class="tabs" role="tablist" aria-label="Kategorie" data-gallery-tabs></div><div class="gallery" data-gallery></div></div>` },
  { file: "aktuality.html", id: "aktuality", title: "Aktuality", desc: "Novinky z projektu Pístov.", eyebrow: "Ze života projektu", h1: "Aktuality", lead: "Co je v projektu nového – od katalogu domů po dronové snímky lokality. Informace o průběhu přípravy a výstavby bude doplňovat developer.", body: `<div class="wrap"><div class="newsgrid newsgrid--page" data-news></div></div>` },
  { file: "aktualita.html", id: "aktuality", title: "Aktualita", desc: "Aktualita projektu Pístov.", body: `<article class="wrap article" data-article></article><section class="section section--tight"><div class="wrap"><h2 class="h3">Další aktuality</h2><div class="newsgrid" data-news-more></div></div></section>`, noHero: true },
  { file: "financovani.html", id: "financovani", title: "Financování", desc: "Postup při koupi pozemku se stavbou domu a orientační kalkulačka splátky.", eyebrow: "Financování", h1: "Možnosti financování", lead: "Pozemek i dům obvykle financujete hypotečním úvěrem, čerpaným postupně podle průběhu stavby. Spočítejte si orientační splátku a pošlete nám poptávku – s nastavením financování pomůžeme.", body: `<div data-financing></div>` },
  { file: "faq.html", id: "faq", title: "Časté otázky", desc: "Odpovědi na nejčastější otázky k parcelám, domům a cenám v projektu Pístov.", eyebrow: "FAQ", h1: "Časté otázky", lead: "Odpovědi na otázky k parcelám, typovým domům, cenám i vizualizacím. Nenašli jste tu svou? Napište nám.", body: `<div class="wrap faqpage"><div class="tabs" role="tablist" aria-label="Kategorie otázek" data-faq-tabs></div><div class="accordion" data-faq></div><p class="faqpage__more">Nenašli jste odpověď? <a class="link" href="kontakty.html#formular">Zeptejte se nás</a></p></div>` },
  { file: "kontakty.html", id: "kontakty", title: "Kontakty", desc: "Kontakty projektu Pístov, mapa lokality a kontaktní formulář.", eyebrow: "Kontakt", h1: "Rádi vám projekt představíme", lead: "Pošlete nám dotaz nebo poptávku konkrétní parcely a domu. Ozveme se s aktuální dostupností a dalším postupem.", body: `<div data-contacts></div>` },
  { file: "porovnani.html", id: "porovnani", title: "Porovnání", desc: "Porovnejte vybrané parcely a kombinace parcel s domy vedle sebe.", eyebrow: "Nástroje", h1: "Porovnání", lead: "Postavte vybrané parcely a kombinace s domy vedle sebe. Pořadí karet změníte přetažením.", body: `<div class="wrap" data-compare></div>` },
  { file: "oblibene.html", id: "oblibene", title: "Oblíbené", desc: "Uložené parcely, domy a kombinace.", eyebrow: "Nástroje", h1: "Oblíbené", lead: "Parcely, domy a kombinace, které jste si uložili. Zůstávají jen ve vašem prohlížeči.", body: `<div class="wrap" data-favourites></div>` },
  { file: "ochrana-osobnich-udaju.html", id: "legal", title: "Ochrana osobních údajů", desc: "Zásady zpracování osobních údajů a cookies.", eyebrow: "Právní informace", h1: "Ochrana osobních údajů", lead: "Jak nakládáme s osobními údaji a cookies.", body: `<div class="wrap legal" data-legal></div>` },
];

const tpl = (p) => `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${p.title} — Pístov</title>
  <meta name="description" content="${p.desc}">
  <meta name="theme-color" content="#f4efe3">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="css/pages.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2323231f'/%3E%3Cpath d='M9 23V9h7a4.5 4.5 0 0 1 0 9H9' fill='none' stroke='%23f4efe3' stroke-width='2.4'/%3E%3C/svg%3E">
</head>
<body class="subpage" data-page="${p.id}">
  <a class="skip-link" href="#obsah">Přeskočit na obsah</a>
  <header class="topbar is-solid" data-topbar></header>
  <main id="obsah">
${p.noHero ? "" : `    <section class="pagehero section--paper">
      <div class="wrap pagehero__grid">
        <div><nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><span>${p.h1}</span></nav>
        <p class="eyebrow">${p.eyebrow}</p><h1 class="pagehero__title">${p.h1}</h1></div>
        <p class="lead">${p.lead}</p>
      </div>
    </section>
`}    <section class="section pagebody">
      ${p.body}
    </section>
  </main>
  <footer data-site-footer></footer>
  <script type="module" src="js/pages/${p.file.replace(".html", "")}.js"></script>
</body>
</html>
`;
for (const p of pages) fs.writeFileSync(`../${p.file}`, tpl(p));
console.log(pages.length, "pages");
