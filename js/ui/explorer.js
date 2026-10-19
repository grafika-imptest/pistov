// Interactive locality: viewer + plot layer + tooltip + control rail + views menu.
import { Viewer } from "../core/viewer.js";
import { PlotLayer } from "../core/plotLayer.js";
import { PanoramaViewer } from "../core/panorama.js";
import { typesForPlot } from "../core/compat.js";
import { northBearing, homographyToCss, centroid } from "../core/geometry.js";
import { reducedMotion } from "../core/motion.js";
import { esc, m2, statusBadge } from "./format.js";

const isTouch = () => window.matchMedia("(hover: none)").matches;

export class Explorer {
  constructor(root, { project, store, statusOf, onSelectPlot, onEnterExplore, onStation }) {
    this.root = root; this.project = project; this.store = store; this.statusOf = statusOf;
    this.onSelectPlot = onSelectPlot; this.onEnterExplore = onEnterExplore; this.onStation = onStation;
    this.$ = (s) => root.querySelector(s);
    this.viewer = new Viewer(this.$("[data-viewer]"), this.$("[data-scene]"), {
      onChange: (v) => { this.layer.setScale(v.s); this._placeTooltip(); this.onViewChange?.(); },
      onUserGesture: () => this.onGesture?.(),
    });
    this.viewer.onResize = () => this._onResize();
    this.viewer.onWheelHint = () => this._wheelHint();
    this.layer = new PlotLayer(this.$("[data-scene]"), {
      onEnter: (plot, how) => this._hover(plot, how),
      onLeave: (plot) => this._unhover(plot),
      onSelect: (plot, how) => { this._hideTooltip(true); onSelectPlot(plot, how); },
      onStation: (id) => onStation?.(id),
    });
    this.tooltip = this.$("[data-tooltip]");
    this._bindControls();
  }

  // ---------- views ----------
  setView(id, { keepCamera = false } = {}) {
    const view = this.project.views.find((v) => v.id === id && !v.pending) || this.project.views[0];
    this.view = view;
    this.root.classList.toggle("is-pano-view", view.kind === "panorama");
    this._renderViewsMenu();
    if (view.kind === "panorama") { this._enterPano(view); return; }
    const intro = view.introSources && this.root.dataset.phase !== "explore" && !this.skipIntroImage;
    this.viewer.setContent({ size: view.size, sources: intro ? view.introSources : view.sources, alt: view.caption });
    this.$("[data-scene]").querySelector(".viewer__overlay")?.remove();
    this.layer.render(view, this.project);
    this.root.dataset.view = view.id;
    this.root.classList.toggle("is-static-view", !view.interactive);
    this.$("[data-view-caption]").textContent = view.caption;
    // compass: where is north in this view?
    const plan = this.project.views.find((v) => v.id === "plan");
    const bearing = view.homography ? northBearing(view.homography, [plan.size[0] / 2, plan.size[1] / 2]) : 0;
    this.$("[data-needle]").style.transform = `rotate(${bearing.toFixed(1)}deg)`;
    this.$("[data-needle]").style.transformOrigin = "12px 12px";
    this.northBearing = bearing;
    this._renderViewsMenu();
    if (!keepCamera) this.frameAll(false);
    this.refresh();
  }

  /** intro → exploration: the built visualisation of the intro gives way to the empty plots */
  useMainImage({ fade = false } = {}) {
    const v = this.view; if (!v?.introSources || this.isPano) return;
    if (this.viewer.content?.sources === v.sources) return;
    const old = this.viewer.img;
    if (fade && old?.complete) { // the built visualisation stays on top for a moment and fades out
      const ghost = old.cloneNode(); ghost.classList.add("viewer__ghost"); old.after(ghost);
      requestAnimationFrame(() => requestAnimationFrame(() => ghost.classList.add("is-out")));
      setTimeout(() => ghost.remove(), 2200);
    }
    this.viewer.setContent({ size: v.size, sources: v.sources, alt: v.caption });
  }

  // ---------- 360° panorama view ----------
  get isPano() { return this.view?.kind === "panorama"; }
  stationById(id) { const P = this.project.panoramas; return P.find((s) => s.id === id) || P.find((s) => s.id === this.project.defaultStation) || P[0]; }

