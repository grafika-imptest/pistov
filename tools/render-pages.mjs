// Render every catalog page to a JPG preview + dump page text and embedded image info.
// usage: node render-pages.mjs <pdf> <outDir> [dpi]
import * as mupdf from "mupdf";
import fs from "node:fs";
import path from "node:path";

const [pdfPath, outDir, dpiArg] = process.argv.slice(2);
const dpi = Number(dpiArg || 60);
fs.mkdirSync(outDir, { recursive: true });
const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
const n = doc.countPages();
const info = [];
for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  const b = page.getBounds();
  const m = mupdf.Matrix.scale(dpi / 72, dpi / 72);
  const pix = page.toPixmap(m, mupdf.ColorSpace.DeviceRGB, false, true);
  fs.writeFileSync(path.join(outDir, `p${String(i + 1).padStart(2, "0")}.jpg`), pix.asJPEG(80));
  const text = page.toStructuredText("preserve-whitespace").asText();
  const imgs = [];
  page.toStructuredText("preserve-images").walk({
    onImageBlock(bbox, _t, image) {
      imgs.push({ bbox: bbox.map(Math.round), w: image.getWidth(), h: image.getHeight() });
    },
  });
  info.push({ page: i + 1, size: [Math.round(b[2] - b[0]), Math.round(b[3] - b[1])], imgs, text });
}
fs.writeFileSync(path.join(outDir, "info.json"), JSON.stringify(info, null, 1));
console.log("pages", n);
