import * as mupdf from "mupdf"; import fs from "node:fs";
const doc = mupdf.Document.openDocument(fs.readFileSync("../podklady/katalog.pdf"), "application/pdf");
const pg = Number(process.argv[2]||3);
const page = doc.loadPage(pg-1);
const stats = {}; const paths=[];
function walk(path, ctm){ const pts=[]; path.walk({moveTo(x,y){pts.push(["M",...mupdf.Matrix.transformPoint?[x,y]:[x,y]])},lineTo(x,y){pts.push(["L",x,y])},curveTo(a,b,c,d,x,y){pts.push(["C",x,y])},closePath(){pts.push(["Z"])}}); return pts.map(p=>p[0]==="Z"?p:[p[0],ctm[0]*p[1]+ctm[2]*p[2]+ctm[4],ctm[1]*p[1]+ctm[3]*p[2]+ctm[5]]);}
const dev = new mupdf.Device({
  fillPath(path, evenOdd, ctm, cs, color, alpha){ const k="fill:"+color.map(c=>c.toFixed(2)).join(","); stats[k]=(stats[k]||0)+1; paths.push({t:"f",c:color,a:alpha,p:walk(path,ctm)}); },
  strokePath(path, stroke, ctm, cs, color, alpha){ const k="stroke:"+color.map(c=>c.toFixed(2)).join(",")+" w"+stroke.getLineWidth?.(); stats[k]=(stats[k]||0)+1; paths.push({t:"s",c:color,a:alpha,p:walk(path,ctm)}); },
  fillText(text, ctm, cs, color){ const k="text"; stats[k]=(stats[k]||0)+1; },
  fillImage(img, ctm){ stats["img "+img.getWidth()+"x"+img.getHeight()+" ctm "+ctm.map(v=>v.toFixed(1)).join(",")]=1; }
});
page.run(dev, mupdf.Matrix.identity);
console.log(stats);
fs.writeFileSync(`../podklady/vec-p${pg}.json`, JSON.stringify(paths));
