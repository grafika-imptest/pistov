// Application wiring: one store, many views. Project data comes from js/projects/pistov.
import { project } from "./projects/pistov/project.js";
import { createStore, readUrl } from "./core/store.js";
import { typesForPlot, isAllowed } from "./core/compat.js";
import { revealOnScroll, reducedMotion } from "./core/motion.js";
import { Explorer } from "./ui/explorer.js";
import { Intro } from "./ui/hero.js";
import { Panel, matchesFilters } from "./ui/panel.js";
import { Stage } from "./ui/stage.js";
import { Catalog } from "./ui/catalog.js";
import { Detail } from "./ui/detail.js";
import { Enquiry } from "./ui/enquiry.js";
import { m2, plural } from "./ui/format.js";
import { applyFixtures } from "./fixtures.js";
import { planToMetres } from "./core/panorama.js";
import { PanoTeaser } from "./ui/panoTeaser.js";

const $ = (s) => document.querySelector(s);
const url = readUrl();
if (url.fixture) applyFixtures(project, url.fixture);
const demoStatus = url.demo === "stavy";
const statusOf = (plot) => (demoStatus ? project.demoStatusOverrides[plot.no] ?? plot.status : plot.status);
const desktop = () => window.matchMedia("(min-width: 900px)").matches;

const store = createStore({
  defaultView: project.defaultView,
  view: project.views.some((v) => v.id === url.view && !v.pending) ? url.view : project.defaultView,
  mode: url.mode || "plots",
  plotNo: project.plots.some((p) => p.no === url.plotNo) ? url.plotNo : null,
  type: project.houseTypes.some((t) => t.id === url.type) ? url.type : null,
  layout: url.layout || null,
  material: url.material || null,
  vis: url.vis || "plot",
  station: project.panoramas.some((s) => s.id === url.station) ? url.station : project.defaultStation,
  detail: project.houseTypes.some((t) => t.id === url.detail) ? url.detail : null,
  filters: { status: "all", area: null, type: null },
  markers: true,
  labels: true,
});

// ---------------- selection (derived, always consistent) ----------------
function selection(st = store.get()) {
  const plot = project.plots.find((p) => p.no === st.plotNo) || null;
  const type = project.houseTypes.find((t) => t.id === st.type) || null;
  const layout = type ? type.layouts.find((l) => l.id === st.layout) || type.layouts[0] : null;
  const variants = type ? project.houseVariants.filter((v) => v.type === type.id) : [];
  const variant = type ? variants.find((v) => v.id === st.material) || variants[0] : null;
  return { plot, type, layout, variant };
}

