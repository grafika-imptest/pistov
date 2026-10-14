// Studio motion: restrained reveals that never hide content for long. Everything degrades to static content
// without IntersectionObserver, with reduced motion or when JS fails (the HTML is complete on its own).
import { reducedMotion } from "../core/motion.js";

const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** headlines: wrap words so they can rise line by line (keeps the text readable for assistive tech) */
export function splitLines(root = document) {
  for (const el of root.querySelectorAll("[data-s-lines]:not(.is-split)")) {
    // one-letter prepositions stay with the next word (Czech typography)
    const words = el.textContent.trim().replace(/(^|\s)([vkszouaiVKSZOUAI])\s+/g, "$1$2 ").split(/[ \t\n]+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="s-w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(" ");
    el.classList.add("is-split");
  }
}

/** [data-s-in] fade up, [data-s-reveal] image wipe, [data-s-lines] word rise – once, when 15 % visible */
export function reveal(root = document) {
  splitLines(root);
  const els = root.querySelectorAll("[data-s-in], [data-s-reveal], [data-s-lines]");
  if (reducedMotion() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
  document.documentElement.classList.add("s-motion");
  // clipped images do not count as visible for native lazy loading → start loading them well before they arrive
  const pre = new IntersectionObserver((list) => {
    for (const en of list) if (en.isIntersecting) { en.target.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager")); pre.unobserve(en.target); }
  }, { rootMargin: "600px 0px" });
  root.querySelectorAll("[data-s-reveal]").forEach((e) => pre.observe(e));
  const io = new IntersectionObserver((list) => {
    for (const en of list) if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  els.forEach((e) => io.observe(e));
  // failsafe: whatever is already on (or above) the screen after load is shown, even if an observer never fires
  const sweep = () => els.forEach((e) => { if (!e.classList.contains("is-in") && e.getBoundingClientRect().top < innerHeight) e.classList.add("is-in"); });
  addEventListener("load", () => setTimeout(sweep, 1200));
  let t; addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(sweep, 700); }, { passive: true });
}

/** [data-s-parallax] media drift (max ±6 % of its height), only while on screen */
export function parallax(root = document) {
  if (reducedMotion()) return;
  const items = [...root.querySelectorAll("[data-s-parallax]")].map((el) => ({ el, media: el.querySelector("img, video"), on: false }));
  if (!items.length) return;
  const io = new IntersectionObserver((list) => list.forEach((en) => { const it = items.find((x) => x.el === en.target); if (it) it.on = en.isIntersecting; }));
  items.forEach((it) => io.observe(it.el));
  let raf = 0;
  const tick = () => {
    raf = 0;
    for (const it of items) {
      if (!it.on || !it.media) continue;
      const r = it.el.getBoundingClientRect(), p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height); // -0.5 … 0.5
      it.media.style.transform = `translate3d(0, ${(p * -12).toFixed(2)}%, 0) scale(1.14)`;
    }
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  tick();
}

/** count numbers up when they appear (keeps the final value in the DOM for screen readers) */
export function countUp(root = document) {
  const els = root.querySelectorAll("[data-s-count]");
  if (reducedMotion()) return;
  const io = new IntersectionObserver((list) => {
    for (const en of list) {
      if (!en.isIntersecting) continue; io.unobserve(en.target);
      const el = en.target, to = Number(el.dataset.sCount), fmt = new Intl.NumberFormat("cs-CZ"), t0 = performance.now(), d = 1100;
      const step = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt.format(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  els.forEach((e) => io.observe(e));
}

/** videos that play only while visible; sources attached lazily ([data-src-hd] / [data-src-sd]) */
export function lazyLoops(root = document) {
  for (const v of root.querySelectorAll("video[data-s-loop]")) {
    if (reducedMotion()) continue; // poster only
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        if (!v.src) v.src = innerWidth >= 900 && !navigator.connection?.saveData ? v.dataset.srcHd : v.dataset.srcSd;
        v.play().catch(() => {});
      } else v.pause();
    }, { rootMargin: "120px" });
    io.observe(v);
  }
}
