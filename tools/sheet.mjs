import sharp from "sharp"; import fs from "node:fs";
const [dir, out, from, to, cols] = process.argv.slice(2);
const W=600,H=424,c=Number(cols||3); const files=[];
for(let i=+from;i<=+to;i++) files.push(`${dir}/p${String(i).padStart(2,"0")}.jpg`);
const rows=Math.ceil(files.length/c);
const comps=await Promise.all(files.map(async(f,i)=>({input:await sharp(f).resize(W,H,{fit:"contain",background:"#fff"}).toBuffer(),left:(i%c)*W,top:Math.floor(i/c)*H})));
await sharp({create:{width:W*c,height:H*rows,channels:3,background:"#888"}}).composite(comps).jpeg({quality:80}).toFile(out);
