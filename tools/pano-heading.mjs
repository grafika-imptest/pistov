// Find the compass heading of the centre column of each equirectangular drone panorama by projecting
// OSM ponds (known lat/lon) into the image and maximising overlap with water-coloured pixels.
import sharp from "sharp";
import fs from "node:fs";
const osm = JSON.parse(fs.readFileSync("../podklady/panorama/osm-water.json", "utf8")).elements;
const P = "../podklady/panorama/preview/";
const panos = { DJI_0303: [49.38015, 15.567753, 30.1], DJI_0304: [49.380154, 15.567755, 59.6], DJI_0305: [49.380919, 15.57023, 59.8], DJI_0308: [49.378484, 15.567918, 59.7], DJI_0309: [49.380665, 15.563362, 60], DJI_0311: [49.383037, 15.567392, 59.3] };
const mLat = 111132.92 - 559.82 * Math.cos(2 * 49.38 * Math.PI / 180), mLon = 111412.84 * Math.cos(49.38 * Math.PI / 180);
// pond sample points: polygon vertices + points towards the centroid (interior)
const pts = osm.flatMap((e) => { const g = e.geometry; const c = [g.reduce((s, p) => s + p.lat, 0) / g.length, g.reduce((s, p) => s + p.lon, 0) / g.length];
  return g.flatMap((p) => [0.25, 0.5, 0.75].map((t) => [p.lat + (c[0] - p.lat) * t, p.lon + (c[1] - p.lon) * t])).concat([c]); });
const out = {};
for (const [name, [lat, lon, alt]] of Object.entries(panos)) {
  const { data, info } = await sharp(P + name + "-2400.jpg").raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const water = (x, y) => { const i = (y * W + x) * C; const r = data[i], g = data[i + 1], b = data[i + 2]; return b > r + 12 && b >= g - 4 && r < 135; };
  const geo = pts.map(([la, lo]) => { const e = (lo - lon) * mLon, n = (la - lat) * mLat; const d = Math.hypot(e, n); return { bearing: (Math.atan2(e, n) * 180) / Math.PI, pitch: (-Math.atan2(alt, d) * 180) / Math.PI, d }; }).filter((g) => g.d > 25 && g.d < 900);
  let best = { h: 0, s: -1 }; const curve = [];
  for (let h = 0; h < 360; h += 1) {
    let hit = 0;
    for (const g of geo) {
      let rel = ((g.bearing - h + 540) % 360) - 180; // −180..180 from centre column
      const x = Math.round((0.5 + rel / 360) * W) % W, y = Math.round((0.5 - g.pitch / 180) * H);
      if (y > 0 && y < H && water(x, y)) hit++;
    }
    const s = hit / geo.length; curve.push(s); if (s > best.s) best = { h, s };
  }
  const second = Math.max(...curve.map((s, h) => (Math.abs(((h - best.h + 540) % 360) - 180) > 20 ? s : 0)));
  out[name] = best.h;
  console.log(`${name}: centre heading ≈ ${best.h}° (score ${best.s.toFixed(2)}, next peak ${second.toFixed(2)}, ${geo.length} pts)`);
}
fs.writeFileSync("../podklady/panorama/headings.json", JSON.stringify(out, null, 1));
