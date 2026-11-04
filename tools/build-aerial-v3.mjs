// Swaps the aerial view for the bird's-eye visualisations of 11/2026 (podklady/vizualizace, "PÍSTOV_LOKALITA_*").
//  - MENŠÍ_03 (bare plots, paths, trees) → aerial-empty-*  = base of the interactive view
//  - MENŠÍ_04 (houses)                   → aerial-*        = gallery, home teasers, hero
//  - MENŠÍ_01 (plot numbers)             → aerial-plots-*  = gallery
//  - VĚTŠÍ_04 (same render, wider frame) → aerial-wide-* = gallery; with sky above and fields below outpainted in
//    Magnific (podklady/vizualizace-okoli-magnific.png, 2000×2938, VĚTŠÍ at y 938) → aerial-surround, shown when zoomed out
// The plan → view homography was fitted on the plot numbers of MENŠÍ_01 and refined on the white plot lines of
// MENŠÍ_02 (mean distance 2.8 px on 4356 px). MENŠÍ is an exact crop of VĚTŠÍ at (322, 359), scale 1 (SSD check).
// Rewrites the aerial coordinates in plots.generated.js and panoramas.generated.js; plan coordinates stay.
// usage: cd tools && node build-aerial-v3.mjs
import sharp from "sharp";
import fs from "node:fs";

const SRC = "../podklady/vizualizace/", IMG = "../assets/img/", DATA = "../js/projects/pistov/";
const SIZE = [4356, 2450];
const H = [0.9028819989965753, -0.49737680067025997, 695.2203022549053, 0.028690738513257825, 0.1849511412843043, 141.70797423804538, -0.000005300315334288146, -0.00021344902178568103, 1];
const WIDE_OFFSET = [322, 359], WIDE_SIZE = [5275, 2967];
const r1 = (v) => Math.round(v * 10) / 10;
const apply = (h, [x, y]) => { const w = h[6] * x + h[7] * y + h[8]; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w].map(r1); };

// ---- images
const out = async (file, name, widths, q = 72) => { for (const w of widths) await sharp(SRC + file).resize(w).webp({ quality: q }).toFile(`${IMG}${name}-${w}.webp`); };
await out("PÍSTOV_LOKALITA_MENŠÍ_03.jpg", "aerial-empty", [800, 1400, 2200, 3400]);
await out("PÍSTOV_LOKALITA_MENŠÍ_04.jpg", "aerial", [800, 1400, 2200, 3400]);
await out("PÍSTOV_LOKALITA_MENŠÍ_01.jpg", "aerial-plots", [480, 960, 1600]);
await out("PÍSTOV_LOKALITA_VĚTŠÍ_04.jpg", "aerial-wide", [480, 960, 1600]);
await sharp("../podklady/vizualizace-okoli-magnific.png").webp({ quality: 62 }).toFile(`${IMG}aerial-surround-2000.webp`);

// ---- plots
const plotsFile = DATA + "plots.generated.js";
const P = await import(new URL(plotsFile, import.meta.url));
const plots = P.plotsSource.map((p) => ({
  ...p,
  geometry: { ...p.geometry, aerial: p.geometry.plan.map((q) => apply(H, q)) },
  label: { ...p.label, aerial: apply(H, p.label.plan) },
}));
let src = fs.readFileSync(plotsFile, "utf8");
src = src.replace(/aerial = px of [^\n]*\n/, `aerial = px of the bird's-eye visualisation 11/2026 (${SIZE.join("×")}, tools/build-aerial-v3.mjs).\n`)
  .replace(/export const AERIAL_SIZE = .*;/, `export const AERIAL_SIZE = ${JSON.stringify(SIZE)};`)
  .replace(/export const AERIAL_HOMOGRAPHY = .*;/, `export const AERIAL_HOMOGRAPHY = ${JSON.stringify(H)};`)
  .replace(/export const plotsSource = .*;/, `export const plotsSource = ${JSON.stringify(plots)};`);
fs.writeFileSync(plotsFile, src);

// ---- panorama stations (aerial follows from plan)
const panoFile = DATA + "panoramas.generated.js";
const pano = fs.readFileSync(panoFile, "utf8").replace(/"plan": \[\s*([\d.-]+),\s*([\d.-]+)\s*\],\s*"aerial": \[\s*[\d.-]+,\s*[\d.-]+\s*\]/g, (m, x, y) => {
  const [u, v] = apply(H, [+x, +y]);
  return `"plan": [\n   ${x},\n   ${y}\n  ],\n  "aerial": [\n   ${u},\n   ${v}\n  ]`;
});
fs.writeFileSync(panoFile, pano);

const k = WIDE_SIZE[0] / 2000; // surround px → scene px
console.log(plots.length, "plots remapped; surround box", [-WIDE_OFFSET[0], -WIDE_OFFSET[1] - 938 * k, WIDE_SIZE[0], 2938 * k].map((v) => Math.round(v)).join(", "));
