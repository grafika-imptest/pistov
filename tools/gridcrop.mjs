import sharp from "sharp";
const [x0,y0,w,h,out,step="50"] = process.argv.slice(2); const X=+x0,Y=+y0,Wd=+w,Hd=+h,st=+step;
let lines="";
for(let x=Math.ceil(X/st)*st;x<X+Wd;x+=st){const big=x%(st*2)===0;lines+=`<line x1="${x-X}" y1="0" x2="${x-X}" y2="${Hd}" stroke="${big?'#00f':'#0af'}" stroke-width="${big?1.5:0.7}"/>`+(big?`<text x="${x-X+2}" y="12" font-size="12" fill="#00f">${x}</text>`:"");}
for(let y=Math.ceil(Y/st)*st;y<Y+Hd;y+=st){const big=y%(st*2)===0;lines+=`<line x1="0" y1="${y-Y}" x2="${Wd}" y2="${y-Y}" stroke="${big?'#00f':'#0af'}" stroke-width="${big?1.5:0.7}"/>`+(big?`<text x="2" y="${y-Y-2}" font-size="12" fill="#00f">${y}</text>`:"");}
const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}">${lines}</svg>`);
const SRCF=process.env.SRC||"../podklady/raw/p03_1_3364x3281.png";const crop=await sharp(SRCF).extract({left:X,top:Y,width:Wd,height:Hd}).composite([{input:svg}]).png().toBuffer();
await sharp(crop).resize(Math.min(1400,Wd*1.6|0)).jpeg({quality:85}).toFile(out);
