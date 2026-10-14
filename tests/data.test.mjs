// Data integrity + business-logic tests. Run: npm test  (node --test, no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { project } from "../js/projects/pistov/project.js";
import { typesForPlot, isAllowed, plotsForType, canConfigure } from "../js/core/compat.js";
import { priceSummary } from "../js/core/pricing.js";
import { applyH, polyArea } from "../js/core/geometry.js";
import { validate } from "../js/ui/enquiry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (rel) => fs.existsSync(path.join(root, rel));

test("plots: 72 numbered plots 1–73 (no 59), unique, valid status", () => {
  const nos = project.plots.map((p) => p.no);
  assert.equal(nos.length, 72);
  assert.equal(new Set(nos).size, 72);
  assert.ok(!nos.includes(59));
  for (const p of project.plots) {
    assert.ok(["available", "reserved", "sold"].includes(p.status), `status of ${p.no}`);
    assert.ok(p.area >= 400 && p.area <= 1500, `area of ${p.no}`);
    assert.equal(p.price, null, "no invented prices");
  }
});

test("plots: reserved plots match the hatching in the catalogue plan (64–72)", () => {
  const reserved = project.plots.filter((p) => p.status === "reserved").map((p) => p.no);
  assert.deepEqual(reserved, [64, 65, 66, 67, 68, 69, 70, 71, 72]);
});

test("geometry: traced polygons agree with the stated plot areas", () => {
  const k = project.planMetersPerPx ** 2;
  for (const p of project.plots.filter((x) => x.geometry && !x.geometry.approx)) {
    const m2 = polyArea(p.geometry.plan) * k;
    const ratio = m2 / p.area;
    // traced boundary sits ~1 px inside the drawn lines and trees partly cover some edges
    assert.ok(ratio > 0.82 && ratio < 1.08, `plot ${p.no}: traced ${m2.toFixed(0)} m² vs ${p.area} m²`);
    assert.equal(p.geometry.aerial.length, p.geometry.plan.length);
  }
});

test("geometry: aerial projection of every plot lands inside the aerial image", () => {
  const view = project.views.find((v) => v.id === "aerial");
  for (const p of project.plots) {
    const [x, y] = applyH(view.homography, p.label.plan);
    assert.ok(x > 0 && x < view.size[0] && y > 0 && y < view.size[1], `plot ${p.no}`);
  }
});

test("houses: A–D with catalogue built-up areas", () => {
  const byId = Object.fromEntries(project.houseTypes.map((t) => [t.id, t]));
  assert.deepEqual(Object.keys(byId), ["A", "B", "C", "D"]);
  assert.equal(byId.A.builtUpArea, 170);
  assert.equal(byId.B.builtUpArea, 143);
  assert.equal(byId.C.builtUpArea, 107);
  assert.equal(byId.C.layouts.find((l) => l.id === "C2").builtUpArea, 106);
  assert.equal(byId.D.builtUpArea, 156);
  // the catalogue gives no built-up area for the single-storey D variants – must stay unknown
  assert.equal(byId.D.layouts.find((l) => l.id === "D2").builtUpArea, null);
  assert.equal(byId.D.layouts.find((l) => l.id === "D3").builtUpArea, null);
  assert.equal(byId.A.layouts[0].disposition, "4+kk");
  assert.equal(byId.A.layouts[1].disposition, "5+kk");
  assert.equal(byId.B.layouts[0].disposition, "5+kk");
});

test("assets: every referenced image exists", () => {
  for (const v of project.houseVariants) {
    assert.ok(project.houseTypes.some((t) => t.id === v.type), v.id);
    for (const img of v.images) for (const w of [480, 960, 1600]) assert.ok(exists(project.img(img, w)), project.img(img, w));
  }
  for (const t of project.houseTypes) {
    for (const l of t.layouts) assert.ok(exists(project.img(l.sheet, 1100)), l.sheet);
    assert.ok(exists(project.img(t.sheets.site, 1100)));
  }
  for (const v of project.views.filter((x) => !x.pending && x.sources)) for (const [, src] of v.sources) assert.ok(exists(src), src);
});

test("compatibility: rules exclude types and explain why", () => {
  const p41 = project.plots.find((p) => p.no === 41); // 499 m²
  const t = typesForPlot(project, p41);
  assert.equal(t.length, 4);
  assert.equal(t.find((x) => x.type.id === "A").allowed, false);
  assert.ok(t.find((x) => x.type.id === "A").reason.length > 10);
  assert.equal(t.find((x) => x.type.id === "D").allowed, false);
  assert.equal(isAllowed(project, p41, "C"), true);
  assert.ok(plotsForType(project, "B").length === project.plots.length);
});

