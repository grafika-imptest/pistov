import { renderChrome } from "../site/chrome.js";
import { collections, COMPARE_MAX } from "../site/collections.js";
import { itemInfo, esc } from "../site/items.js";
import { img, srcset, toast } from "../site/ui.js";

renderChrome({ page: "oblibene", solid: true });
const root = document.querySelector("[data-favourites]");

function card(it, k) {
  const x = itemInfo(it);
  const inCmp = collections.has("cmp", it);
  return `<article class="favcard">
    <a class="favcard__img ${x.pic ? "" : "is-plan"}" ${x.pic ? "" : `style="${x.planPos}"`} href="${x.href}" tabindex="-1" aria-hidden="true">
      ${x.pic ? `<img src="${img(x.pic, "m")}" srcset="${srcset(x.pic)}" sizes="(min-width: 1000px) 30vw, 100vw" alt="" loading="lazy">` : `<span class="favcard__no">${x.plot.no}</span>`}
    </a>
    <div class="favcard__body">
      <p class="eyebrow">${x.kindLabel}</p>
      <h2 class="favcard__title"><a href="${x.href}">${esc(x.title)}</a></h2>
      <p class="muted">${x.meta.map(esc).join(" · ")}</p>
      <div class="favcard__actions">
        <a class="btn btn--ink btn--sm" href="${x.href}">Otevřít</a>
        <button type="button" class="btn btn--ghost btn--sm" data-cmp="${k}" aria-pressed="${inCmp}">${inCmp ? "V porovnání ✓" : "Porovnat"}</button>
        <button type="button" class="link" data-remove="${k}">Odebrat</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const items = collections.list("fav");
  root.innerHTML = items.length
    ? `<div class="toolbar"><p class="muted">${items.length} ${items.length === 1 ? "položka" : items.length < 5 ? "položky" : "položek"}</p><a class="link" href="porovnani.html">Přejít na porovnání (${collections.list("cmp").length})</a></div>
       <div class="favgrid">${items.map(card).join("")}</div>`
    : `<div class="emptystate"><svg class="emptystate__sketch" viewBox="0 0 120 80" aria-hidden="true"><path d="M60 68s-28-17-36-33C18 23 26 10 39 10c8 0 13 4 16 9h10c3-5 8-9 16-9 13 0 21 13 15 25-8 16-36 33-36 33Z"/></svg>
       <p class="emptystate__title">Zatím nemáte nic uloženo</p><p class="muted">U parcely, domu nebo vaší kombinace klikněte na srdíčko – uloží se sem, do vašeho prohlížeče.</p>
       <p><a class="btn btn--red" href="index.html#explorer">Vybrat parcelu</a> <a class="btn btn--ghost" href="index.html#domy">Typové domy</a></p></div>`;
}
root.addEventListener("click", (e) => {
  const items = collections.list("fav");
  const r = e.target.closest("[data-remove]"); if (r) collections.remove("fav", items[Number(r.dataset.remove)]);
  const c = e.target.closest("[data-cmp]");
  if (c && collections.toggle("cmp", items[Number(c.dataset.cmp)]) === null) toast(`Porovnat lze nejvýše ${COMPARE_MAX} položky. Nejdřív některou odeberte.`);
});
collections.subscribe(render);
render();
