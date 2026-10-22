import { renderChrome } from "../site/chrome.js";
import { img, srcset, esc, lightbox } from "../site/ui.js";
import { poiList, poiCard, kmLabel } from "../site/pois.js";
import { poiIcon } from "../site/poi-icons.js";
import { mountLocationMap } from "../site/map.js";

renderChrome({ page: "lokalita", solid: true });
const list = poiList(), id = new URLSearchParams(location.search).get("id");
const p = list.find((x) => x.id === id) || list[0];
document.title = `${p.name} — Lokalita — Pístov`;
const [first, ...rest] = p.photos || [];
const credit = (f) => `${esc(f.author)}, <a href="${f.source}" target="_blank" rel="noopener">${esc(f.license)}</a>`;
document.querySelector("[data-place]").innerHTML = `
  <nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><a href="lokalita.html">Lokalita</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav>
  <p class="article__meta place__meta"><span class="place__ic">${poiIcon(p.icon)}</span>${esc(p.cat)} · ${kmLabel(p.km)} od parcel vzdušnou čarou</p>
  <h1 class="article__title">${esc(p.name)}</h1>
  <p class="article__perex">${esc(p.perex)}</p>
  ${first
    ? `<figure class="article__img place__hero"><button type="button" data-lb-open="0" aria-label="Zvětšit fotografii"><img src="${img(first.image, "l")}" srcset="${srcset(first.image)}" sizes="(min-width: 1000px) 920px, 100vw" alt="${esc(p.name)}"></button><figcaption>Foto: ${credit(first)}</figcaption></figure>`
    : `<div class="place__nophoto"><span>${poiIcon(p.icon)}</span><p>Fotografie z místa doplníme.</p></div>`}
  <div class="place__grid">
    <div class="article__body">
      ${p.text ? `<p>${esc(p.text)}</p>` : ""}
      <p>Od parcel v Pístově je to ${kmLabel(p.km)} vzdušnou čarou. Údaje o místě jsou orientační, ověřte je prosím přímo u provozovatele.</p>
      ${rest.length ? `<div class="place__gallery">${rest.map((f, i) => `<figure><button type="button" data-lb-open="${i + 1}" aria-label="Zvětšit fotografii"><img src="${img(f.image, "m")}" srcset="${srcset(f.image)}" sizes="(min-width: 1000px) 300px, 50vw" alt="${esc(p.name)}" loading="lazy"></button><figcaption>Foto: ${credit(f)}</figcaption></figure>`).join("")}</div>` : ""}
      <p class="place__actions"><a class="btn btn--red" href="index.html#explorer">Vybrat parcelu <span aria-hidden="true">→</span></a><a class="link" href="lokalita.html">← Všechna místa v okolí</a></p>
    </div>
    <div class="place__map" data-place-map role="region" aria-label="Mapa – ${esc(p.name)} a parcely v Pístově"></div>
  </div>`;
mountLocationMap(document.querySelector("[data-place-map]"), { zoom: 14, color: "#b94a28", pois: [p] });
const shots = (p.photos || []).map((f) => [f.image, `${p.name} · foto ${f.author}, ${f.license}`]);
document.querySelector("[data-place]").addEventListener("click", (e) => { const b = e.target.closest("[data-lb-open]"); if (b) lightbox(shots).open?.(+b.dataset.lbOpen); });
document.querySelector("[data-place-more]").innerHTML = list.filter((x) => x !== p).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat) || (b.photos.length > 0) - (a.photos.length > 0) || a.km - b.km).slice(0, 3).map(poiCard).join("");
