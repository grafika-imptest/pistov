// Section "Typové domy": one full-bleed slider per house type (all architect's visualisations + the floor-plan
// sheets), arrows / swipe / keyboard, and an edge-to-edge information row underneath.
import { esc, plural } from "./format.js";
import { plotsForType } from "../core/compat.js";
import { reducedMotion } from "../core/motion.js";

export class Catalog {
  constructor(root, app) {
    this.root = root; this.app = app;
    this.idx = {};   // current slide per type
    root.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-cat-nav]");
      if (nav) { this.step(nav.dataset.type, Number(nav.dataset.catNav)); return; }
      const go = e.target.closest("[data-cat-go]");
      if (go) { const [type, i] = go.dataset.catGo.split("|"); this.show(type, Number(i)); return; }
      const t = e.target.closest("[data-cat-try]");
      if (t) { app.tryType(t.dataset.catTry, this.variantOf(t.dataset.catTry)?.id); return; }
      const d = e.target.closest("[data-cat-detail]");
      if (d) app.openDetail(d.dataset.catDetail, this.variantOf(d.dataset.catDetail)?.id);
    });
    root.addEventListener("keydown", (e) => {
      const stage = e.target.closest("[data-cat-stage]"); if (!stage) return;
      if (e.key === "ArrowRight") { e.preventDefault(); this.step(stage.dataset.type, 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); this.step(stage.dataset.type, -1); }
    });
    // swipe on touch screens (horizontal drag ≥ 45 px)
    let sx = null, sy = null, st = null;
    root.addEventListener("pointerdown", (e) => { const s = e.target.closest("[data-cat-stage]"); if (!s || e.target.closest("button")) return; sx = e.clientX; sy = e.clientY; st = s.dataset.type; });
    root.addEventListener("pointerup", (e) => {
      if (st == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) this.step(st, dx < 0 ? 1 : -1);
      st = null;
    });
  }

  /** slides of one house type: every visualisation of every material variant, then the plan sheets */
  slides(type) {
    const P = this.app.project;
    const out = [];
    for (const v of P.houseVariants.filter((x) => x.type === type.id)) for (const img of v.images) out.push({ kind: "render", img, variant: v, label: v.name });
    const seen = new Set();
    for (const l of type.layouts) {
      if (seen.has(l.sheet)) continue; seen.add(l.sheet);
      out.push({ kind: "plan", img: l.sheet, label: `Půdorys · ${l.name}${l.disposition ? ` ${l.disposition}` : ""}` });
    }
    return out;
  }
  variantOf(typeId) {
    const type = this.app.project.houseTypes.find((t) => t.id === typeId);
    const slides = this.slides(type);
    const i = this.idx[typeId] || 0;
    // plan slides keep the last rendered material
    for (let k = i; k >= 0; k--) if (slides[k].variant) return slides[k].variant;
    return slides[0].variant;
  }

  render() {
    const P = this.app.project;
    this.root.innerHTML = P.houseTypes.map((t, n) => {
      const slides = this.slides(t);
      const i = Math.min(this.idx[t.id] || 0, slides.length - 1);
      const vs = P.houseVariants.filter((v) => v.type === t.id);
      const free = plotsForType(P, t.id).filter((p) => this.app.statusOf(p) === "available").length;
      const layouts = t.layouts.map((l) => `${esc(l.name)}${l.disposition ? ` (${l.disposition})` : ""}`);
      const firstPlan = slides.findIndex((s) => s.kind === "plan");
      return `
      <article class="cat" data-cat="${t.id}" aria-labelledby="cat-${t.id}">
        <div class="cat__stage" data-cat-stage data-type="${t.id}" tabindex="0" role="region" aria-roledescription="galerie" aria-label="${esc(t.name)} – vizualizace a půdorysy, šipkami listujete">
          ${slides.map((s, k) => `
            <figure class="cat__slide cat__slide--${s.kind} ${k === i ? "is-on" : ""}" data-k="${k}" aria-hidden="${k !== i}">
              <img ${Math.abs(k - i) <= 1 ? "" : "data-"}src="${P.img(s.img, s.kind === "plan" ? 2000 : 1600)}" ${s.kind === "render" ? `${Math.abs(k - i) <= 1 ? "" : "data-"}srcset="${P.imgSet(s.img, [960, 1600])}" sizes="100vw"` : ""}
                alt="${esc(t.name)} – ${s.kind === "plan" ? esc(s.label) : `vizualizace, ${esc(s.label)}`}" decoding="async" ${k === i && n === 0 ? "" : 'loading="lazy"'}>
            </figure>`).join("")}
          <div class="cat__shade" aria-hidden="true"></div>
          <div class="cat__headline">
            <p class="cat__letter" aria-hidden="true">${t.id}</p>
            <div>
              <p class="cat__kicker">Typový dům ${String(n + 1).padStart(2, "0")} / ${String(P.houseTypes.length).padStart(2, "0")}</p>
              <h3 class="cat__title" id="cat-${t.id}">${esc(t.name)} <span>${esc(t.tagline)}</span></h3>
            </div>
          </div>
          <button type="button" class="cat__nav cat__nav--prev" data-cat-nav="-1" data-type="${t.id}" aria-label="Předchozí snímek"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button type="button" class="cat__nav cat__nav--next" data-cat-nav="1" data-type="${t.id}" aria-label="Další snímek"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
          <p class="cat__counter" aria-live="polite"><b data-cat-no>${String(i + 1).padStart(2, "0")}</b> / ${String(slides.length).padStart(2, "0")} <span class="cat__caption note" data-cat-caption>${esc(slides[i].label.toLowerCase())}</span></p>
          <div class="cat__progress" aria-hidden="true"><i style="--p:${(i + 1) / slides.length}"></i></div>
        </div>
        <div class="cat__info">
          <p class="cat__text">${esc(t.character)}</p>
          <dl class="cat__specs">
            <div><dt>${esc(t.builtUpLabel)}</dt><dd>${t.builtUpArea} m²</dd></div>
            <div><dt>Délka domu</dt><dd>${String(t.length).replace(".", ",")} m</dd></div>
            <div><dt>Střecha</dt><dd>${esc(t.roof)}</dd></div>
            <div><dt>Volné parcely*</dt><dd>${free}</dd></div>
          </dl>
          <div class="cat__variants">
            <p class="cat__layouts"><span class="eyebrow">${plural(t.layouts.length, "Dispozice", "Dispozice", "Dispozice")}</span> ${layouts.join(" · ")}</p>
            <div class="cat__materials" role="group" aria-label="Materiálová řešení – ${esc(t.name)}">
              ${vs.map((x) => { const k = slides.findIndex((s) => s.variant === x); return `<button type="button" class="matbtn" data-cat-go="${t.id}|${k}" data-variant="${x.id}" aria-pressed="false" title="${esc(x.name)}"><img src="${P.img(x.images[0], 480)}" alt="" width="480" height="320" loading="lazy" decoding="async"><span class="sr-only">${esc(x.name)}</span></button>`; }).join("")}
              ${firstPlan >= 0 ? `<button type="button" class="matbtn matbtn--plan" data-cat-go="${t.id}|${firstPlan}" aria-pressed="false"><span>Půdorysy</span></button>` : ""}
            </div>
          </div>
          <div class="cat__actions">
            <button type="button" class="btn btn--ink" data-cat-try="${t.id}">Vyzkoušet na parcele <span aria-hidden="true">→</span></button>
            <button type="button" class="btn btn--ghost" data-cat-detail="${t.id}">Detail domu</button>
          </div>
        </div>
      </article>`;
    }).join("") + `<p class="source catalog__note">* podle ukázkových pravidel přiřazení; skutečnou vazbu domů na parcely potvrdí developer s architektem.</p>`;
    for (const t of P.houseTypes) this._sync(t.id);
  }

  step(typeId, d) {
    const type = this.app.project.houseTypes.find((t) => t.id === typeId);
    const n = this.slides(type).length;
    this.show(typeId, ((this.idx[typeId] || 0) + d + n) % n, d);
  }

  show(typeId, i, dir = 0) {
    const art = this.root.querySelector(`[data-cat="${typeId}"]`); if (!art) return;
    const prev = this.idx[typeId] || 0; if (i === prev) return;
    this.idx[typeId] = i;
    const figs = art.querySelectorAll(".cat__slide");
    // load the target and its neighbours
    for (const k of [i - 1, i, i + 1]) {
      const img = figs[(k + figs.length) % figs.length]?.querySelector("img");
      if (img?.dataset.src) { if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute("data-srcset"); } img.src = img.dataset.src; img.removeAttribute("data-src"); }
    }
    const from = figs[prev], to = figs[i];
    const forward = dir ? dir > 0 : i > prev;
    art.style.setProperty("--dir", forward ? 1 : -1);
    figs.forEach((f) => f.classList.remove("is-leaving"));
    if (!reducedMotion()) { from.classList.add("is-leaving"); setTimeout(() => from.classList.remove("is-leaving"), 750); }
    from.classList.remove("is-on"); from.setAttribute("aria-hidden", "true");
    to.classList.add("is-on"); to.setAttribute("aria-hidden", "false");
    this._sync(typeId);
  }

  /** counter, caption, progress and the highlighted material for the current slide */
  _sync(typeId) {
    const art = this.root.querySelector(`[data-cat="${typeId}"]`); if (!art) return;
    const type = this.app.project.houseTypes.find((t) => t.id === typeId);
    const slides = this.slides(type), i = this.idx[typeId] || 0, s = slides[i];
    art.querySelector("[data-cat-no]").textContent = String(i + 1).padStart(2, "0");
    art.querySelector("[data-cat-caption]").textContent = s.label.toLowerCase();
    art.querySelector(".cat__progress i").style.setProperty("--p", (i + 1) / slides.length);
    art.classList.toggle("is-plan", s.kind === "plan");
    const current = s.kind === "plan" ? null : s.variant.id;
    for (const b of art.querySelectorAll(".matbtn")) {
      const on = b.classList.contains("matbtn--plan") ? s.kind === "plan" : b.dataset.variant === current;
      b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on));
    }
  }
}
