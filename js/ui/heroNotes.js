// Hand-written notes over the aerial view in the hero. Notes come in pairs, the second one slightly behind the
// first: the arrow draws in towards the place, the note writes itself on a paper label, the note goes away and the
// arrow retracts – then the next pair. Anchors live in scene pixels, so the notes ride along with the camera drift.
import { reducedMotion, wait } from "../core/motion.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// label centre relative to the anchor, in order of preference: above right, above left, below right, below left
const SIDES = [[1, -1], [-1, -1], [1, 1], [-1, 1]];
const SLOTS = 2, STAGGER = 1300; // two notes on screen at a time, the second one this much later
const hit = (a, b, pad = 18) => a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad;

export class HeroNotes {
  constructor(root, explorer, notes = []) {
    this.root = root; this.ex = explorer; this.notes = notes; this.i = 0;
    this.shown = new Map(); // note → when it was last on screen (least recently shown goes first)
    this.host = root.querySelector("[data-hero-notes]");
    if (!this.host) return;
    this.host.innerHTML = Array.from({ length: SLOTS }, () =>
      `<div class="hnote"><svg class="hnote__svg"><path class="hnote__line" pathLength="1"/><path class="hnote__head" pathLength="1"/></svg><p class="hnote__label"></p></div>`).join("");
    this.slots = [...this.host.querySelectorAll(".hnote")].map((el) => ({
      el, line: el.querySelector(".hnote__line"), head: el.querySelector(".hnote__head"), label: el.querySelector(".hnote__label"), cur: null,
    }));
  }

