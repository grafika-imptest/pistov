// Layers for the home-page hero film (js/studio/hero-film.js): the houses of the bird's-eye visualisation 11/2026
// cut out of MENŠÍ_04 against the bare plots of MENŠÍ_03 (same render, pixel-aligned).
// Every changed pixel is given to the nearest plot, so each plot gets its own house sprite (house, terrace, driveway).
//  - film-houses.webp : atlas of the built-up house sprites
//  - film-wire.webp   : the same atlas as a "wireframe" – light edge lines (sprite outline + strong edges of the render)
//  - film.generated.js: per plot the sprite rectangle in the atlas and its place in the aerial image (fractions)
// usage: cd tools && node build-hero-film.mjs
import sharp from "sharp";
import fs from "node:fs";
import { plotsSource, AERIAL_SIZE } from "../js/projects/pistov/plots.generated.js";

const SRC = "../podklady/vizualizace/", IMG = "../assets/img/";
const W = 3400;
const load = async (f) => (await sharp(SRC + f).resize(W).removeAlpha().raw().toBuffer({ resolveWithObject: true }));
const a = await load("PÍSTOV_LOKALITA_MENŠÍ_03.jpg"), b = await load("PÍSTOV_LOKALITA_MENŠÍ_04.jpg");
const H = a.info.height, N = W * H, A = a.data, B = b.data;

// ---- mask: clearly changed pixels that are not green (lawn, trees) nor yellow-green (autumn foliage) in the built render
let m = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const d = Math.abs(A[i * 3] - B[i * 3]) + Math.abs(A[i * 3 + 1] - B[i * 3 + 1]) + Math.abs(A[i * 3 + 2] - B[i * 3 + 2]);
  const r = B[i * 3], g = B[i * 3 + 1], bl = B[i * 3 + 2];
  m[i] = d > 90 && !(g - Math.max(r, bl) > 6) && !(g >= r - 6 && g - bl > 40) ? 1 : 0;
}
const morph = (src, r, dil) => { const o = new Uint8Array(N); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = dil ? 0 : 1;
  for (let dy = -r; dy <= r && (dil ? !v : v); dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = src[Y * W + X]; if (dil && q) { v = 1; break; } if (!dil && !q) { v = 0; break; } }
  o[y * W + x] = v; } return o; };
m = morph(morph(m, 2, true), 2, false);
// fill small holes (dark roof patches close to the colour of the lawn)
{ const lab = new Int32Array(N); let id = 0;
  for (let k = 0; k < N; k++) { if (m[k] || lab[k]) continue; id++; const st = [k], px = []; lab[k] = id; let border = false;
    while (st.length) { const c = st.pop(); px.push(c); const x = c % W, y = (c / W) | 0; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      for (const n of [c - 1, c + 1, c - W, c + W]) if (n >= 0 && n < N && !m[n] && !lab[n] && Math.abs((n % W) - x) <= 1) { lab[n] = id; st.push(n); } }
    if (!border && px.length < 1500) for (const c of px) m[c] = 1; } }

// ---- houses: every mask pixel belongs to the nearest plot label (within reach)
const k = W / AERIAL_SIZE[0], labels = plotsSource.map((p) => [p.no, p.label.aerial[0] * k, p.label.aerial[1] * k]);
const owner = new Int16Array(N), box = new Map();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!m[i]) continue;
  let best = 0, bd = 1e12; for (const [no, lx, ly] of labels) { const d = (x - lx) ** 2 + (y - ly) ** 2; if (d < bd) { bd = d; best = no; } }
  if (bd > (230 * k * 2) ** 2) { m[i] = 0; continue; }
  owner[i] = best; const b0 = box.get(best) || [W, H, 0, 0, 0]; box.set(best, [Math.min(b0[0], x), Math.min(b0[1], y), Math.max(b0[2], x), Math.max(b0[3], y), b0[4] + 1]); }
