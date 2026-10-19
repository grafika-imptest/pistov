// Builds js/projects/pistov/plots.generated.js from the CORRECTED site plan (zásilka 10/2026, plots 1–62).
// The new plan is registered onto the frame of the original plan (similarity fit on plots that did not change),
// so the aerial homography, the georeference of the panoramas and PLAN_M_PER_PX stay valid.
//  - polygons: trace-plots-v2.mjs (half-size copy of "FINAL_US_PÍSTOV_BEZ ORTO.jpg")
//  - plan images: the new plan resampled into the original frame (3364×3281) → plan-*.webp, plan-cutout
// usage: node trace-plots-v2.mjs && node build-data-v2.mjs
import sharp from "sharp";
import fs from "node:fs";

const OLD = await import("../podklady/plots.generated.OLD.js");
const traced = JSON.parse(fs.readFileSync("../podklady/plots-v2.json", "utf8"));
const [PW, PH] = OLD.PLAN_SIZE, H = OLD.AERIAL_HOMOGRAPHY;
const r1 = (v) => Math.round(v * 10) / 10;
const apply = (h, [x, y]) => { const w = h[6] * x + h[7] * y + h[8]; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
const area = (p) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;
const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

// areas as printed in the corrected plan (m²); every plot is offered for sale (no hatching in the new plan)
const AREA = {1:696,2:598,3:578,4:583,5:576,6:635,7:661,8:660,9:621,10:607,11:601,12:600,13:1067,14:903,15:953,16:927,17:787,
  18:633,19:556,20:587,21:584,22:568,23:601,24:600,25:600,26:600,27:599,28:570,29:598,30:626,31:602,32:604,33:605,34:606,35:607,
  36:710,37:580,38:571,39:557,40:539,41:499,42:524,43:542,44:573,45:579,46:601,47:614,48:614,49:612,50:599,51:885,52:889,53:695,
  54:800,55:609,56:655,57:626,58:623,59:573,60:528,61:553,62:527};

const polys = new Map(traced.plots.filter((p) => p.hull.length > 2).map((p) => [p.no, p.hull]));

// ---- split two plots that the flood fill merged (their division line is crossed by a house footprint)
function cutPoly(P, n, c) { // keep the part where n·x <= c
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], da = n[0] * a[0] + n[1] * a[1] - c, db = n[0] * b[0] + n[1] * b[1] - c;
    if (da <= 0) out.push(a);
    if ((da < 0) !== (db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function split(merged, neighbour, nearNo, farNo) {
  const M = polys.get(merged === nearNo ? nearNo : farNo) || polys.get(merged);
  const N = polys.get(neighbour), mc = centroid(M);
  // divider direction = edge of the neighbour closest to the merged plot
  let best = null;
  for (let i = 0; i < N.length; i++) { const a = N[i], b = N[(i + 1) % N.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(m[0] - mc[0], m[1] - mc[1]); if (!best || d < best.d) best = { a, b, d }; }
  const dx = best.b[0] - best.a[0], dy = best.b[1] - best.a[1], L = Math.hypot(dx, dy);
  let n = [-dy / L, dx / L];
  if (n[0] * best.a[0] + n[1] * best.a[1] > n[0] * mc[0] + n[1] * mc[1]) n = [-n[0], -n[1]]; // n points from the neighbour into M
  const proj = M.map((p) => n[0] * p[0] + n[1] * p[1]), lo = Math.min(...proj), hi = Math.max(...proj);
  const want = AREA[nearNo] / (AREA[nearNo] + AREA[farNo]), total = area(M);
  let a = lo, b = hi;
  for (let k = 0; k < 60; k++) { const c = (a + b) / 2; if (area(cutPoly(M, n, c)) / total < want) a = c; else b = c; }
  const c = (a + b) / 2;
  polys.set(nearNo, cutPoly(M, n, c));
  polys.set(farNo, cutPoly(M, [-n[0], -n[1]], -c));
}
split(10, 9, 10, 11);   // 10 (next to 9) + 11
split(30, 32, 31, 30);  // 31 (next to 32) + 30
split(47, 46, 47, 48);  // 47 (next to 46) + 48

// ---- similarity new(half px) → old plan px from plots that did not change
const oldById = new Map(OLD.plotsSource.filter((p) => p.geometry).map((p) => [p.no, p]));
const pairs = [];
for (let no = 1; no <= 45; no++) {
  if ([10, 11, 30, 31, 47, 48].includes(no) || !polys.has(no) || !oldById.has(no) || oldById.get(no).area !== AREA[no]) continue;
  pairs.push([centroid(polys.get(no)), centroid(oldById.get(no).geometry.plan)]);
}
// least squares: [X,Y] = [[a,-b],[b,a]]·[x,y] + [tx,ty]
let sx = 0, sy = 0, sX = 0, sY = 0; const n = pairs.length;
for (const [[x, y], [X, Y]] of pairs) { sx += x; sy += y; sX += X; sY += Y; }
const mx = sx / n, my = sy / n, mX = sX / n, mY = sY / n;
let num1 = 0, num2 = 0, den = 0;
for (const [[x, y], [X, Y]] of pairs) { const u = x - mx, v = y - my, U = X - mX, V = Y - mY; num1 += u * U + v * V; num2 += u * V - v * U; den += u * u + v * v; }
const A = num1 / den, B = num2 / den, TX = mX - A * mx + B * my, TY = mY - B * mx - A * my;
const toOld = ([x, y]) => [A * x - B * y + TX, B * x + A * y + TY];
const fromOld = ([X, Y]) => { const d = A * A + B * B, u = X - TX, v = Y - TY; return [(A * u + B * v) / d, (-B * u + A * v) / d]; };
const resid = pairs.map(([p, q]) => Math.hypot(toOld(p)[0] - q[0], toOld(p)[1] - q[1]));
console.log(`similarity from ${n} plots: scale ${Math.hypot(A, B).toFixed(5)}, rot ${(Math.atan2(B, A) * 180 / Math.PI).toFixed(3)}°, residual mean ${(resid.reduce((s, v) => s + v, 0) / n).toFixed(2)} px, max ${Math.max(...resid).toFixed(2)} px`);

// ---- the new plan resampled into the original frame (bilinear)
const SRC = "../podklady/new-plan-half.png";
const { data: sd, info: si } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const BG = [244, 241, 228];
const frame = Buffer.alloc(PW * PH * 3);
for (let Y = 0; Y < PH; Y++) for (let X = 0; X < PW; X++) {
  const [x, y] = fromOld([X + 0.5, Y + 0.5]); const o = (Y * PW + X) * 3;
  const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5), fx = x - 0.5 - x0, fy = y - 0.5 - y0;
  if (x0 < 0 || y0 < 0 || x0 + 1 >= si.width || y0 + 1 >= si.height) { frame[o] = BG[0]; frame[o + 1] = BG[1]; frame[o + 2] = BG[2]; continue; }
  for (let c = 0; c < 3; c++) {
    const g = (xx, yy) => sd[(yy * si.width + xx) * 3 + c];
    frame[o + c] = Math.round(g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy);
  }
}
const planImg = sharp(frame, { raw: { width: PW, height: PH, channels: 3 } });
const planPng = await planImg.png().toBuffer();
fs.writeFileSync("../podklady/plan-v2-frame.png", planPng);
// registered copy (geometry frame) for the interactive plan view …
for (const [w, q] of [[900, 80], [1800, 80], [3364, 82]]) await sharp(planPng).resize(w).webp({ quality: q }).toFile(`../assets/img/plan-frame-${w}.webp`);
// … and the corrected plan as delivered for display (gallery, project section)
const FULL = "../podklady/zasilka-WWKAM8Y9MY8DA4HA/FINAL_US_PÍSTOV_BEZ ORTO.jpg";
for (const [w, q] of [[900, 80], [1800, 80], [3364, 82]]) await sharp(FULL).resize(w).webp({ quality: q }).toFile(`../assets/img/plan-${w}.webp`);
await sharp("../podklady/zasilka-WWKAM8Y9MY8DA4HA/FINAL_US_PÍSTOV_ORTO.jpg").resize(1800).webp({ quality: 80 }).toFile("../assets/img/plan-orto-1800.webp");
await sharp("../podklady/zasilka-WWKAM8Y9MY8DA4HA/FINAL_US_PÍSTOV_ORTO.jpg").resize(900).webp({ quality: 80 }).toFile("../assets/img/plan-orto-900.webp");

// ---- house placement: centre + axis of the pink footprint drawn in each plot (for the 2.5D build-up)
const px = (x, y) => { const i = (y * PW + x) * 3; return [frame[i], frame[i + 1], frame[i + 2]]; };
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function placement(poly) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), all = [], light = [];
  for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
    if (!inPoly(x, y, poly)) continue; const [r, g, b] = px(x, y);
    if (r > 215 && r - g > 18 && r - b > 30 && g > 150) { all.push([x, y]); if (g > 205) light.push([x, y]); }
  }
  if (all.length < 150) return null;
  const mean = (a) => [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length];
  const [cx, cy] = mean(all);
  let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of all) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
  return { c: [r1(cx), r1(cy)], angle: Math.round(0.5 * Math.atan2(2 * sxy, sxx - syy) * 1000) / 1000, wing: light.length > 100 ? mean(light).map(r1) : null };
}

