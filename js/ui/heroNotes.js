// Hand-written notes over the aerial view in the hero. One place at a time: the arrow draws in towards the place,
// the note writes itself on a paper label, the note goes away and the arrow retracts – then the next place.
// Anchors live in scene pixels, so the notes ride along with the camera drift.
import { reducedMotion, wait } from "../core/motion.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// label centre relative to the anchor, in order of preference: above right, above left, below right, below left
const SIDES = [[1, -1], [-1, -1], [1, 1], [-1, 1]];

export class HeroNotes {
  constructor(root, explorer, notes = []) {
    this.root = root; this.ex = explorer; this.notes = notes; this.i = 0;
    this.host = root.querySelector("[data-hero-notes]");
    if (!this.host) return;
    this.host.innerHTML = `<svg class="hnote__svg"><path class="hnote__line" pathLength="1"/><path class="hnote__head" pathLength="1"/></svg><p class="hnote__label"></p>`;
    this.line = this.host.querySelector(".hnote__line");
    this.head = this.host.querySelector(".hnote__head");
    this.label = this.host.querySelector(".hnote__label");
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
    this.run?.abort(); this.run = null; this.cur = null;
    if (this.host) this.host.dataset.state = "";
  }
  /** called on every camera change */
  update() { if (this.cur) this._place(); }

  async _loop(signal) {
    await wait(700, signal);
    let misses = 0;
    while (!signal.aborted) {
      const n = this.notes[this.i++ % this.notes.length];
      if (!this._prepare(n)) {
        // nothing fits right now (small screen, camera elsewhere) – try again a bit later
        if (++misses >= this.notes.length) { misses = 0; await wait(1500, signal); }
        continue;
      }
      misses = 0;
      await this._play(signal);
      await wait(600, signal);
    }
  }

  /** fill the label and pick a side where the label, the arrow and the place are all clear of the hero text */
  _prepare(n) {
    if (window.innerWidth < 1100 || this.root.dataset.phase !== "ready") return false;
    const pt = this.anchor(n); if (!pt) return false;
    this.label.innerHTML = n.lines.map((l) => `<span class="hnote__ln"><span>${esc(l)}</span></span>`).join("");
    const lw = this.label.offsetWidth, lh = this.label.offsetHeight;
    const [ax, ay] = this.ex.viewer.toScreen(pt);
    const W = this.root.clientWidth, H = this.root.clientHeight;
    const top = (document.querySelector("[data-topbar]")?.offsetHeight || 64) + 16;
    const er = this.root.getBoundingClientRect(), hr = this.root.querySelector(".hero")?.getBoundingClientRect();
    const hero = hr && { l: hr.left - er.left - 24, t: hr.top - er.top - 24, r: hr.right - er.left + 24, b: hr.bottom - er.top + 24 };
    const inHero = (x0, y0, x1, y1) => hero && x1 > hero.l && x0 < hero.r && y1 > hero.t && y0 < hero.b;
    const free = (x0, y0, x1, y1) => x0 > 16 && y0 > top && x1 < W - 16 && y1 < H - 90 && !inHero(x0, y0, x1, y1);
    if (!free(ax - 60, ay - 40, ax + 60, ay + 40)) return false; // the place itself keeps clear of the hero text
    const dx = 120 + lw * 0.35, dy = 92 + lh * 0.5;
    for (const [sx, sy] of SIDES) {
      const cx = ax + sx * dx, cy = ay + sy * dy;
      const box = [cx - lw / 2, cy - lh / 2, cx + lw / 2, cy + lh / 2];
      if (!free(...box)) continue;
      this.cur = { pt, side: [sx, sy], dx, dy, lw, lh };
      // writing speed follows the length of each line
      let delay = 0;
      for (const ln of this.label.querySelectorAll(".hnote__ln")) {
        const d = Math.max(380, ln.textContent.length * 55);
        ln.style.setProperty("--d", `${delay}ms`); ln.style.setProperty("--w", `${d}ms`);
        delay += d + 120;
      }
      this.cur.write = delay;
      this.label.style.setProperty("--tilt", `${(this.i % 2 ? -1 : 1) * (1.5 + (this.i % 3))}deg`);
      this._place();
      return true;
    }
    return false;
  }

  _place() {
    const c = this.cur; if (!c) return;
    const [ax, ay] = this.ex.viewer.toScreen(c.pt);
    const [sx, sy] = c.side, cx = ax + sx * c.dx, cy = ay + sy * c.dy;
    this.label.style.left = `${cx - c.lw / 2}px`; this.label.style.top = `${cy - c.lh / 2}px`;
    // pen stroke from the label edge facing the place to just short of it
    const x0 = cx - sx * c.lw * 0.18, y0 = cy - sy * (c.lh / 2 + 8);
    const dx = ax - x0, dy = ay - y0, len = Math.hypot(dx, dy);
    const ex = ax - (dx / len) * 12, ey = ay - (dy / len) * 12;
    const qx = x0 + dx * 0.15 + sx * len * 0.22, qy = y0 + dy * 0.75;
    const tl = Math.hypot(ex - qx, ey - qy), ux = (ex - qx) / tl, uy = (ey - qy) / tl, h = 13;
    const f = (n) => n.toFixed(1);
    this.line.setAttribute("d", `M${f(x0)} ${f(y0)} Q ${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}`);
    this.head.setAttribute("d", `M${f(ex - ux * h - uy * h * 0.55)} ${f(ey - uy * h + ux * h * 0.55)} L${f(ex)} ${f(ey)} L${f(ex - ux * h + uy * h * 0.55)} ${f(ey - uy * h - ux * h * 0.55)}`);
  }

  async _play(signal) {
    const rm = reducedMotion(), s = (v) => (this.host.dataset.state = v);
    s("arrow"); await wait(rm ? 0 : 1050, signal);           // the arrow draws in
    s("text"); await wait(rm ? 0 : this.cur.write + 200, signal); // the note writes itself
    await wait(rm ? 6000 : 2600, signal);                     // time to read
    s("text-out"); await wait(rm ? 0 : 450, signal);         // the note goes
    s("out"); await wait(rm ? 0 : 800, signal);              // the arrow retracts
    s(""); this.cur = null;
  }
}
