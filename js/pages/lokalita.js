import { renderChrome } from "../site/chrome.js";
import { pois } from "../projects/pistov/content.js";
import { poiList, poiCard } from "../site/pois.js";
import { mountLocationMap } from "../site/map.js";

renderChrome({ page: "lokalita", solid: true });
const list = poiList(), cats = ["Vše", ...new Set(list.map((p) => p.cat))];
const tabs = document.querySelector("[data-poi-tabs]"), grid = document.querySelector("[data-poi-grid]");
let current = "Vše";
const render = () => {
  tabs.innerHTML = cats.map((c) => `<button type="button" role="tab" aria-selected="${c === current}" data-cat="${c}">${c}<span>${c === "Vše" ? list.length : list.filter((p) => p.cat === c).length}</span></button>`).join("");
  grid.innerHTML = list.filter((p) => current === "Vše" || p.cat === current).map(poiCard).join("");
};
tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { current = b.dataset.cat; render(); } });
render();
document.querySelector("[data-poi-note]").textContent = pois.note;
mountLocationMap(document.querySelector("[data-poi-map]"), { zoom: 15, color: "#b94a28", pois: list });
