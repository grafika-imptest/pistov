// Favourites + comparison, kept in the visitor's browser (localStorage). Shared by all pages.
// Item shapes: { kind: "plot", no } | { kind: "house", type } | { kind: "combo", plot, type, layout, material }
const KEYS = { fav: "pistov:favourites", cmp: "pistov:compare" };
export const COMPARE_MAX = 4;

const read = (k) => { try { return JSON.parse(localStorage.getItem(KEYS[k])) || []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(KEYS[k], JSON.stringify(v)); } catch { /* private mode */ } emit(); };
const key = (it) => [it.kind, it.no, it.type, it.plot, it.layout, it.material].filter((x) => x != null).join(":");
const subs = new Set();
const emit = () => subs.forEach((fn) => fn());
if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (Object.values(KEYS).includes(e.key)) emit(); });

export const collections = {
  list: (k) => read(k),
  has: (k, it) => read(k).some((x) => key(x) === key(it)),
  toggle(k, it) {
    const all = read(k), i = all.findIndex((x) => key(x) === key(it));
    if (i >= 0) { all.splice(i, 1); write(k, all); return false; }
    if (k === "cmp" && all.length >= COMPARE_MAX) return null; // full
    all.push(it); write(k, all); return true;
  },
  remove(k, it) { write(k, read(k).filter((x) => key(x) !== key(it))); },
  reorder(k, from, to) { const all = read(k); const [x] = all.splice(from, 1); all.splice(to, 0, x); write(k, all); },
  clear(k) { write(k, []); },
  subscribe: (fn) => (subs.add(fn), () => subs.delete(fn)),
  key,
};

/** human label of an item */
export function describe(project, it) {
  const plot = it.no != null ? project.plots.find((p) => p.no === it.no) : it.plot != null ? project.plots.find((p) => p.no === it.plot) : null;
  const type = it.type ? project.houseTypes.find((t) => t.id === it.type) : null;
  const layout = type && it.layout ? type.layouts.find((l) => l.id === it.layout) : type?.layouts[0];
  const variant = type ? project.houseVariants.find((v) => v.id === it.material) || project.houseVariants.find((v) => v.type === type.id) : null;
  return { plot, type, layout, variant };
}

const ICON = {
  fav: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.1 2.3h2.6C14 6.1 15.4 5 17.4 5c3.4 0 5.3 3.4 3.8 6.4C19 15.6 12 20 12 20Z"/></svg>',
  cmp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8"/></svg>',
};
/** heart + compare toggle buttons for an item; handled by bindSaveButtons() */
export function saveButtons(it, { what = "" } = {}) {
  const data = JSON.stringify(it).replace(/'/g, "&#39;");
  return ["fav", "cmp"].map((k) => {
    const on = collections.has(k, it);
    const label = k === "fav" ? (on ? "Uloženo v oblíbených" : "Uložit do oblíbených") : on ? "V porovnání" : "Přidat do porovnání";
    return `<button type="button" class="savebtn savebtn--${k} ${on ? "is-on" : ""}" data-save="${k}" data-value="${k}" data-item='${data}' aria-pressed="${on}" aria-label="${label}${what ? ` – ${what}` : ""}" title="${label}">${ICON[k]}<span>${k === "fav" ? "Oblíbené" : "Porovnat"}</span></button>`;
  }).join("");
}
/** delegate clicks on [data-save] inside root; onFull is called when the comparison is full */
export function bindSaveButtons(root, onFull) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-save]"); if (!b || !root.contains(b)) return;
    e.preventDefault(); e.stopPropagation();
    const res = collections.toggle(b.dataset.save, JSON.parse(b.dataset.item));
    if (res === null) onFull?.();
  });
}
/** keep all rendered save buttons in sync without re-rendering their containers */
export function syncSaveButtons(root = document) {
  for (const b of root.querySelectorAll("[data-save]")) {
    const k = b.dataset.save, on = collections.has(k, JSON.parse(b.dataset.item));
    b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on));
    const label = k === "fav" ? (on ? "Uloženo v oblíbených" : "Uložit do oblíbených") : on ? "V porovnání" : "Přidat do porovnání";
    b.title = label; b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/^[^–]+/, `${label} `).trim());
  }
}
