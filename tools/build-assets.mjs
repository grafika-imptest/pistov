// Asset pipeline: catalog PDF (TAM architekti, duben 2026) -> optimised web assets in /assets/img.
// Raster pictures are taken from the embedded originals (podklady/raw, see extract.mjs);
// vector sheets (floor plans, site drawings) are rendered from the PDF.
// usage: node build-assets.mjs
import * as mupdf from "mupdf";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const RAW = "../podklady/raw";
const OUT = "../assets/img";
fs.mkdirSync(OUT, { recursive: true });
const doc = mupdf.Document.openDocument(fs.readFileSync("../podklady/katalog.pdf"), "application/pdf");

async function webp(input, name, widths, q = 78) {
  for (const w of widths) {
    const file = path.join(OUT, `${name}-${w}.webp`);
    await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: q, effort: 5 }).toFile(file);
  }
  const meta = await sharp(input).metadata();
  return { name, w: meta.width, h: meta.height };
}
function renderPage(pageNo, dpi, clip) { // clip in PDF points [x0,y0,x1,y1]
  const page = doc.loadPage(pageNo - 1);
  const s = dpi / 72;
  const pix = page.toPixmap(mupdf.Matrix.scale(s, s), mupdf.ColorSpace.DeviceRGB, false, true);
  let img = sharp(Buffer.from(pix.asPNG()));
  if (clip) img = img.extract({ left: Math.round(clip[0] * s), top: Math.round(clip[1] * s), width: Math.round((clip[2] - clip[0]) * s), height: Math.round((clip[3] - clip[1]) * s) });
  return img.png().toBuffer();
}

const manifest = {};
const add = (m) => (manifest[m.name] = { w: m.w, h: m.h });

// locality
add(await webp(`${RAW}/p06_1_3419x2038.png`, "aerial", [3400, 2200, 1400, 800], 80));
add(await webp(`${RAW}/p03_1_3364x3281.png`, "plan", [3364, 1800, 900], 82));
add(await webp(`${RAW}/p04_1_4616x3278.png`, "section-1", [2400, 1400]));
add(await webp(`${RAW}/p05_1_4615x3273.png`, "section-2", [2400, 1400]));
// paper texture used by the catalog (page background)
const bg = [];
doc.loadPage(1).run(new mupdf.Device({ fillImage(img) { if (img.getWidth() === 1953) bg.push(img); } }), mupdf.Matrix.identity);
if (bg[0]) add(await webp(Buffer.from(bg[0].toPixmap().asPNG()), "paper", [1400], 60));

// house renders (TAM architekti visualisations)
const renders = {
  "A-garden-warm": "p13_1_1327x939", "A-street": "p14_1_1323x939", "A-garden-larch": "p15_1_1439x1022",
  "A-mat-lightbrick": "p16_1_1442x1024", "A-mat-white-tile": "p16_2_1442x1024", "A-mat-sandbrick": "p16_3_1442x1024", "A-mat-redbrick": "p16_4_1442x1024",
  "B-garden-brick": "p20_1_1536x1024", "B-mat-white-tile": "p21_1_1442x1024", "B-mat-white-larch": "p21_2_1439x1024",
  "C-garden-white-tile": "p27_1_1536x1024", "C-mat-redbrick": "p28_1_1442x1024", "C-mat-white-dark": "p28_2_1442x1024",
  "D-garden-white": "p33_1_1386x985", "D-mat-lightbrick": "p34_1_1442x1024", "D-mat-redbrick": "p34_2_1333x941",
};
for (const [name, src] of Object.entries(renders)) add(await webp(`${RAW}/${src}.png`, name, [1600, 960, 480], 80));

// elevations of house A (raster in the catalog)
add(await webp(`${RAW}/p10_1_2479x2904.png`, "A-elev-street", [1000, 500]));
add(await webp(`${RAW}/p11_1_2479x2910.png`, "A-elev-garden", [1000, 500]));

// drawing sheets rendered from vector pages (page area without the outer margin)
const sheet = [57, 20, 1170, 822];
const sheets = {
  "A-site": [8, sheet], "A-plans": [9, sheet], "A-plans-v2": [12, sheet],
  "B-site": [18, sheet], "B-plans": [19, sheet],
  "C-site": [23, sheet], "C-plans": [24, sheet], "C2-site": [25, sheet], "C2-plans": [26, sheet],
  "D-site": [30, sheet], "D-plans": [31, sheet], "D-plans-v23": [32, sheet],
};
for (const [name, [pg, clip]] of Object.entries(sheets)) add(await webp(await renderPage(pg, 200, clip), name, [2000, 1100], 82));

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(Object.keys(manifest).length, "assets");
