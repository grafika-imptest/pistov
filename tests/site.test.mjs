// Subpages, shared chrome and editorial content. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { project } from "../js/projects/pistov/project.js";
import { site, news, faq, financing, gallery } from "../js/projects/pistov/content.js";
import { NAV, MENU } from "../js/site/chrome.js";
import { collections, describe } from "../js/site/collections.js";
import { itemInfo } from "../js/site/items.js";
import { widthsOf } from "../js/site/ui.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const PAGES = ["galerie", "aktuality", "aktualita", "financovani", "faq", "kontakty", "developer", "porovnani", "oblibene", "ochrana-osobnich-udaju"];

test("subpages: every page exists with its script, shared styles, header and footer slots", () => {
  for (const p of PAGES) {
    const html = read(`${p}.html`);
    assert.ok(exists(`js/pages/${p}.js`), `script of ${p}`);
    assert.match(html, new RegExp(`src="js/pages/${p}.js"`), `${p} loads its script`);
    assert.match(html, /href="css\/pages.css"/, `${p} links pages.css`);
    assert.match(html, /data-topbar/); assert.match(html, /data-site-footer/);
  }
  const index = read("index.html");
  assert.match(index, /href="css\/pages.css"/);
  assert.match(index, /data-site-footer/);
  for (const t of ["data-hp-gallery", "data-hp-news", "data-hp-faq", "data-hp-fin-steps", "data-hp-devfacts"]) assert.ok(index.includes(t), `home teaser ${t}`);
});

test("links: every local page linked from HTML, navigation and content exists", () => {
  const hrefs = new Set();
  for (const f of ["index.html", ...PAGES.map((p) => `${p}.html`)]) for (const m of read(f).matchAll(/href="([^"#?:]+\.html)/g)) hrefs.add(m[1]);
  for (const f of fs.readdirSync(path.join(root, "js/pages"))) for (const m of read(`js/pages/${f}`).matchAll(/href="([^"#?:$]+\.html)/g)) hrefs.add(m[1]);
  for (const n of NAV) hrefs.add(n.href.split(/[#?]/)[0]);
  for (const c of MENU) for (const [h] of c.items) hrefs.add(h.split(/[#?]/)[0]);
  for (const n of news) if (n.cta) hrefs.add(n.cta.href.split(/[#?]/)[0]);
  for (const h of hrefs) assert.ok(exists(h), `linked page ${h}`);
});

test("chrome: footer credits the realisation and offers cookie settings", () => {
  const chrome = read("js/site/chrome.js");
  assert.equal(site.realisation.label, "IMP net");
  assert.match(chrome, /Web realizovalo/);
  assert.match(chrome, /data-cookie-settings/);
  assert.match(chrome, /ochrana-osobnich-udaju\.html/);
});

test("content: news are unique, dated and illustrated with existing images", () => {
  assert.equal(new Set(news.map((n) => n.slug)).size, news.length);
  for (const n of news) {
    assert.match(n.date, /^\d{4}-\d{2}(-\d{2})?$/, n.slug);
    assert.ok(n.title && n.perex && n.body.length, n.slug);
    for (const w of widthsOf(n.image)) assert.ok(exists(`assets/img/${n.image}-${w}.webp`), `${n.image}-${w}`);
  }
});

test("content: gallery images exist in every size used by srcset", () => {
  let count = 0;
  for (const c of gallery) for (const [name, caption] of c.items) {
    assert.ok(caption, `caption of ${name}`);
    for (const w of widthsOf(name)) assert.ok(exists(`assets/img/${name}-${w}.webp`), `${name}-${w}`);
    count++;
  }
  assert.ok(count >= 30);
});

test("content: FAQ facts match the plot data", () => {
  const all = faq.map((f) => f.a).join(" ").replace(/\s/g, " "); // NBSP-insensitive
  const free = project.plots.filter((p) => p.status === "available").length;
  const reserved = project.plots.filter((p) => p.status === "reserved").length;
  const areas = project.plots.map((p) => p.area);
  assert.ok(all.includes(`obsahuje ${project.plots.length} parcel`));
  assert.ok(all.includes(`je ${free} k prodeji a ${reserved} rezervovaných`));
  assert.ok(all.includes(`od ${Math.min(...areas)} do ${new Intl.NumberFormat("cs-CZ").format(Math.max(...areas)).replace(/\s/g, " ")} m²`));
  for (const t of project.houseTypes) assert.ok(read("js/projects/pistov/content.js").includes(`${t.builtUpArea} m²`), `area of ${t.id} in content`);
});

test("content: no invented prices or terms – only the labelled calculator example", () => {
  const text = JSON.stringify({ news, faq, steps: financing.steps, site });
  assert.doesNotMatch(text, /\d[\d\s]*Kč/, "no prices in editorial content");
  assert.ok(financing.pending && financing.stepsNote);
  assert.match(read("js/pages/financovani.js"), /nejde o ceny projektu Pístov/);
  assert.ok(site.salesContact.pending);
});

test("collections: item keys and descriptions", () => {
  const combo = { kind: "combo", plot: 5, type: "A", layout: "A1", material: "A-m2" };
  assert.equal(collections.key(combo), "combo:A:5:A1:A-m2");
  assert.notEqual(collections.key({ kind: "plot", no: 5 }), collections.key({ kind: "house", type: "A" }));
  const d = describe(project, combo);
  assert.equal(d.plot.no, 5); assert.equal(d.type.id, "A"); assert.equal(d.layout.id, "A1"); assert.equal(d.variant.id, "A-m2");
});

test("items: links reopen the configuration, plot crops stay inside the aerial view", () => {
  const combo = itemInfo({ kind: "combo", plot: 5, type: "A", layout: "A1", material: "A-m2" });
  assert.equal(combo.href, "index.html?parcela=5&dum=A&dispozice=A1&material=A-m2&rezim=navrh#explorer");
  assert.equal(itemInfo({ kind: "house", type: "D" }).href, "index.html?detail=D");
  for (const p of project.plots) {
    const { planPos } = itemInfo({ kind: "plot", no: p.no });
    const [x, y] = planPos.match(/[\d.]+(?=%)/g).map(Number);
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `crop of plot ${p.no}`);
  }
  // D2/D3 state their own built-up area
  const d2 = project.houseTypes.find((t) => t.id === "D").layouts[1];
  const info = itemInfo({ kind: "combo", plot: 1, type: "D", layout: d2.id });
  assert.equal(info.builtUp, d2.builtUpArea !== undefined ? d2.builtUpArea : 156);
});

test("developer: Horák & Vetchý everywhere, no former client name left", () => {
  assert.equal(site.developer.name, "Horák & Vetchý s.r.o.");
  assert.equal(project.developer, site.developer.name);
  assert.match(site.developer.ico, /^\d{8}$/);
  const files = ["index.html", "README.md", ...PAGES.map((p) => `${p}.html`), ...fs.readdirSync(path.join(root, "js"), { recursive: true }).filter((f) => f.endsWith(".js")).map((f) => `js/${f}`)];
  for (const f of files) assert.doesNotMatch(read(f), /START Zelen|Brtnice|Zadavatel projektu/i, f);
  assert.match(read("js/site/chrome.js"), /developer\.html/);
});
