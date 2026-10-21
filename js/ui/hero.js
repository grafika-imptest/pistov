// Cinematic introduction on the real aerial visualisation.
// Scene 1 – arrival: close camera over the development; the architect's site plan lies on the ground.
// Scene 2 – transformation: the drawing dissolves and the planned houses of the visualisation appear
//           while the camera travels across the locality (2.5D camera move, not a 3D fly-through).
// Scene 3 – exploration: camera settles on the overview; boundaries trace in, controls appear.
import { reducedMotion, wait } from "../core/motion.js";
import { draw } from "./sketch.js";
import { HeroNotes } from "./heroNotes.js";
import { smoothTo } from "../site/smooth.js";

// once per browser session: a new visit starts with the film, coming back from a subpage does not
const KEY = "pistov:intro-seen";

export class Intro {
  constructor(root, explorer) {
    this.root = root; this.explorer = explorer;
    this.caption = root.querySelector("[data-intro-caption]");
    this.notes = new HeroNotes(root, explorer, explorer.project.heroNotes);
    // the arrow follows the camera, so it always points at the development
    explorer.onViewChange = () => { if (root.dataset.phase !== "explore") this.notes.update(); };
    window.addEventListener("resize", () => {
      this.notes.update();
      // the hero framing is recomputed on resize → restart the drift from the new framing
      if (root.dataset.phase !== "ready" || reducedMotion()) return;
      this._stopDrift();
      clearTimeout(this._rz);
      this._rz = setTimeout(() => { if (root.dataset.phase === "ready") { explorer.heroFrame(false); this._startDrift(); } }, 400);
    });
    // the drift only runs while the hero is on screen
    new IntersectionObserver(([e]) => { this._heroVisible = e.isIntersecting; }, { threshold: 0.05 }).observe(root);
  }

