// Smooth wheel scrolling for the ateliér edition – Lenis 1.1.18 (vendored), set up like on IKO Plzeň:
// desktop pointer only (touch keeps its native feel), off with reduced motion. Nested scrollers keep their own
// wheel; ctrl/⌘ + wheel stays with the map (Lenis ignores it) and the page is locked while a dialog or menu is open.
import { EDITION } from "./edition.js";
import { reducedMotion } from "../core/motion.js";

let lenis = null;
const PREVENT = ".panel__scroll, .popover, dialog, .detail, .sitemenu, .lightbox, .cookies, .cat__info, .leaflet-container, [data-pano], .pano-teaser__gl, [data-lenis-prevent]";

export function initSmoothScroll() {
  if (EDITION !== "atelier" || reducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches || initSmoothScroll.done) return;
  initSmoothScroll.done = true;
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "assets/vendor/lenis/lenis.css"; document.head.append(css);
  const s = document.createElement("script"); s.src = "assets/vendor/lenis/lenis.min.js"; s.async = true;
  s.onload = () => {
    if (!window.Lenis) return;
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      prevent: (node) => !!node.closest?.(PREVENT),
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // dialogs and the full-screen menu lock the page
    const html = document.documentElement;
    const sync = () => (html.classList.contains("has-dialog") || html.classList.contains("has-menu") ? lenis.stop() : lenis.start());
    new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ["class"] });
    sync();
    // in-page anchors ease instead of jumping
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return;
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = document.getElementById(decodeURIComponent(id.slice(1))); if (!t) return;
      e.preventDefault(); history.pushState(null, "", id); smoothTo(t);
    });
    window.__lenis = lenis;
  };
  document.head.append(s);
}

/** scroll to an element or y position – through Lenis when it runs, natively otherwise */
export function smoothTo(target, { offset = 0, immediate = false } = {}) {
  if (lenis) { lenis.scrollTo(target, { offset, immediate, duration: immediate ? 0 : 1.2 }); return; }
  if (typeof target === "number") scrollTo({ top: target + offset, behavior: immediate || reducedMotion() ? "auto" : "smooth" });
  else target?.scrollIntoView({ behavior: immediate || reducedMotion() ? "auto" : "smooth", block: "start" });
}
