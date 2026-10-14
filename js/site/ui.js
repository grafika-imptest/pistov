// Reusable building blocks for the subpages and the home teasers.
import { reducedMotion } from "../core/motion.js";

const IMG = "assets/img/";
// available widths per image family (see tools/build-assets.mjs, pano-stills.mjs)
const WIDTHS = { aerial: [800, 1400, 2200], plan: [900, 1800], "section-1": [1400, 2400], "section-2": [1400, 2400] };
const SHEET = /^[A-D]2?-(plans|site)/; // catalogue sheets (house plans, site plans)
const ELEV = /^[A-D]2?-elev-/; // catalogue elevations
export const widthsOf = (name) => WIDTHS[name] || (SHEET.test(name) ? [1100, 2000] : ELEV.test(name) ? [500, 1000] : [480, 960, 1600]);
export const img = (name, prefer = "s") => { const w = widthsOf(name); return `${IMG}${name}-${prefer === "l" ? w[w.length - 1] : prefer === "m" ? w[Math.min(1, w.length - 1)] : w[0]}.webp`; };
export const srcset = (name) => widthsOf(name).map((w) => `${IMG}${name}-${w}.webp ${w}w`).join(", ");
export const isDrawing = (name) => name === "plan" || /^section-/.test(name) || SHEET.test(name) || ELEV.test(name);

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function dateLabel(n) {
  if (n.dateLabel) return n.dateLabel;
  const [y, m, d] = n.date.split("-").map(Number);
  return d ? `${d}. ${m}. ${y}` : `${m}/${y}`;
}

export function newsCard(n, { big = false } = {}) {
  return `<a class="newscard ${big ? "newscard--big" : ""}" href="aktualita.html?id=${n.slug}">
    <span class="newscard__img"><img src="${img(n.image, "m")}" srcset="${srcset(n.image)}" sizes="(min-width: 900px) 33vw, 100vw" alt="" loading="lazy" decoding="async"></span>
    <span class="newscard__meta"><time datetime="${n.date}">${dateLabel(n)}</time><span>${esc(n.category)}</span></span>
    <span class="newscard__title">${esc(n.title)}</span>
    <span class="newscard__perex">${esc(n.perex)}</span>
    <span class="newscard__more">Číst dál <span aria-hidden="true">→</span></span>
  </a>`;
}

/** accordion: one open at a time; keyboard friendly (<button aria-expanded>) */
export function accordion(items, { open = -1 } = {}) {
  return items.map((it, i) => `
    <div class="acc ${i === open ? "is-open" : ""}">
      <h3 class="acc__h"><button type="button" class="acc__btn" aria-expanded="${i === open}" aria-controls="acc-${it.id ?? i}" id="accb-${it.id ?? i}">${esc(it.q)}<span class="acc__icon" aria-hidden="true"></span></button></h3>
      <div class="acc__panel" id="acc-${it.id ?? i}" role="region" aria-labelledby="accb-${it.id ?? i}" ${i === open ? "" : "hidden"}><p>${esc(it.a)}</p></div>
    </div>`).join("");
}
export function bindAccordion(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".acc__btn"); if (!b) return;
    const acc = b.closest(".acc"), open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); acc.classList.toggle("is-open", open);
    acc.querySelector(".acc__panel").hidden = !open;
  });
}

/** full-screen lightbox with prev/next, keyboard and swipe */
export function lightbox(items) {
  let i = 0, el = document.querySelector(".lightbox");
  if (!el) {
    el = document.createElement("div"); el.className = "lightbox"; el.hidden = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Galerie");
    el.innerHTML = `<figure class="lightbox__fig"><img alt=""><figcaption><span data-lb-cap></span><b data-lb-no></b></figcaption></figure>
      <button type="button" class="lightbox__btn lightbox__close" data-lb="close" aria-label="Zavřít">✕</button>
      <button type="button" class="lightbox__btn lightbox__prev" data-lb="-1" aria-label="Předchozí"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button type="button" class="lightbox__btn lightbox__next" data-lb="1" aria-label="Další"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`;
    document.body.append(el);
  }
  const show = () => {
    const [name, cap] = el._items[i];
    const im = el.querySelector("img");
    im.classList.toggle("is-drawing", isDrawing(name));
    im.src = img(name, "l"); im.alt = cap;
    el.querySelector("[data-lb-cap]").textContent = cap;
    el.querySelector("[data-lb-no]").textContent = `${i + 1} / ${el._items.length}`;
    // preload neighbours
    for (const k of [i - 1, i + 1]) { const n = el._items[(k + el._items.length) % el._items.length]; if (n) new Image().src = img(n[0], "l"); }
  };
  const go = (d) => { i = (i + d + el._items.length) % el._items.length; show(); };
  const close = () => { el.hidden = true; document.documentElement.classList.remove("has-dialog"); el._last?.focus(); };
  if (!el._bound) {
    el._bound = true;
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-lb]"); if (b) { b.dataset.lb === "close" ? close() : go(Number(b.dataset.lb)); } else if (e.target === el) close(); });
    document.addEventListener("keydown", (e) => { if (el.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
    let sx = null; el.addEventListener("pointerdown", (e) => (sx = e.clientX)); el.addEventListener("pointerup", (e) => { if (sx != null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
  }
  el._items = items;
  return {
    open(k) { i = k; el._last = document.activeElement; el.hidden = false; document.documentElement.classList.add("has-dialog"); show(); el.querySelector(".lightbox__next").focus({ preventScroll: true }); },
  };
}

export const smooth = () => (reducedMotion() ? "auto" : "smooth");

/** small status message at the bottom of the screen */
export function toast(msg) {
  let t = document.querySelector(".sitetoast");
  if (!t) { t = document.createElement("p"); t.className = "sitetoast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; t.classList.add("is-on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("is-on"), 3200);
}
