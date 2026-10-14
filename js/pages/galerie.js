import { renderChrome } from "../site/chrome.js";
import { gallery } from "../projects/pistov/content.js";
import { img, srcset, isDrawing, esc, lightbox } from "../site/ui.js";

renderChrome({ page: "galerie", solid: true });

const tabs = document.querySelector("[data-gallery-tabs]"), grid = document.querySelector("[data-gallery]");
const all = gallery.flatMap((g) => g.items.map((it) => [...it, g.cat]));
const cats = ["Vše", ...gallery.map((g) => g.cat)];
let current = new URLSearchParams(location.search).get("kategorie") || "Vše";
if (!cats.includes(current)) current = "Vše";

function render() {
  tabs.innerHTML = cats.map((c) => `<button type="button" role="tab" aria-selected="${c === current}" data-cat="${c}">${c}<span>${c === "Vše" ? all.length : all.filter((x) => x[2] === c).length}</span></button>`).join("");
  const items = current === "Vše" ? all : all.filter((x) => x[2] === current);
  grid.innerHTML = items.map(([name, cap], k) => `
    <button type="button" class="gallery__item ${isDrawing(name) ? "is-drawing" : ""} ${k % 7 === 0 ? "is-wide" : ""}" data-k="${k}">
      <img src="${img(name, "m")}" srcset="${srcset(name)}" sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw" alt="${esc(cap)}" loading="lazy" decoding="async">
      <span class="gallery__cap">${esc(cap)}</span>
    </button>`).join("");
  const lb = lightbox(items.map(([n, c]) => [n, c]));
  grid.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) lb.open(Number(b.dataset.k)); };
}
tabs.addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  current = b.dataset.cat;
  history.replaceState(null, "", current === "Vše" ? "galerie.html" : `galerie.html?kategorie=${encodeURIComponent(current)}`);
  render();
});
render();