  _enterPano(view) {
    this.root.dataset.view = view.id;
    this.root.classList.remove("is-static-view");
    this.$("[data-view-caption]").textContent = view.caption;
    if (!this.pano) {
      this.pano = new PanoramaViewer(this.$("[data-pano]"), {
        stations: this.project.panoramas, geo: this.project.planGeoref, plots: this.project.plots, interactive: true,
        wheelNeedsModifier: true, onWheelHint: () => this._wheelHint(),
        onHover: (plot) => this._hover(plot, "pointer"),
        onLeave: (plot) => this._unhover(plot),
        onSelect: (plot) => { this._hideTooltip(true); this.onSelectPlot(plot, "pano"); },
        onStationClick: (id) => this.onStation?.(id),
        insets: null,
        onChange: (p) => { this.$("[data-needle]").style.transform = `rotate(${(-p.yaw).toFixed(1)}deg)`; this._placeTooltip(); },
      });
    }
    this.pano.insets = this._insets;
    this.$("[data-needle]").style.transformOrigin = "12px 12px";
    this.showStation(this.store.get().station);
    this.refresh();
  }

  /** switch panorama station; optionally turn towards a plot */
  async showStation(id, { lookAtPlot } = {}) {
    const st = this.stationById(id);
    const same = this.pano.station?.id?.split(":")[0] === st.id;
    this._renderPanoUi(st);
    const future = this.panoTime === "future" && st.future;
    const scene = future ? { ...st, sources: st.future, id: st.id + ":future" } : st;
    if (!same || this.pano.station?.id !== scene.id) await this.pano.setStation(scene, lookAtPlot || same ? null : st.view);
    if (lookAtPlot) this.pano.lookAtPlot(lookAtPlot, { animate: same });
  }

  _renderPanoUi(st) {
    const ui = this.$("[data-pano-ui]");
    const P = this.project.panoramas;
    ui.innerHTML = `
      <div class="pano-ui__time" role="group" aria-label="Stav lokality">
        <button type="button" data-pano-time="today" aria-pressed="${this.panoTime !== "future" || !st.future}">Dnes</button>
        <button type="button" data-pano-time="future" aria-pressed="${this.panoTime === "future" && !!st.future}" ${st.future ? "" : "disabled title=\"Vizualizace zástavby do panoramat připravujeme\""}>Po dostavbě ${st.future ? "" : "<small>připravujeme</small>"}</button>
      </div>
      <div class="pano-ui__stations" role="radiogroup" aria-label="Stanoviště panoramatu">
        ${P.map((s) => `<button type="button" role="radio" aria-checked="${s.id === st.id}" data-station-id="${s.id}"><span>${esc(s.label)}</span><b>${esc(s.short)}</b></button>`).join("")}
      </div>
      <p class="pano-ui__meta">Dronové panorama · ${new Date(st.captured.replace(" ", "T")).toLocaleDateString("cs-CZ")} · stav před výstavbou · hranice parcel promítnuté orientačně</p>`;
    ui.onclick = (e) => {
      const t = e.target.closest("[data-pano-time]");
      if (t && !t.disabled) { this.panoTime = t.dataset.panoTime; this.showStation(st.id); return; }
      const b = e.target.closest("[data-station-id]"); if (b) this.onStation?.(b.dataset.stationId);
    };
  }

  /** hero overlay: the architect's plan laid onto the ground of the aerial render */
  addPlanOverlay() {
    const view = this.view; if (!view.overlay) return null;
    const img = document.createElement("img");
    img.className = "viewer__overlay"; img.alt = ""; img.decoding = "async"; img.src = view.overlay.src;
    img.style.transform = homographyToCss(view.homography, view.overlay.scale);
    this.$("[data-scene]").append(img);
    return img;
  }

  frameAll(animate = true, duration) {
    if (this.isPano) { const st = this.pano?.station; if (st) this.pano.lookAt(st.view.yaw, st.view.pitch, 75, { animate }); return; }
    const box = this.view.interactive ? this.layer.allBox() : { x: 0, y: 0, w: this.view.size[0], h: this.view.size[1] };
    this.viewer.fit(box, { padding: 0.06, animate, duration });
  }
  /** presentation framing: whole development, full-bleed, shifted right of the headline */
  heroFrame(animate = true, duration = 1600) {
    const b = this.layer.allBox();
    const narrow = this.viewer.vw < 700;
    const w = b.w * (narrow ? 1.15 : 1.55), h = b.h * 1.3;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    this.viewer.cover({ x: cx - w * (narrow ? 0.5 : 0.6), y: cy - h * 0.46, w, h }, { animate, duration, easing: "cubic-bezier(.45,.05,.35,1)" });
  }
  framePlot(id, animate = true) {
    if (this.isPano) { const plot = this.project.plots.find((p) => p.id === id); if (plot && this.pano?.station) this.pano.lookAtPlot(plot, { animate }); return; }
    const b = this.layer.boxOf(id); if (!b) return;
    // show the plot with its neighbourhood: at least ~9 plots wide
    const ctx = Math.max(b.w, b.h) * 3.2;
    const c = [b.x + b.w / 2, b.y + b.h / 2];
    this.viewer.fit({ x: c[0] - ctx / 2, y: c[1] - ctx / 2, w: ctx, h: ctx }, { padding: 0.04, animate, duration: 650 });
  }
  ensurePlotVisible(id) {
    if (this.isPano) return;
    const c = this.layer.centerOf(id); if (!c) return;
    const [x, y] = this.viewer.toScreen(c); const f = this.viewer.free;
    if (x < f.x + 40 || x > f.x + f.w - 40 || y < f.y + 40 || y > f.y + f.h - 40) this.framePlot(id);
  }

