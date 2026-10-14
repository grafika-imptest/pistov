// Lightweight 360° viewer for equirectangular drone panoramas (WebGL, no dependencies) with a vector
// overlay of plot boundaries. Plots are projected from the georeferenced site plan: plan px → metres
// (east/north) → ray from the drone (known GPS + height above the take-off ground) → screen.
// Terrain is treated as flat at take-off level, so the overlay is indicative, not survey-accurate.
import { reducedMotion, tween, ease } from "./motion.js";

const NS = "http://www.w3.org/2000/svg";
const D2R = Math.PI / 180;
const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision highp float; varying vec2 v;
uniform sampler2D tex; uniform vec3 R; uniform vec3 U; uniform vec3 F; uniform vec2 k; uniform float heading; uniform float fade;
const float PI = 3.14159265359;
void main(){
  vec3 d = normalize(R * v.x * k.x + U * v.y * k.y + F);
  float bearing = atan(d.x, d.z);               // world: x = east, y = up, z = north
  float elev = asin(clamp(d.y, -1.0, 1.0));
  float u = fract(0.5 + (bearing - heading) / (2.0 * PI));
  float t = 0.5 - elev / PI;
  gl_FragColor = vec4(texture2D(tex, vec2(u, t)).rgb * fade, 1.0);
}`;

export function planToMetres(geo, [px, py]) {
  const u = px - geo.tx, v = py - geo.ty, k = geo.a * geo.a + geo.b * geo.b;
  return [(geo.a * u + geo.b * v) / k, (geo.b * u - geo.a * v) / k]; // [east, north] in metres
}
export function bearingTo(from, to) { return (Math.atan2(to[0] - from[0], to[1] - from[1]) / D2R + 360) % 360; }

export class PanoramaViewer {
  /**
   * opts: { stations, geo, plots, statusOf, overlays, interactive, onHover(plot, pt), onLeave(plot), onSelect(plot),
   *         onStation(station), onChange(viewer), labels }
   */
  constructor(root, opts) {
    this.root = root; this.o = opts;
    this.yaw = 0; this.pitch = -20; this.fov = 75; // vertical fov, degrees
    this.minPitch = -88; this.maxPitch = 42;       // zenith of drone panoramas is a blurred fill – keep it out of view
    this.show = { markers: true, labels: true };
    root.classList.add("pano");
    root.innerHTML = `<canvas class="pano__gl"></canvas><svg class="pano__svg" aria-label="Parcely v panoramatu"></svg><div class="pano__loading" aria-hidden="true"><span></span></div>`;
    this.canvas = root.querySelector("canvas"); this.svg = root.querySelector("svg");
    this.gl = this.canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
    if (!this.gl) { root.classList.add("pano--nogl"); return; }
    this._initGL();
    this._bind();
    new ResizeObserver(() => this.render()).observe(root);
  }

  get maxTex() { return this.gl ? this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) : 0; }

  // ---------------- scene ----------------
  async setStation(st, view, { animate = true } = {}) {
    const token = (this._token = (this._token || 0) + 1);
    const prev = this.station;
    this.station = st;
    this._prepareOverlay();
    if (view) Object.assign(this, { yaw: view.yaw ?? this.yaw, pitch: view.pitch ?? this.pitch, fov: view.fov ?? this.fov });
    this.root.classList.add("is-loading");
    // 4096 px ≈ 11 px per degree; use 8192 when the viewport needs more detail (not on phones – GPU memory)
    const phone = navigator.maxTouchPoints > 0 && Math.min(innerWidth, innerHeight) < 600;
    const big = !phone && this.maxTex >= 8192 && (this.root.clientHeight || innerHeight) * (window.devicePixelRatio || 1) / 75 > 12 ? 8192 : 4096;
    // quick low-res first paint, then full resolution
    const low = await this._load(st.sources[1024]).catch(() => null);
    if (token !== this._token) return;
    if (low) { this._upload(low); if (animate && prev && !reducedMotion()) this._fadeIn(); this.render(); }
    const full = await this._load(st.sources[big]).catch(() => null);
    if (token !== this._token) return;
    if (full) { this._upload(full); this.render(); }
    this.root.classList.remove("is-loading");
    this.o.onStation?.(st);
  }

  lookAt(yaw, pitch, fov, { animate = true, duration = 900 } = {}) {
    const y0 = this.yaw, p0 = this.pitch, f0 = this.fov;
    const dy = ((yaw - y0 + 540) % 360) - 180;
    const go = (t) => { this.yaw = (y0 + dy * t + 360) % 360; this.pitch = p0 + (pitch - p0) * t; this.fov = f0 + ((fov ?? f0) - f0) * t; this._clamp(); this.render(); };
    this._lookCtrl?.abort(); this._lookCtrl = new AbortController();
    if (!animate) return go(1);
    return tween(duration, go, { easing: ease.inOut, signal: this._lookCtrl.signal }).catch(() => {});
  }

  /** turn the camera towards a plot and frame it */
  lookAtPlot(plot, opts) {
    const a = this._plotAngles(plot); if (!a) return;
    const fov = Math.max(28, Math.min(70, a.extent * 3.2));
    // keep the plot in the middle of the area not covered by panels
    const w = this.root.clientWidth || 1, h = this.root.clientHeight || 1, i = this.insets || { left: 0, right: 0 };
    const tx = Math.tan((fov * D2R) / 2) * (w / h);
    const shift = Math.atan((((i.right || 0) - (i.left || 0)) / 2 / (w / 2)) * tx) / D2R;
    return this.lookAt(a.yaw + shift, Math.max(this.minPitch + 4, Math.min(a.pitch + fov * 0.12, 10)), fov, opts);
  }
  /** angular position of a plot as seen from the current station */
  _plotAngles(plot) {
    const pts = this._plotM.get(plot.id); if (!pts) return null;
    const s = this.station.enu, h = this.station.altitude;
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    const d = Math.hypot(c[0] - s[0], c[1] - s[1]);
    const ext = Math.max(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))) * 2;
    return { yaw: bearingTo(s, c), pitch: -Math.atan2(h, d) / D2R, extent: Math.atan2(ext, Math.hypot(d, h)) / D2R, distance: d };
  }
  zoomBy(f) { this.lookAt(this.yaw, this.pitch, this.fov / f, { duration: 260 }); }

  setState({ selectedId, hoverId, isDim, statusOf }) { this.sel = selectedId; this.hov = hoverId; this.isDim = isDim; this.statusOf = statusOf; this.render(); }
  setVisible({ markers, labels }) { this.show = { markers, labels }; this.svg?.classList.toggle("is-hidden", this.o.overlays === false || !markers); this.render(); }

  // ---------------- GL ----------------
  _initGL() {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = Object.fromEntries(["R", "U", "F", "k", "heading", "fade", "tex"].map((n) => [n, gl.getUniformLocation(prog, n)]));
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fade = 1;
  }
  _load(src) { const i = new Image(); i.decoding = "async"; i.src = src; return i.decode().then(() => i); }
  _upload(img) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); this.hasTex = true; }
  _fadeIn() { tween(450, (t) => { this.fade = 0.35 + 0.65 * t; this.render(); }, { easing: ease.out }); }

  _basis() {
    const y = this.yaw * D2R, p = this.pitch * D2R;
    const F = [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)];
    const R = [Math.cos(y), 0, -Math.sin(y)];
    const U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
    const w = this.root.clientWidth || 1, h = this.root.clientHeight || 1;
    const ty = Math.tan((this.fov * D2R) / 2), tx = ty * (w / h);
    return { F, R, U, tx, ty, w, h };
  }

  render() {
    if (!this.gl || this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const b = this._basis(), gl = this.gl, dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(b.w * dpr), H = Math.round(b.h * dpr);
      if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; }
      gl.viewport(0, 0, W, H);
      if (this.hasTex && this.station) {
        gl.uniform3fv(this.u.R, b.R); gl.uniform3fv(this.u.U, b.U); gl.uniform3fv(this.u.F, b.F);
        gl.uniform2f(this.u.k, b.tx, b.ty); gl.uniform1f(this.u.heading, this.station.heading * D2R); gl.uniform1f(this.u.fade, this.fade);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      this._drawOverlay(b);
      this.o.onChange?.(this);
    });
  }

  // ---------------- overlay ----------------
  _prepareOverlay() {
    const { geo, plots } = this.o;
    this._plotM = new Map();
    for (const p of plots) {
      if (p.geometry) this._plotM.set(p.id, p.geometry.plan.map((q) => planToMetres(geo, q)));
      else this._plotM.set(p.id, [planToMetres(geo, p.label.plan)]); // marker-only plots
    }
    this.svg.replaceChildren();
    const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
    this.nodes = new Map();
    const gP = mk("g", { class: "pano__plots" }), gL = mk("g", { class: "pano__labels", "aria-hidden": "true" }), gS = mk("g", { class: "pano__stations" });
    for (const p of plots) {
      const path = mk("path", { class: "pano__plot", "data-plot": p.id, tabindex: this.o.interactive ? "0" : "-1", role: this.o.interactive ? "button" : "presentation" });
      path.setAttribute("aria-label", `Parcela ${p.no}, ${p.area} m²`);
      const label = mk("text", { class: "pano__no" }); label.textContent = p.no;
      gP.append(path); gL.append(label);
      this.nodes.set(p.id, { plot: p, path, label });
    }
    this.stationNodes = new Map();
    const placed = [this.station.enu];
    // one marker per position (the higher shot wins where two altitudes share a spot)
    if (this.o.interactive) for (const s of [...this.o.stations].sort((x, y) => y.altitude - x.altitude)) {
      if (placed.some((p) => Math.hypot(p[0] - s.enu[0], p[1] - s.enu[1]) < 15)) continue;
      placed.push(s.enu);
      const g = mk("g", { class: "pano__station", "data-station": s.id, tabindex: "0", role: "button", "aria-label": `Přesunout se: ${s.label}, ${s.short}` });
      // eye icon = "look from here" (same symbol as the views control)
      g.append(mk("circle", { r: "17" }), mk("path", { d: "M-9.5 0C-7 -4.6 -3.8 -6 0 -6S7 -4.6 9.5 0C7 4.6 3.8 6 0 6S-7 4.6 -9.5 0Z", class: "pano__station-eye" }), mk("circle", { r: "2.6", class: "pano__station-pupil" }));
      const t = mk("text", { y: "34" }); t.textContent = s.short; g.append(t);
      gS.append(g); this.stationNodes.set(s.id, { s, g });
    }
    this.svg.append(gP, gS, gL);
  }

  /** world point (metres east/north, height 0 = take-off ground) → screen px, with near-plane clipping */
  _cam(b, [e, n], z = 0) {
    const s = this.station.enu, h = this.station.altitude;
    const P = [e - s[0], z - h, n - s[1]];
    return [P[0] * b.R[0] + P[1] * b.R[1] + P[2] * b.R[2], P[0] * b.U[0] + P[1] * b.U[1] + P[2] * b.U[2], P[0] * b.F[0] + P[1] * b.F[1] + P[2] * b.F[2]];
  }
  _scr(b, c) { return [b.w / 2 + (c[0] / c[2] / b.tx) * (b.w / 2), b.h / 2 - (c[1] / c[2] / b.ty) * (b.h / 2)]; }
  _clip(poly, near = 1) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length];
      const ai = a[2] >= near, ci = c[2] >= near;
      if (ai) out.push(a);
      if (ai !== ci) { const t = (near - a[2]) / (c[2] - a[2]); out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, near]); }
    }
    return out;
  }
  _drawOverlay(b) {
    if (!this.nodes) return;
    const show = this.o.overlays !== false && this.show.markers;
    this.svg.classList.toggle("is-hidden", !show);
    this.svg.setAttribute("viewBox", `0 0 ${b.w} ${b.h}`);
    for (const [id, n] of this.nodes) {
      const pts = this._plotM.get(id);
      const st = this.statusOf ? this.statusOf(n.plot) : n.plot.status;
      n.path.dataset.status = st;
      n.path.classList.toggle("is-selected", id === this.sel);
      n.path.classList.toggle("is-hover", id === this.hov);
      n.path.classList.toggle("is-dim", !!this.isDim?.(n.plot));
      if (pts.length === 1) {
        // marker-only plot: small ground disc
        const c = this._cam(b, pts[0]);
        if (c[2] < 1) { n.path.setAttribute("d", ""); n.label.setAttribute("visibility", "hidden"); continue; }
        const [x, y] = this._scr(b, c); const r = Math.max(5, Math.min(16, 900 / c[2]));
        n.path.setAttribute("d", `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`);
        this._label(n, x, y, c[2]);
        continue;
      }
      const cam = this._clip(pts.map((p) => this._cam(b, p)));
      if (cam.length < 3) { n.path.setAttribute("d", ""); n.label.setAttribute("visibility", "hidden"); continue; }
      const scr = cam.map((c) => this._scr(b, c));
      n.path.setAttribute("d", scr.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("") + "Z");
      const cen = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
      const cc = this._cam(b, cen);
      if (cc[2] > 1) { const [x, y] = this._scr(b, cc); this._label(n, x, y, cc[2]); } else n.label.setAttribute("visibility", "hidden");
    }
    for (const [, { s, g }] of this.stationNodes) {
      const c = this._cam(b, s.enu, 0);
      if (c[2] < 5) { g.setAttribute("visibility", "hidden"); continue; }
      const [x, y] = this._scr(b, c);
      const off = x < -40 || x > b.w + 40 || y < -40 || y > b.h + 40;
      g.setAttribute("visibility", off ? "hidden" : "visible");
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${Math.min(y, b.h - 50).toFixed(1)})`);
    }
  }
  _label(n, x, y, dist) {
    const vis = this.show.labels && dist < 900 && x > -20 && x < this.root.clientWidth + 20;
    n.label.setAttribute("visibility", vis || n.plot.id === this.sel ? "visible" : "hidden");
    n.label.setAttribute("x", x.toFixed(1)); n.label.setAttribute("y", y.toFixed(1));
    n.label.style.fontSize = `${Math.max(10, Math.min(18, 2600 / dist))}px`;
    n.label.classList.toggle("is-selected", n.plot.id === this.sel);
  }
  /** screen anchor of a plot (for tooltips) */
  anchorOf(id) {
    const n = this.nodes?.get(id); if (!n) return null;
    const bb = n.path.getBBox?.(); if (!bb || !bb.width) return null;
    return { x: bb.x + bb.width / 2, y: bb.y, h: bb.height };
  }

  _clamp() { this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch)); this.fov = Math.max(22, Math.min(100, this.fov)); }

  // ---------------- input ----------------
  _bind() {
    const el = this.root;
    let drag = null, moved = 0; const ptrs = new Map(); let pinch = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      this._lookCtrl?.abort(); this.stopAuto?.();
      if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; moved = 0; }
      if (ptrs.size === 2) { const [a, c] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - c[0], a[1] - c[1]), fov: this.fov }; }
    });
    el.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch) { const [a, c] = [...ptrs.values()]; this.fov = pinch.fov * (pinch.d / Math.hypot(a[0] - c[0], a[1] - c[1])); this._clamp(); this.render(); moved = 99; return; }
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved < 4) return;
      if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      const degPerPx = this.fov / (el.clientHeight || 1);
      this.yaw = (drag.yaw - dx * degPerPx + 360) % 360; this.pitch = drag.pitch + dy * degPerPx; this._clamp(); this.render();
    });
    const end = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { drag = null; el.classList.remove("is-dragging"); } };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("click", (e) => {
      if (moved > 6) { e.stopPropagation(); moved = 0; return; }
      const st = e.target.closest("[data-station]");
      if (st) { this.o.onStationClick?.(st.dataset.station); return; }
      const p = e.target.closest("[data-plot]");
      if (p && this.o.interactive) this.o.onSelect?.(this.nodes.get(p.dataset.plot).plot);
    }, true);
    el.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey) && this.o.wheelNeedsModifier) { this.o.onWheelHint?.(); return; }
      e.preventDefault(); this.fov *= Math.exp(e.deltaY * 0.0012); this._clamp(); this.render();
    }, { passive: false });
    el.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
      if (step && !e.target.closest("[data-plot]")) { e.preventDefault(); this.lookAt(this.yaw + step[0], this.pitch + step[1], this.fov, { duration: 200 }); }
      const p = e.target.closest("[data-plot]");
      if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); this.o.onSelect?.(this.nodes.get(p.dataset.plot).plot); }
      const s = e.target.closest("[data-station]");
      if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); this.o.onStationClick?.(s.dataset.station); }
    });
    this.svg.addEventListener("pointerover", (e) => { const p = e.target.closest("[data-plot]"); if (p && e.pointerType !== "touch") this.o.onHover?.(this.nodes.get(p.dataset.plot).plot); });
    this.svg.addEventListener("pointerout", (e) => { const p = e.target.closest("[data-plot]"); if (p && !p.contains(e.relatedTarget)) this.o.onLeave?.(this.nodes.get(p.dataset.plot).plot); });
    this.svg.addEventListener("focusin", (e) => { const p = e.target.closest("[data-plot]"); if (p) this.o.onHover?.(this.nodes.get(p.dataset.plot).plot); });
    this.svg.addEventListener("focusout", (e) => { const p = e.target.closest("[data-plot]"); if (p) this.o.onLeave?.(this.nodes.get(p.dataset.plot).plot); });
  }

  /** slow auto-rotation (teaser); stops on interaction or when hidden */
  autoRotate(degPerSec = 2.2) {
    if (reducedMotion()) return;
    this.stopAuto?.();
    let last = performance.now(), id, on = true;
    const step = (t) => { if (!on) return; this.yaw = (this.yaw + ((t - last) / 1000) * degPerSec) % 360; last = t; this.render(); id = requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    this.stopAuto = () => { on = false; cancelAnimationFrame(id); this.stopAuto = null; };
  }
}
