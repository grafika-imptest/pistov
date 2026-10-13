// Trace plot polygons from the raster site plan (catalog p.3) by flood-filling from each plot label.
// Output: ../podklady/plots-traced.json  (coords in source-image pixels, 3364x3281)
//         ../podklady/plots-check.jpg     (overlay for visual verification)
import sharp from "sharp";
import fs from "node:fs";

const SRC = "../podklady/raw/p03_1_3364x3281.png";
const S = 3364 / 1600; // label positions below were read from the 1600px preview
// [plot no., x, y] in 1600px preview space – position of the red plot number
const labels = [
  [1,377,866],[2,407,925],[3,434,975],[4,470,1022],[5,497,1070],[6,536,1116],
  [7,581,1180],[8,630,1230],[9,678,1270],[10,728,1313],[11,776,1342],[12,820,1379],
  [13,857,1417],[14,978,1371],[15,1033,1333],[16,1083,1287],[17,1133,1238],
  [18,881,1278],[19,826,1226],[20,785,1176],[21,738,1137],[22,697,1097],
  [23,656,1035],[24,617,992],[25,589,943],[26,562,893],[27,523,843],[28,466,820],[29,515,784],[30,561,752],
  [31,597,815],[32,630,864],[33,633,908],[34,668,953],[35,702,997],
  [36,767,1060],[37,813,1095],[38,853,1145],[39,885,1193],[40,931,1236],
  [41,1018,1165],[42,980,1118],[43,939,1073],[44,902,1029],[45,859,987],
  [46,826,918],[47,800,866],[48,762,820],[49,735,775],[50,690,720],[51,650,679],[52,701,648],[53,744,618],
  [54,758,676],[55,794,722],[56,831,764],[57,849,833],[58,878,875],
  [60,932,946],[61,968,1003],[62,1016,1055],[63,1057,1110],
  [64,237,688],[65,281,712],[66,300,773],[67,334,655],[68,392,630],[69,472,618],[70,544,560],
  [71,660,380],[72,657,433],[73,685,483],
];

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const at = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const isFill = ([r, g, b]) => Math.abs(r - 232) < 10 && Math.abs(g - 235) < 9 && Math.abs(b - 224) < 10;
const isPink = ([r, g, b]) => r > 215 && r - g > 12 && r - b > 8;          // house footprints
const isRed = ([r, g, b]) => r > 195 && g < 150 && b < 160;                 // labels + hatching
const isBarrier = ([r, g, b]) => (Math.max(r, g, b) < 224 && Math.abs(r - g) < 18 && Math.abs(g - b) < 22) || (r < 215 && r - g > 55) || (g > r + 4) || (r > 246 && g > 246 && b > 246) || (r < 120 && g < 120);
const T = Number(process.env.T ?? 6);
const isFillT = ([r, g, b]) => Math.abs(r - 232) <= T && Math.abs(g - 235) <= T && Math.abs(b - 224) <= T;
const passable = process.env.MODE === "barrier" ? (p) => !isBarrier(p) : (p) => isFillT(p) || isPink(p) || isRed(p);

// barrier map: non-passable pixels dilated by R so thin/antialiased division lines become closed
const R = Number(process.env.R ?? 0); const pass = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pass[y * W + x] = passable(at(x, y)) ? 1 : 0;
const open = pass.slice();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!pass[y * W + x]) for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < W && yy < H) open[yy * W + xx] = 0; }

function seedNear(x0, y0) {
  for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = x0 + dx, y = y0 + dy; let ok = true;
    for (let j = -3; j <= 3 && ok; j++) for (let i = -3; i <= 3 && ok; i++) if (!isFill(at(x + i, y + j))) ok = false;
    if (ok) return [x, y];
  }
  return null;
}

function flood(sx, sy, maxPx = 400000) {
  const seen = new Uint8Array(W * H); const stack = [sy * W + sx]; seen[stack[0]] = 1; const pts = [];
  while (stack.length) {
    const k = stack.pop(); const x = k % W, y = (k / W) | 0; pts.push([x, y]);
    if (pts.length > maxPx) return { pts, leaked: true };
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nk = ny * W + nx; if (seen[nk]) continue; seen[nk] = 1;
      if (open[nk]) stack.push(nk);
    }
  }
  return { pts, leaked: false };
}

