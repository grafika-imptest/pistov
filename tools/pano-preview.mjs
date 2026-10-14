// usage: node pano-preview.mjs <outDir> <file...>  – 2400×1200 previews + EXIF GPS
import sharp from "sharp";
import exifr from "exifr";
import fs from "node:fs";
import path from "node:path";
const [out, ...files] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const f of files) {
  const name = path.basename(f).replace(/\.jpe?g$/i, "");
  const gps = await exifr.gps(f).catch(() => null);
  const ex = await exifr.parse(f, { xmp: true, pick: ["GPSAltitude", "PosePitchDegrees", "PoseHeadingDegrees", "InitialViewHeadingDegrees", "CroppedAreaImageWidthPixels", "FullPanoWidthPixels", "GimbalPitchDegree"] }).catch(() => ({}));
  await sharp(f, { limitInputPixels: false }).resize(2400, 1200).jpeg({ quality: 82 }).toFile(path.join(out, name + "-2400.jpg"));
  console.log(JSON.stringify({ name, lat: gps?.latitude?.toFixed(6), lon: gps?.longitude?.toFixed(6), ...ex }));
}
