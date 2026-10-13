import * as mupdf from "mupdf"; import fs from "node:fs"; import sharp from "sharp";
const doc = mupdf.Document.openDocument(fs.readFileSync("../podklady/katalog.pdf"), "application/pdf");
fs.mkdirSync("../podklady/raw",{recursive:true});
for(let i=0;i<doc.countPages();i++){
  const page=doc.loadPage(i); let k=0; const imgs=[];
  page.run(new mupdf.Device({ fillImage(img, ctm){ imgs.push({img,ctm}); } }), mupdf.Matrix.identity);
  for(const {img,ctm} of imgs){
    const w=img.getWidth(),h=img.getHeight();
    if(w===1953&&h===1381) continue; // paper background
    if(w*h<600*600) continue;
    k++;
    const pix=img.toPixmap();
    const png=pix.asPNG();
    const name=`../podklady/raw/p${String(i+1).padStart(2,"0")}_${k}_${w}x${h}.png`;
    fs.writeFileSync(name,png);
    console.log(name, "pos", ctm.map(v=>v.toFixed(0)).join(","), pix.getNumberOfComponents?.(), pix.getAlpha?.());
  }
}
// also paper bg once