// ---- layers
const housesRGBA = Buffer.alloc(N * 4), wire = Buffer.alloc(N * 4);
const L = new Float32Array(N); for (let i = 0; i < N; i++) L[i] = 0.3 * B[i * 3] + 0.59 * B[i * 3 + 1] + 0.11 * B[i * 3 + 2];
const S = new Float32Array(N); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { let t = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) t += L[(y + dy) * W + x + dx]; S[y * W + x] = t / 9; }
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const i = y * W + x;
  if (m[i]) { housesRGBA[i * 4] = B[i * 3]; housesRGBA[i * 4 + 1] = B[i * 3 + 1]; housesRGBA[i * 4 + 2] = B[i * 3 + 2]; housesRGBA[i * 4 + 3] = 255; }
  if (!m[i] && !m[i - 1] && !m[i + 1] && !m[i - W] && !m[i + W]) continue;
  const gx = S[i + 1 - W] + 2 * S[i + 1] + S[i + 1 + W] - S[i - 1 - W] - 2 * S[i - 1] - S[i - 1 + W];
  const gy = S[i + W - 1] + 2 * S[i + W] + S[i + W + 1] - S[i - W - 1] - 2 * S[i - W] - S[i - W + 1];
  let al = Math.max(0, Math.min(1, (Math.hypot(gx, gy) - 70) / 120));
  if (m[i] && (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W])) al = Math.max(al, 0.9);
  wire[i * 4] = 236; wire[i * 4 + 1] = 246; wire[i * 4 + 2] = 255; wire[i * 4 + 3] = Math.round(al * 255);
}
// ---- atlas (shelf packing, 2 px gutter)
const AW = 1600, sprites = []; let cx = 0, cy = 0, row = 0;
for (const [no, [x0, y0, x1, y1, n]] of [...box].sort((p, q) => (q[1][3] - q[1][1]) - (p[1][3] - p[1][1]))) {
  if (n < 200) continue; const w = x1 - x0 + 3, h = y1 - y0 + 3;
  if (cx + w > AW) { cx = 0; cy += row; row = 0; }
  sprites.push({ no, sx: cx, sy: cy, w, h, x0: x0 - 1, y0: y0 - 1 }); cx += w + 2; row = Math.max(row, h + 2);
}
const AH = cy + row, atlasH = Buffer.alloc(AW * AH * 4), atlasW = Buffer.alloc(AW * AH * 4);
for (const sp of sprites) for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
  const X = sp.x0 + x, Y = sp.y0 + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = Y * W + X, o = ((sp.sy + y) * AW + sp.sx + x) * 4;
  const mine = owner[i] === sp.no, edge = [i - 1, i + 1, i - W, i + W].some((q) => owner[q] === sp.no);
  if (mine) for (let c = 0; c < 4; c++) atlasH[o + c] = housesRGBA[i * 4 + c];
  if (mine || edge) for (let c = 0; c < 4; c++) atlasW[o + c] = wire[i * 4 + c];
}
await sharp(atlasH, { raw: { width: AW, height: AH, channels: 4 } }).webp({ quality: 82, alphaQuality: 90 }).toFile(`${IMG}film-houses.webp`);
await sharp(atlasW, { raw: { width: AW, height: AH, channels: 4 } }).webp({ quality: 82, alphaQuality: 85 }).toFile(`${IMG}film-wire.webp`);
const r4 = (v) => +v.toFixed(5);
fs.writeFileSync("../js/projects/pistov/film.generated.js", `// GENERATED by tools/build-hero-film.mjs – do not edit by hand.
// House sprites of the bird's-eye visualisation 11/2026: atlas ${AW}×${AH} px (assets/img/film-houses.webp, film-wire.webp),
// per plot [no, sx, sy, w, h] in the atlas and [x, y, w, h] in the aerial image as fractions.
export const filmAtlas = { size: [${AW}, ${AH}], image: [${W}, ${H}] };
export const filmHouses = ${JSON.stringify(sprites.sort((p, q) => p.no - q.no).map((sp) => [sp.no, sp.sx, sp.sy, sp.w, sp.h, r4(sp.x0 / W), r4(sp.y0 / H), r4(sp.w / W), r4(sp.h / H)]))};
`);
console.log(sprites.length, "house sprites, atlas", AW, "x", AH);
