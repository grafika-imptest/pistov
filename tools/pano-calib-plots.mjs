// Calibration sheet with the georeferenced PLOTS drawn for candidate headings (crop centred on the development).
// usage: node pano-calib-plots.mjs <PANO> <alt> <lat> <lon> <h1,h2,...>
import sharp from "sharp";
import fs from "node:fs";
import { plotsSource } from "../js/projects/pistov/plots.generated.js";
const [name, altS, latS, lonS, hs] = process.argv.slice(2);
const alt = +altS, lat = +latS, lon = +lonS;
const { REF, mLat, mLon, T } = JSON.parse(fs.readFileSync("../podklady/georef.json", "utf8"));
const k2 = T.a * T.a + T.b * T.b;
const toM = ([px, py]) => { const u = px - T.tx, v = py - T.ty; return [(T.a * u + T.b * v) / k2, (T.b * u - T.a * v) / k2]; };
const me = [(lon - REF[1]) * mLon, (lat - REF[0]) * mLat];
const W = 2400, H = 1200;
const img = await sharp(`../podklady/panorama/preview/${name}-2400.jpg`).toBuffer();
const polys = plotsSource.filter((p) => p.geometry).map((p) => p.geometry.plan.map(toM));
const all = polys.flat(); const c = all.reduce((s, p) => [s[0] + p[0] / all.length, s[1] + p[1] / all.length], [0, 0]);
const cb = Math.atan2(c[0] - me[0], c[1] - me[1]) * 180 / Math.PI;
const proj = (p, h) => { const de = p[0] - me[0], dn = p[1] - me[1]; const d = Math.hypot(de, dn); const b = Math.atan2(de, dn) * 180 / Math.PI; const rel = ((b - h + 540) % 360) - 180; return [(0.5 + rel / 360) * W, (0.5 + Math.atan2(alt, d) * 180 / Math.PI / 180) * H]; };
const tiles = [];
for (const h of hs.split(",").map(Number)) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  for (const poly of polys) { const q = poly.map((p) => proj(p, h)); if (q.some((a) => Math.abs(a[0] - q[0][0]) > W / 2)) continue; svg += `<path d="${q.map((a, i) => `${i ? "L" : "M"}${a[0].toFixed(1)} ${a[1].toFixed(1)}`).join("")}Z" fill="none" stroke="#ff3b2b" stroke-width="1.6"/>`; }
  svg += "</svg>";
  const comp = await sharp(img).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  const cx = (0.5 + ((((cb - h + 540) % 360) - 180) / 360)) * W;
  const left = Math.max(0, Math.min(W - 700, Math.round(cx - 350)));
  tiles.push(await sharp(comp).extract({ left, top: 540, width: 700, height: 300 }).composite([{ input: Buffer.from(`<svg width="700" height="40"><rect width="700" height="40" fill="#000" opacity=".6"/><text x="10" y="28" font-size="24" fill="#fff" font-family="Arial">${name} heading ${h}°</text></svg>`), top: 0, left: 0 }]).png().toBuffer());
}
await sharp({ create: { width: 1400, height: 300 * Math.ceil(tiles.length / 2), channels: 3, background: "#fff" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % 2) * 700, top: Math.floor(i / 2) * 300 }))).jpeg({ quality: 80 }).toFile(`../podklady/panorama/preview/calibp-${name}.jpg`);
console.log("ok", name, "dev bearing", cb.toFixed(1));