function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// drop vertices that deviate less than tol from the line through their neighbours
function simplify(poly, tol = 7) {
  let pts = poly.slice(); let changed = true;
  while (changed && pts.length > 4) {
    changed = false; let best = -1, bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      const d = Math.abs((c[0] - a[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (c[1] - a[1])) / Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (bestD < tol) { pts.splice(best, 1); changed = true; }
  }
  return pts;
}
const area = (p) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;

const out = [];

// Reserved (hatched) plots: the hatching is drawn in the same red as the outline, so the flood is
// clipped to the block outline read manually from a gridded crop (source px).
const HATCH_64_70 = [[320,1436],[567,1205],[602,1191],[700,1145],[800,1099],[951,1000],[1028,1104],[1197,999],[1280,1149],[600,1678]];
const HATCH_71_72 = [[1137,759],[1297,705],[1437,903],[1275,995]];
const CLIP = { 64: HATCH_64_70, 65: HATCH_64_70, 66: HATCH_64_70, 67: HATCH_64_70, 68: HATCH_64_70, 69: HATCH_64_70, 70: HATCH_64_70, 71: HATCH_71_72, 72: HATCH_71_72 };
// Plots whose flood fill cannot be separated from neighbouring non-project land: read manually.
const MANUAL = { 73: [[1275,995],[1437,903],[1512,1006],[1300,1067]] };

const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

function floodClip(sx, sy, clip, maxPx = 400000) {
  const seen = new Uint8Array(W * H); const stack = [sy * W + sx]; seen[stack[0]] = 1; const pts = [];
  while (stack.length) {
    const k = stack.pop(); const x = k % W, y = (k / W) | 0; pts.push([x, y]);
    if (pts.length > maxPx) return { pts, leaked: true };
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nk = ny * W + nx; if (seen[nk]) continue; seen[nk] = 1;
      if (open[nk] && (!clip || inPoly(nx, ny, clip))) stack.push(nk);
    }
  }
  return { pts, leaked: false };
}
function seedAny(x0, y0, clip) { // for hatched plots: nearest passable pixel with passable neighbourhood
  for (let r = 0; r < 80; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = x0 + dx, y = y0 + dy; let ok = true;
    for (let j = -2; j <= 2 && ok; j++) for (let i = -2; i <= 2 && ok; i++) if (!open[(y + j) * W + x + i]) ok = false;
    if (ok && inPoly(x, y, clip)) return [x, y];
  }
  return null;
}

const AREA = {1:696,2:598,3:578,4:583,5:576,6:635,7:661,8:660,9:621,10:607,11:601,12:600,13:1067,14:903,15:953,16:927,17:787,18:633,19:556,20:587,21:584,22:568,23:601,24:600,25:600,26:600,27:599,28:570,29:598,30:626,31:602,32:604,33:605,34:606,35:607,36:710,37:580,38:571,39:557,40:538,41:499,42:524,43:542,44:573,45:579,46:601,47:614,48:614,49:612,50:599,51:597,52:592,53:562,54:615,55:570,56:570,57:571,58:585,60:682,61:659,62:586,63:605,64:917,65:938,66:840,67:1423,68:1221,69:674,70:900,71:603,72:651,73:697};

for (const [no, lx, ly] of labels) {
  if (MANUAL[no]) { out.push({ no, seed: MANUAL[no][0], poly: MANUAL[no], method: "manual" }); continue; }
  const clip = CLIP[no];
  const seed = clip ? seedAny(Math.round(lx * S), Math.round(ly * S), clip) : seedNear(Math.round(lx * S), Math.round(ly * S));
  if (!seed) { out.push({ no, error: "no seed" }); continue; }
  const { pts, leaked } = floodClip(...seed, clip);
  if (leaked) { out.push({ no, error: "leaked", seed }); continue; }
  const poly = simplify(hull(pts));
  out.push({ no, seed, px: pts.length, poly, method: clip ? "flood-clipped" : "flood" });
}

// Plots whose dividing line is missing in the raster come out as one merged region.
// Split such a region into strips in proportion to the plot areas stated in the plan.
const groups = {};
for (const o of out) if (o.px) (groups[o.px + ":" + o.poly.length] ||= []).push(o);
for (const g of Object.values(groups)) {
  if (g.length < 2) continue;
  let q = g[0].poly; let tol = 7; while (q.length > 4 && tol < 80) { q = simplify(q, (tol += 4)); }
  if (q.length !== 4) { g.forEach((o) => (o.error = "merged, not splittable")); continue; }
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  // long edge pair: (q0->q1, q3->q2) or (q1->q2, q0->q3)
  const pairA = len(q[0], q[1]) + len(q[3], q[2]), pairB = len(q[1], q[2]) + len(q[0], q[3]);
  const [a0, a1, b0, b1] = pairA >= pairB ? [q[0], q[1], q[3], q[2]] : [q[1], q[2], q[0], q[3]];
  const dir = [a1[0] - a0[0], a1[1] - a0[1]];
  const sorted = g.slice().sort((p, r) => (p.seed[0] - a0[0]) * dir[0] + (p.seed[1] - a0[1]) * dir[1] - ((r.seed[0] - a0[0]) * dir[0] + (r.seed[1] - a0[1]) * dir[1]));
  const total = sorted.reduce((s, o) => s + AREA[o.no], 0);
  const lerp = (p, r, t) => [Math.round(p[0] + (r[0] - p[0]) * t), Math.round(p[1] + (r[1] - p[1]) * t)];
  let acc = 0;
  for (const o of sorted) {
    const f0 = acc / total; acc += AREA[o.no]; const f1 = acc / total;
    o.poly = [lerp(a0, a1, f0), lerp(a0, a1, f1), lerp(b0, b1, f1), lerp(b0, b1, f0)];
    o.method = "split-by-area"; o.mergedWith = sorted.map((s) => s.no);
  }
}
for (const o of out) if (o.poly) { o.polyArea = Math.round(area(o.poly)); o.pxPerM2 = +(o.polyArea / AREA[o.no]).toFixed(1); }

fs.writeFileSync(`../podklady/plots-traced-final.json`, JSON.stringify(out, null, 1));
for (const o of out) console.log(o.no, o.error || `${o.method} ${o.poly.length}v ratio=${o.pxPerM2}`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${out.filter(o => o.poly).map(o =>
  `<polygon points="${o.poly.map(p => p.join(",")).join(" ")}" fill="${o.method === "flood" ? "rgba(0,120,255,.22)" : "rgba(255,140,0,.3)"}" stroke="#0050ff" stroke-width="4"/><text x="${o.poly.reduce((s, p) => s + p[0], 0) / o.poly.length - 20}" y="${o.poly.reduce((s, p) => s + p[1], 0) / o.poly.length + 14}" font-size="44" font-weight="bold" fill="#002" font-family="Arial">${o.no}</text>`).join("")}</svg>`;
const comp = await sharp(SRC).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
await sharp(comp).resize(1800).jpeg({ quality: 82 }).toFile(`../podklady/plots-check-final.jpg`);