// ---------------- app API used by the UI modules ----------------
const app = {
  project, store, statusOf, demoStatus, selection,
  selectPlot(no, how) {
    const plot = project.plots.find((p) => p.no === no); if (!plot) return;
    if (explorerRoot.dataset.phase !== "explore") intro.enter({ instant: true });
    const st = store.get();
    const patch = { plotNo: no, vis: "plot" };
    if (st.type && !isAllowed(project, plot, st.type)) {
      patch.type = null; patch.layout = null; patch.material = null;
      explorer._toast(`Dům ${st.type} na parcelu č. ${no} umístit nelze`);
    }
    if (st.mode === "houses" && st.type && isAllowed(project, plot, st.type) && statusOf(plot) === "available") patch.mode = "design";
    else if (st.mode !== "design") patch.mode = "plots";
    if ((patch.mode || st.mode) === "design" && !(patch.type === null ? null : st.type)) {
      const first = typesForPlot(project, plot).find((t) => t.allowed);
      if (first) { patch.type = first.type.id; patch.layout = null; patch.material = null; }
    }
    store.set(patch, { history: "push" });
    if (how !== "map-silent") explorer.framePlot(plot.id);
    if (!desktop()) panel.setSheet("half");
  },
  clearPlot() { store.set({ plotNo: null, vis: "plot" }, { history: "push" }); explorer.frameAll(true); },
  setMode(mode) {
    const st = store.get(), sel = selection();
    const patch = { mode };
    if (mode === "design" && sel.plot && !st.type) {
      const first = typesForPlot(project, sel.plot).find((t) => t.allowed);
      if (first) patch.type = first.type.id;
    }
    if (mode === "design") patch.vis = "plot";
    store.set(patch, { history: "push" });
    if (mode !== "design" && sel.plot) requestAnimationFrame(() => explorer.ensurePlotVisible(sel.plot.id));
  },
  setType(id) {
    const sel = selection();
    if (sel.plot && !isAllowed(project, sel.plot, id)) return;
    const st = store.get();
    store.set({ type: st.type === id && st.mode === "houses" ? null : id, layout: null, material: null });
  },
  tryType(id, material) {
    const sel = selection();
    scrollToExplorer();
    if (explorerRoot.dataset.phase !== "explore") intro.enter({ instant: true });
    if (sel.plot && statusOf(sel.plot) === "available" && isAllowed(project, sel.plot, id)) {
      store.set({ type: id, layout: null, material: material || null, mode: "design", vis: "house" }, { history: "push" });
    } else {
      store.set({ type: id, layout: null, material: material || null, mode: "houses", plotNo: sel.plot && isAllowed(project, sel.plot, id) ? sel.plot.no : null }, { history: "push" });
      explorer._toast(sel.plot ? `Dům ${id} nelze umístit na parcelu č. ${sel.plot.no} – vyberte zvýrazněnou parcelu` : `Vyberte parcelu – zvýrazněné jsou ty, kam lze umístit dům ${id}`);
      explorer.frameAll(true);
    }
  },
  setLayout(id) { store.set({ layout: id }); },
  setMaterial(id) {
    const v = project.houseVariants.find((x) => x.id === id); if (!v) return;
    const st = store.get();
    if (st.type !== v.type) store.set({ type: v.type, layout: null, material: id }); else store.set({ material: id });
  },
  setVis(vis) { store.set({ vis }); },
  openDetail(typeId, material) {
    const sel = selection(), st = store.get();
    const patch = { detail: typeId };
    if (st.type !== typeId && (!sel.plot || isAllowed(project, sel.plot, typeId))) Object.assign(patch, { type: typeId, layout: null, material: material || null });
    store.set(patch, { history: "push" });
    detailPushed = true;
  },
  closeDetail() { if (detailPushed) { detailPushed = false; history.back(); } else store.set({ detail: null }); },
  goEnquiry() {
    const el = $("#poptavka");
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), reducedMotion() ? 0 : 700);
  },
  scrollToExplorer,
  onSheetChange: () => updateInsets(),
  /** open the 360° view at a station, optionally turned towards a plot */
  openPano(stationId, plot) {
    if (explorerRoot.dataset.phase !== "explore") intro.enter({ instant: true });
    const st = store.get();
    store.set({ view: "pano", station: stationId, ...(st.mode === "design" ? { mode: "plots" } : {}) }, { history: "push" });
    explorer.showStation(stationId, { lookAtPlot: plot || null });
  },
  /** best station to look at a plot: an oblique view (≈ 22° down), not straight down from above */
  openPanoForPlot(plot) {
    if (!plot) return;
    const pts = plot.geometry ? plot.geometry.plan : [plot.label.plan];
    const c = planToMetres(project.planGeoref, pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]));
    const score = (s) => { const d = Math.hypot(c[0] - s.enu[0], c[1] - s.enu[1]); const pitch = Math.atan2(s.altitude, d) * 180 / Math.PI; return Math.abs(pitch - 22) + (d > 450 ? 40 : 0); };
    const best = [...project.panoramas].sort((a, b) => score(a) - score(b))[0];
    app.openPano(best.id, plot);
  },
};
let detailPushed = false;
function scrollToExplorer() { $("#explorer").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }); }

// ---------------- components ----------------
const explorerRoot = $("#explorer");
const explorer = new Explorer(explorerRoot, {
  project, store, statusOf,
  onSelectPlot: (plot, how) => app.selectPlot(plot.no, how),
  onStation: (id) => app.openPano(id),
});
const intro = new Intro(explorerRoot, explorer);
const panel = new Panel($("[data-panel]"), app);
const stage = new Stage($("[data-stage]"), app);
const catalog = new Catalog($("[data-catalog]"), app);
const detail = new Detail($("[data-detail]"), app);
const enquiry = new Enquiry($("[data-enquiry]"), $("[data-enquiry-summary]"), app);
explorer.onGesture = () => { if (explorerRoot.dataset.phase === "intro") intro.skip(); };

function updateInsets() {
  if (explorerRoot.dataset.phase !== 'explore') { explorer.setInsets({ top: 0, right: 0, bottom: 0, left: 0 }); return; }
  const panelEl = $("[data-panel]");
  const top = (document.querySelector("[data-topbar]")?.offsetHeight || 64) + (desktop() ? 70 : 64);
  if (desktop()) explorer.setInsets({ top, right: panelEl.offsetWidth + 28, bottom: 64, left: 72 });
  else {
    const sheetH = { peek: 0.24, half: 0.5, full: 0.86 }[panelEl.dataset.sheet] * explorerRoot.clientHeight;
    explorer.setInsets({ top, right: 0, bottom: explorerRoot.dataset.phase === "explore" ? sheetH : 0, left: 0 });
  }
}
explorer.onResizeHook = updateInsets;

