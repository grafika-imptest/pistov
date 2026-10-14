// Calibration sheet: crops of the equirectangular preview around the ponds with OSM outlines drawn for a
// range of candidate headings. usage: node pano-calib-sheet.mjs <PANO_FILE_BASENAME> <alt> <lat> <lon> <h1,h2,...>
import sharp from "sharp";
import fs from "node:fs";
const [name, altS, latS, lonS, hs] = process.argv.slice(2);
const alt = +altS, lat = +latS, lon = +lonS;
const osm = JSON.parse(fs.readFileSync("../podklady/panorama/osm-water.json", "utf8")).elements;
const mLat = 111132.92 - 559.82 * Math.cos(2 * 49.38 * Math.PI / 180), mLon = 111412.84 * Math.cos(49.38 * Math.PI / 180);
const W = 2400, H = 1200;
const img = await sharp(`../podklady/panorama/preview/${name}-2400.jpg`).toBuffer();
// ponds near the site (the cluster east of the plots + village ponds)
const IDS = (process.env.IDS || "").split(",").filter(Boolean).map(Number);
const ponds = osm.filter((e) => { if (IDS.length) return IDS.includes(e.id); const g = e.geometry[0]; return Math.abs(g.lat - 49.3810) < 0.006 && Math.abs(g.lon - 15.567) < 0.008 && e.geometry.length < 200; });
const proj = (p, h) => { const e = (p.lon - lon) * mLon, n = (p.lat - lat) * mLat; const d = Math.hypot(e, n); const b = Math.atan2(e, n) * 180 / Math.PI; const rel = ((b - h + 540) % 360) - 180; return [(0.5 + rel / 360) * W, (0.5 + Math.atan2(alt, d) * 180 / Math.PI / 180) * H, b]; };
// centre the crop on the mean bearing of the pond cluster
const cl = ponds.flatMap((e) => e.geometry); const ce = cl.reduce((s, p) => [s[0] + (p.lon - lon) * mLon / cl.length, s[1] + (p.lat - lat) * mLat / cl.length], [0, 0]);
const cb = Math.atan2(ce[0], ce[1]) * 180 / Math.PI;
const tiles = [];
for (const h of hs.split(",").map(Number)) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  for (const e of ponds) { const q = e.geometry.map((p) => proj(p, h)); if (q.some((a) => Math.abs(a[0] - q[0][0]) > W / 2)) continue; svg += `<path d="${q.map((a, i) => `${i ? "L" : "M"}${a[0].toFixed(1)} ${a[1].toFixed(1)}`).join("")}Z" fill="none" stroke="#00e5ff" stroke-width="2.5"/>`; }
  svg += "</svg>";
  const comp = await sharp(img).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  // crop ±40° around the cluster at the CURRENT heading
  const cx = (0.5 + ((((cb - h + 540) % 360) - 180) / 360)) * W;
  const left = Math.max(0, Math.min(W - 534, Math.round(cx - 267)));
  const crop = await sharp(comp).extract({ left, top: 560, width: 534, height: 260 }).composite([{ input: Buffer.from(`<svg width="534" height="40"><rect width="534" height="40" fill="#000" opacity=".6"/><text x="10" y="28" font-size="24" fill="#fff" font-family="Arial">${name} heading ${h}°</text></svg>`), top: 0, left: 0 }]).png().toBuffer();
  tiles.push(crop);
}
const sheet = await sharp({ create: { width: 534 * 2, height: 260 * Math.ceil(tiles.length / 2), channels: 3, background: "#fff" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % 2) * 534, top: Math.floor(i / 2) * 260 }))).jpeg({ quality: 80 }).toFile(`../podklady/panorama/preview/calib-${name}.jpg`);
console.log("ok", name, "cluster bearing", cb.toFixed(1));
