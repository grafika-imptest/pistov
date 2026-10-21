// Contextual panel (desktop side panel / mobile bottom sheet). Content follows the active mode.
import { typesForPlot, canConfigure, plotsForType } from "../core/compat.js";
import { priceSummary, formatPrice } from "../core/pricing.js";
import { bbox, toPath, minRect, polyArea } from "../core/geometry.js";
import { lightbox, img } from "../site/ui.js";
import { esc, m2, statusBadge, plural, STATUS } from "./format.js";
import { arrowSVG, draw } from "./sketch.js";
import { saveButtons } from "../site/collections.js";

const AREA_BANDS = [
  { id: "s", label: "do 580 m²", test: (a) => a < 580 },
  { id: "m", label: "580–650 m²", test: (a) => a >= 580 && a <= 650 },
  { id: "l", label: "nad 650 m²", test: (a) => a > 650 },
];
const PRICE_BANDS = [
  { id: "p1", label: "do 3,5 mil. Kč", test: (v) => v < 3500000 },
  { id: "p2", label: "3,5–4 mil. Kč", test: (v) => v >= 3500000 && v <= 4000000 },
  { id: "p3", label: "nad 4 mil. Kč", test: (v) => v > 4000000 },
];
export const matchesFilters = (project, plot, f, statusOf) =>
  (!f.price || PRICE_BANDS.find((b) => b.id === f.price).test(plot.price)) &&
  (f.status === "all" || statusOf(plot) === f.status) &&
  (!f.area || AREA_BANDS.find((b) => b.id === f.area).test(plot.area)) &&
  (!f.type || typesForPlot(project, plot).find((t) => t.type.id === f.type)?.allowed);

export class Panel {
  constructor(root, app) {
    this.root = root; this.app = app; this.project = app.project;
    this.body = root.querySelector("[data-panel-body]");
    this.body.addEventListener("click", (e) => this._click(e));
    this.body.addEventListener("change", (e) => this._change(e));
    root.querySelector("[data-sheet-toggle]").addEventListener("click", () => {
      const order = ["peek", "half", "full"]; const cur = root.dataset.sheet;
      this.setSheet(order[(order.indexOf(cur) + 1) % order.length]);
    });
    this._locatorBox = bbox(this.project.plots.flatMap((p) => (p.geometry ? p.geometry.plan : [])));
  }

  setSheet(s) {
    this.root.dataset.sheet = s;
    this.root.querySelector("[data-sheet-toggle]").setAttribute("aria-label", s === "full" ? "Sbalit panel" : "Rozbalit panel");
    this.app.onSheetChange?.(s);
  }

  render() {
    const st = this.app.store.get();
    const sel = this.app.selection();
    let html;
    if (st.mode === "plots") html = sel.plot ? this._plotDetail(sel) : this._plotList(st);
    else if (st.mode === "houses") html = this._houses(st, sel);
    else html = this._design(st, sel);
    const key = `${st.mode}|${sel.plot?.id}|${st.mode === "plots" && !sel.plot ? "list" : ""}`;
    const scroll = key === this._key ? this.body.scrollTop : 0;
    // keep keyboard focus on the equivalent control after re-render
    const ae = this.body.contains(document.activeElement) ? document.activeElement : null;
    const attr = ae && ["data-material", "data-type", "data-layout", "data-select", "data-action", "data-try", "data-save"].find((a) => ae.hasAttribute(a));
    const focusSel = attr ? `[${attr}="${ae.getAttribute(attr)}"]${ae.dataset.value ? `[data-value="${ae.dataset.value}"]` : ""}` : ae?.dataset.filter ? `[data-filter="${ae.dataset.filter}"][data-value="${ae.dataset.value}"]` : null;
    this.body.innerHTML = html;
    this.body.scrollTop = scroll;
    const kept = focusSel && this.body.querySelector(focusSel);
    if (kept) kept.focus({ preventScroll: true });
    else if (ae && key !== this._key) this.body.querySelector("button, [href]")?.focus({ preventScroll: true }); // content replaced under the keyboard user
    if (key !== this._key) { this.body.classList.remove("is-in"); void this.body.offsetWidth; this.body.classList.add("is-in"); draw(this.body); }
    this._key = key;
  }

