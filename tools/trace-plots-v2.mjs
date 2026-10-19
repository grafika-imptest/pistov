// Trace plot polygons from the CORRECTED site plan (zásilka 10/2026, "FINAL_US_PÍSTOV_BEZ ORTO.jpg").
// Works on a half-size copy (4967×3508). Output: ../podklady/plots-v2.json + ../podklady/plots-v2-check.jpg
// usage: node trace-plots-v2.mjs
import sharp from "sharp";
import fs from "node:fs";

const SRC = "../podklady/new-plan-half.png";
const K = 4967 / 1400; // seeds below were read from a 1400 px preview
// [plot no., x, y] – position of the plot number in the 1400 px preview
export const seeds = [
  [1,372,437],[2,400,489],[3,424,532],[4,455,573],[5,479,616],[6,511,654],
  [7,550,710],[8,594,752],[9,633,788],[10,677,822],[11,717,849],[12,757,882],
  [13,818,917],[14,894,873],[15,941,840],[16,986,795],[17,1030,745],
  [18,811,791],[19,762,748],[20,726,705],[21,685,670],[22,650,636],
  [23,614,583],[24,583,545],[25,556,505],[26,532,460],[27,499,416],[28,451,397],[29,493,365],[30,534,339],
  [31,541,394],[32,569,433],[33,597,472],[34,627,512],[35,676,560],
  [36,712,605],[37,754,637],[38,787,677],[39,818,718],[40,856,755],
  [41,902,693],[42,896,655],[43,861,616],[44,830,578],[45,793,543],
  [46,764,482],[47,741,435],[48,707,397],[49,685,348],[50,645,310],[51,612,275],[52,520,172],[53,640,106],
  [54,697,233],[55,697,272],[56,731,337],[57,767,390],[58,803,449],
  [59,857,507],[60,891,555],[61,927,601],[62,965,647],
];

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const px = (i) => [data[i * C], data[i * C + 1], data[i * C + 2]];
const fill = ([r, g, b]) => Math.abs(r - 229) <= 10 && Math.abs(g - 229) <= 10 && b >= 194 && b <= 218;
const house = ([r, g, b]) => r >= 218 && r <= 252 && g >= 176 && g <= 226 && b >= 148 && b <= 206 && r - g >= 6;
const number = ([r, g, b]) => r > 232 && g < 95 && b < 45;
const text = ([r, g, b]) => Math.max(r, g, b) < 120 && Math.abs(r - b) < 45;
const pass = new Uint8Array(W * H);
// plots whose division line is crossed by a house footprint are traced without the footprints (strict)
const STRICT = new Set((process.env.STRICT || "").split(",").map(Number));
const passStrict = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const p = px(i); pass[i] = fill(p) || house(p) || number(p) || text(p) ? 1 : 0; passStrict[i] = fill(p) || number(p) || text(p) ? 1 : 0; }

// red plot numbers → glyph groups (digits of one number lie within ~30 px)
const isNum = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) isNum[i] = number(px(i)) ? 1 : 0;
const seen = new Uint8Array(W * H), groups = [];
for (let i = 0; i < W * H; i++) {
  if (!isNum[i] || seen[i]) continue;
  const st = [i], g = []; seen[i] = 1;
  while (st.length) { const j = st.pop(); g.push(j); const x = j % W, y = (j / W) | 0;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const k = (y + dy) * W + x + dx; if (x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H && isNum[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
  if (g.length < 60) continue;
  const cx = g.reduce((s, j) => s + (j % W), 0) / g.length, cy = g.reduce((s, j) => s + ((j / W) | 0), 0) / g.length;
  groups.push({ cx, cy, n: g.length, start: g[0] });
}
// assign each listed number to the nearest free glyph group
const assigned = new Map();
const cand = []; for (const [no, sx, sy] of seeds) for (const [gi, g] of groups.entries()) cand.push([Math.hypot(g.cx - sx * K, g.cy - sy * K), no, gi]);
cand.sort((x, y) => x[0] - y[0]); const usedG = new Set();
for (const [d, no, gi] of cand) { if (assigned.has(no) || usedG.has(gi) || d > 160) continue; assigned.set(no, groups[gi]); usedG.add(gi); }
console.log("glyph groups", groups.length, "assigned", assigned.size, "missing", seeds.filter(([no]) => !assigned.has(no)).map(([no]) => no).join(","));

const owner = new Int32Array(W * H).fill(-1);
const out = [];
for (const [no] of [...seeds].sort((a, b) => STRICT.has(b[0]) - STRICT.has(a[0]))) {
  const g = assigned.get(no); if (!g) continue;
  const ok = STRICT.has(no) ? passStrict : pass;
  if (owner[g.start] >= 0) { out.push({ no, pixels: 0, hull: [], mergedInto: owner[g.start] }); continue; }
  const stack = [g.start], pts = []; owner[g.start] = no;
  while (stack.length) {
    const i = stack.pop(); const x = i % W, y = (i / W) | 0; pts.push([x, y]);
    for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && ok[j] && owner[j] < 0 && Math.abs((j % W) - x) <= 1) { owner[j] = no; stack.push(j); }
  }
  // number drawn inside a closed house footprint → continue from the plot fill around it
  if (pts.length < 15000) {
    const gx = Math.round(g.cx), gy = Math.round(g.cy);
    for (let r = 10; r < 90; r += 2) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
      const i = (gy + dy) * W + gx + dx; if (!fill(px(i)) || owner[i] >= 0) continue;
      const st = [i]; owner[i] = no;
      while (st.length) { const j = st.pop(); const x = j % W; pts.push([x, (j / W) | 0]); for (const k of [j - 1, j + 1, j - W, j + W]) if (k >= 0 && k < W * H && ok[k] && owner[k] < 0 && Math.abs((k % W) - x) <= 1) { owner[k] = no; st.push(k); } }
    }
  }
  out.push({ no, pixels: pts.length, hull: hull(pts), glyph: [g.cx, g.cy] });
}
console.log("merged:", out.filter((o) => o.mergedInto).map((o) => o.no + "→" + o.mergedInto).join(" "));

function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return simplify(lo.slice(0, -1).concat(up.slice(0, -1)), 3.5);
}
// drop hull vertices that deviate less than eps px from the line of their neighbours
function simplify(poly, eps) {
  let p = poly.slice(), changed = true;
  while (changed && p.length > 3) {
    changed = false;
    for (let i = 0; i < p.length && p.length > 3; i++) {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      const d = Math.abs((c[0] - a[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (c[1] - a[1])) / Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (d < eps) { p.splice(i, 1); changed = true; i--; }
    }
  }
  return p;
}

fs.writeFileSync("../podklady/plots-v2.json", JSON.stringify({ size: [W, H], plots: out }));
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
for (const p of out.filter((q) => q.hull.length > 2)) svg += `<polygon points="${p.hull.map((q) => q.join(",")).join(" ")}" fill="rgba(0,120,255,.25)" stroke="#0050ff" stroke-width="4"/><text x="${p.hull[0][0]}" y="${p.hull[0][1]}" font-size="40" fill="#0050ff">${p.no}</text>`;
svg += "</svg>";
console.log(out.length, "plots", out.map((p) => `${p.no}:${p.pixels}`).join(" "));
const ov = await sharp(Buffer.from(svg)).resize(W, H, { fit: "fill" }).png().toBuffer();
await sharp(await sharp(SRC).composite([{ input: ov }]).png().toBuffer()).resize(1600).jpeg().toFile("../podklady/plots-v2-check.jpg");
console.log(out.length, "plots", out.map((p) => `${p.no}:${p.pixels}`).join(" "));
