// Draw georeferenced plot boundaries (plan) + OSM ponds into an equirectangular preview for a given heading.
// usage: node pano-overlay.mjs <pano> <heading...>
import sharp from "sharp";
import fs from "node:fs";
import { plotsSource } from "../js/projects/pistov/plots.generated.js";
const [name, ...hs] = process.argv.slice(2);
const geo = JSON.parse(fs.readFileSync("../podklady/georef.json", "utf8"));
const osm = JSON.parse(fs.readFileSync("../podklady/panorama/osm-water.json", "utf8")).elements;
const panos = { DJI_0303: [49.38015, 15.567753, 30.1], DJI_0304: [49.380154, 15.567755, 59.6], DJI_0305: [49.380919, 15.57023, 59.8], DJI_0308: [49.378484, 15.567918, 59.7], DJI_0309: [49.380665, 15.563362, 60], DJI_0311: [49.383037, 15.567392, 59.3] };
const [lat, lon, alt] = panos[name];
const { REF, mLat, mLon, T } = geo;
const k2 = T.a * T.a + T.b * T.b;
const planToEnu = ([px, py]) => { const u = px - T.tx, v = py - T.ty; return [(T.a * u + T.b * v) / k2, (T.b * u - T.a * v) / k2]; };
const llToEnu = (la, lo) => [(lo - REF[1]) * mLon, (la - REF[0]) * mLat];
const me = llToEnu(lat, lon);
const W = 2400, H = 1200;
const proj = ([e, n], h) => { const de = e - me[0], dn = n - me[1]; const d = Math.hypot(de, dn); const b = (Math.atan2(de, dn) * 180) / Math.PI; const rel = ((b - h + 540) % 360) - 180; return [(0.5 + rel / 360) * W, (0.5 + (Math.atan2(alt, d) * 180) / Math.PI / 180) * H]; };
const path = (pts, h) => { const q = pts.map((p) => proj(p, h)); // break segments that wrap around the seam
  let d = ""; q.forEach((p, i) => { const prev = q[(i - 1 + q.length) % q.length]; d += (i === 0 || Math.abs(p[0] - prev[0]) > W / 2 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1); }); return d + (Math.abs(q[0][0] - q.at(-1)[0]) > W / 2 ? "" : "Z"); };
for (const h of hs.map(Number)) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  for (const p of plotsSource) if (p.geometry) svg += `<path d="${path(p.geometry.plan.map(planToEnu), h)}" fill="rgba(255,60,40,.18)" stroke="#ff3b2b" stroke-width="2"/>`;
  for (const e of osm) svg += `<path d="${path(e.geometry.map((g) => llToEnu(g.lat, g.lon)), h)}" fill="none" stroke="#00e5ff" stroke-width="3"/>`;
  svg += `<text x="20" y="60" font-size="44" fill="#fff" stroke="#000" stroke-width="1.5" font-family="Arial">${name} heading ${h}°</text></svg>`;
  const comp = await sharp(`../podklady/panorama/preview/${name}-2400.jpg`).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  await sharp(comp).resize(1600).jpeg({ quality: 78 }).toFile(`../podklady/panorama/preview/ov-${name}-${h}.jpg`);
}