  // ---------- POZEMKY ----------
  _plotList(st) {
    const f = st.filters, P = this.project;
    const list = P.plots.filter((p) => matchesFilters(P, p, f, this.app.statusOf));
    const free = P.plots.filter((p) => this.app.statusOf(p) === "available").length;
    const chip = (group, id, label, on) => `<button type="button" class="chip ${on ? "is-on" : ""}" data-filter="${group}" data-value="${id}" aria-pressed="${on}">${label}</button>`;
    const active = f.status !== "all" || f.area || f.type || f.price;
    return `
      <header class="pn__head">
        <p class="eyebrow">Pozemky</p>
        <h2 class="pn__title">${free} volných parcel</h2>
        <p class="pn__sub">z ${P.plots.length} v lokalitě · podle opraveného situačního plánu, říjen 2026</p>
      </header>
      <div class="filters" role="group" aria-label="Filtr parcel">
        <p class="filters__label">Stav</p>
        <div class="chips">${chip("status", "all", "Vše", f.status === "all")}${chip("status", "available", "Volné", f.status === "available")}${P.plots.some((p) => this.app.statusOf(p) === "reserved") ? chip("status", "reserved", "Rezervované", f.status === "reserved") : ""}${this.app.demoStatus ? chip("status", "sold", "Prodané", f.status === "sold") : ""}</div>
        <p class="filters__label">Výměra</p>
        <div class="chips">${AREA_BANDS.map((b) => chip("area", b.id, b.label, f.area === b.id)).join("")}</div>
        <p class="filters__label">Cena pozemku <span class="filters__hint">${P.pricing.perM2.toLocaleString("cs-CZ")} Kč/m²</span></p>
        <div class="chips">${PRICE_BANDS.map((b) => chip("price", b.id, b.label, f.price === b.id)).join("")}</div>
        <p class="filters__label">Lze postavit dům</p>
        <div class="chips">${P.houseTypes.map((t) => chip("type", t.id, t.id, f.type === t.id)).join("")}</div>
        ${active ? `<button type="button" class="link filters__reset" data-action="reset-filters">Zrušit filtry</button>` : ""}
      </div>
      <p class="pn__count" role="status">${list.length} ${plural(list.length, "parcela", "parcely", "parcel")}${active ? " odpovídá filtru" : ""}</p>
      <ul class="plotlist">
        ${list.map((p) => {
          const s = this.app.statusOf(p);
          const types = s === "available" ? typesForPlot(P, p).filter((t) => t.allowed).map((t) => t.type.id).join(" ") : "";
          return `<li><button type="button" class="plotrow" data-select="${p.no}"><span class="plotrow__no">${p.no}</span><span class="plotrow__area">${m2(p.area)}<small>${formatPrice(p.price)}</small></span><span class="plotrow__status"><i class="sw sw--${s}" aria-hidden="true"></i>${STATUS[s].label}</span><span class="plotrow__types" aria-label="Typy domů">${types}</span></button></li>`;
        }).join("") || `<li class="empty">Žádná parcela neodpovídá filtru.</li>`}
      </ul>`;
  }