const plots = [];
for (let no = 1; no <= 62; no++) {
  const P = polys.get(no); if (!P) throw new Error(`plot ${no} missing`);
  const plan = P.map((p) => toOld(p).map(r1)), aerial = plan.map((p) => apply(H, p).map(r1)), c = centroid(plan);
  const traced = area(plan) * 0.1693 ** 2;
  plots.push({
    id: `P${String(no).padStart(2, "0")}`, no, area: AREA[no], status: "available",
    geometry: { plan, aerial, method: [10, 11, 30, 31, 47, 48].includes(no) ? "split" : "flood", approx: false },
    label: { plan: c.map(r1), aerial: apply(H, c).map(r1) }, placement: placement(plan), tracedArea: Math.round(traced),
  });
}
const off = plots.map((p) => [p.no, p.tracedArea / p.area]).sort((a, b) => Math.abs(1 - b[1]) - Math.abs(1 - a[1]));
console.log("traced/stated area – worst:", off.slice(0, 6).map(([no, r]) => `${no}:${r.toFixed(3)}`).join(" "), "| median", off.map((o) => o[1]).sort()[31].toFixed(3));
for (const p of plots) delete p.tracedArea;

const header = `// GENERATED by tools/build-data-v2.mjs – do not edit by hand.
// Source: opravený situační plán (zásilka 10/2026, „FINAL_US_PÍSTOV_BEZ ORTO“), parcely 1–62, všechny k prodeji.
// Coordinates: plan = px of assets/img/plan-3364.webp (3364×3281, the corrected plan registered onto the frame of the
// original catalogue plan), aerial = px of assets/img/aerial-3400.webp (3419×2038 source).
`;
fs.writeFileSync("../js/projects/pistov/plots.generated.js", `${header}export const PLAN_SIZE = [${PW}, ${PH}];
export const AERIAL_SIZE = ${JSON.stringify(OLD.AERIAL_SIZE)};
export const PLAN_M_PER_PX = ${OLD.PLAN_M_PER_PX}; // 284.7 mm print width × 2000 / 3364 px
export const AERIAL_HOMOGRAPHY = ${JSON.stringify(H)};
export const reservedBlock = null;
export const plotsSource = ${JSON.stringify(plots)};
`);
console.log(plots.length, "plots;", plots.filter((p) => p.placement).length, "with placement");

