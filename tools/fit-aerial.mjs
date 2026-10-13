// Fit a plan -> aerial-visualization homography.
// Plan house footprints (pink) are matched to rendered roofs (orange) in the aerial view.
// Start: 4 hand-picked pairs; then ICP-style refinement on all matches.
import sharp from "sharp";
import fs from "node:fs";

const PLAN = "../podklady/raw/p03_1_3364x3281.png";
const AER = "../podklady/raw/p06_1_3419x2038.png";
const plots = JSON.parse(fs.readFileSync("../podklady/plots-traced-final.json", "utf8")).filter((p) => p.poly);

const load = async (f) => { const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true }); return { data, W: info.width, H: info.height, C: info.channels }; };
const plan = await load(PLAN), aer = await load(AER);
const px = (img, x, y) => { const i = (y * img.W + x) * img.C; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

// 1. plan: centroid of pink (house footprint) pixels inside each plot
const planPts = [];
for (const p of plots) {
  const xs = p.poly.map((q) => q[0]), ys = p.poly.map((q) => q[1]);
  let sx = 0, sy = 0, n = 0;
  for (let y = Math.min(...ys); y <= Math.max(...ys); y += 2) for (let x = Math.min(...xs); x <= Math.max(...xs); x += 2) {
    if (!inPoly(x, y, p.poly)) continue; const [r, g, b] = px(plan, x, y);
    if (r > 215 && r - g > 25 && r - b > 20 && g > 120) { sx += x; sy += y; n++; }
  }
  if (n > 50) planPts.push({ no: p.no, x: sx / n, y: sy / n });
}

// 2. aerial: connected components of roof-coloured pixels
const { W, H } = aer; const roof = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = px(aer, x, y); if ((r > 170 && r - g > 55 && r - b > 70) || (r > 110 && r - g > 50 && r - b > 45 && g < 90)) roof[y * W + x] = 1; }
const lab = new Int32Array(W * H); const blobs = [];
for (let k = 0; k < W * H; k++) {
  if (!roof[k] || lab[k]) continue; const st = [k]; lab[k] = blobs.length + 1; let sx = 0, sy = 0, n = 0;
  while (st.length) { const c = st.pop(); const x = c % W, y = (c / W) | 0; sx += x; sy += y; n++;
    for (const d of [1, -1, W, -W]) { const nk = c + d; if (nk >= 0 && nk < W * H && roof[nk] && !lab[nk]) { lab[nk] = lab[k]; st.push(nk); } } }
  blobs.push({ x: sx / n, y: sy / n, n });
}
const roofs = blobs.filter((b) => b.n > 250);
console.log("plan houses", planPts.length, "aerial roofs", roofs.length);

// homography helpers
function solve(A, b) { const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / r[i]); }
function fitH(pairs) { // least squares, h33 = 1
  const AtA = Array.from({ length: 8 }, () => Array(8).fill(0)), Atb = Array(8).fill(0);
  for (const [[x, y], [u, v]] of pairs) for (const [row, rhs] of [[[x, y, 1, 0, 0, 0, -u * x, -u * y], u], [[0, 0, 0, x, y, 1, -v * x, -v * y], v]])
    for (let i = 0; i < 8; i++) { Atb[i] += row[i] * rhs; for (let j = 0; j < 8; j++) AtA[i][j] += row[i] * row[j]; }
  return [...solve(AtA, Atb), 1]; }
const apply = (h, [x, y]) => { const w = h[6] * x + h[7] * y + h[8]; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };

const byNo = Object.fromEntries(planPts.map((p) => [p.no, [p.x, p.y]]));
const PAIRS = JSON.parse(process.env.PAIRS || "[[1,1240,530],[6,1355,805],[13,2064,1440],[17,2740,1232]]");
let Hm = fitH(PAIRS.map(([n, u, v]) => [byNo[n], [u, v]]));
let matches = [];
for (let it = 0, r = Number(process.env.R0 ?? 90); it < Number(process.env.ITERS ?? 12); it++, r = Math.max(Number(process.env.RMIN ?? 35), r * 0.8)) {
  matches = [];
  for (const p of planPts) { const q = apply(Hm, [p.x, p.y]); let best = null, bd = r;
    for (const b of roofs) { const d = Math.hypot(b.x - q[0], b.y - q[1]); if (d < bd) { bd = d; best = b; } }
    if (best) matches.push({ no: p.no, from: [p.x, p.y], to: [best.x, best.y], d: bd }); }
  Hm = fitH(matches.map((m) => [m.from, m.to]));
  const err = matches.map((m) => Math.hypot(...apply(Hm, m.from).map((v, i) => v - m.to[i])));
  console.log(`iter ${it} r=${r.toFixed(0)} matches=${matches.length} meanErr=${(err.reduce((a, b) => a + b, 0) / err.length).toFixed(1)}px`);
}
fs.writeFileSync("../podklady/aerial-homography.json", JSON.stringify({ H: Hm, matches: matches.length }, null, 1));

// check overlay: plot polygons projected onto the aerial
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${plots.map((p) => {
  const pts = p.poly.map((q) => apply(Hm, q)); const c = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]);
  return `<polygon points="${pts.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="rgba(0,90,255,.18)" stroke="#00f" stroke-width="3"/><text x="${c[0] - 10}" y="${c[1] + 8}" font-size="26" font-weight="bold" fill="#fff" stroke="#000" stroke-width="1" font-family="Arial">${p.no}</text>`; }).join("")}${roofs.map((b) => `<circle cx="${b.x}" cy="${b.y}" r="7" fill="yellow"/>`).join("")}${planPts.map((p) => { const q = apply(Hm, [p.x, p.y]); return `<circle cx="${q[0]}" cy="${q[1]}" r="7" fill="red"/>`; }).join("")}</svg>`;
const comp = await sharp(AER).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
await sharp(comp).extract({ left: 900, top: 150, width: 2300, height: 1600 }).resize(1700).jpeg({ quality: 82 }).toFile("../podklady/aerial-check.jpg");
