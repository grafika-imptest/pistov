// Pan / zoom viewer for a large image + overlays that share ONE coordinate system (the image's
// natural pixels). Plot polygons live inside the transformed scene, so they stay aligned at any
// viewport size or zoom level.
import { reducedMotion } from "./motion.js";

export class Viewer {
  constructor(viewport, scene, { onChange, onUserGesture } = {}) {
    this.vp = viewport; this.scene = scene;
    this.onChange = onChange; this.onUserGesture = onUserGesture;
    this.s = 1; this.tx = 0; this.ty = 0;
    this.size = [1, 1];
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.interactive = false;
    this.pointers = new Map();
    this._raf = 0;
    this._bind();
    new ResizeObserver(() => this._onResize()).observe(this.vp);
  }

  /** content: { size:[w,h], sources:[[w,url],...], alt } */
  setContent(content) {
    this.content = content; this.size = content.size;
    this.scene.style.width = `${content.size[0]}px`;
    this.scene.style.height = `${content.size[1]}px`;
    let img = this.scene.querySelector("img.viewer__img");
    if (!img) { img = document.createElement("img"); img.className = "viewer__img"; img.decoding = "async"; img.draggable = false; this.scene.prepend(img); }
    img.alt = content.alt || "";
    img.width = content.size[0]; img.height = content.size[1];
    // optional wider surroundings behind the image, so zooming out never shows an empty backdrop
    let sur = this.scene.querySelector("img.viewer__surround");
    if (content.surround) {
      if (!sur) { sur = document.createElement("img"); sur.className = "viewer__surround"; sur.alt = ""; sur.decoding = "async"; sur.draggable = false; this.scene.prepend(sur); }
      const [x, y, w, h] = content.surround.box;
      Object.assign(sur.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      if (sur.getAttribute("src") !== content.surround.src) sur.src = content.surround.src;
    } else sur?.remove();
    this.img = img; this._srcW = 0;
    this._pickSource(true);
  }

  get vw() { return this.vp.clientWidth; }
  get vh() { return this.vp.clientHeight; }
  /** viewport area not covered by panels */
  get free() { const i = this.insets; return { x: i.left, y: i.top, w: Math.max(80, this.vw - i.left - i.right), h: Math.max(80, this.vh - i.top - i.bottom) }; }
  get minScale() {
    const f = this.free, s = Math.min(f.w / this.size[0], f.h / this.size[1]) * 0.85, b = this.content?.surround?.box;
    // with surroundings: never zoom out past them (the whole viewport stays covered)
    return b ? Math.max(s, this.vw / b[2], this.vh / b[3]) : s;
  }
  get maxScale() { return Math.max(2.6 * (window.devicePixelRatio > 1 ? 1 : 1.2), this.minScale * 4); }

  toScreen([x, y]) { return [x * this.s + this.tx, y * this.s + this.ty]; }
  toScene([sx, sy]) { return [(sx - this.tx) / this.s, (sy - this.ty) / this.s]; }

  /** frame a box (scene px) inside the free area */
  fit(box, { padding = 0.08, animate = true, duration = 700, easing, maxScale } = {}) {
    const f = this.free;
    const pw = f.w * (1 - 2 * padding), ph = f.h * (1 - 2 * padding);
    let s = Math.min(pw / box.w, ph / box.h);
    s = Math.min(s, maxScale ?? this.maxScale);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    this.setView({ s, tx: f.x + f.w / 2 - cx * s, ty: f.y + f.h / 2 - cy * s }, { animate, duration, easing });
  }
  /** cover the free area with the box (no letterboxing) */
  cover(box, opts = {}) {
    const f = this.free; const s = Math.max(f.w / box.w, f.h / box.h);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    this.setView({ s, tx: f.x + f.w / 2 - cx * s, ty: f.y + f.h / 2 - cy * s }, opts);
  }

  setView({ s, tx, ty }, { animate = false, duration = 600, easing = "cubic-bezier(.22,.7,.2,1)", clamp = true } = {}) {
    this.s = s; this.tx = tx; this.ty = ty;
    if (clamp) this._clamp();
    const anim = animate && !reducedMotion();
    this.scene.style.transition = anim ? `transform ${duration}ms ${easing}` : "none";
    this.scene.style.transform = `translate3d(${this.tx}px, ${this.ty}px, 0) scale(${this.s})`;
    this._emit(anim ? duration : 0);
  }

  zoomBy(f, at = [this.free.x + this.free.w / 2, this.free.y + this.free.h / 2], animate = true) {
    const s = Math.min(this.maxScale, Math.max(this.minScale, this.s * f));
    const [x, y] = this.toScene(at);
    this.setView({ s, tx: at[0] - x * s, ty: at[1] - y * s }, { animate, duration: 320 });
  }
  panBy(dx, dy, animate = false) { this.setView({ s: this.s, tx: this.tx + dx, ty: this.ty + dy }, { animate, duration: 260 }); }

  _clamp() {
    this.s = Math.min(this.maxScale, Math.max(Math.min(this.minScale, this.s), this.s));
    const f = this.free, W = this.size[0] * this.s, H = this.size[1] * this.s;
    // keep at least the free-area centre on the image
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    const minTx = cx - W, maxTx = cx, minTy = cy - H, maxTy = cy;
    if (W <= f.w) this.tx = Math.min(Math.max(this.tx, f.x), f.x + f.w - W); else this.tx = Math.min(maxTx, Math.max(minTx, this.tx));
    if (H <= f.h) this.ty = Math.min(Math.max(this.ty, f.y), f.y + f.h - H); else this.ty = Math.min(maxTy, Math.max(minTy, this.ty));
    const b = this.content?.surround?.box;
    if (b) { // keep the surroundings under the whole viewport
      this.tx = Math.min(-b[0] * this.s, Math.max(this.vw - (b[0] + b[2]) * this.s, this.tx));
      this.ty = Math.min(-b[1] * this.s, Math.max(this.vh - (b[1] + b[3]) * this.s, this.ty));
    }
  }

  _emit(settleMs) {
    cancelAnimationFrame(this._raf);
    const t0 = performance.now();
    const loop = () => { this.onChange?.(this); this._pickSource(); if (performance.now() - t0 < settleMs + 40) this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  // progressive resolution: load a larger file only when the displayed size needs it
  _pickSource(force = false) {
    if (!this.content?.sources) return;
    // first paint: same rule as the <link rel=preload imagesrcset> (viewport width × DPR) so the preloaded file is reused
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const need = force ? this.vw * (window.devicePixelRatio || 1) : this.size[0] * this.s * dpr;
    const list = this.content.sources;
    const pick = list.find(([w]) => w >= need * 0.9) || list[list.length - 1];
    if (!force && pick[0] <= this._srcW) return;
    this._srcW = pick[0];
    if (force || !this.img.src) { this.img.src = pick[1]; return; }
    const pre = new Image(); pre.decoding = "async"; pre.src = pick[1];
    const url = pick[1];
    pre.decode().then(() => { if (this._srcW === pick[0] && this.content.sources.some((s) => s[1] === url)) this.img.src = url; }).catch(() => {});
  }

  _onResize() {
    if (!this.content) return;
    this.onResize ? this.onResize() : this.setView({ s: this.s, tx: this.tx, ty: this.ty });
  }

  _bind() {
    const vp = this.vp;
    let dragStart = null, moved = 0, pinch = null;
    vp.addEventListener("pointerdown", (e) => {
      if (!this.interactive || e.button > 0) return;
      if (e.target.closest("[data-no-pan]")) return;
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (this.pointers.size === 1) { dragStart = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty }; moved = 0; }
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: this.s, mid: this._local([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) };
      }
    });
    vp.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (this.pointers.size === 2 && pinch) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const s = Math.min(this.maxScale, Math.max(this.minScale, pinch.s * (d / pinch.d)));
        const [x, y] = this.toScene(pinch.mid);
        this.setView({ s, tx: pinch.mid[0] - x * s, ty: pinch.mid[1] - y * s });
        moved = 99; return;
      }
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 4) {
        if (!vp.hasPointerCapture(e.pointerId)) vp.setPointerCapture(e.pointerId);
        vp.classList.add("is-dragging");
        this.setView({ s: this.s, tx: dragStart.tx + dx, ty: dragStart.ty + dy });
        this.onUserGesture?.();
      }
    });
    const end = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) pinch = null;
      if (this.pointers.size === 0) { dragStart = null; vp.classList.remove("is-dragging"); }
    };
    vp.addEventListener("pointerup", end);
    vp.addEventListener("pointercancel", end);
    // a drag must not end as a click on a plot
    vp.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);

    vp.addEventListener("wheel", (e) => {
      if (!this.interactive) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this.zoomBy(Math.exp(-e.deltaY * 0.0022), this._local([e.clientX, e.clientY]), false);
        this.onUserGesture?.();
      } else {
        this.onWheelHint?.();
      }
    }, { passive: false });
    vp.addEventListener("dblclick", (e) => {
      if (!this.interactive || e.target.closest("[data-plot]")) return;
      this.zoomBy(1.8, this._local([e.clientX, e.clientY]));
    });
    vp.addEventListener("keydown", (e) => {
      if (!this.interactive) return;
      const step = 80;
      const map = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (map[e.key] && !e.target.closest("[data-plot]")) { e.preventDefault(); this.panBy(...map[e.key], true); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); this.zoomBy(1.4); }
      else if (e.key === "-") { e.preventDefault(); this.zoomBy(1 / 1.4); }
    });
  }
  _local([cx, cy]) { const r = this.vp.getBoundingClientRect(); return [cx - r.left, cy - r.top]; }
}