  /** scene point of a note: [x, y] | "centre" | { plot } | { plots: [] } | { station } (aerial view pixels) */
  anchor(n) {
    const P = this.ex.project, at = n.at, lab = (no) => P.plots.find((p) => p.no === no)?.label.aerial;
    if (Array.isArray(at)) return at;
    if (at === "centre") { const b = this.ex.layer.allBox(); return [b.x + b.w * 0.5, b.y + b.h * 0.55]; }
    if (at.plot) return lab(at.plot);
    if (at.plots) { const pts = at.plots.map(lab).filter(Boolean); return pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]); }
    if (at.station) return P.panoramas.find((s) => s.id === at.station)?.aerial;
    return null;
  }

  start() {
    this.stop();
    if (!this.host || !this.notes.length) return;
    const run = (this.run = new AbortController());
    this._loop(run.signal).catch((e) => { if (e.name !== "AbortError") throw e; });
  }
  stop() {
    this.run?.abort(); this.run = null;
    for (const s of this.slots || []) { s.cur = null; s.el.dataset.state = ""; }
  }
  /** called on every camera change */
  update() { for (const s of this.slots || []) if (s.cur) this._place(s); }

  async _loop(signal) {
    await wait(700, signal);
    while (!signal.aborted) {
      // pick up to two notes that fit on screen and keep clear of each other, least recently shown first
      const picked = [];
      const order = this.notes.map((n, k) => [n, this.shown.get(n) ?? -1, k]).sort((a, b) => a[1] - b[1] || a[2] - b[2]);
      for (const [n] of order) {
        if (picked.length >= SLOTS) break;
        this.i++;
        const slot = this.slots[picked.length];
        if (this._prepare(slot, n, picked.flatMap((s) => s.cur.rects))) { picked.push(slot); this.shown.set(n, performance.now()); }
      }
      if (!picked.length) { await wait(1500, signal); continue; }
      await Promise.all(picked.map((slot, k) => wait(k * STAGGER, signal).then(() => this._play(slot, signal))));
      await wait(500, signal);
    }
  }

  /** fill the label and pick a side where the label, the arrow and the place are clear of the hero text and of `avoid` */
  _prepare(slot, n, avoid) {
    if (window.innerWidth < 1100 || this.root.dataset.phase !== "ready") return false;
    const pt = this.anchor(n); if (!pt) return false;
    slot.label.innerHTML = n.lines.map((l) => `<span class="hnote__ln"><span>${esc(l)}</span></span>`).join("");
    const lw = slot.label.offsetWidth, lh = slot.label.offsetHeight;
    const [ax, ay] = this.ex.viewer.toScreen(pt);
    const W = this.root.clientWidth, H = this.root.clientHeight;
    const top = (document.querySelector("[data-topbar]")?.offsetHeight || 64) + 16;
    const er = this.root.getBoundingClientRect(), hr = this.root.querySelector(".hero")?.getBoundingClientRect();
    const hero = hr && [hr.left - er.left - 24, hr.top - er.top - 24, hr.right - er.left + 24, hr.bottom - er.top + 24];
    const free = (r) => r[0] > 16 && r[1] > top && r[2] < W - 16 && r[3] < H - 90 && !(hero && hit(r, hero, 0)) && !avoid.some((a) => hit(r, a));
    const place = [ax - 44, ay - 26, ax + 44, ay + 26]; // the place itself stays visible
    if (!free(place)) return false;
    const dx = 120 + lw * 0.35, dy = 92 + lh * 0.5;
    for (const [sx, sy] of SIDES) {
      const cx = ax + sx * dx, cy = ay + sy * dy;
      const box = [cx - lw / 2, cy - lh / 2, cx + lw / 2, cy + lh / 2];
      // the arrow runs between the label and the place – keep that corridor clear as well
      const corridor = [Math.min(cx, ax) - 10, Math.min(cy, ay) - 10, Math.max(cx, ax) + 10, Math.max(cy, ay) + 10];
      if (!free(box) || avoid.some((a) => hit(corridor, a, 6))) continue;
      slot.cur = { pt, side: [sx, sy], dx, dy, lw, lh, rects: [box, place, corridor] };
      // writing speed follows the length of each line
      let delay = 0;
      for (const ln of slot.label.querySelectorAll(".hnote__ln")) {
        const d = Math.max(380, ln.textContent.length * 55);
        ln.style.setProperty("--d", `${delay}ms`); ln.style.setProperty("--w", `${d}ms`);
        delay += d + 120;
      }
      slot.cur.write = delay;
      slot.label.style.setProperty("--tilt", `${(this.i % 2 ? -1 : 1) * (1.5 + (this.i % 3))}deg`);
      this._place(slot);
      return true;
    }
    slot.cur = null;
    return false;
  }

  _place(slot) {
    const c = slot.cur; if (!c) return;
    const [ax, ay] = this.ex.viewer.toScreen(c.pt);
    const [sx, sy] = c.side, cx = ax + sx * c.dx, cy = ay + sy * c.dy;
    slot.label.style.left = `${cx - c.lw / 2}px`; slot.label.style.top = `${cy - c.lh / 2}px`;
    // pen stroke from the label edge facing the place to just short of it
    const x0 = cx - sx * c.lw * 0.18, y0 = cy - sy * (c.lh / 2 + 8);
    const dx = ax - x0, dy = ay - y0, len = Math.hypot(dx, dy);
    const ex = ax - (dx / len) * 12, ey = ay - (dy / len) * 12;
    const qx = x0 + dx * 0.15 + sx * len * 0.22, qy = y0 + dy * 0.75;
    const tl = Math.hypot(ex - qx, ey - qy), ux = (ex - qx) / tl, uy = (ey - qy) / tl, h = 13;
    const f = (n) => n.toFixed(1);
    slot.line.setAttribute("d", `M${f(x0)} ${f(y0)} Q ${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}`);
    slot.head.setAttribute("d", `M${f(ex - ux * h - uy * h * 0.55)} ${f(ey - uy * h + ux * h * 0.55)} L${f(ex)} ${f(ey)} L${f(ex - ux * h + uy * h * 0.55)} ${f(ey - uy * h - ux * h * 0.55)}`);
  }

  async _play(slot, signal) {
    const rm = reducedMotion(), s = (v) => (slot.el.dataset.state = v);
    try {
      s("arrow"); await wait(rm ? 0 : 1050, signal);           // the arrow draws in
      s("text"); await wait(rm ? 0 : slot.cur.write + 200, signal); // the note writes itself
      await wait(rm ? 6000 : 2600, signal);                     // time to read
      s("text-out"); await wait(rm ? 0 : 450, signal);         // the note goes
      s("out"); await wait(rm ? 0 : 800, signal);              // the arrow retracts
    } finally {
      s(""); slot.cur = null;
    }
  }
}