// ---- hero overlay (ateliér): the plan cut out to the development area with a feathered edge
const hull = (points) => { const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
const env = hull(plots.flatMap((p) => p.geometry.plan));
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><defs><filter id="f"><feGaussianBlur stdDeviation="45"/></filter></defs><polygon points="${env.map((p) => p.join(",")).join(" ")}" fill="#fff" stroke="#fff" stroke-width="160" stroke-linejoin="round" filter="url(#f)"/></svg>`);
const alpha = await sharp(mask).resize(1682).greyscale().raw().toBuffer();
const small = await sharp(planPng).resize(1682).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(1682 * small.info.height * 4);
for (let i = 0; i < 1682 * small.info.height; i++) { rgba[i * 4] = small.data[i * 3]; rgba[i * 4 + 1] = small.data[i * 3 + 1]; rgba[i * 4 + 2] = small.data[i * 3 + 2]; rgba[i * 4 + 3] = alpha[i]; }
await sharp(rgba, { raw: { width: 1682, height: small.info.height, channels: 4 } }).webp({ quality: 80, alphaQuality: 70 }).toFile("../assets/img/plan-cutout-1682.webp");

// ---- light plan for the studio project section: the corrected plan itself, cropped around the development
const pts = plots.flatMap((p) => p.geometry.plan.map(fromOld)), bx = pts.map((p) => p[0]), by = pts.map((p) => p[1]);
const pad = 260, cx0 = Math.max(0, Math.floor(Math.min(...bx) - pad)), cy0 = Math.max(0, Math.floor(Math.min(...by) - pad));
const cw = Math.min(si.width - cx0, Math.ceil(Math.max(...bx) - cx0 + pad)), ch = Math.min(si.height - cy0, Math.ceil(Math.max(...by) - cy0 + pad));
for (const w of [900, 1800]) await sharp(SRC).extract({ left: cx0, top: cy0, width: cw, height: ch }).resize(w).webp({ quality: 82 }).toFile(`../assets/img/plan-light-${w}.webp`);
console.log("plan images written; light crop", cw, "×", ch);

// ---- check sheet: new polygons over the aerial view and over the registered plan
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">`;
for (const p of plots) svg += `<polygon points="${p.geometry.plan.join(" ")}" fill="none" stroke="#0050ff" stroke-width="5"/>`;
svg += "</svg>";
const ov = await sharp(Buffer.from(svg)).resize(PW, PH, { fit: "fill" }).png().toBuffer();
await sharp(await sharp(planPng).composite([{ input: ov }]).png().toBuffer()).resize(1400).jpeg().toFile("../podklady/plots-v2-registered.jpg");