// ---------------- render pipeline ----------------
function render(st, prev, changed) {
  const sel = selection(st);
  explorerRoot.dataset.mode = st.mode;
  for (const b of document.querySelectorAll("[data-mode]")) b.setAttribute("aria-selected", String(b.dataset.mode === st.mode));
  document.querySelector("[data-modes]").dataset.on = st.mode;

  if (!changed || changed.has("view")) { explorer.setView(st.view, { keepCamera: false }); if (sel.plot && st.view !== "pano") explorer.framePlot(sel.plot.id, false); }
  else if (changed.has("station") && st.view === "pano") explorer.showStation(st.station);
  // which plots are emphasised on the map
  const f = st.filters, filtering = f.status !== "all" || f.area || f.type;
  explorer.dimFn = st.mode === "plots" ? (filtering ? (p) => !matchesFilters(project, p, f, statusOf) : null)
    : st.type ? (p) => !isAllowed(project, p, st.type) || statusOf(p) !== "available" : null;
  explorer.refresh();

  const stageEl = $("[data-stage]");
  stageEl.hidden = st.mode !== "design";
  if (st.mode === "design") stage.update();

  panel.render();
  if (!changed || ["mode", "plotNo"].some((k) => changed.has(k))) requestAnimationFrame(updateInsets);
  enquiry.update();

  // state-aware global CTA
  const cta = $("[data-cta-global]");
  cta.textContent = !desktop() ? "Poptat" : sel.plot && sel.type ? "Poptat vybranou kombinaci" : sel.plot ? `Poptat parcelu ${sel.plot.no}` : "Poptat";
  cta.setAttribute("aria-label", sel.plot && sel.type ? `Poptat vybranou kombinaci: parcela ${sel.plot.no}, ${sel.type.name}` : sel.plot ? `Poptat parcelu ${sel.plot.no}` : "Poptat");

  // detail dialog
  if (st.detail) detail.open(st.detail); else detail.close();
  if (st.detail && changed && ["type", "layout", "material", "plotNo"].some((k) => changed.has(k))) detail.render();

  if (!changed || ["type", "plotNo"].some((k) => changed?.has(k))) catalog.render();
}
store.subscribe(render);

window.addEventListener("popstate", () => {
  const u = readUrl();
  const prev = store.get();
  detailPushed = false;
  // leaving the house detail must not undo choices made inside it (selection survives the modal)
  if (prev.detail && !u.detail) {
    store.set({ detail: null }, { history: "replace" });
    return;
  }
  store.set({
    plotNo: u.plotNo ?? null, type: u.type ?? null, layout: u.layout ?? null, material: u.material ?? null,
    mode: u.mode || "plots", view: u.view || project.defaultView, detail: u.detail ?? null, vis: u.vis || "plot",
    station: u.station || project.defaultStation,
  }, { silentUrl: true });
  const sel = selection();
  if (sel.plot) explorer.framePlot(sel.plot.id); else explorer.frameAll(true);
});

// ---------------- chrome events ----------------
document.querySelector("[data-modes]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]"); if (!b) return;
  if (explorerRoot.dataset.phase !== "explore") intro.enter({ instant: true });
  app.setMode(b.dataset.mode);
});
document.querySelector("[data-modes]").addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const tabs = [...document.querySelectorAll("[data-mode]")]; const i = tabs.indexOf(document.activeElement);
  const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); app.setMode(n.dataset.mode);
});
$("[data-enter]").addEventListener("click", () => { intro.enter(); updateInsets(); explorer.frameAll(true, 900); });
$("[data-skip]").addEventListener("click", () => { intro.enter({ instant: true }); updateInsets(); explorer.frameAll(true, 600); });
$("[data-cta-global]").addEventListener("click", (e) => { e.preventDefault(); app.goEnquiry(); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || document.querySelector("dialog[open]") || document.querySelector(".popover:not([hidden])")) return;
  const st = store.get();
  if (st.mode === "plots" && st.plotNo && explorerRoot.contains(document.activeElement)) app.clearPlot();
});
// topbar: solid once the page scrolls past the explorer
const io = new IntersectionObserver(([en]) => document.querySelector("[data-topbar]").classList.toggle("is-solid", !en.isIntersecting), { threshold: 0.02 });
io.observe(explorerRoot);

// facts in the project section – computed from the data, not typed in
const free = project.plots.filter((p) => statusOf(p) === "available").length;
const areas = project.plots.map((p) => p.area);
$("[data-facts]").innerHTML = `
  <div><dt>Parcel v plánu</dt><dd>${project.plots.length}</dd></div>
  <div><dt>Volných k prodeji</dt><dd>${free}</dd></div>
  <div><dt>Výměry parcel</dt><dd>${m2(Math.min(...areas))} – ${m2(Math.max(...areas))}</dd></div>
  <div><dt>Typové domy</dt><dd>${project.houseTypes.length} ${plural(project.houseTypes.length, "typ", "typy", "typů")} · ${project.houseVariants.length} vizualizací</dd></div>`;

if (demoStatus) {
  const b = document.createElement("p"); b.className = "demo-badge"; b.textContent = "Ukázková data stavů (?demo=stavy) – neodpovídají nabídce";
  document.body.append(b);
}

// ---------------- boot ----------------
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);
render(store.get(), null, null);
updateInsets();
revealOnScroll();
new PanoTeaser(document.querySelector("[data-pano-teaser]"), app);
const deepLink = url.plotNo || url.mode || url.detail || url.type || (url.view && url.view !== project.defaultView);
if (deepLink) { intro.enter({ instant: true }); updateInsets(); requestAnimationFrame(() => { updateInsets(); const sel = selection(); if (sel.plot) explorer.framePlot(sel.plot.id, false); else explorer.frameAll(false); }); }
else intro.play();

// exposed for automated checks in the browser console
window.__pistov = { app, store, explorer, stage, intro };
if (new URLSearchParams(location.search).has("kalibrace")) import("./dev/calibrate.js").then((m) => m.startCalibration(app, explorer));
