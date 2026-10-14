// Single source of truth for the visitor's selection + UI state, mirrored into the URL
// so a configuration can be bookmarked / shared and the back button behaves sensibly.

const URL_KEYS = {
  plot: "parcela",
  type: "dum",
  layout: "dispozice",
  material: "material",
  mode: "rezim",
  view: "pohled",
  detail: "detail",
  vis: "stav",
  station: "stanoviste",
};
const MODE_SLUG = { plots: "pozemky", houses: "domy", design: "navrh" };
const SLUG_MODE = Object.fromEntries(Object.entries(MODE_SLUG).map(([k, v]) => [v, k]));

export function createStore(initial) {
  let state = { ...initial };
  const subs = new Set();
  const get = () => state;
  function set(patch, { history = "replace", silentUrl = false } = {}) {
    const prev = state;
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    const changed = Object.keys(next).filter((k) => !Object.is(next[k], prev[k]));
    if (!changed.length) return;
    state = next;
    if (!silentUrl) writeUrl(state, history);
    for (const fn of subs) fn(state, prev, new Set(changed));
  }
  const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
  return { get, set, subscribe };
}

export function readUrl() {
  const q = new URLSearchParams(location.search);
  const out = {};
  const plot = q.get(URL_KEYS.plot);
  if (plot && /^\d+$/.test(plot)) out.plotNo = Number(plot);
  for (const k of ["type", "layout", "material", "view", "detail", "station"]) if (q.get(URL_KEYS[k])) out[k] = q.get(URL_KEYS[k]);
  if (q.get(URL_KEYS.mode)) out.mode = SLUG_MODE[q.get(URL_KEYS.mode)];
  if (q.get(URL_KEYS.vis) === "dum") out.vis = "house";
  out.demo = q.get("demo");
  out.fixture = q.get("fixture");
  return out;
}

function writeUrl(s, history) {
  const q = new URLSearchParams(location.search);
  const put = (k, v) => (v == null || v === "" ? q.delete(URL_KEYS[k]) : q.set(URL_KEYS[k], v));
  put("plot", s.plotNo);
  put("type", s.type);
  put("layout", s.layout);
  put("material", s.material);
  put("mode", s.mode && s.mode !== "plots" ? MODE_SLUG[s.mode] : null);
  put("view", s.view && s.view !== s.defaultView ? s.view : null);
  put("detail", s.detail);
  put("station", s.view === "pano" ? s.station : null);
  put("vis", s.mode === "design" && s.vis === "house" ? "dum" : null);
  const url = `${location.pathname}${q.toString() ? "?" + q : ""}${location.hash}`;
  if (url === location.pathname + location.search + location.hash) return;
  if (history === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
