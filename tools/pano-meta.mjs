// usage: node pano-meta.mjs <file...>  – size, projection hints, GPS/altitude from EXIF/XMP
import sharp from "sharp";
import fs from "node:fs";
for (const f of process.argv.slice(2)) {
  const m = await sharp(f, { limitInputPixels: false }).metadata();
  const xmp = m.xmp ? m.xmp.toString("utf8") : "";
  const pick = (re) => (xmp.match(re) || [])[1];
  // raw EXIF GPS (DJI writes it into EXIF + XMP drone-dji namespace)
  const out = {
    file: f.split(/[\/]/).pop(), w: m.width, h: m.height, ratio: (m.width / m.height).toFixed(3), format: m.format, sizeMB: (fs.statSync(f).size / 1e6).toFixed(1),
    projection: pick(/ProjectionType[=>"]+([^"<]+)/), gpano: /GPano/.test(xmp),
    lat: pick(/GpsLatitude[=>"]+([-\d.]+)/), lon: pick(/GpsLongi?tude[=>"]+([-\d.]+)/),
    absAlt: pick(/AbsoluteAltitude[=>"]+([-+\d.]+)/), relAlt: pick(/RelativeAltitude[=>"]+([-+\d.]+)/),
    yaw: pick(/FlightYawDegree[=>"]+([-+\d.]+)/), gimbalYaw: pick(/GimbalYawDegree[=>"]+([-+\d.]+)/),
    model: pick(/Model[=>"]+([^"<]+)/), date: pick(/(?:CreateDate|DateCreated)[=>"]+([^"<]+)/),
  };
  console.log(JSON.stringify(out));
}