  _plotDetail({ plot }) {
    const P = this.project, s = this.app.statusOf(plot);
    const types = typesForPlot(P, plot);
    const configurable = canConfigure({ ...plot, status: s });
    const price = plot.price ? formatPrice(plot.price) : "Cena na vyžádání";
    return `
      <header class="pn__head pn__head--plot">
        <button type="button" class="link back" data-action="clear-plot"><span aria-hidden="true">←</span> Všechny parcely</button>
        <p class="eyebrow">Parcela</p>
        <div class="plothead">
          <p class="plothead__no">${plot.no}</p>
          <div>${statusBadge(s)}<p class="plothead__area">${m2(plot.area)}</p></div>
          ${this._locator(plot)}
        </div>
        ${plot.geometry?.approx ? `<p class="hint">Hranice této parcely je v podkladu jen částečně čitelná – zobrazení je orientační.</p>` : ""}
        ${!plot.geometry ? `<p class="hint">${esc(plot.geometryNote)}</p>` : ""}
        <div class="savebar">${saveButtons({ kind: "plot", no: plot.no }, { what: `parcela ${plot.no}` })}</div>
      </header>
      <button type="button" class="pano-link" data-action="pano-plot"><span class="pano-link__icon" aria-hidden="true">360°</span><span><b>Výhled na parcelu dnes</b><small>dronové panorama, stav před výstavbou</small></span><span aria-hidden="true">→</span></button>
      <dl class="facts facts--panel">
        <div><dt>Výměra</dt><dd>${m2(plot.area)}</dd></div>
        <div><dt>Cena pozemku</dt><dd>${price}<small>${plot.price ? `${P.pricing.perM2.toLocaleString("cs-CZ")} Kč/m²` : "bude doplněna developerem"}</small></dd></div>
        <div><dt>Stav</dt><dd>${STATUS[s].long}<small>${esc(plot.statusSource)}</small></dd></div>
        <div><dt>Šířka × délka</dt><dd>${this._dims(plot)}</dd></div>
      </dl>
      ${this._terrain(plot)}
      ${configurable ? `
      <section class="pn__block">
        <h3 class="pn__h3">Co zde můžete postavit</h3>
        <div class="typepick">
          ${types.map(({ type, allowed, reason }) => `
            <button type="button" class="typecard ${allowed ? "" : "is-disabled"}" ${allowed ? `data-try="${type.id}"` : `aria-disabled="true"`} aria-describedby="why-${type.id}">
              <img src="${P.img(this._mainImage(type), 480)}" alt="" width="480" height="320" loading="lazy" decoding="async">
              <span class="typecard__letter">${type.id}</span>
              <span class="typecard__name">${esc(type.tagline)}</span>
              <span class="typecard__meta">${type.builtUpArea} m² obestavěná</span>
              <span class="typecard__why" id="why-${type.id}">${allowed ? "Lze umístit" : esc(reason)}</span>
            </button>`).join("")}
        </div>
        ${!P.compatibility.confirmed ? `<p class="hint">${esc(P.compatibility.note)}</p>` : ""}
      </section>
      <div class="pn__actions">
        <button type="button" class="btn btn--ink btn--block" data-action="design">Prohlédnout dům na parcele <span aria-hidden="true">→</span></button>
        <button type="button" class="btn btn--ghost btn--block" data-action="enquire">Poptat parcelu č. ${plot.no}</button>
      </div>
      <div class="pn__note">${arrowSVG({ w: 90, h: 56, from: [8, 8], to: [70, 48], bend: -0.3 })}<span class="note">a dům vyroste<br>přímo na parcele</span></div>` : `
      <section class="pn__block">
        <p class="pn__msg">Parcela je ${STATUS[s].label}. Konfigurace domu na ní proto není k dispozici.</p>
        <button type="button" class="btn btn--ink btn--block" data-action="enquire">Mám zájem o podobnou parcelu</button>
        <button type="button" class="btn btn--ghost btn--block" data-action="filter-free">Zobrazit volné parcely</button>
      </section>`}`;
  }

  /** width × length of the plot: smallest enclosing rectangle of the traced outline, scaled to the stated area */
  _dims(plot) {
    if (!plot.geometry) return `<span class="muted">doplníme</span>`;
    const r = minRect(plot.geometry.plan), k = this.project.planMetersPerPx;
    const fix = Math.sqrt(plot.area / (polyArea(plot.geometry.plan) * k * k)); // the trace runs just inside the boundary lines
    const m = (v) => (Math.round(v * k * fix * 2) / 2).toLocaleString("cs-CZ");
    return `cca ${m(r.w)} × ${m(r.h)} m<small>orientačně, odečteno ze situačního plánu</small>`;
  }

