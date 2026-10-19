// Generates the studio edition (/studio/*.html). Same content and scripts as the ateliér pages, its own look
// (css/studio.css) and three own pages: home (tools/studio/home.html), offer (the explorer app taken from
// index.html, so both editions always run the same configurator) and house types. usage: node build-studio.mjs
import fs from "node:fs";
import { pages } from "./site-pages.mjs";

const index = fs.readFileSync("../atelier.html", "utf8");
const cut = (from, to) => { const a = index.indexOf(from), b = index.indexOf(to, a + from.length); if (a < 0 || b < 0) throw new Error(`index.html: ${from}`); return index.slice(a, b); };
const defs = cut("<!-- shared SVG defs", "\n\n  <header");
const explorer = cut("<!-- ===================== EXPLORER", "    <!-- ===================== PROJECT");
const enquiry = cut("<!-- ===================== ENQUIRY", "  </main>").replace(/<p class="eyebrow">\d+ — Poptávka<\/p>/, '<p class="eyebrow">Poptávka</p>');
const dialog = cut('<dialog class="detail"', "</dialog>") + "</dialog>";

const head = (p) => `<!doctype html>
<html lang="cs" data-edition="studio">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <base href="../">
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}">
  <meta name="theme-color" content="#0d0e0d">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
${p.preload || ""}  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="css/pages.css">
  <link rel="stylesheet" href="css/studio.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230d0e0d'/%3E%3Cpath d='M9 23V9h7a4.5 4.5 0 0 1 0 9H9' fill='none' stroke='%23b94a28' stroke-width='2.6'/%3E%3C/svg%3E">
</head>`;

const page = (p) => `${head(p)}
<body class="${p.bodyClass || "subpage"} studio" data-page="${p.id}">
  <a class="skip-link" href="#obsah">Přeskočit na obsah</a>
${p.defs ? `  ${defs}\n` : ""}  <header class="topbar" data-topbar></header>
  <main id="obsah">
${p.main}
  </main>
  <footer data-site-footer></footer>
${p.after || ""}  <script type="module" src="${p.script}"></script>
</body>
</html>
`;

const out = [];
const write = (file, html) => { fs.writeFileSync(`../studio/${file}`, html); out.push(file); };
fs.mkdirSync("../studio", { recursive: true });

// ---- subpages: identical containers, studio page hero
for (const p of pages) {
  const hero = p.noHero ? "" : `    <section class="pagehero">
      <div class="wrap pagehero__grid">
        <div><nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><span>${p.h1}</span></nav>
        <p class="eyebrow">${p.eyebrow}</p><h1 class="pagehero__title">${p.h1}</h1></div>
        <p class="lead">${p.lead}</p>
      </div>
${p.heroImage ? `      <div class="pagehero__media pagehero__media--${p.heroImage}" aria-hidden="true"></div>\n` : ""}    </section>
`;
  write(p.file, page({ ...p, title: `${p.title} — Pístov`, script: `js/pages/${p.file.replace(".html", "")}.js`,
    main: `${hero}    <section class="section pagebody">
      ${p.body}
    </section>` }));
}

// ---- home
write("index.html", page({
  id: "home", title: "Pístov — parcely a rodinné domy u Jihlavy", bodyClass: "s-homepage",
  desc: "72 parcel pro rodinné domy v Pístově u Jihlavy a čtyři typové domy od TAM architekti. Vyberte si parcelu a podívejte se, jaký dům na ní může stát.",
  preload: `  <link rel="preload" as="image" href="assets/video/intro-poster.webp" fetchpriority="high">\n`,
  main: fs.readFileSync("studio/home.html", "utf8"), script: "js/studio/home.js",
}));

// ---- offer: the explorer app of the home page, enquiry and house detail dialog
write("nabidka.html", page({
  id: "nabidka", title: "Nabídka parcel — Pístov", bodyClass: "s-app", defs: true,
  desc: "Interaktivní mapa 72 parcel v Pístově: výměry, stav, typové domy, které lze na parcelu postavit, a vizualizace domu přímo na parcele.",
  main: `    <h1 class="sr-only">Nabídka parcel a domů</h1>\n${explorer}${enquiry}`, after: `  ${dialog}\n`, script: "js/main.js",
}));

// ---- house types
write("domy.html", page({
  id: "domy", title: "Typové domy A–D — Pístov",
  desc: "Čtyři typové domy od TAM architekti: dispozice, obestavěné plochy, materiálová řešení a parcely, na které je lze postavit.",
  main: `    <section class="pagehero">
      <div class="wrap pagehero__grid">
        <div><nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><span>Typové domy</span></nav>
        <p class="eyebrow">Typové domy · TAM architekti</p><h1 class="pagehero__title">Čtyři domy, jedna architektonická řeč</h1></div>
        <p class="lead">Dům A až D s dispozičními a materiálovými variantami. U každého uvidíte obestavěnou plochu, půdorysy a parcely, na které ho lze postavit.</p>
      </div>
    </section>
    <div data-s-houses></div>`,
  script: "js/studio/domy.js",
}));

console.log(out.length, "studio pages:", out.join(", "));
