// SVG layer with plot boundaries, rendered inside the viewer scene (same coordinate system as the image).
import { bbox, centroid, toPath } from "./geometry.js";
import { statusLabel } from "../ui/format.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

export class PlotLayer {
  constructor(scene, { onEnter, onLeave, onSelect, onStation }) {
    this.scene = scene; this.cb = { onEnter, onLeave, onSelect, onStation };
    this.nodes = new Map();
  }

  render(view, project) {
    this.svg?.remove();
    this.nodes.clear();
    this.view = view;
    if (!view.interactive || !view.geometryKey) return;
    const key = view.geometryKey;
    const [W, H] = view.size;
    const svg = el("svg", { class: "plots", viewBox: `0 0 ${W} ${H}`, width: W, height: H, "aria-label": "Parcely" });
    const shapes = el("g", { class: "plots__shapes" });
    const labels = el("g", { class: "plots__labels", "aria-hidden": "true" });

    // reserved block whose internal boundaries are not legible in the source plan
    if (project.reservedBlock?.[key]) {
      shapes.append(el("path", { class: "plots__block", d: toPath(project.reservedBlock[key]) }));
    }
    for (const plot of project.plots) {
      const g = el("g", { class: "plot", "data-plot": plot.id, "data-status": plot.status, tabindex: "0", role: "button" });
      g.setAttribute("aria-label", `Parcela ${plot.no}, ${plot.area} m², ${statusLabel(plot.status)}`);
      let c;
      if (plot.geometry?.[key]) {
        const d = toPath(plot.geometry[key]);
        g.append(el("path", { class: "plot__shape", d }), el("path", { class: "plot__trace", d, pathLength: "1" }));
        c = plot.label[key];
        this.nodes.set(plot.id, { g, box: bbox(plot.geometry[key]), c, plot });
      } else {
        // marker-only plot (position of the number in the plan)
        c = plot.label[key];
        g.classList.add("plot--marker");
        g.append(el("circle", { class: "plot__shape", cx: c[0], cy: c[1], r: 30 }), el("circle", { class: "plot__trace", cx: c[0], cy: c[1], r: 30, pathLength: "1" }));
        this.nodes.set(plot.id, { g, box: { x: c[0] - 90, y: c[1] - 90, w: 180, h: 180 }, c, plot });
      }
      const t = el("text", { class: "plot__no", x: c[0], y: c[1], "data-for": plot.id });
      t.textContent = plot.no;
      labels.append(t);
      shapes.append(g);
    }
    svg.append(shapes, el("g", { class: "plots__selection", "aria-hidden": "true" }), labels);

    // 360° panorama stations (one marker per position; the 60 m shot is the default at a shared spot)
    if (project.panoramas?.length) {
      const g = el("g", { class: "plots__stations" });
      const seen = [];
      for (const s of [...project.panoramas].sort((a, b) => b.altitude - a.altitude)) {
        const p = s[key]; if (!p) continue;
        if (seen.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 60) || p[0] < 30 || p[1] < 30 || p[0] > W - 30 || p[1] > H - 30) continue;
        seen.push(p);
        const m = el("g", { class: "station", transform: `translate(${p[0]} ${p[1]})`, tabindex: "0", role: "button", "data-station": s.id, "aria-label": `Panorama 360° – ${s.label}, ${s.short}` });
        const inner = el("g", { class: "station__body" });
        inner.append(el("circle", { class: "station__halo", r: 26 }), el("circle", { class: "station__dot", r: 17 }));
        const t = el("text", { class: "station__txt", y: 1 }); t.textContent = "360°";
        inner.append(t); m.append(inner); g.append(m);
      }
      svg.append(g);
    }
    this.scene.append(svg);
    this.svg = svg;
    this._wire(svg);
  }

  _wire(svg) {
    svg.addEventListener("pointerover", (e) => {
      const g = e.target.closest("[data-plot]"); if (!g || e.pointerType === "touch") return;
      this.cb.onEnter?.(this.nodes.get(g.dataset.plot).plot, "pointer");
    });
    svg.addEventListener("pointerout", (e) => {
      const g = e.target.closest("[data-plot]"); if (!g || g.contains(e.relatedTarget)) return;
      this.cb.onLeave?.(this.nodes.get(g.dataset.plot).plot);
    });
    svg.addEventListener("click", (e) => {
      const s = e.target.closest("[data-station]"); if (s) { this.cb.onStation?.(s.dataset.station); return; }
      const g = e.target.closest("[data-plot]"); if (!g) return;
      this.cb.onSelect?.(this.nodes.get(g.dataset.plot).plot, e.pointerType || "mouse");
    });
    svg.addEventListener("focusin", (e) => {
      const g = e.target.closest("[data-plot]"); if (g) this.cb.onEnter?.(this.nodes.get(g.dataset.plot).plot, "focus");
    });
    svg.addEventListener("focusout", (e) => {
      const g = e.target.closest("[data-plot]"); if (g) this.cb.onLeave?.(this.nodes.get(g.dataset.plot).plot);
    });
    svg.addEventListener("keydown", (e) => {
      const s = e.target.closest("[data-station]");
      if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); this.cb.onStation?.(s.dataset.station); return; }
      const g = e.target.closest("[data-plot]"); if (!g) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.cb.onSelect?.(this.nodes.get(g.dataset.plot).plot, "keyboard"); }
    });
  }

  /** keep labels/strokes legible: counter-scale by the viewer zoom */
  setScale(s) { this.svg?.style.setProperty("--inv", (1 / s).toFixed(4)); }

  update({ selectedId, hoverId, isDim, statusOf }) {
    if (!this.svg) return;
    for (const [id, n] of this.nodes) {
      const st = statusOf ? statusOf(n.plot) : n.plot.status;
      n.g.dataset.status = st;
      n.g.classList.toggle("is-selected", id === selectedId);
      n.g.classList.toggle("is-hover", id === hoverId);
      n.g.classList.toggle("is-dim", !!isDim?.(n.plot));
      n.g.setAttribute("aria-pressed", id === selectedId ? "true" : "false");
      n.g.setAttribute("aria-label", `Parcela ${n.plot.no}, ${n.plot.area} m², ${statusLabel(st)}`);
      this.svg.querySelector(`text[data-for="${id}"]`)?.classList.toggle("is-selected", id === selectedId);
    }
    // selected outline drawn in a top layer (moving the focused node itself would drop keyboard focus)
    const sel = this.nodes.get(selectedId);
    const top = this.svg.querySelector(".plots__selection");
    if (top.dataset.for !== (selectedId || "")) {
      top.dataset.for = selectedId || "";
      top.replaceChildren();
      if (sel) { const shape = sel.g.querySelector(".plot__shape").cloneNode(); shape.setAttribute("class", "plots__sel"); top.append(shape); }
    }
  }

  setVisible({ markers, labels }) {
    this.svg?.classList.toggle("is-hidden", !markers);
    this.svg?.classList.toggle("no-labels", !labels);
  }

  /** draw-in of all boundaries (scene 3 of the intro) */
  traceIn(reduced) {
    if (!this.svg) return;
    this.svg.classList.remove("is-traced");
    if (reduced) { this.svg.classList.add("is-traced", "no-anim"); return; }
    let i = 0;
    for (const [, n] of [...this.nodes].sort((a, b) => a[1].c[1] - b[1].c[1])) n.g.style.setProperty("--d", `${Math.min(900, i++ * 14)}ms`);
    void this.svg.getBoundingClientRect();
    this.svg.classList.add("is-traced");
  }

  boxOf(id) { return this.nodes.get(id)?.box; }
  centerOf(id) { return this.nodes.get(id)?.c; }
  focus(id) { this.nodes.get(id)?.g.focus({ preventScroll: true }); }
  allBox() { return bbox([...this.nodes.values()].flatMap((n) => [[n.box.x, n.box.y], [n.box.x + n.box.w, n.box.y + n.box.h]])); }
}

export { centroid };
