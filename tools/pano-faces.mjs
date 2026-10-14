// Render a rectilinear view (e.g. straight up) from an equirectangular image + measure the 0/360° seam.
// usage: node pano-faces.mjs <in.jpg> <out.jpg> <yawDeg> <pitchDeg> [fovDeg]
import sharp from "sharp";
const [inp, out, yawS, pitchS, fovS = "100"] = process.argv.slice(2);
const { data, info } = await sharp(inp, { limitInputPixels: false }).resize(4000, 2000).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const S = 900, f = (S / 2) / Math.tan((Number(fovS) * Math.PI) / 360);
const yaw = (Number(yawS) * Math.PI) / 180, pitch = (Number(pitchS) * Math.PI) / 180;
const o = Buffer.alloc(S * S * 3);
for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
  // camera ray, then pitch (around x) and yaw (around y)
  let x = i - S / 2, y = -(j - S / 2), z = f;
  let y2 = y * Math.cos(pitch) + z * Math.sin(pitch), z2 = -y * Math.sin(pitch) + z * Math.cos(pitch);
  let x3 = x * Math.cos(yaw) + z2 * Math.sin(yaw), z3 = -x * Math.sin(yaw) + z2 * Math.cos(yaw);
  const lon = Math.atan2(x3, z3), lat = Math.atan2(y2, Math.hypot(x3, z3));
  const u = Math.min(W - 1, Math.floor(((lon / (2 * Math.PI)) + 0.5) * W)), v = Math.min(H - 1, Math.floor((0.5 - lat / Math.PI) * H));
  const s = (v * W + u) * C, d = (j * S + i) * 3; o[d] = data[s]; o[d + 1] = data[s + 1]; o[d + 2] = data[s + 2];
}
await sharp(o, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 80 }).toFile(out);
// seam: mean abs difference between first and last column (sky rows only)
let diff = 0, n = 0; for (let v = 0; v < H * 0.45; v++) { for (let c = 0; c < 3; c++) diff += Math.abs(data[(v * W) * C + c] - data[(v * W + W - 1) * C + c]); n += 3; }
console.log(out.split("/").pop(), "seam mean |Δ| =", (diff / n).toFixed(1));
