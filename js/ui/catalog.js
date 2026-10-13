// Section "Typové domy": editorial cards with live material switching.
import { esc, plural } from "./format.js";
import { plotsForType } from "../core/compat.js";

export class Catalog {
  constructor(root, app) {
    this.root = root; this.app = app; this.pick = {};
    root.addEventListener("click", (e) => {
      const m = e.target.closest("[data-cat-material]");
      if (m) { const [type, id] = m.dataset.catMaterial.split("|"); this.pick[type] = id; this.render(); this.root.querySelector(`[data-cat-material="${type}|${id}"]`)?.focus({ preventScroll: true }); return; }
      const t = e.target.closest("[data-cat-try]");
      if (t) { app.tryType(t.dataset.catTry, this.pick[t.dataset.catTry]); return; }
      const d = e.target.closest("[data-cat-detail]");
      if (d) app.openDetail(d.dataset.catDetail, this.pick[d.dataset.catDetail]);
    });
  }
  render() {
    const P = this.app.project;
    this.root.innerHTML = P.houseTypes.map((t, i) => {
      const vs = P.houseVariants.filter((v) => v.type === t.id);
      const v = vs.find((x) => x.id === this.pick[t.id]) || vs[0];
      const free = plotsForType(P, t.id).filter((p) => this.app.statusOf(p) === "available").length;
      const layouts = t.layouts.map((l) => `${esc(l.name)}${l.disposition ? ` (${l.disposition})` : ""}`);
      return `
      <article class="cat ${i % 2 ? "cat--flip" : ""} reveal is-in">
        <figure class="cat__media">
          <img src="${P.img(v.images[0], 960)}" srcset="${P.imgSet(v.images[0], [480, 960, 1600])}" sizes="(min-width: 1000px) 58vw, 100vw" width="1600" height="1067" alt="${esc(t.name)} – vizualizace, ${esc(v.name)}" loading="lazy" decoding="async">
          <figcaption class="note">${esc(v.name.toLowerCase())}</figcaption>
        </figure>
        <div class="cat__body">
          <p class="cat__letter" aria-hidden="true">${t.id}</p>
          <h3 class="cat__title">${esc(t.name)} <span>${esc(t.tagline)}</span></h3>
          <p class="cat__text">${esc(t.character)}</p>
          <dl class="cat__specs">
            <div><dt>${esc(t.builtUpLabel)}</dt><dd>${t.builtUpArea} m²</dd></div>
            <div><dt>Délka domu</dt><dd>${String(t.length).replace(".", ",")} m</dd></div>
            <div><dt>Střecha</dt><dd>${esc(t.roof)}</dd></div>
            <div><dt>Volné parcely*</dt><dd>${free}</dd></div>
          </dl>
          <p class="cat__layouts"><span class="eyebrow">${plural(t.layouts.length, "Dispozice", "Dispozice", "Dispozice")}</span> ${layouts.join(" · ")}</p>
          <div class="cat__materials" role="radiogroup" aria-label="Materiálové řešení – ${esc(t.name)}">
            ${vs.map((x) => `<button type="button" role="radio" aria-checked="${x.id === v.id}" class="matbtn ${x.id === v.id ? "is-on" : ""}" data-cat-material="${t.id}|${x.id}" title="${esc(x.name)}"><img src="${P.img(x.images[0], 480)}" alt="" width="480" height="320" loading="lazy" decoding="async"><span class="sr-only">${esc(x.name)}</span></button>`).join("")}
          </div>
          <div class="cat__actions">
            <button type="button" class="btn btn--ink" data-cat-try="${t.id}">Vyzkoušet na parcele <span aria-hidden="true">→</span></button>
            <button type="button" class="btn btn--ghost" data-cat-detail="${t.id}">Detail domu</button>
          </div>
        </div>
      </article>`;
    }).join("") + `<p class="source">* podle ukázkových pravidel přiřazení; skutečnou vazbu domů na parcely potvrdí developer s architektem.</p>`;
  }
}