  /** after the intro: slow left → right pan with a slight zoom over the aerial view, there and back,
   *  like the self-rotating panorama in the Lokalita section. Any interaction with the map stops it. */
  _startDrift(delay = 0) {
    this._stopDrift();
    if (reducedMotion() || this.root.dataset.phase !== "ready") return;
    if (delay) { this._driftTimer = setTimeout(() => this._startDrift(), delay); return; }
    const v = this.explorer.viewer, f = v.free;
    const s0 = v.s, tx0 = v.tx, ty0 = v.ty;
    const [cx0, cy0] = v.toScene([f.x + f.w / 2, f.y + f.h / 2]);
    const Z = 0.07, s1 = s0 * (1 + Z);                                     // zoom in by 7 %
    const D = Math.max(0, Math.min(v.size[0] * 0.14, v.size[0] - f.w / (2 * s1) - cx0)); // travel to the right (scene px)
    const T = 56000;                                                      // one there-and-back cycle
    let t = 0, last = performance.now();
    const step = (now) => {
      if (this.root.dataset.phase !== "ready") { this._stopDrift(); return; }
      const dt = Math.min(64, now - last); last = now;
      if (this._heroVisible !== false && !document.hidden) {
        t += dt;
        const p = (1 - Math.cos((2 * Math.PI * t) / T)) / 2;               // 0 → 1 → 0, soft at both ends
        const s = s0 * (1 + Z * p), cx = cx0 + D * p;
        let tx = f.x + f.w / 2 - cx * s, ty = f.y + f.h / 2 - cy0 * s;
        // never reveal the edge of the image (bounds widened to the start so nothing jumps)
        const W = v.size[0] * s, H = v.size[1] * s;
        if (W >= f.w) tx = Math.min(Math.max(f.x, tx0), Math.max(Math.min(f.x + f.w - W, tx0), tx));
        if (H >= f.h) ty = Math.min(Math.max(f.y, ty0), Math.max(Math.min(f.y + f.h - H, ty0), ty));
        v.setView({ s, tx, ty }, { clamp: false });
      }
      this._drift = requestAnimationFrame(step);
    };
    this._drift = requestAnimationFrame(step);
    // stop as soon as the visitor takes over the map
    const off = (this._driftOff = new AbortController());
    const stop = () => this._stopDrift();
    v.vp.addEventListener("pointerdown", stop, { signal: off.signal });
    v.vp.addEventListener("keydown", stop, { signal: off.signal });
    v.vp.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) stop(); }, { signal: off.signal, passive: true });
  }
  _stopDrift() {
    cancelAnimationFrame(this._drift); this._drift = 0;
    clearTimeout(this._driftTimer);
    this._driftOff?.abort(); this._driftOff = null;
  }

  get seen() { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } }
  markSeen() { try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ } }

  /** play the intro film again on request (button in the hero) */
  replay() {
    this.ctrl?.abort();
    this._removeVideo();
    smoothTo(0, { immediate: true });
    this.root.classList.remove("hero-in");
    this.notes.stop();
    return this.play({ force: true });
  }

  async play({ force = false } = {}) {
    const ex = this.explorer, v = ex.viewer, root = this.root;
    this._stopDrift();
    this.notes.stop();
    this.ctrl = new AbortController(); const { signal } = this.ctrl;
    root.dataset.phase = "intro";
    v.interactive = false;
    const all = ex.layer.allBox();
    const short = !force && (this.seen || reducedMotion() || window.innerWidth < 700);
    if (short) { this._settle(); return; }

    // preferred: the intro film (drone over the plots → houses rise → fly-through → back to the overview)
    if (ex.project.introVideo) {
      try {
        const played = await this._playVideo(signal);
        if (played) {
          ex.useMainImage({ fade: true });
          ex.heroFrame(true, 1900);
          await wait(1950, signal);
          this._caption("");
          this.markSeen();
          root.dataset.phase = "ready";
          v.interactive = true;
          this._startDrift();
          this.notes.start();
          return;
        }
      } catch (e) { if (e.name === "AbortError") return; throw e; }
    }

    // fallback: the architect's plan laid on the aerial view dissolves into the visualisation
    const overlay = ex.addPlanOverlay();
    root.classList.add("is-drawing");
    // Scene 1: close over the northern streets
    v.cover({ x: all.x + all.w * 0.12, y: all.y + all.h * 0.02, w: all.w * 0.7, h: all.h * 0.6 }, { animate: false });
    this._caption("Situační plán");
    try {
      await wait(350, signal);
      root.classList.add("hero-in");
      draw(root.querySelector(".hero"));
      await wait(900, signal);
      // Scene 2: the drawing becomes the place
      root.classList.add("is-transforming");
      overlay?.classList.add("is-sweeping");
      v.cover({ x: all.x + all.w * 0.22, y: all.y + all.h * 0.28, w: all.w * 0.85, h: all.h * 0.72 }, { animate: true, duration: 3600, easing: "cubic-bezier(.45,.05,.35,1)" });
      await wait(1500, signal);
      root.classList.remove("is-drawing");
      this._caption("Vizualizace budoucí zástavby");
      await wait(2300, signal);
      // Scene 3 (part 1): rise to the overview and stop
      ex.heroFrame(true, 1900);
      await wait(1950, signal);
      overlay?.remove();
      this._caption("");
      this.markSeen();
      root.dataset.phase = "ready";
      v.interactive = true;
      this._startDrift();
      this.notes.start();
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
  }

  /** full-bleed intro film; resolves true when it played to the end, false when it cannot play */
  async _playVideo(signal) {
    const cfg = this.explorer.project.introVideo, root = this.root, v = this.explorer.viewer;
    const el = document.createElement("video");
    el.className = "hero-video"; el.muted = true; el.defaultMuted = true; el.playsInline = true; el.preload = "auto";
    el.setAttribute("muted", ""); el.setAttribute("playsinline", ""); el.setAttribute("aria-hidden", "true");
    el.poster = cfg.poster;
    el.src = window.innerWidth >= 900 && !navigator.connection?.saveData ? cfg.src.hd : cfg.src.sd;
    root.querySelector("[data-viewer]").after(el);
    this.video = el;
    // the interactive aerial sits underneath in exactly the framing of the film's last frame → seamless hand-over
    v.cover(cfg.endBox, { animate: false });
    root.classList.add("has-video");
    try { await el.play(); } catch { this._removeVideo(); return false; }
    this._caption(cfg.caption);
    const ended = new Promise((res, rej) => {
      el.addEventListener("ended", () => res(true), { once: true });
      el.addEventListener("error", () => res(false), { once: true });
      signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")), { once: true });
    });
    await wait(900, signal);
    root.classList.add("hero-in");
    draw(root.querySelector(".hero"));
    const ok = await ended;
    el.classList.add("is-out");
    root.classList.remove("has-video");
    setTimeout(() => this._removeVideo(), 1000);
    return ok;
  }
  _removeVideo() { this.video?.remove(); this.video = null; this.root.classList.remove("has-video"); }

  /** skip: jump to the final framing of the intro */
  skip() {
    this.ctrl?.abort();
    this._settle();
  }
  _settle() {
    const ex = this.explorer, root = this.root;
    this._removeVideo();
    ex.useMainImage?.({ fade: true });
    root.querySelector(".viewer__overlay")?.remove();
    root.classList.remove("is-drawing", "is-transforming");
    root.classList.add("hero-in");
    draw(root.querySelector(".hero"));
    ex.heroFrame(!reducedMotion(), 700);
    this._caption("");
    this.markSeen();
    root.dataset.phase = "ready";
    ex.viewer.interactive = true;
    this._startDrift(reducedMotion() ? 0 : 760); // after the 700 ms settle animation
    this.notes.start();
  }

  /** Scene 3: from presentation to exploration */
  enter({ instant = false } = {}) {
    this.ctrl?.abort();
    this._stopDrift();
    this.notes.stop();
    const root = this.root, ex = this.explorer;
    this._removeVideo();
    root.querySelector(".viewer__overlay")?.remove();
    root.classList.remove("is-drawing", "is-transforming");
    root.dataset.phase = "explore";
    ex.useMainImage?.();
    ex.viewer.interactive = true;
    ex.layer.traceIn(instant || reducedMotion());
    this._caption("");
    this.markSeen();
    setTimeout(() => draw(root.querySelector(".explore-note")?.parentElement || root), 900);
  }

  _caption(t) { if (!this.caption) return; this.caption.textContent = t; this.caption.classList.toggle("is-on", !!t); }
}
