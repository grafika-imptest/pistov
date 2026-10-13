// "Můj návrh" visualisation stage: PLOT ONLY ↔ PLOT + HOUSE with the construction timelapse.
import { TimelapseStage } from "../core/timelapse.js";
import { esc, m2 } from "./format.js";
import { arrowSVG, draw } from "./sketch.js";

export class Stage {
  constructor(root, app) {
    this.root = root; this.app = app;
    root.innerHTML = `
      <div class="stage__bar">
        <div class="vis-toggle" role="group" aria-label="Zobrazení">
          <button type="button" data-vis="plot" aria-pressed="true">Pouze parcela</button>
          <button type="button" data-vis="house" aria-pressed="false">Parcela + dům</button>
          <span class="vis-toggle__ink" aria-hidden="true"></span>
        </div>
        <button type="button" class="btn btn--ghost btn--sm stage__replay" data-replay hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg><span class="stage__replay-label">Přehrát stavbu znovu</span></button>
        <button type="button" class="btn btn--ghost btn--sm stage__close" data-stage-map><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14M15 6v14"/></svg>Mapa lokality</button>
      </div>
      <div class="tl" data-tl data-phase="plot">
        <div class="tl__frame">
          <div class="tl__drawing" data-tl-drawing></div>
          <div class="tl__media" data-tl-media></div>
          <img class="tl__final" data-tl-final alt="" decoding="async">
          <div class="tl__loader" aria-hidden="true"><span></span></div>
          <div class="tl__badge" data-tl-badge></div>
          <div class="tl__empty" data-tl-empty hidden></div>
        </div>
        <p class="tl__caption" data-tl-caption></p>
        <div class="tl__note" data-tl-note aria-hidden="true">${arrowSVG({ w: 120, h: 70, from: [110, 62], to: [26, 8], bend: 0.3 })}<span class="note">přepněte a&nbsp;dům vyroste</span></div>
      </div>
      <p class="sr-only" aria-live="polite" data-tl-live></p>`;
    const q = (s) => root.querySelector(s);
    this.tlRoot = q("[data-tl]");
    this.tl = new TimelapseStage({
      root: this.tlRoot, drawing: q("[data-tl-drawing]"), media: q("[data-tl-media]"), final: q("[data-tl-final]"),
    }, app.project, { onPhase: (ph) => this._phase(ph) });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vis]");
      if (b) { app.setVis(b.dataset.vis); return; }
      if (e.target.closest("[data-replay]")) { this.tl.replay(); return; }
      if (e.target.closest("[data-stage-map]")) app.setMode("plots");
    });
    this.key = null;
  }

  /** called on every relevant state change */
  update() {
    const st = this.app.store.get();
    const sel = this.app.selection();
    const ok = sel.plot && sel.plot.geometry && this.app.statusOf(sel.plot) === "available";
    const empty = this.root.querySelector("[data-tl-empty]");
    this.root.classList.toggle("is-empty", !ok);
    if (!ok) {
      empty.hidden = false;
      empty.innerHTML = sel.plot && !sel.plot.geometry
        ? `<p>Parcela č. ${sel.plot.no} je rezervovaná a její hranice nejsou v podkladu čitelné.</p>`
        : sel.plot ? `<p>Parcela č. ${sel.plot.no} není volná.</p>` : `<p class="note">nejprve vyberte parcelu</p>`;
      this.key = null;
      return;
    }
    empty.hidden = true;
    const vis = sel.type ? st.vis : "plot";
    for (const b of this.root.querySelectorAll("[data-vis]")) {
      b.setAttribute("aria-pressed", String(b.dataset.vis === vis));
      b.disabled = b.dataset.vis === "house" && !sel.type;
    }
    this.root.querySelector(".vis-toggle").dataset.on = vis;
    const key = [sel.plot.id, sel.type?.id, sel.layout?.id, sel.variant?.id, vis].join("|");
    if (key === this.key) return;
    this.key = key;
    this.tl.show(sel, vis);
    this._captions(sel, vis);
  }

  _captions(sel, vis) {
    const cap = this.root.querySelector("[data-tl-caption]");
    const badge = this.root.querySelector("[data-tl-badge]");
    const tl = sel.variant?.timelapse;
    badge.innerHTML = `<span class="tl__badge-no">${sel.plot.no}</span><span>${m2(sel.plot.area)}${sel.type && vis === "house" ? ` · ${esc(sel.type.name)}<span class="tl__badge-var"> · ${esc(sel.variant.name)}</span>` : ""}</span>`;
    if (vis === "plot") cap.textContent = `Parcela č. ${sel.plot.no} podle situačního plánu · orientační rozměry stran odvozené z měřítka M 1 : 2000`;
    else if (tl) cap.textContent = "Animace výstavby";
    else cap.textContent = `Schéma hmoty podle rozměrů z katalogu, umístění podle situačního plánu · vizualizace: TAM architekti${sel.layout?.renderNote ? ` · ${sel.layout.renderNote}` : ""}`;
    this.root.querySelector("[data-tl-note]").classList.toggle("is-on", vis === "plot" && !!sel.type);
    if (vis === "plot" && sel.type) draw(this.root.querySelector("[data-tl-note]"));
  }

  _phase(ph) {
    const live = this.root.querySelector("[data-tl-live]");
    this.root.querySelector("[data-replay]").hidden = ph !== "built";
    const sel = this.app.selection();
    if (ph === "building") live.textContent = `Stavíme ${sel.type?.name ?? "dům"} na parcele ${sel.plot?.no}.`;
    if (ph === "built") live.textContent = `Hotovo: ${sel.type?.name}, ${sel.variant?.name}, na parcele ${sel.plot?.no}.`;
    if (ph === "plot") live.textContent = `Parcela ${sel.plot?.no} bez domu.`;
  }
}