  setInsets(insets) { this.viewer.insets = insets; if (this.pano) this.pano.insets = insets; this._insets = insets; }

  refresh() {
    const st = this.store.get();
    const sel = this.project.plots.find((p) => p.no === st.plotNo);
    this.layer.update({ selectedId: sel?.id, hoverId: this.hoverPlot?.id, isDim: this.dimFn, statusOf: this.statusOf });
    this.layer.setVisible({ markers: st.markers, labels: st.labels });
    if (this.isPano && this.pano) { this.pano.setState({ selectedId: sel?.id, hoverId: this.hoverPlot?.id, isDim: this.dimFn, statusOf: this.statusOf }); this.pano.setVisible({ markers: st.markers, labels: st.labels }); }
    this.$('[data-ctl="markers"]').setAttribute("aria-pressed", String(st.markers));
    this.$('[data-ctl="labels"]').setAttribute("aria-pressed", String(st.labels));
  }

  // ---------- tooltip ----------
  _hover(plot, how) {
    clearTimeout(this._hideT);
    this.hoverPlot = plot; this.hoverHow = how;
    this.refresh();
    if (how === "pointer" && isTouch()) return;
    const st = this.statusOf(plot);
    const types = typesForPlot(this.project, plot).filter((t) => t.allowed).map((t) => t.type.id);
    const price = plot.price ? `${plot.price.toLocaleString("cs-CZ")} Kč` : "Cena na vyžádání";
    this.tooltip.innerHTML = `
      <p class="tt__eyebrow">Parcela</p>
      <p class="tt__no">${plot.no}</p>
      ${statusBadge(st)}
      <dl class="tt__facts"><div><dt>Výměra</dt><dd>${m2(plot.area)}</dd></div><div><dt>Cena</dt><dd>${price}</dd></div>
      <div><dt>Typové domy</dt><dd>${st === "available" ? types.map((t) => `<span class="chip chip--type">${t}</span>`).join("") : "—"}</dd></div></dl>
      <button class="btn btn--ink btn--sm tt__cta" type="button" data-tt-open="${plot.id}">Prohlédnout parcelu <span aria-hidden="true">→</span></button>`;
    this.tooltip.hidden = false;
    this.tooltip.classList.remove("is-on");
    this._placeTooltip();
    requestAnimationFrame(() => this.tooltip.classList.add("is-on"));
  }
  _unhover(plot) {
    if (this.hoverPlot !== plot) return;
    this._hideT = setTimeout(() => { if (!this.tooltip.matches(":hover")) this._hideTooltip(); }, 140);
  }
  _hideTooltip(force) {
    this.tooltip.classList.remove("is-on"); this.tooltip.hidden = true;
    if (force || this.hoverPlot) { this.hoverPlot = null; this.refresh(); }
  }
  _placeTooltip() {
    if (this.tooltip.hidden || !this.hoverPlot) return;
    let x, y, halfH;
    if (this.isPano) {
      const a = this.pano?.anchorOf(this.hoverPlot.id); if (!a) return;
      x = a.x; y = a.y + a.h / 2; halfH = a.h / 2;
    } else {
      const c = this.layer.centerOf(this.hoverPlot.id); if (!c) return;
      [x, y] = this.viewer.toScreen(c);
      const b = this.layer.boxOf(this.hoverPlot.id);
      halfH = (b.h * this.viewer.s) / 2;
    }
    const tw = this.tooltip.offsetWidth || 240, th = this.tooltip.offsetHeight || 200;
    const vw = this.viewer.vw, f = this.viewer.free;
    // prefer above the plot; flip below if there is no room; keep inside the free area
    let top = y - halfH - th - 14, below = false;
    if (top < f.y + 8) { top = y + halfH + 14; below = true; }
    let left = Math.min(Math.max(x - tw / 2, f.x + 8), f.x + f.w - tw - 8);
    this.tooltip.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    this.tooltip.dataset.side = below ? "below" : "above";
    this.tooltip.style.setProperty("--ax", `${Math.round(Math.min(Math.max(x - left, 16), tw - 16))}px`);
    void vw;
  }

