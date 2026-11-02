import { renderChrome } from "../site/chrome.js";
import { builder as B } from "../projects/pistov/content.js";
import { esc, img, srcset } from "../site/ui.js";

renderChrome({ page: "developer", solid: true });
const pic = (name, alt, sizes) => `<img src="${img(name, "m")}" srcset="${srcset(name)}" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

// the developer's logo leads the page hero
document.querySelector(".pagehero .eyebrow")?.insertAdjacentHTML("beforebegin", `<img class="pagehero__logo pagehero__logo--wide" src="${B.logo}" alt="START Zelený" width="1011" height="216">`);

document.querySelector("[data-builder]").innerHTML = `
  <div class="wrap">
    <ul class="devfacts">${B.facts.map(([big, small]) => `<li><b>${esc(big)}</b><span>${esc(small)}</span></li>`).join("")}</ul>
  </div>

  <section class="section section--tight" aria-labelledby="sz-pistov">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">V Pístově</p><h2 class="h2" id="sz-pistov">Parcely připravené <em>ke stavbě domu</em></h2></div>
        <p class="lead">${esc(B.lead)}</p></div>
      <ol class="devvalues">${B.pistov.map((v, i) => `<li><span class="devvalues__no">${i + 1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join("")}</ol>
    </div>
  </section>

  <section class="section section--paper section--tight" aria-labelledby="sz-focus">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Stavební činnost</p><h2 class="h2" id="sz-focus">${esc(B.claim)}</h2></div>
        <p class="lead">START Zelený se stavební výrobou zabývá od roku 2002. Kromě staveb provozuje betonárku, půjčovnu stavební techniky a stavebniny v Jihlavě a Brtnici.</p></div>
      <div class="devservices">${B.focus.map((s) => `<article class="devservice"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join("")}</div>
    </div>
  </section>

  <section class="section section--tight" aria-labelledby="sz-refs">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Reference</p><h2 class="h2" id="sz-refs">Postavili <em>na Vysočině</em></h2></div>
        <p class="lead">Výběr z realizovaných staveb. Celý přehled najdete na webu zeleny.cz.</p></div>
      <ul class="devprojects">${B.projects.map((p) => `
        <li><a href="https://www.zeleny.cz/realizovane-projekty" target="_blank" rel="noopener">
          <span class="devprojects__img">${pic(p.image, p.name, "(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw")}</span>
          <span class="devprojects__place">${esc(p.note)}</span><b>${esc(p.name)}</b><span class="devprojects__go" aria-hidden="true">↗</span>
        </a></li>`).join("")}</ul>
    </div>
  </section>

  <section class="section section--ink section--tight" aria-labelledby="sz-company">
    <div class="wrap devcontact">
      <div>
        <span class="devcontact__tile"><img src="${B.logo}" alt="START Zelený" width="1011" height="216" loading="lazy"></span>
        <h2 class="sr-only" id="sz-company">Údaje o developerovi</h2>
        <p class="lead">Prodej parcel zajišťuje Horák & Vetchý reality. S dotazy na konkrétní parcelu se obracejte na prodejce.</p>
        <p class="hp-more"><a class="btn btn--red" href="prodejce.html">Kontakty na prodejce <span aria-hidden="true">→</span></a><a class="btn btn--ghost" href="${B.web}" target="_blank" rel="noopener">Web zeleny.cz ↗</a></p>
      </div>
      <dl class="devcontact__company">${B.company.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    </div>
    <div class="wrap"><p class="source">${esc(B.source)}</p></div>
  </section>`;
