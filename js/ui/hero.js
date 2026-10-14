// Cinematic introduction on the real aerial visualisation.
// Scene 1 – arrival: close camera over the development; the architect's site plan lies on the ground.
// Scene 2 – transformation: the drawing dissolves and the planned houses of the visualisation appear
//           while the camera travels across the locality (2.5D camera move, not a 3D fly-through).
// Scene 3 – exploration: camera settles on the overview; boundaries trace in, controls appear.
import { reducedMotion, wait } from "../core/motion.js";
import { draw } from "./sketch.js";

// once per browser session: a new visit starts with the film, coming back from a subpage does not
const KEY = "pistov:intro-seen";

export class Intro {
  constructor(root, explorer) {
    this.root = root; this.explorer = explorer;
    this.caption = root.querySelector("[data-intro-caption]");
    this.arrow = root.querySelector("[data-hero-arrow]");
    this.note = root.querySelector("[data-hero-note]");
    // the arrow follows the camera, so it always points at the development
    explorer.onViewChange = () => { if (root.dataset.phase !== "explore") this.placeArrow(); };
    window.addEventListener("resize", () => this.placeArrow());
  }

  _drawArrow() {
    const a = this.arrow; if (!a) return;
    this.placeArrow();
    a.classList.remove("is-drawn"); void a.getBoundingClientRect(); a.classList.add("is-drawn");
  }

  /** hand-drawn arrow from below the note to the middle of the planned houses (never across the text) */
  placeArrow() {
    const a = this.arrow, note = this.note; if (!a || !note) return;
    if (getComputedStyle(note).display === "none" || !this.explorer.layer.nodes.size) { a.style.display = "none"; return; }
    a.style.display = "";
    const er = this.root.getBoundingClientRect(), nr = note.getBoundingClientRect();
    const box = this.explorer.layer.allBox();
    const [tx, ty] = this.explorer.viewer.toScreen([box.x + box.w * 0.5, box.y + box.h * 0.55]);
    const sx = nr.left - er.left + nr.width * 0.3, sy = nr.bottom - er.top + 14;
    // stop short of the target, bend like a pen stroke
    const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy);
    if (len < 80) { a.style.display = "none"; return; }
    const ex = tx - (dx / len) * 22, ey = ty - (dy / len) * 22;
    const side = dx < 0 ? -1 : 1;
    const cx = sx + dx * 0.2 - side * Math.min(140, len * 0.28), cy = sy + dy * 0.75;
    const f = (n) => n.toFixed(1);
    const tl = Math.hypot(ex - cx, ey - cy), ux = (ex - cx) / tl, uy = (ey - cy) / tl, h = 13;
    const h1 = [ex - ux * h - uy * h * 0.55, ey - uy * h + ux * h * 0.55], h2 = [ex - ux * h + uy * h * 0.55, ey - uy * h - ux * h * 0.55];
    const [p1, p2] = a.querySelectorAll("path");
    p1.setAttribute("d", `M${f(sx)} ${f(sy)} Q ${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`);
    p2.setAttribute("d", `M${f(h1[0])} ${f(h1[1])} L${f(ex)} ${f(ey)} L${f(h2[0])} ${f(h2[1])}`);
  }
  get seen() { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } }
  markSeen() { try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ } }

  /** play the intro film again on request (button in the hero) */
  replay() {
    this.ctrl?.abort();
    this._removeVideo();
    window.scrollTo({ top: 0, behavior: "auto" });
    this.root.classList.remove("hero-in");
    this.arrow?.classList.remove("is-drawn");
    return this.play({ force: true });
  }

  async play({ force = false } = {}) {
    const ex = this.explorer, v = ex.viewer, root = this.root;
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
          ex.heroFrame(true, 1900);
          await wait(1950, signal);
          this._drawArrow();
          this._caption("");
          this.markSeen();
          root.dataset.phase = "ready";
          v.interactive = true;
          return;
        }
      } catch (e) { if (e.name === "AbortError") return; throw e; }
    }

    // fallback: the architect's plan laid on the aerial view dissolves into the visualisation
    const overlay = ex.addPlanOverlay();
    root.classList.add("is-drawing");
    // Scene 1: close over the northern streets
    v.cover({ x: all.x + all.w * 0.12, y: all.y + all.h * 0.02, w: all.w * 0.7, h: all.h * 0.6 }, { animate: false });
    this._caption("Situační plán · TAM architekti");
    try {
      await wait(350, signal);
      root.classList.add("hero-in");
      draw(root.querySelector(".hero"));
      this._drawArrow();
      await wait(900, signal);
      // Scene 2: the drawing becomes the place
      root.classList.add("is-transforming");
      overlay?.classList.add("is-sweeping");
      v.cover({ x: all.x + all.w * 0.22, y: all.y + all.h * 0.28, w: all.w * 0.85, h: all.h * 0.72 }, { animate: true, duration: 3600, easing: "cubic-bezier(.45,.05,.35,1)" });
      await wait(1500, signal);
      root.classList.remove("is-drawing");
      this._caption("Vizualizace budoucí zástavby · TAM architekti");
      await wait(2300, signal);
      // Scene 3 (part 1): rise to the overview and stop
      ex.heroFrame(true, 1900);
      await wait(1950, signal);
      overlay?.remove();
      this._caption("");
      this.markSeen();
      root.dataset.phase = "ready";
      v.interactive = true;
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
    root.querySelector(".viewer__overlay")?.remove();
    root.classList.remove("is-drawing", "is-transforming");
    root.classList.add("hero-in");
    draw(root.querySelector(".hero"));
    ex.heroFrame(!reducedMotion(), 700);
    this._drawArrow();
    this._caption("");
    this.markSeen();
    root.dataset.phase = "ready";
    ex.viewer.interactive = true;
  }

  /** Scene 3: from presentation to exploration */
  enter({ instant = false } = {}) {
    this.ctrl?.abort();
    const root = this.root, ex = this.explorer;
    this._removeVideo();
    root.querySelector(".viewer__overlay")?.remove();
    root.classList.remove("is-drawing", "is-transforming");
    root.dataset.phase = "explore";
    ex.viewer.interactive = true;
    ex.layer.traceIn(instant || reducedMotion());
    this._caption("");
    this.markSeen();
    setTimeout(() => draw(root.querySelector(".explore-note")?.parentElement || root), 900);
  }

  _caption(t) { this.caption.textContent = t; this.caption.classList.toggle("is-on", !!t); }
}
