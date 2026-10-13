// House-on-plot visualisation with a construction timelapse.
//
// Contract (acceptance criteria):
//  - state "plot"  → the selected plot without a house
//  - state "house" → ALWAYS (re)starts the construction animation of the CURRENT house/variant from frame 0,
//                    and holds the final frame until the selection changes or the state goes back to "plot"
//  - any new request aborts the previous one (no overlapping playback, no stale frames)
//
// Players: VideoPlayer / FramesPlayer play the supplied animation (variant.timelapse);
// when a variant has no animation yet, SchematicPlayer builds the house from the catalogue
// dimensions on the exact plot drawing and then reveals the architect's render.
import { SiteDrawing } from "./schematic.js";
import { reducedMotion, wait } from "./motion.js";

class VideoPlayer {
  constructor(host) { this.host = host; }
  async prepare(tl, signal) {
    const v = document.createElement("video");
    v.className = "tl__video"; v.muted = true; v.playsInline = true; v.preload = "auto"; v.setAttribute("aria-hidden", "true");
    if (tl.poster) v.poster = tl.poster;
    if (tl.srcWebm) { const s = document.createElement("source"); s.src = tl.srcWebm; s.type = "video/webm"; v.append(s); }
    const s = document.createElement("source"); s.src = tl.src; s.type = "video/mp4"; v.append(s);
    this.host.replaceChildren(v); this.v = v;
    await new Promise((res, rej) => {
      if (v.readyState >= 3) return res();
      v.addEventListener("canplay", res, { once: true });
      v.addEventListener("error", () => rej(new Error("video error")), { once: true });
      signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")), { once: true });
      v.load();
    });
  }
  async play(signal) {
    const v = this.v; v.currentTime = 0;
    await v.play();
    await new Promise((res, rej) => {
      v.addEventListener("ended", res, { once: true }); // video stays on its last frame
      signal.addEventListener("abort", () => { v.pause(); rej(new DOMException("aborted", "AbortError")); }, { once: true });
    });
  }
  showFinal() { if (this.v && this.v.duration) { this.v.pause(); this.v.currentTime = this.v.duration; } }
  dispose() { this.v?.pause(); this.v?.removeAttribute("src"); this.host.replaceChildren(); }
}

class FramesPlayer {
  constructor(host) { this.host = host; }
  async prepare(tl, signal) {
    const c = document.createElement("canvas"); c.className = "tl__canvas"; c.setAttribute("aria-hidden", "true");
    this.host.replaceChildren(c); this.c = c; this.fps = tl.fps || 24;
    this.imgs = await Promise.all(tl.frames.map((src) => { const i = new Image(); i.decoding = "async"; i.src = src; return i.decode().then(() => i); }));
    if (signal.aborted) throw new DOMException("aborted", "AbortError");
    c.width = this.imgs[0].naturalWidth; c.height = this.imgs[0].naturalHeight;
    this.draw(0);
  }
  draw(i) { const img = this.imgs?.[i]; if (img && !this.disposed) this.c.getContext("2d").drawImage(img, 0, 0); }
  play(signal) {
    return new Promise((res, rej) => {
      const t0 = performance.now(); let id;
      const step = (now) => {
        const i = Math.min(this.imgs.length - 1, Math.floor(((now - t0) / 1000) * this.fps));
        if (this.disposed) return;
        this.draw(i);
        if (i < this.imgs.length - 1) id = requestAnimationFrame(step); else res();
      };
      id = requestAnimationFrame(step);
      signal.addEventListener("abort", () => { cancelAnimationFrame(id); rej(new DOMException("aborted", "AbortError")); }, { once: true });
    });
  }
  showFinal() { this.draw(this.imgs.length - 1); }
  dispose() { this.disposed = true; this.imgs = null; this.host.replaceChildren(); }
}

export class TimelapseStage {
  /** els: { drawing, media, final, loader, status }  – callbacks: onPhase(phase) */
  constructor(els, project, { onPhase } = {}) {
    this.els = els; this.project = project; this.onPhase = onPhase;
    this.drawing = new SiteDrawing(els.drawing, project);
    this.run = 0; this.ctrl = null; this.player = null;
  }