  /** slope and terrain section of the plot (per-plot data from the architect; catalogue section until then) */
  _terrain(plot) {
    const T = this.project.terrain; if (!T) return "";
    const t = T.perPlot[plot.no] || {};
    const sheet = t.section || T.fallbackSections[plot.no % T.fallbackSections.length];
    return `
      <section class="pn__block terrain">
        <h3 class="pn__h3">Svažitost</h3>
        <p class="terrain__text">${t.slope ? `Sklon pozemku: <b>${esc(t.slope)}</b>. ` : ""}${esc(t.text || "Lokalita leží v mírně svažitém terénu a domy jsou do něj osazené podle řezů architekta.")}</p>
        <button type="button" class="terrain__sheet" data-action="terrain" data-sheet="${sheet}" data-cap="${esc(t.section ? `Parcela č. ${plot.no} – řez terénem` : "Řez terénem – ilustrační řez z katalogu TAM architekti")}">
          <img src="${img(sheet, "s")}" alt="" loading="lazy" decoding="async"><span class="terrain__zoom">Zvětšit řez</span>
        </button>
        ${t.section ? "" : `<p class="hint">${esc(T.note)}</p>`}
      </section>`;
  }

  _locator(plot) {
    const b = this._locatorBox, pad = 60;
    const paths = this.project.plots.filter((p) => p.geometry).map((p) => `<path d="${toPath(p.geometry.plan)}" class="${p === plot ? "is-sel" : ""}"/>`).join("");
    const mark = plot.geometry ? "" : `<circle cx="${plot.label.plan[0]}" cy="${plot.label.plan[1]}" r="40" class="is-sel"/>`;
    return `<svg class="locator" viewBox="${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}" role="img" aria-label="Poloha parcely ${plot.no} v celkovém plánu">${paths}${mark}</svg>`;
  }
  _mainImage(type) { return this.project.houseVariants.find((v) => v.type === type.id).images[0]; }

  // ---------- TYPOVÉ DOMY ----------
  _houses(st, sel) {
    const P = this.project;
    const free = (t) => plotsForType(P, t.id).filter((p) => this.app.statusOf(p) === "available").length;
    return `
      <header class="pn__head">
        <p class="eyebrow">Typové domy</p>
        <h2 class="pn__title">Vyberte dům</h2>
        <p class="pn__sub">${sel.plot ? `pro parcelu č. ${sel.plot.no} · ${m2(sel.plot.area)}` : "mapa zvýrazní parcely, na které lze dům postavit"}</p>
      </header>
      <div class="houselist">
        ${P.houseTypes.map((t) => {
          const on = st.type === t.id;
          const allowedHere = sel.plot ? typesForPlot(P, sel.plot).find((x) => x.type.id === t.id) : null;
          const variants = P.houseVariants.filter((v) => v.type === t.id);
          const variant = on && sel.variant?.type === t.id ? sel.variant : variants[0];
          return `
          <article class="housecard ${on ? "is-on" : ""}">
            <button type="button" class="housecard__main" data-type="${t.id}" aria-pressed="${on}">
              <span class="housecard__img"><img src="${P.img(variant.images[0], 960)}" alt="${esc(t.name)} – ${esc(variant.name)}" width="960" height="640" loading="lazy" decoding="async"></span>
              <span class="housecard__letter">${t.id}</span>
              <span class="housecard__txt"><span class="housecard__name">${esc(t.name)} · ${esc(t.tagline)}</span>
              <span class="housecard__meta">${t.builtUpArea} m² obestavěná plocha · ${t.layouts.length} ${plural(t.layouts.length, "dispozice", "dispozice", "dispozic")} · ${variants.length} materiálová řešení</span>
              <span class="housecard__fit">${allowedHere ? (allowedHere.allowed ? `✓ lze na parcelu č. ${sel.plot.no}` : `✕ ${esc(allowedHere.reason)}`) : `vhodný pro ${free(t)} volných parcel`}</span></span>
            </button>
            ${on ? `
            <div class="housecard__more">
              <p>${esc(t.character)}</p>
              <div class="swatches" role="radiogroup" aria-label="Materiálové řešení">${variants.map((v) => this._swatch(v, v.id === variant.id)).join("")}</div>
              <div class="pn__actions pn__actions--row">
                <button type="button" class="btn btn--ink" data-action="try" data-type-id="${t.id}">Vyzkoušet na parcele</button>
                <button type="button" class="btn btn--ghost" data-action="detail" data-type-id="${t.id}">Detail domu</button>
              </div>
              <div class="savebar">${saveButtons({ kind: "house", type: t.id }, { what: t.name })}</div>
            </div>` : ""}
          </article>`;
        }).join("")}
      </div>`;
  }

