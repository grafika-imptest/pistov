// Cinematic introduction on the real aerial visualisation.
// Scene 1 – arrival: close camera over the development; the architect's site plan lies on the ground.
// Scene 2 – transformation: the drawing dissolves and the planned houses of the visualisation appear
//           while the camera travels across the locality (2.5D camera move, not a 3D fly-through).
// Scene 3 – exploration: camera settles on the overview; boundaries trace in, controls appear.
import { reducedMotion, wait } from "../core/motion.js";
import { draw } from "./sketch.js";

const KEY = "pistov:intro-seen";

export class Intro {
  constructor(root, explorer) {
    this.root = root; this.explorer = explorer;
    this.caption = root.querySelector("[data-intro-caption]");
  }
  get seen() { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } }
  markSeen() { try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ } }

  async play() {
    const ex = this.explorer, v = ex.viewer, root = this.root;
    this.ctrl = new AbortController(); const { signal } = this.ctrl;
    root.dataset.phase = "intro";
    v.interactive = false;
    const all = ex.layer.allBox();
    const short = this.seen || reducedMotion() || window.innerWidth < 700;
    if (short) { this._settle(); return; }

    const overlay = ex.addPlanOverlay();
    root.classList.add("is-drawing");
    // Scene 1: close over the northern streets
    v.cover({ x: all.x + all.w * 0.12, y: all.y + all.h * 0.02, w: all.w * 0.7, h: all.h * 0.6 }, { animate: false });
    this._caption("Situační plán · TAM architekti");
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

  /** skip: jump to the final framing of the intro */
  skip() {
    this.ctrl?.abort();
    this._settle();
  }
  _settle() {
    const ex = this.explorer, root = this.root;
    root.querySelector(".viewer__overlay")?.remove();
    root.classList.remove("is-drawing", "is-transforming");
    root.classList.add("hero-in");
    draw(root.querySelector(".hero"));
    ex.heroFrame(!reducedMotion(), 700);
    this._caption("");
    this.markSeen();
    root.dataset.phase = "ready";
    ex.viewer.interactive = true;
  }

  /** Scene 3: from presentation to exploration */
  enter({ instant = false } = {}) {
    this.ctrl?.abort();
    const root = this.root, ex = this.explorer;
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
