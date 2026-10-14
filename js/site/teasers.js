// Home page teasers – short previews of the subpages with a click-through (gallery, news, financing + FAQ).
import { news, faq, financing, gallery, developer } from "../projects/pistov/content.js";
import { newsCard, accordion, bindAccordion, img, srcset, isDrawing, esc } from "./ui.js";

const PICKS = [["Domy", "A-garden-warm"], ["Lokalita", "drone-site-centre"], ["Domy", "D-garden-white"], ["Výkresy", "A-plans"]];

export function renderHomeTeasers() {
  const g = document.querySelector("[data-hp-gallery]");
  if (g) {
    const total = gallery.reduce((n, c) => n + c.items.length, 0);
    const cap = (name) => gallery.flatMap((c) => c.items).find(([n]) => n === name)?.[1] || "";
    g.innerHTML = PICKS.map(([cat, name], i) => `
      <a href="galerie.html?kategorie=${encodeURIComponent(cat)}" class="${isDrawing(name) ? "is-drawing" : ""}">
        <img src="${img(name, i === 0 ? "l" : "m")}" srcset="${srcset(name)}" sizes="${i === 0 ? "(min-width: 760px) 42vw, 100vw" : "(min-width: 760px) 28vw, 50vw"}" alt="${esc(cap(name))}" loading="lazy" decoding="async">
        <span class="hp-gallery__tag">${cat}</span>
      </a>`).join("") + `
      <a href="galerie.html" class="hp-gallery__all"><b>${total}</b><span>snímků v galerii</span><span class="note">vizualizace, dron, výkresy</span></a>`;
  }
  const n = document.querySelector("[data-hp-news]");
  if (n) n.innerHTML = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((x) => newsCard(x)).join("");

  const f = document.querySelector("[data-hp-fin-steps]");
  if (f) f.innerHTML = financing.steps.slice(0, 4).map((s) => `<li><span>${esc(s.title)}</span></li>`).join("");

  const d = document.querySelector("[data-hp-devfacts]");
  if (d) d.innerHTML = developer.facts.map(([big, small]) => `<li><b>${esc(big)}</b><span>${esc(small)}</span></li>`).join("");

  const q = document.querySelector("[data-hp-faq]");
  if (q) {
    const want = ["Kolik stojí", "libovolný dům", "Kolik parcel", "Kdo je developerem"];
    const pick = want.map((w) => faq.findIndex((f) => f.q.includes(w))).filter((i) => i >= 0).map((i) => ({ ...faq[i], id: `hp${i}` }));
    q.innerHTML = accordion(pick);
    bindAccordion(q);
  }
}
