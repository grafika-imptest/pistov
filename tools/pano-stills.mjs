// Still photographs (rectilinear 16:9) rendered from the drone panoramas for the gallery.
// Bearings are compass directions; the calibrated heading of each panorama maps them to image columns.
// usage: node pano-stills.mjs
import sharp from "sharp";
import fs from "node:fs";

const SRC = "../podklady/panorama";
const OUT = "../assets/img";
const heading = { "DJI_0304": 126, "DJI_0305": 70, "DJI_0308": 48, "DJI_0309": 95, "DJI_0311": 185 };
const shots = [
  { name: "drone-ponds", file: "DJI_0304", bearing: 35, pitch: -12, fov: 64, caption: "Rybníky a pole na východ od lokality" },
  { name: "drone-site-south", file: "DJI_0308", bearing: 356, pitch: -16, fov: 62, caption: "Plocha budoucích parcel od jihu" },
  { name: "drone-site-centre", file: "DJI_0304", bearing: 190, pitch: -30, fov: 70, caption: "Střed lokality – stav před výstavbou" },
  { name: "drone-village", file: "DJI_0311", bearing: 200, pitch: -14, fov: 66, caption: "Obec a rybník na sever od lokality" },
  { name: "drone-east", file: "DJI_0305", bearing: 245, pitch: -12, fov: 64, caption: "Pohled od východu přes rybníky" },
];
const W = 1600, H = 900;
const cache = {};
for (const s of shots) {
  if (!cache[s.file]) {
    const { data, info } = await sharp(`${SRC}/${s.file}.JPG`, { limitInputPixels: false }).resize(8192, 4096).raw().toBuffer({ resolveWithObject: true });
    cache[s.file] = { data, w: info.width, h: info.height, c: info.channels };
  }
  const { data, w, h, c } = cache[s.file];
  const yaw = ((s.bearing - heading[s.file]) * Math.PI) / 180, pitch = (s.pitch * Math.PI) / 180;
  const fy = (H / 2) / Math.tan(((s.fov / 2) * Math.PI) / 180); // vertical fov
  const out = Buffer.alloc(W * H * 3);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = i - W / 2, y = -(j - H / 2), z = fy;
    const y2 = y * Math.cos(pitch) + z * Math.sin(pitch), z2 = -y * Math.sin(pitch) + z * Math.cos(pitch);
    const x3 = x * Math.cos(yaw) + z2 * Math.sin(yaw), z3 = -x * Math.sin(yaw) + z2 * Math.cos(yaw);
    const lon = Math.atan2(x3, z3), lat = Math.atan2(y2, Math.hypot(x3, z3));
    const u = (lon / (2 * Math.PI) + 0.5) * w, v = (0.5 - lat / Math.PI) * h;
    // bilinear sample
    const u0 = Math.floor(u), v0 = Math.min(h - 2, Math.max(0, Math.floor(v))), fu = u - u0, fv = v - v0;
    const p = (uu, vv) => ((vv * w + ((uu % w) + w) % w) * c);
    const a = p(u0, v0), b = p(u0 + 1, v0), d = p(u0, v0 + 1), e = p(u0 + 1, v0 + 1), o = (j * W + i) * 3;
    for (let k = 0; k < 3; k++) out[o + k] = data[a + k] * (1 - fu) * (1 - fv) + data[b + k] * fu * (1 - fv) + data[d + k] * (1 - fu) * fv + data[e + k] * fu * fv;
  }
  for (const [ww, q] of [[1600, 80], [960, 78], [480, 74]]) await sharp(out, { raw: { width: W, height: H, channels: 3 } }).resize(ww).webp({ quality: q }).toFile(`${OUT}/${s.name}-${ww}.webp`);
  console.log("ok", s.name);
}
fs.writeFileSync("../podklady/video/stills.json", JSON.stringify(shots.map(({ name, caption }) => ({ name, caption })), null, 1));
