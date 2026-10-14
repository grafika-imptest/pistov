// Motion tokens + helpers shared by all components (durations mirror css/tokens.css).
// guarded so pure modules can be imported in Node tests
const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false, addEventListener() {} };
export const reducedMotion = () => mq.matches;
export const onReducedMotionChange = (fn) => mq.addEventListener("change", fn);

export const DUR = { fast: 180, ui: 240, panel: 340, image: 560, scene: 1000 };
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
export const wait = (ms, signal) => new Promise((res, rej) => {
  const id = setTimeout(res, ms);
  signal?.addEventListener("abort", () => { clearTimeout(id); rej(new DOMException("aborted", "AbortError")); }, { once: true });
});

/** rAF tween; resolves when done, rejects on abort */
export function tween(duration, onFrame, { easing = ease.out, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (duration <= 0 || reducedMotion()) { onFrame(1); resolve(); return; }
    const t0 = performance.now(); let id;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      onFrame(easing(t));
      if (t < 1) id = requestAnimationFrame(step); else resolve();
    };
    id = requestAnimationFrame(step);
    signal?.addEventListener("abort", () => { cancelAnimationFrame(id); reject(new DOMException("aborted", "AbortError")); }, { once: true });
  });
}

/** reveal-on-scroll for elements with .reveal */
export function revealOnScroll(root = document) {
  const els = root.querySelectorAll(".reveal:not(.is-in)");
  if (reducedMotion() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}