  _swatch(v, on) {
    return `<button type="button" role="radio" class="swatch ${on ? "is-on" : ""}" aria-checked="${on}" data-material="${v.id}" title="${esc(v.name)}">
      <span class="swatch__chips" aria-hidden="true">${v.swatches.map((c) => `<i style="background:${c}"></i>`).join("")}</span><span class="swatch__name">${esc(v.name)}</span></button>`;
  }

  // ---------- MŮJ NÁVRH ----------
  _design(st, sel) {
    const P = this.project, { plot, type, layout, variant } = sel;
    if (!plot) return `
      <header class="pn__head"><p class="eyebrow">Můj návrh</p><h2 class="pn__title">Začněte parcelou</h2>
      <p class="pn__sub">Návrh vždy stojí na konkrétním místě. Vyberte parcelu v mapě nebo ze seznamu.</p></header>
      <button type="button" class="btn btn--ink btn--block" data-action="mode-plots">Vybrat parcelu</button>
      ${type ? `<p class="hint">Vybraný dům: ${esc(type.name)} – mapa zvýrazňuje parcely, kam ho lze umístit.</p>` : ""}`;
    const s = this.app.statusOf(plot);
    if (!canConfigure({ ...plot, status: s })) return `
      <header class="pn__head"><p class="eyebrow">Můj návrh</p><h2 class="pn__title">Parcela č. ${plot.no} není volná</h2></header>
      <p class="pn__msg">Parcela je ${STATUS[s].label}. Vyberte prosím jinou parcelu.</p>
      <button type="button" class="btn btn--ink btn--block" data-action="mode-plots">Zpět na parcely</button>`;
    const types = typesForPlot(P, plot);
    const variants = type ? P.houseVariants.filter((v) => v.type === type.id) : [];
    const sum = priceSummary(P, { plot, type, layout });
    return `
      <header class="pn__head"><p class="eyebrow">Můj návrh</p><h2 class="pn__title">Parcela ${plot.no}${type ? ` + ${esc(type.name)}` : ""}</h2></header>
      <ol class="cfg">
        <li class="cfg__step"><span class="cfg__no">1</span><div class="cfg__body"><h3>Parcela</h3>
          <p class="cfg__val">č. ${plot.no} · ${m2(plot.area)} · ${STATUS[s].label}</p>
          <button type="button" class="link" data-action="mode-plots">Změnit parcelu</button></div></li>
        <li class="cfg__step"><span class="cfg__no">2</span><div class="cfg__body"><h3 id="cfg-type">Typový dům</h3>
          <div class="seg" role="radiogroup" aria-labelledby="cfg-type">${types.map(({ type: t, allowed, reason }) => `
            <button type="button" role="radio" aria-checked="${type?.id === t.id}" class="seg__opt ${type?.id === t.id ? "is-on" : ""}" ${allowed ? `data-type="${t.id}"` : `aria-disabled="true" title="${esc(reason)}"`}>
              <span class="seg__big">${t.id}</span><span class="seg__small">${t.builtUpArea} m²</span></button>`).join("")}</div>
          ${types.some((t) => !t.allowed) ? `<p class="hint">Nedostupné: ${types.filter((t) => !t.allowed).map((t) => `${t.type.id} – ${esc(t.reason)}`).join(" ")}</p>` : ""}</div></li>
        ${type ? `
        <li class="cfg__step"><span class="cfg__no">3</span><div class="cfg__body"><h3 id="cfg-layout">Dispozice</h3>
          <div class="radios" role="radiogroup" aria-labelledby="cfg-layout">${type.layouts.map((l) => `
            <button type="button" role="radio" aria-checked="${layout?.id === l.id}" class="radio ${layout?.id === l.id ? "is-on" : ""}" data-layout="${l.id}">
              <span class="radio__dot" aria-hidden="true"></span><span><b>${esc(l.name)}</b>${l.disposition ? ` · ${l.disposition}` : ""}${(() => { const a = l.builtUpArea !== undefined ? l.builtUpArea : type.builtUpArea; return a ? ` · ${a} m²` : " · plocha neuvedena"; })()}</span></button>`).join("")}</div>
          ${layout?.renderNote ? `<p class="hint">${esc(layout.renderNote)}</p>` : ""}</div></li>
        <li class="cfg__step"><span class="cfg__no">4</span><div class="cfg__body"><h3 id="cfg-mat">Materiálové řešení</h3>
          <div class="swatches" role="radiogroup" aria-labelledby="cfg-mat">${variants.map((v) => this._swatch(v, v.id === variant?.id)).join("")}</div>
          <p class="hint">Podle vizualizací v katalogu architektů.</p></div></li>` : ""}
      </ol>
      ${type ? `
      <section class="price" aria-label="Orientační souhrn">
        <h3 class="pn__h3">Orientační souhrn</h3>
        <dl>${sum.lines.map((l) => `<div><dt>${esc(l.label)}</dt><dd>${l.value != null ? formatPrice(l.value) : `<span class="muted">${esc(l.missing)}</span>`}</dd></div>`).join("")}
        <div class="price__total"><dt>Celkem</dt><dd>${sum.total != null ? formatPrice(sum.total) : `<span class="muted">bude doplněno</span>`}</dd></div></dl>
        <p class="hint">${esc(sum.note)}</p>
      </section>
      <div class="pn__actions">
        <button type="button" class="btn btn--red btn--block" data-action="enquire">Poptat tuto kombinaci <span aria-hidden="true">→</span></button>
        <button type="button" class="btn btn--ghost btn--block" data-action="enquire-plot">Poptat cenu jen pozemku č. ${plot.no}</button>
        <p class="hint pn__plotonly">Dům je volitelný – parcelu můžete koupit i bez typového domu.</p>
        <button type="button" class="btn btn--ghost btn--block" data-action="detail" data-type-id="${type.id}">Detail domu ${type.id}</button>
      </div>
      <div class="savebar">${saveButtons({ kind: "combo", plot: plot.no, type: type.id, layout: layout?.id, material: variant?.id }, { what: `parcela ${plot.no} + ${type.name}` })}</div>` : `<p class="hint">Zvolte typový dům – na parcele se vám zobrazí jeho hmota a vizualizace.</p>`}`;
  }

