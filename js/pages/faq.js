import { renderChrome } from "../site/chrome.js";
import { faq } from "../projects/pistov/content.js";
import { accordion, bindAccordion } from "../site/ui.js";

renderChrome({ page: "faq", solid: true });
const tabs = document.querySelector("[data-faq-tabs]"), list = document.querySelector("[data-faq]");
const cats = ["Vše", ...new Set(faq.map((f) => f.cat))];
let cur = "Vše";
const render = () => {
  tabs.innerHTML = cats.map((c) => `<button type="button" role="tab" aria-selected="${c === cur}" data-cat="${c}">${c}</button>`).join("");
  const items = faq.map((f, i) => ({ ...f, id: i })).filter((f) => cur === "Vše" || f.cat === cur);
  list.innerHTML = accordion(items, { open: 0 });
};
tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { cur = b.dataset.cat; render(); } });
bindAccordion(list);
render();
