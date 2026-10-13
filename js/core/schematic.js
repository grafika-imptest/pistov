// Architectural site drawing of one plot (exact traced geometry, north up) + a schematic house mass
// placed where the architect drew the footprint in the site plan. Dimensions come from the catalogue.
// This is the honest fallback "build-up" used until the real construction animations are delivered.
import { bbox, centroid, toPath, toPoints } from "./geometry.js";
import { tween, ease } from "./motion.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); parent?.append(n); return n; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];

export class SiteDrawing {
  constructor(container, project) {
    this.project = project;
    this.k = 1 / project.planMetersPerPx; // plan px per metre
    this.svg = el("svg", { class: "site", role: "img" });
    container.append(this.svg);
  }

  setPlot(plot) {
    this.plot = plot;
    const svg = this.svg; svg.replaceChildren();
    const poly = plot.geometry.plan;
    const b = bbox(poly);
    const pad = Math.max(b.w, b.h) * 0.42;
    const vb = { x: b.x - pad, y: b.y - pad * 0.8, w: b.w + pad * 2, h: b.h + pad * 1.6 };
    // keep a 3:2 frame so the stage never changes size
    const ar = 1.5;
    if (vb.w / vb.h < ar) { const nw = vb.h * ar; vb.x -= (nw - vb.w) / 2; vb.w = nw; } else { const nh = vb.w / ar; vb.y -= (nh - vb.h) / 2; vb.h = nh; }
    this.vb = vb;
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    svg.setAttribute("aria-label", `Výkres parcely č. ${plot.no}, ${plot.area} m², sever nahoře`);
    const u = vb.w / 1000; // drawing unit (stroke/font sizes relative to frame)
    this.u = u;

    // context: neighbouring plots
    const ctx = el("g", { class: "site__ctx" }, svg);
    for (const p of this.project.plots) {
      if (p === plot || !p.geometry) continue;
      const pb = bbox(p.geometry.plan);
      if (pb.x > vb.x + vb.w || pb.x + pb.w < vb.x || pb.y > vb.y + vb.h || pb.y + pb.h < vb.y) continue;
      el("path", { d: toPath(p.geometry.plan), "stroke-width": u * 1.2 }, ctx);
      const c = p.label.plan; const t = el("text", { x: c[0], y: c[1], "font-size": u * 15 }, ctx); t.textContent = p.no;
    }
    // the plot
    el("path", { class: "site__plot", d: toPath(poly), "stroke-width": u * 3.2 }, svg);
    el("path", { class: "site__plot-trace", d: toPath(poly), pathLength: 1, "stroke-width": u * 3.2 }, svg);
    // edge dimensions (metres, from the plan scale)
    const dims = el("g", { class: "site__dims" }, svg);
    const c = centroid(poly);
    poly.forEach((p, i) => {
      const q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]) * this.project.planMetersPerPx;
      if (len < 6) return;
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const out = [m[0] - c[0], m[1] - c[1]]; const ol = Math.hypot(...out);
      const pos = add(m, mul(out, (u * 34) / ol));
      const t = el("text", { x: pos[0], y: pos[1], "font-size": u * 24 }, dims);
      t.textContent = `${len.toFixed(1).replace(".", ",")} m`;
    });
    // number + area
    const lab = el("g", { class: "site__label" }, svg);
    el("text", { class: "site__no", x: vb.x + u * 40, y: vb.y + u * 110, "font-size": u * 92 }, lab).textContent = plot.no;
    el("text", { class: "site__area", x: vb.x + u * 44, y: vb.y + u * 150, "font-size": u * 26 }, lab).textContent = `parcela · ${plot.area} m²`;
    // north arrow + scale bar (10 m)
    const na = el("g", { class: "site__north", transform: `translate(${vb.x + vb.w - u * 70} ${vb.y + u * 80})` }, svg);
    el("circle", { r: u * 26, "stroke-width": u * 1.6 }, na);
    el("path", { d: `M0 ${-u * 22} L${u * 7} ${u * 8} L0 ${u * 2} L${-u * 7} ${u * 8}Z` }, na);
    el("text", { y: -u * 34, "font-size": u * 20 }, na).textContent = "S";
    const sb = el("g", { class: "site__scale", transform: `translate(${vb.x + vb.w - u * 40 - 10 * this.k} ${vb.y + vb.h - u * 46})` }, svg);
    el("path", { d: `M0 0H${10 * this.k}M0 ${-u * 8}V${u * 8}M${10 * this.k} ${-u * 8}V${u * 8}M${5 * this.k} ${-u * 5}V${u * 5}`, "stroke-width": u * 2 }, sb);
    el("text", { x: 5 * this.k, y: -u * 16, "font-size": u * 20 }, sb).textContent = "10 m";

    this.houseG = el("g", { class: "site__house" }, svg);
    this.noteG = el("g", { class: "site__note" }, svg);
    this.layout = null;
  }

  /** footprint rectangles (plan px) for a layout's massing at this plot's placement */
  footprint(massing) {
    const pl = this.plot.placement;
    const k = this.k;
    const a = pl ? pl.angle : 0;
    const U = [Math.cos(a), Math.sin(a)], V = [-Math.sin(a), Math.cos(a)];
    const c0 = pl ? pl.c : centroid(this.plot.geometry.plan);
    let su = 1, sv = 1;
    if (pl?.wing) { const d = [pl.wing[0] - c0[0], pl.wing[1] - c0[1]]; su = Math.sign(d[0] * U[0] + d[1] * U[1]) || 1; sv = Math.sign(d[0] * V[0] + d[1] * V[1]) || 1; }
    const { main, wing } = massing;
    const L = main.l * k, W = main.w * k;
    let m0 = c0;
    let wingRect = null;
    if (wing) {
      const aw = (wing.along[1] - wing.along[0]) * wing.out, am = main.l * main.w;
      const off = add(mul(U, su * (L / 2 - ((wing.along[0] + wing.along[1]) / 2) * k)), mul(V, sv * (W / 2 + (wing.out * k) / 2)));
      m0 = add(c0, mul(off, -aw / (aw + am)));
    }
    const P = (t, s) => add(add(m0, mul(U, su * (L / 2 - t * k))), mul(V, s));
    const mainRect = [P(0, -W / 2), P(main.l, -W / 2), P(main.l, W / 2), P(0, W / 2)];
    if (wing) {
      const s0 = sv * (W / 2), s1 = sv * (W / 2 + wing.out * k);
      wingRect = [P(wing.along[0], s0), P(wing.along[1], s0), P(wing.along[1], s1), P(wing.along[0], s1)];
    }
    return { mainRect, wingRect, U: mul(U, su), V: mul(V, sv) };
  }

  /** draw the house mass at build progress p ∈ [0,1] */
  drawMass(layout, variant, p) {
    const g = this.houseG; g.replaceChildren();
    if (!layout || p <= 0) return;
    const { main, wing } = layout.massing;
    const fp = this.footprint(layout.massing);
    const k = this.k, u = this.u;
    const lift = (pt, z) => [pt[0] + z * k * 0.18, pt[1] - z * k * 0.62]; // plan-oblique view from south-east
    const [facade, roof] = variant?.swatches || ["#efe9dc", "#b8532f"];
    const faces = [];
    const shadowOf = (rect, h) => rect.map((pt) => [pt[0] + h * k * 0.55 * p, pt[1] + h * k * 0.28 * p]);
    const box = (rect, h, roofType, ridge, axis) => {
      const z = h * Math.min(1, p / 0.72);
      for (let i = 0; i < 4; i++) {
        const a = rect[i], b = rect[(i + 1) % 4];
        const nx = (b[1] - a[1]), ny = -(b[0] - a[0]); // outward normal for clockwise screen order
        const cc = centroid(rect); const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const outward = (mid[0] - cc[0]) * nx + (mid[1] - cc[1]) * ny > 0 ? [nx, ny] : [-nx, -ny];
        // visible only if the face points against the extrusion direction (0.18, -0.62)
        if (outward[0] * 0.18 - outward[1] * 0.62 >= 0) continue;
        const ol = Math.hypot(...outward);
        faces.push({ y: Math.max(a[1], b[1]), pts: [a, b, lift(b, z), lift(a, z)], cls: outward[1] / ol > 0.5 ? "wall wall--s" : "wall wall--w", fill: facade });
      }
      if (roofType === "gable" && p > 0.72) {
        const rz = z + (ridge - h) * Math.min(1, (p - 0.72) / 0.28);
        // ridge runs along the long axis through the middle of the short edges
        const r0 = lift([(rect[0][0] + rect[3][0]) / 2, (rect[0][1] + rect[3][1]) / 2], rz);
        const r1 = lift([(rect[1][0] + rect[2][0]) / 2, (rect[1][1] + rect[2][1]) / 2], rz);
        const top = rect.map((pt) => lift(pt, z));
        const cc = centroid(rect);
        const faceVisible = (a, b) => { const m = [(a[0] + b[0]) / 2 - cc[0], (a[1] + b[1]) / 2 - cc[1]]; return m[0] * 0.18 - m[1] * 0.62 < 0; };
        const g0 = { pts: [top[0], top[3], r0], cls: "gable", fill: facade }, g1 = { pts: [top[1], top[2], r1], cls: "gable", fill: facade };
        const front0 = faceVisible(rect[3], rect[0]);
        faces.push({ y: 1e9, ...(front0 ? g1 : g0) });
        const vis01 = faceVisible(rect[0], rect[1]), vis23 = faceVisible(rect[2], rect[3]);
        // the roof plane facing the viewer is painted last
        faces.push({ y: 1e9 + (vis01 ? 1.5 : 1), pts: [top[0], top[1], r1, r0], cls: vis01 ? "roof roof--lit" : "roof", fill: roof });
        faces.push({ y: 1e9 + (vis23 ? 1.5 : 1), pts: [top[3], top[2], r1, r0], cls: vis23 ? "roof roof--lit" : "roof", fill: roof });
        faces.push({ y: 1e9 + 2, ...(front0 ? g0 : g1) });
      } else {
        faces.push({ y: 1e9, pts: rect.map((pt) => lift(pt, z)), cls: roofType === "flat" ? "roof roof--flat" : "roof", fill: roofType === "flat" ? "#d9d4c8" : roof });
      }
    };
    el("path", { class: "site__shadow", d: toPath(shadowOf(fp.mainRect, main.ridge || main.eave)) }, g);
    if (fp.wingRect) el("path", { class: "site__shadow", d: toPath(shadowOf(fp.wingRect, wing.h)) }, g);
    // painter's order: wing then main if wing lies "behind" on screen
    const parts = [{ rect: fp.mainRect, h: main.eave, roof: main.roof, ridge: main.ridge }];
    if (fp.wingRect) parts.push({ rect: fp.wingRect, h: wing.h, roof: wing.roof, ridge: wing.ridge || wing.h });
    parts.sort((a, b) => centroid(a.rect)[1] - centroid(b.rect)[1]);
    for (const part of parts) {
      const start = faces.length;
      box(part.rect, part.h, part.roof, part.ridge);
      const mine = faces.splice(start).sort((a, b) => a.y - b.y);
      for (const f of mine) el("polygon", { class: `mass ${f.cls}`, points: toPoints(f.pts), fill: f.fill, "stroke-width": u * 1.4 }, g);
    }
  }

  footprintOutline(layout) {
    const g = this.houseG; g.replaceChildren();
    if (!layout) return;
    const fp = this.footprint(layout.massing);
    for (const r of [fp.mainRect, fp.wingRect].filter(Boolean)) el("path", { class: "site__footprint", d: toPath(r), pathLength: 1, "stroke-width": this.u * 2.4 }, g);
    // construction lines: extend the main axis like a draughtsman's guide
    const c = centroid(fp.mainRect), L = this.vb.w;
    el("path", { class: "site__guide", d: toPath([[c[0] - fp.U[0] * L, c[1] - fp.U[1] * L], [c[0] + fp.U[0] * L, c[1] + fp.U[1] * L]], false), "stroke-width": this.u * 1 }, g);
    el("path", { class: "site__guide", d: toPath([[c[0] - fp.V[0] * L, c[1] - fp.V[1] * L], [c[0] + fp.V[0] * L, c[1] + fp.V[1] * L]], false), "stroke-width": this.u * 1 }, g);
  }

  annotate(type, layout) {
    const g = this.noteG; g.replaceChildren();
    if (!type) return;
    const u = this.u, vb = this.vb;
    const fp = this.footprint(layout.massing);
    const tip = centroid(fp.mainRect);
    const from = [vb.x + vb.w * 0.7, vb.y + vb.h * 0.83];
    el("path", { class: "site__arrow", pathLength: 1, d: `M${from[0]} ${from[1]} Q ${(from[0] + tip[0]) / 2 + u * 80} ${(from[1] + tip[1]) / 2 + u * 40} ${tip[0] + u * 30} ${tip[1] + u * 20}`, "stroke-width": u * 2.2 }, g);
    const area = layout.builtUpArea !== undefined ? layout.builtUpArea : type.builtUpArea;
    const t = el("text", { x: from[0] - u * 10, y: from[1] + u * 40, "font-size": u * 30 }, g);
    t.textContent = area ? `${type.name} · obestavěná plocha ${area} m²` : `${type.name} · ${layout.name.toLowerCase()}`;
  }

  /** animated build-up: trace footprint → construction lines → rising mass */
  async build(type, layout, variant, signal) {
    this.svg.classList.remove("is-built");
    this.footprintOutline(layout);
    this.noteG.replaceChildren();
    this.svg.classList.add("is-building");
    await tween(520, (t) => this.houseG.querySelectorAll(".site__footprint").forEach((n) => (n.style.strokeDashoffset = String(1 - t))), { signal, easing: ease.inOut });
    await tween(900, (t) => this.drawMass(layout, variant, t), { signal, easing: ease.out });
    this.annotate(type, layout);
    this.svg.classList.remove("is-building");
    this.svg.classList.add("is-built");
  }
  showBuilt(type, layout, variant) { this.drawMass(layout, variant, 1); this.annotate(type, layout); this.svg.classList.add("is-built"); }
  clearHouse() { this.houseG.replaceChildren(); this.noteG.replaceChildren(); this.svg.classList.remove("is-built", "is-building"); }
}