  _wheelHint() {
    const h = this.$("[data-zoom-hint]");
    h.classList.add("is-on"); clearTimeout(this._wheelT);
    this._wheelT = setTimeout(() => h.classList.remove("is-on"), 1400);
  }

  _onResize() {
    this.onResizeHook?.();
    if (this.isPano) { this.pano?.render(); return; }
    const st = this.store.get();
    const sel = this.project.plots.find((p) => p.no === st.plotNo);
    if (this.root.dataset.phase !== 'explore') this.heroFrame(false); else if (sel && this.view.interactive) this.framePlot(sel.id, false); else this.frameAll(false);
  }

  // ---------- controls ----------
  _bindControls() {
    const r = this.root;
    r.addEventListener("click", (e) => {
      const tt = e.target.closest("[data-tt-open]");
      if (tt) { const plot = this.project.plots.find((p) => p.id === tt.dataset.ttOpen); this._hideTooltip(true); this.onSelectPlot(plot, "tooltip"); return; }
      const ctl = e.target.closest("[data-ctl]"); if (!ctl) return;
      const k = ctl.dataset.ctl, st = this.store.get();
      if (k === "zoom-in") this.isPano ? this.pano.zoomBy(1.4) : this.viewer.zoomBy(1.5);
      else if (k === "zoom-out") this.isPano ? this.pano.zoomBy(1 / 1.4) : this.viewer.zoomBy(1 / 1.5);
      else if (k === "reset") this.frameAll(true);
      else if (k === "markers") this.store.set({ markers: !st.markers });
      else if (k === "labels") this.store.set({ labels: !st.labels });
      else if (k === "fullscreen") this._toggleFullscreen();
      else if (k === "help") this._togglePopover(this.$("[data-help]"), ctl);
      else if (k === "views") this._togglePopover(this.$("[data-views-menu]"), ctl);
      else if (k === "compass") this._compass();
    });
    this.tooltip.addEventListener("pointerleave", () => this._hideTooltip());
    this.tooltip.setAttribute("data-no-pan", "");
    this.$("[data-help-close]").addEventListener("click", () => this._closePopovers());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") this._closePopovers(); });
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".popover, [data-ctl]")) this._closePopovers(); });
    document.addEventListener("fullscreenchange", () => {
      this.$('[data-ctl="fullscreen"]').setAttribute("aria-pressed", String(!!document.fullscreenElement));
      this.root.classList.toggle("is-fullscreen", !!document.fullscreenElement);
    });
  }
  _toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (this.root.requestFullscreen) this.root.requestFullscreen().catch(() => this.root.classList.toggle("is-fullscreen"));
    else this.root.classList.toggle("is-fullscreen"); // iOS Safari: CSS fallback
  }
  _togglePopover(pop, btn) {
    const open = pop.hidden;
    this._closePopovers();
    if (!open) return;
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); this._popBtn = btn;
    const first = pop.querySelector("button:not([disabled])"); first?.focus();
  }
  _closePopovers() {
    for (const p of this.root.querySelectorAll(".popover")) p.hidden = true;
    this._popBtn?.setAttribute("aria-expanded", "false");
  }
  _compass() {
    if (this.isPano) { this.pano.lookAt(0, this.pano.pitch, this.pano.fov); this._toast("Pohled natočen k severu"); return; }
    if (this.view.id !== "plan") { this.store.set({ view: "plan" }); this._toast("Situační plán je orientován k severu"); }
    else this._toast("Sever je nahoře · situační plán M 1 : 2000");
  }
  _toast(text) {
    let t = this.root.querySelector(".toast");
    if (!t) { t = document.createElement("p"); t.className = "toast"; t.setAttribute("role", "status"); this.root.append(t); }
    t.textContent = text; t.classList.add("is-on"); clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove("is-on"), 2200);
  }
  _renderViewsMenu() {
    const menu = this.$("[data-views-menu]");
    menu.innerHTML = `<p class="views-menu__title">Pohledy na lokalitu</p>` + this.project.views.filter((v) => !v.hidden).map((v) => `
      <button type="button" role="menuitemradio" aria-checked="${v.id === this.view?.id}" data-view-id="${v.id}" ${v.pending ? "disabled" : ""}>
        <span class="views-menu__name">${esc(v.label)}</span>
        <span class="views-menu__meta">${v.pending ? esc(v.pending) : esc(v.menuMeta || (v.interactive ? "s výběrem parcel" : "pouze náhled"))}</span>
      </button>`).join("");
    menu.onclick = (e) => {
      const b = e.target.closest("[data-view-id]"); if (!b || b.disabled) return;
      this._closePopovers(); this.store.set({ view: b.dataset.viewId }, { history: "push" });
    };
  }
}

export { centroid, reducedMotion, isTouch };