  /** ctx: { plot, type, layout, variant }, state: "plot" | "house" */
  async show(ctx, state) {
    this.ctrl?.abort();
    const ctrl = (this.ctrl = new AbortController());
    const run = ++this.run;
    const { signal } = ctrl;
    const root = this.els.root;
    const plotChanged = ctx.plot !== this.ctx?.plot;
    this.ctx = ctx; this.state = state;
    if (plotChanged) this.drawing.setPlot(ctx.plot);
    this.player?.dispose(); this.player = null;
    this._final(null);
    root.dataset.phase = state === "plot" ? "plot" : "building";

    if (state === "plot") {
      this.drawing.clearHouse();
      const tl = ctx.variant?.timelapse;
      root.dataset.source = tl?.poster ? "poster" : "drawing";
      if (tl?.poster) this._final(tl.poster, "empty");
      this._prefetch(tl);
      this.onPhase?.("plot");
      return;
    }

    const tl = ctx.variant?.timelapse;
    const render = ctx.variant ? this.project.img(ctx.variant.images[0], 1600) : null;
    const loaderTimer = setTimeout(() => run === this.run && root.classList.add("is-loading"), 160);
    try {
      if (tl && (tl.kind === "video" || tl.kind === "frames")) {
        root.dataset.source = tl.kind;
        this.drawing.clearHouse();
        const P = tl.kind === "video" ? VideoPlayer : FramesPlayer;
        this.player = new P(this.els.media);
        await this.player.prepare(tl, signal);
        clearTimeout(loaderTimer); root.classList.remove("is-loading");
        this.onPhase?.("building");
        if (reducedMotion()) this.player.showFinal(); else await this.player.play(signal);
      } else {
        root.dataset.source = "schematic";
        const ready = render ? this._preload(render) : Promise.resolve();
        clearTimeout(loaderTimer); root.classList.remove("is-loading");
        this.onPhase?.("building");
        if (reducedMotion()) this.drawing.showBuilt(ctx.type, ctx.layout, ctx.variant);
        else await this.drawing.build(ctx.type, ctx.layout, ctx.variant, signal);
        await ready;
        if (signal.aborted) return;
        if (!reducedMotion()) await wait(220, signal);
        if (render) this._final(render, "render", ctx.variant);
      }
      if (run !== this.run) return;
      root.dataset.phase = "built";
      this.onPhase?.("built");
    } catch (e) {
      clearTimeout(loaderTimer); root.classList.remove("is-loading");
      if (e.name === "AbortError" || run !== this.run) return;
      // asset failed → honest static fallback: show the render (or keep the drawing)
      console.warn("[timelapse] playback failed, showing static visualisation", e);
      this.drawing.showBuilt(ctx.type, ctx.layout, ctx.variant);
      if (render) this._final(render, "render", ctx.variant);
      root.dataset.phase = "built";
      this.onPhase?.("built");
    }
  }

  replay() { if (this.ctx) this.show(this.ctx, "house"); }

  /** warm the cache while the visitor looks at the empty plot, so the toggle starts without delay */
  _prefetch(tl) {
    if (!tl || this._prefetched === tl) return;
    this._prefetched = tl;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(() => {
      if (tl.kind === "frames") tl.frames.forEach((src) => { const i = new Image(); i.src = src; });
      else if (tl.kind === "video") { const l = document.createElement("link"); l.rel = "preload"; l.as = "video"; l.href = tl.src; document.head.append(l); }
    });
  }
  _preload(src) { const i = new Image(); i.decoding = "async"; i.src = src; return i.decode().catch(() => {}); }
  _final(src, kind, variant) {
    const img = this.els.final;
    if (!src) { img.classList.remove("is-on"); img.removeAttribute("data-kind"); return; }
    if (variant) { img.srcset = this.project.imgSet(variant.images[0], [480, 960, 1600]); img.sizes = "(min-width: 1000px) 62vw, 100vw"; } else { img.removeAttribute("srcset"); }
    img.src = src; img.dataset.kind = kind;
    img.alt = kind === "render" ? `Vizualizace: ${this.ctx.type?.name}, ${variant?.name}` : "Prázdná parcela";
    requestAnimationFrame(() => img.classList.add("is-on"));
  }
}
