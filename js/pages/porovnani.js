import { renderChrome } from "../site/chrome.js";
import { collections, COMPARE_MAX } from "../site/collections.js";
import { itemInfo, statusText, esc, m2, project } from "../site/items.js";
import { img, toast } from "../site/ui.js";
import { formatPrice } from "../core/pricing.js";

renderChrome({ page: "porovnani", solid: true });
const root = document.querySelector("[data-compare]");
const dash = '<span class="muted">—</span>';
const pending = '<span class="pending">doplní developer</span>';

// rows: [label, (info) => html, numeric value for highlighting the max]
const ROWS = [
  ["Parcela", (x) => (x.plot ? `č. ${x.plot.no}` : dash)],
  ["Výměra parcely", (x) => (x.plot ? m2(x.plot.area) : dash), (x) => x.plot?.area, "největší parcela"],
  ["Stav", (x) => (x.plot ? statusText(x.plot) : dash)],
  ["Domy vhodné na parcelu", (x) => (x.allowed ? x.allowed.map((t) => `<span class="cmp__chip">${t}</span>`).join("") : dash)],
  ["Typový dům", (x) => (x.type ? `${esc(x.type.name)}<br><span class="muted">${esc(x.type.tagline)}</span>` : dash)],
  ["Obestavěná plocha", (x) => (x.builtUp ? m2(x.builtUp) : dash), (x) => x.builtUp, "největší dům"],
  ["Dispozice", (x) => (!x.type ? dash : x.generic ? x.type.layouts.map((l) => esc(l.disposition || l.name)).join(" / ") : `${esc(x.layout.disposition || "")} <span class="muted">${esc(x.layout.name)}</span>`)],
  ["Střecha", (x) => (x.type ? esc(x.type.roof) : dash)],
  ["Materiál", (x) => (x.generic ? `${x.variantCount} materiálová řešení` : x.type && x.variant ? `<span class="cmp__sw">${x.variant.swatches.map((c) => `<i style="background:${c}"></i>`).join("")}</span>${esc(x.variant.name)}` : dash)],
  ["Parkování", (x) => (x.type ? esc(x.type.parking) : dash)],
  ["Cena pozemku", (x) => (x.plot ? (x.plot.price != null ? formatPrice(x.plot.price) : pending) : dash)],
];

function render() {
  const items = collections.list("cmp");
  if (!items.length) {
    root.innerHTML = `<div class="emptystate"><svg class="emptystate__sketch" viewBox="0 0 120 80" aria-hidden="true"><path d="M34 10v60M86 10v60M14 26h40M66 54h40"/></svg>
      <p class="emptystate__title">Porovnání je prázdné</p><p class="muted">U parcely nebo kombinace klikněte na „Porovnat“. Vedle sebe můžete mít až ${COMPARE_MAX} položky.</p>
      <p><a class="btn btn--red" href="index.html#explorer">Vybrat parcelu</a> <a class="btn btn--ghost" href="oblibene.html">Z oblíbených</a></p></div>`;
    return;
  }
  const info = items.map(itemInfo);
  const max = (fn) => { const v = info.map((x) => fn(x) ?? -Infinity); const m = Math.max(...v); return v.filter((x) => x === m).length === 1 && items.length > 1 ? v.indexOf(m) : -1; };
  root.innerHTML = `
    <div class="toolbar"><p class="muted">${items.length} z ${COMPARE_MAX} · pořadí změníte přetažením karty nebo šipkami</p><button type="button" class="link" data-clear>Vyprázdnit porovnání</button></div>
    <div class="cmp" style="--n:${items.length}" role="region" aria-label="Porovnání" tabindex="0">
      <table class="cmp__table">
        <thead><tr><td class="cmp__corner"></td>${info.map((x, k) => `
          <th scope="col" class="cmp__head" draggable="true" data-k="${k}">
            <div class="cmp__pic ${x.pic ? "" : "is-plan"}" ${x.pic ? "" : `style="${x.planPos}"`}>${x.pic ? `<img src="${img(x.pic, "s")}" alt="" loading="lazy">` : `<span>${x.plot.no}</span>`}</div>
            <p class="eyebrow">${x.kindLabel}</p>
            <p class="cmp__title"><a href="${x.href}">${esc(x.title)}</a></p>
            <div class="cmp__tools">
              <button type="button" class="cmp__btn" data-move="${k}:-1" aria-label="Posunout doleva" ${k === 0 ? "disabled" : ""}>←</button>
              <button type="button" class="cmp__btn" data-move="${k}:1" aria-label="Posunout doprava" ${k === items.length - 1 ? "disabled" : ""}>→</button>
              <button type="button" class="cmp__btn" data-remove="${k}" aria-label="Odebrat ${esc(x.title)}">✕</button>
            </div>
          </th>`).join("")}</tr></thead>
        <tbody>${ROWS.map(([label, fn, num, note]) => { const best = num ? max(num) : -1; return `<tr><th scope="row">${label}</th>${info.map((x, k) => `<td class="${k === best ? "is-best" : ""}">${fn(x)}${k === best ? `<span class="note cmp__note">${note}</span>` : ""}</td>`).join("")}</tr>`; }).join("")}</tbody>
        <tfoot><tr><td></td>${info.map((x) => `<td><a class="btn btn--ink btn--sm" href="${x.href}">Otevřít</a> <a class="link" href="kontakty.html#formular">Poptat</a></td>`).join("")}</tr></tfoot>
      </table>
    </div>
    <p class="source">Plochy podle ${esc(project.source)}. Vhodnost domů pro parcely je zatím ukázková, potvrdí ji developer. Ceny doplní developer.</p>`;
}

root.addEventListener("click", (e) => {
  const items = collections.list("cmp");
  const r = e.target.closest("[data-remove]"); if (r) { collections.remove("cmp", items[Number(r.dataset.remove)]); return; }
  const m = e.target.closest("[data-move]");
  if (m) { const [k, d] = m.dataset.move.split(":").map(Number); collections.reorder("cmp", k, k + d); root.querySelector(`[data-move="${k + d}:${d}"]`)?.focus(); }
  if (e.target.closest("[data-clear]")) collections.clear("cmp");
});
// HTML5 drag & drop of the column heads
let from = null;
root.addEventListener("dragstart", (e) => { const h = e.target.closest(".cmp__head"); if (!h) return; from = Number(h.dataset.k); e.dataTransfer.effectAllowed = "move"; h.classList.add("is-drag"); });
root.addEventListener("dragover", (e) => { const h = e.target.closest(".cmp__head"); if (h && from != null) { e.preventDefault(); root.querySelectorAll(".cmp__head").forEach((x) => x.classList.toggle("is-over", x === h)); } });
root.addEventListener("drop", (e) => { const h = e.target.closest(".cmp__head"); if (h && from != null) { e.preventDefault(); const to = Number(h.dataset.k); if (to !== from) collections.reorder("cmp", from, to); } from = null; });
root.addEventListener("dragend", () => { from = null; root.querySelectorAll(".is-drag,.is-over").forEach((x) => x.classList.remove("is-drag", "is-over")); });

collections.subscribe(render);
render();
if (new URLSearchParams(location.search).has("plne")) toast(`Porovnat lze nejvýše ${COMPARE_MAX} položky.`);
