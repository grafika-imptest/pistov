// Generates the static subpages from one template (shared head, header, footer). usage: node build-pages.mjs
import fs from "node:fs";

import { pages } from "./site-pages.mjs";

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
  <link rel="icon" type="image/svg+xml" href="assets/brand/favicon.svg">
</head>
<body class="subpage" data-page="${p.id}">
  <a class="skip-link" href="#obsah">Přeskočit na obsah</a>
  <header class="topbar is-solid" data-topbar></header>
  <main id="obsah">
${p.noHero ? "" : `    <section class="pagehero section--paper${p.heroImage ? ` pagehero--image pagehero--${p.heroImage}` : ""}">
      <div class="wrap pagehero__grid${p.heroMap ? " pagehero__grid--map" : ""}">
        <div><nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><span>${p.h1}</span></nav>
        <p class="eyebrow">${p.eyebrow}</p><h1 class="pagehero__title">${p.h1}</h1>${p.heroMap ? `<p class="lead">${p.lead}</p>` : ""}</div>
        ${p.heroMap ? `<div class="pagehero__map" ${p.heroMap}></div>` : `<p class="lead">${p.lead}</p>`}
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
