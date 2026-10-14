// Two editions of the site share all data and logic:
//   "atelier" – the pages in the root, art-directed after the architects' hand-drawn catalogue
//   "studio"  – the pages in /studio/, contemporary and focused on clarity. They set <base href="../">,
//               so every relative URL (assets, scripts, links) resolves against the root.
// Links are written once in ateliér terms ("galerie.html", "index.html?parcela=5") and mapped here.

const isDoc = typeof document !== "undefined";
export const EDITION = isDoc && document.documentElement.dataset.edition === "studio" ? "studio" : "atelier";
export const EDITIONS = {
  atelier: { label: "Ateliér", desc: "výtvarná verze inspirovaná katalogem architektů – papír, skica, ruční poznámky" },
  studio: { label: "Studio", desc: "současná verze zaměřená na přehlednost a rychlý výběr parcely" },
};
const CONFIG_KEYS = ["parcela", "dum", "dispozice", "material", "rezim", "pohled", "detail", "stav", "stanoviste", "demo"];
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

const split = (h) => {
  const hi = h.indexOf("#"), hash = hi >= 0 ? h.slice(hi) : "";
  const rest = hi >= 0 ? h.slice(0, hi) : h;
  const qi = rest.indexOf("?");
  return { path: qi >= 0 ? rest.slice(0, qi) : rest, query: qi >= 0 ? rest.slice(qi) : "", hash };
};
const hasConfig = (query) => { const q = new URLSearchParams(query); return CONFIG_KEYS.some((k) => q.has(k)); };

/** file name of the current page inside its edition ("" for the home page) */
export function currentFile(pathname = isDoc ? location.pathname : "") {
  const f = pathname.split("/").pop();
  return f === "index.html" ? "" : f;
}

/** ateliér href → the equivalent studio href (relative to the site root) */
export function toStudio(h, here = isDoc ? currentFile() : "") {
  if (!h || EXTERNAL.test(h) || h.startsWith("studio/") || h.startsWith("assets/")) return h;
  if (h.startsWith("#")) return `studio/${isDoc ? location.pathname.split("/").pop() : here}${h}`;
  const { path, query, hash } = split(h);
  if (path === "" || path === "index.html") {
    if (hasConfig(query)) return `studio/nabidka.html${query}`;
    if (hash === "#explorer") return "studio/nabidka.html";
    if (hash === "#domy") return "studio/domy.html";
    if (hash === "#poptavka") return "studio/kontakty.html#formular";
    return `studio/${hash}`;
  }
  return `studio/${h}`;
}

/** studio href (relative to /studio/) → the equivalent ateliér href (relative to the root) */
export function toAtelier(h) {
  const { path, query, hash } = split(h.replace(/^studio\//, ""));
  if (path === "" || path === "index.html") return `index.html${query}${hash === "#lokalita" || hash === "#projekt" ? hash : ""}`;
  if (path === "nabidka.html") return `index.html${query}#explorer`;
  if (path === "domy.html") return "index.html#domy";
  return `${path}${query}${hash}`;
}

/** the current page in the other edition */
export function otherEditionHref() {
  const rel = `${currentFile()}${location.search}${location.hash}`;
  return EDITION === "studio" ? toAtelier(rel) : toStudio(rel || "index.html");
}

/** map a link written in ateliér terms to the current edition */
export const edLink = (h) => (EDITION === "studio" ? toStudio(h) : h);

/** Czech typography: glue one-letter prepositions/conjunctions (v, k, s, z, o, u, a, i) to the next word */
const ONE = /(^|[\s(„])([vkszouaiVKSZOUAI])\s+(?=\S)/g;
export function czTypo(root) {
  if (!root || root.nodeType !== 1 || root.closest?.("script, style, textarea, svg")) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script, style, textarea, svg") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  for (let n = w.nextNode(); n; n = w.nextNode()) if (ONE.test(n.data)) { ONE.lastIndex = 0; n.data = n.data.replace(ONE, "$1$2 "); }
}

/** studio pages: keep every link inside the studio edition, including links rendered later */
export function keepLinksInEdition(root = document.body) {
  if (EDITION !== "studio") return;
  const fix = (scope) => {
    if (!scope) return;
    czTypo(scope);
    for (const a of scope.querySelectorAll?.("a[href]:not([data-ed])") || []) {
      a.setAttribute("href", toStudio(a.getAttribute("href")));
      a.dataset.ed = "";
    }
  };
  fix(root);
  new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches?.("a[href]:not([data-ed])")) fix(n.parentNode); else fix(n); } })
    .observe(root, { childList: true, subtree: true });
}