test("compatibility: explicit overrides take precedence over rules", () => {
  const p = project.plots.find((x) => x.no === 12);
  const saved = project.compatibility.overrides;
  project.compatibility.overrides = { 12: ["C"] };
  try {
    assert.deepEqual(typesForPlot(project, p).filter((x) => x.allowed).map((x) => x.type.id), ["C"]);
  } finally { project.compatibility.overrides = saved; }
});

test("configuration only on available plots", () => {
  assert.equal(canConfigure(project.plots.find((p) => p.no === 64)), false);
  assert.equal(canConfigure(project.plots.find((p) => p.no === 1)), true);
});

test("pricing: missing prices give an incomplete, explained summary", () => {
  const plot = project.plots[0], type = project.houseTypes[0];
  const s = priceSummary(project, { plot, type, layout: type.layouts[0] });
  assert.equal(s.complete, false);
  assert.equal(s.total, null);
  assert.ok(s.lines.every((l) => l.value === null && l.missing));
  const s2 = priceSummary(project, { plot: { ...plot, price: 2_000_000 }, type: { ...type, price: 6_000_000 }, layout: null });
  assert.equal(s2.complete, true);
  assert.equal(s2.total, 8_000_000);
});

test("enquiry validation", () => {
  assert.deepEqual(Object.keys(validate({})).sort(), ["consent", "email", "name"]);
  assert.ok(validate({ name: "Jana", email: "jana@", consent: true }).email);
  assert.ok(validate({ name: "Jana", email: "jana@novakova.cz", phone: "12", consent: true }).phone);
  assert.deepEqual(validate({ name: "Jana Nováková", email: "jana@novakova.cz", phone: "+420 777 123 456", consent: true }), {});
});

test("timelapse slots: every variant declares an animation slot (null until delivered)", () => {
  for (const v of project.houseVariants) {
    assert.ok("timelapse" in v, v.id);
    if (v.timelapse) assert.ok(["video", "frames"].includes(v.timelapse.kind));
  }
});

test("panoramas: six calibrated stations with existing images", async () => {
  const { planToMetres, bearingTo } = await import("../js/core/panorama.js");
  assert.equal(project.panoramas.length, 6);
  for (const s of project.panoramas) {
    assert.ok(s.heading >= 0 && s.heading < 360, s.id);
    assert.ok(s.altitude > 20 && s.altitude < 120, s.id);
    for (const src of Object.values(s.sources)) assert.ok(exists(src), src);
    assert.equal(s.future, null, "no visualisation in panoramas yet");
  }
  // the centre station really is above the development: inside the bounding box of the traced plots
  const pts = project.plots.filter((p) => p.geometry).flatMap((p) => p.geometry.plan);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const c = project.panoramas.find((s) => s.id === "stred-60").plan;
  assert.ok(c[0] > Math.min(...xs) && c[0] < Math.max(...xs) && c[1] > Math.min(...ys) && c[1] < Math.max(...ys));
  // georeference round trip: station metres → plan px (generated) → metres
  const s = project.panoramas.find((x) => x.id === "vychod");
  const m = planToMetres(project.planGeoref, s.plan);
  assert.ok(Math.hypot(m[0] - s.enu[0], m[1] - s.enu[1]) < 0.5);
  // plan is roughly north-up: the northern station is north of the centre
  assert.ok(Math.abs(bearingTo(project.panoramas.find((x) => x.id === "stred-60").enu, project.panoramas.find((x) => x.id === "sever").enu) - 355) < 10);
});

test("intro film: files exist and the hand-over frame lies inside the aerial view", () => {
  const v = project.introVideo;
  for (const src of [v.src.hd, v.src.sd, v.poster]) assert.ok(exists(src), src);
  const aerial = project.views.find((x) => x.id === "aerial");
  assert.ok(v.endBox.x >= 0 && v.endBox.y >= 0 && v.endBox.x + v.endBox.w <= aerial.size[0] && v.endBox.y + v.endBox.h <= aerial.size[1]);
  assert.ok(Math.abs(v.endBox.w / v.endBox.h - 16 / 9) < 0.01, "film is 16:9");
});
