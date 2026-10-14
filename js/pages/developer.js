import { renderChrome } from "../site/chrome.js";
import { site, developer as D } from "../projects/pistov/content.js";
import { esc, img, srcset } from "../site/ui.js";

renderChrome({ page: "developer", solid: true });
const dev = site.developer, tel = (p) => `<a href="tel:${p.replace(/\s/g, "")}">${esc(p)}</a>`;
const pic = (name, alt, sizes, cls = "") => `<img class="${cls}" src="${img(name, "m")}" srcset="${srcset(name)}" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

// the developer's logo leads the page hero
document.querySelector(".pagehero .eyebrow")?.insertAdjacentHTML("beforebegin", `<img class="pagehero__logo" src="${D.logo.dark}" alt="${esc(D.logo.alt)}" width="900" height="529">`);

document.querySelector("[data-developer]").innerHTML = `
  <div class="wrap">
    <ul class="devfacts">${D.facts.map(([big, small]) => `<li><b>${esc(big)}</b><span>${esc(small)}</span></li>`).join("")}</ul>
    <figure class="devfounders">
      ${pic(D.founders.image, D.founders.caption, "(min-width: 1000px) 92vw, 100vw")}
      <figcaption><span class="note">${esc(D.founders.caption)}</span></figcaption>
    </figure>
  </div>

  <section class="section section--tight" aria-labelledby="dev-values">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Na čem stavějí</p><h2 class="h2" id="dev-values">Čtyři hodnoty <em>Horák & Vetchý</em></h2></div>
        <p class="lead">Hodnoty, na kterých Horák & Vetchý reality podle svých slov stavějí – a které čekají i kupce v Pístově.</p></div>
      <ol class="devvalues">${D.values.map((v, i) => `<li><span class="devvalues__no">${i + 1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join("")}</ol>
    </div>
  </section>

  <section class="section section--paper section--tight" aria-labelledby="dev-services">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Služby</p><h2 class="h2" id="dev-services">Všechno kolem nového bydlení <em>pod jednou střechou</em></h2></div>
        <p class="lead">Kromě prodeje parcel v Pístově nabízí Horák & Vetchý reality služby, které se při koupi hodí – hlavně pomoc s financováním.</p></div>
      <div class="devservices">
        <figure class="devservice devservice--photo">${pic(D.financingImage.image, D.financingImage.alt, "(min-width: 900px) 33vw, 100vw")}</figure>
        ${D.services.map((s) => `<article class="devservice${s.href ? " devservice--link" : ""}"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.href ? `<a class="link" href="${s.href}">Spočítat splátku →</a>` : ""}</article>`).join("")}
      </div>
    </div>
  </section>

  <section class="section section--tight" aria-labelledby="dev-projects">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Další projekty</p><h2 class="h2" id="dev-projects">Developerské projekty <em>v nabídce H&V</em></h2></div>
        <p class="lead">Horák & Vetchý spolupracují s developery po celé republice – zajišťují výhradní zastoupení, marketing a prodej. Ukázka projektů z jejich nabídky:</p></div>
      <ul class="devprojects">${D.projects.map((p) => `
        <li><a href="${p.url}" target="_blank" rel="noopener">
          <span class="devprojects__img ${p.image ? "" : "is-empty"}">${p.image ? pic(p.image, `${p.name} – vizualizace`, "(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw") : `<img src="${D.logo.dark}" alt="" class="devprojects__logo">`}</span>
          <span class="devprojects__place">${esc(p.place)}</span><b>${esc(p.name)}</b><span class="muted">${esc(p.note)}</span><span class="devprojects__go" aria-hidden="true">↗</span>
        </a></li>`).join("")}</ul>
    </div>
  </section>

  <section class="section section--tight devbranches" aria-labelledby="dev-branches">
    <div class="wrap">
      <div class="sechead"><div><p class="eyebrow">Pobočky</p><h2 class="h2" id="dev-branches">${D.branches.length} poboček, <em>nejblíž Pístovu Jihlava</em></h2></div>
        <p class="lead">${D.branches.join(" · ")}</p></div>
      <div class="devbranches__grid">${D.branchPhotos.map(([name, city]) => `<figure>${pic(name, `Pobočka Horák & Vetchý reality – ${city}`, "(min-width: 900px) 25vw, 50vw")}<figcaption>${esc(city)}</figcaption></figure>`).join("")}</div>
    </div>
  </section>

  <section class="section section--ink section--tight" aria-labelledby="dev-contact">
    <div class="wrap devcontact">
      <div>
        <img class="devcontact__logo" src="${D.logo.light}" alt="${esc(D.logo.alt)}" width="900" height="529" loading="lazy">
        <h2 class="sr-only" id="dev-contact">Kontakt na ${esc(dev.brand)}</h2>
        <p class="lead">${esc(dev.address)}<br>${tel(dev.phone)} · <a href="mailto:${dev.email}">${dev.email}</a></p>
        <p class="devcontact__people">${D.people.map(([n, p]) => `<span><b>${esc(n)}</b> ${tel(p)}</span>`).join("")}</p>
        <p class="hp-more"><a class="btn btn--red" href="kontakty.html#formular">Poptat parcelu v Pístově <span aria-hidden="true">→</span></a><a class="btn btn--ghost" href="${dev.web}" target="_blank" rel="noopener">Web hvreality.cz ↗</a></p>
      </div>
      <dl class="devcontact__company">
        <div><dt>Společnost</dt><dd>${esc(dev.name)}</dd></div>
        <div><dt>IČO</dt><dd>${dev.ico}</dd></div>
        <div><dt>DIČ</dt><dd>${dev.dic}</dd></div>
        <div><dt>Obchodní rejstřík</dt><dd>${esc(dev.register)}</dd></div>
      </dl>
    </div>
    <div class="wrap"><p class="source">${esc(D.source)}</p></div>
  </section>`;