  // ---------- events ----------
  _click(e) {
    const a = this.app;
    const t = e.target.closest("[data-select],[data-filter],[data-action],[data-try],[data-type],[data-layout],[data-material]");
    if (!t || t.getAttribute("aria-disabled") === "true") return;
    if (t.dataset.select) return a.selectPlot(Number(t.dataset.select), "list");
    if (t.dataset.filter) {
      const f = a.store.get().filters, g = t.dataset.filter, v = t.dataset.value;
      const next = g === "status" ? v : f[g] === v ? null : v;
      return a.store.set({ filters: { ...f, [g]: next } });
    }
    if (t.dataset.try) return a.tryType(t.dataset.try);
    if (t.dataset.type) return a.setType(t.dataset.type);
    if (t.dataset.layout) return a.setLayout(t.dataset.layout);
    if (t.dataset.material) return a.setMaterial(t.dataset.material);
    const act = t.dataset.action;
    if (act === "reset-filters") a.store.set({ filters: { status: "all", area: null, type: null, price: null } });
    else if (act === "clear-plot") a.clearPlot();
    else if (act === "design") a.setMode("design");
    else if (act === "mode-plots") a.setMode("plots");
    else if (act === "enquire") a.goEnquiry();
    else if (act === "enquire-plot") a.goEnquiry({ plotOnly: true });
    else if (act === "detail") a.openDetail(t.dataset.typeId);
    else if (act === "try") a.tryType(t.dataset.typeId);
    else if (act === "pano-plot") a.openPanoForPlot(a.selection().plot);
    else if (act === "terrain") lightbox([[t.dataset.sheet, t.dataset.cap]]).open(0);
    else if (act === "filter-free") { a.clearPlot(); a.store.set({ filters: { status: "available", area: null, type: null, price: null } }); }
  }
  _change() {}
}
