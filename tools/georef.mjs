// Georeference the site plan: match water bodies (plan raster) to OSM ponds, fit a similarity transform
// (scale + rotation + translation) from local metres (ENU) to plan px. Output ../podklady/georef.json
import sharp from "sharp";
import fs from "node:fs";
const osm = JSON.parse(fs.readFileSync("../podklady/panorama/osm-water.json", "utf8")).elements;
const REF = [49.38015, 15.567753]; // panorama DJI_0303 position as local origin
const mLat = 111132.92 - 559.82 * Math.cos(2 * REF[0] * Math.PI / 180);
const mLon = 111412.84 * Math.cos(REF[0] * Math.PI / 180);
export const enu = (lat, lon) => [(lon - REF[1]) * mLon, (lat - REF[0]) * mLat]; // x east, y north (m)

// plan water components
const { data, info } = await sharp("../podklady/raw/p03_1_3364x3281.png").raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const isWater = (i) => { const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2]; return b > 150 && b - r > 50 && g > 130 && g < 210 && r < 140; };
const lab = new Int32Array(W * H); const comps = [];
for (let k = 0; k < W * H; k++) {
  if (lab[k] || !isWater(k)) continue;
  const st = [k]; lab[k] = comps.length + 1; let sx = 0, sy = 0, n = 0, x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  while (st.length) { const c = st.pop(); const x = c % W, y = (c / W) | 0; sx += x; sy += y; n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    for (const d of [1, -1, W, -W]) { const q = c + d; if (q >= 0 && q < W * H && !lab[q] && isWater(q)) { lab[q] = lab[k]; st.push(q); } } }
  if (n > 3000) comps.push({ c: [sx / n, sy / n], n, w: x1 - x0, h: y1 - y0 });
}
console.log("plan water", comps.map((c) => `${c.c.map(Math.round)} ${c.w}x${c.h}px n=${c.n}`).join(" | "));
const ponds = osm.map((e) => { const g = e.geometry; const la = g.reduce((s, p) => s + p.lat, 0) / g.length, lo = g.reduce((s, p) => s + p.lon, 0) / g.length; return { id: e.id, ll: [la, lo], m: enu(la, lo), n: g.length }; });

// initial guess: north-up, 0.1693 m/px, translation from the big pond (largest component ↔ OSM 52116157)
const big = comps.sort((a, b) => b.n - a.n)[0];
const ob = ponds.find((p) => p.id === 52116157);
const s0 = 1 / 0.1693;
let T = { a: s0, b: 0, tx: big.c[0] - ob.m[0] * s0, ty: big.c[1] + ob.m[1] * s0 }; // px = [a -b; b a]·[x, -y] + t
const fwd = (T, [x, y]) => [T.a * x - T.b * -y + T.tx, T.b * x + T.a * -y + T.ty];
// match each OSM pond to nearest plan component, refit similarity by least squares, iterate
let pairs = [];
for (let it = 0; it < 5; it++) {
  pairs = [];
  for (const p of ponds) { const q = fwd(T, p.m); let best = null, bd = 260; for (const c of comps) { const d = Math.hypot(c.c[0] - q[0], c.c[1] - q[1]); if (d < bd) { bd = d; best = c; } } if (best) pairs.push({ p, c: best, d: bd }); }
  // solve u = a x + b y' + tx, v = -b x + a y'... with y' = -y  → standard similarity on (x, -y)
  const P = pairs.map(({ p, c }) => [[p.m[0], -p.m[1]], c.c]);
  const n = P.length; const mx = P.reduce((s, [s0]) => [s[0] + s0[0] / n, s[1] + s0[1] / n], [0, 0]); const mu = P.reduce((s, [, d]) => [s[0] + d[0] / n, s[1] + d[1] / n], [0, 0]);
  let sxx = 0, a = 0, b = 0;
  for (const [[x, y], [u, v]] of P) { const X = x - mx[0], Y = y - mx[1], U = u - mu[0], V = v - mu[1]; sxx += X * X + Y * Y; a += X * U + Y * V; b += X * V - Y * U; }
  a /= sxx; b /= sxx;
  T = { a, b, tx: mu[0] - (a * mx[0] - b * mx[1]), ty: mu[1] - (b * mx[0] + a * mx[1]) };
  const err = pairs.map(({ p, c }) => Math.hypot(...fwd(T, p.m).map((v, i) => v - c.c[i])));
  console.log(`iter ${it}: ${pairs.length} pairs, m/px=${(1 / Math.hypot(T.a, T.b)).toFixed(4)}, rot=${(Math.atan2(T.b, T.a) * 180 / Math.PI).toFixed(2)}°, err px=${err.map((e) => e.toFixed(0)).join(",")}`);
}
fs.writeFileSync("../podklady/georef.json", JSON.stringify({ REF, mLat, mLon, T, pairs: pairs.map(({ p, c, d }) => ({ osm: p.id, ll: p.ll, plan: c.c, d })) }, null, 1));
const panos = { DJI_0303: [49.38015, 15.567753, 30.1], DJI_0304: [49.380154, 15.567755, 59.6], DJI_0305: [49.380919, 15.57023, 59.8], DJI_0308: [49.378484, 15.567918, 59.7], DJI_0309: [49.380665, 15.563362, 60], DJI_0311: [49.383037, 15.567392, 59.3] };
for (const [k, [la, lo]] of Object.entries(panos)) console.log(k, "plan px", fwd(T, enu(la, lo)).map(Math.round).join(","));
