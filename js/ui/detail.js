// House detail – full-screen dialog bound to the current plot + configuration (URL ?detail=A).
import { typesForPlot } from "../core/compat.js";
import { priceSummary, formatPrice } from "../core/pricing.js";
import { esc, m2 } from "./format.js";

export class Detail {
  constructor(dialog, app) {
    this.d = dialog; this.app = app; this.tab = "plans";
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target.closest("[data-detail-close]")) return app.closeDetail();
      const m = e.target.closest("[data-d-material]"); if (m) return app.setMaterial(m.dataset.dMaterial, { keepVis: true });
      const l = e.target.closest("[data-d-layout]"); if (l) return app.setLayout(l.dataset.dLayout);
      const t = e.target.closest("[data-d-tab]"); if (t) { this.tab = t.dataset.dTab; return this.render(); }
      const g = e.target.closest("[data-d-shot]"); if (g) { this.shot = g.dataset.dShot; return this.render(); }
      const a = e.target.closest("[data-d-action]");
      if (a?.dataset.dAction === "enquire") { app.closeDetail(); app.goEnquiry(); }
      if (a?.dataset.dAction === "onplot") { app.closeDetail(); app.setMode("design"); app.setVis("house"); app.scrollToExplorer(); }
      if (a?.dataset.dAction === "pickplot") { app.closeDetail(); app.tryType(this.typeId); }
    });
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); app.closeDetail(); });
  }

  open(typeId) {
    this.typeId = typeId; this.shot = null;
    this.render();
    if (!this.d.open) { this.lastFocus = document.activeElement; this.d.showModal(); document.documentElement.classList.add("has-dialog"); }
    this.d.querySelector("[data-detail-close]")?.focus();
  }
  close() {
    if (!this.d.open) return;
    this.d.close(); document.documentElement.classList.remove("has-dialog");
    this.lastFocus?.focus?.({ preventScroll: true });
  }

  render() {
    const P = this.app.project;
    const type = P.houseTypes.find((t) => t.id === this.typeId); if (!type) return;
    const sel = this.app.selection();
    const layout = sel.type?.id === type.id && sel.layout ? sel.layout : type.layouts[0];
    const variants = P.houseVariants.filter((v) => v.type === type.id);
    const variant = sel.type?.id === type.id && sel.variant ? sel.variant : variants[0];
    const shot = variant.images.includes(this.shot) ? this.shot : variant.images[0];
    const plot = sel.plot;
    const fit = plot ? typesForPlot(P, plot).find((t) => t.type.id === type.id) : null;
    const area = layout.builtUpArea !== undefined ? layout.builtUpArea : type.builtUpArea;
    const tabs = [["plans", "Půdorysy"], ["site", "Situace"], ...(type.sheets.elevations ? [["elev", "Pohledy"]] : [])];
    const sheet = this.tab === "site" ? [layout.site || type.sheets.site] : this.tab === "elev" ? type.sheets.elevations : [layout.sheet];
    this.d.innerHTML = `
      <div class="detail__inner">
        <header class="detail__bar">
          <p class="detail__crumb"><span class="eyebrow">Typový dům</span> ${plot ? `<span class="detail__plot">na parcele č. ${plot.no} · ${m2(plot.area)}</span>` : ""}</p>
          <button type="button" class="btn btn--ghost btn--sm" data-detail-close>Zpět <span class="sr-only">do výběru</span><span aria-hidden="true">✕</span></button>
        </header>
        <div class="detail__grid">
          <div class="detail__visual">
            <figure class="detail__hero"><img src="${P.img(shot, 1600)}" srcset="${P.imgSet(shot, [960, 1600])}" sizes="(min-width: 1100px) 60vw, 100vw" width="1600" height="1067" alt="${esc(type.name)} – vizualizace, ${esc(variant.name)}" decoding="async">
              <figcaption class="note">vizualizace · TAM architekti</figcaption></figure>
            ${variant.images.length > 1 ? `<div class="detail__shots">${variant.images.map((s) => `<button type="button" class="${s === shot ? "is-on" : ""}" data-d-shot="${s}" aria-pressed="${s === shot}"><img src="${P.img(s, 480)}" alt="${s.includes("street") ? "Pohled z ulice" : "Pohled ze zahrady"}" width="480" height="320" loading="lazy"></button>`).join("")}</div>` : ""}
            <div class="detail__tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${this.tab === id}" data-d-tab="${id}">${label}</button>`).join("")}</div>
            <div class="detail__sheets">${sheet.map((s) => `<a href="${P.img(s, s.includes("elev") ? 1000 : 2000)}" target="_blank" rel="noopener" class="sheet"><img src="${P.img(s, s.includes("elev") ? 500 : 1100)}" alt="${esc(type.name)} – výkres ${esc(this.tab === "plans" ? layout.name : this.tab === "site" ? "situace" : "pohled")}" loading="lazy" decoding="async"><span class="sheet__zoom">Otevřít ve vysokém rozlišení ↗</span></a>`).join("")}</div>
          </div>
          <div class="detail__info">
            <p class="detail__letter" aria-hidden="true">${type.id}</p>
            <h2 class="detail__title" id="detail-title">${esc(type.name)} <span>${esc(type.tagline)}</span></h2>
            <p class="detail__text">${esc(type.character)}</p>
            <dl class="cat__specs">
              <div><dt>Obestavěná plocha</dt><dd>${area ? `${area} m²` : "neuvedeno"}</dd></div>
              <div><dt>Délka domu</dt><dd>${String(layout.length ?? type.length).replace(".", ",")} m</dd></div>
              <div><dt>Dispozice</dt><dd>${layout.disposition || "dle výkresu"}</dd></div>
              <div><dt>Střecha</dt><dd>${esc(type.roof)}</dd></div>
            </dl>
            <h3 class="pn__h3">Dispoziční varianta</h3>
            <div class="radios">${type.layouts.map((l) => `<button type="button" role="radio" aria-checked="${l.id === layout.id}" class="radio ${l.id === layout.id ? "is-on" : ""}" data-d-layout="${l.id}" ${sel.type?.id !== type.id ? "disabled" : ""}><span class="radio__dot" aria-hidden="true"></span><span><b>${esc(l.name)}</b>${l.disposition ? ` · ${l.disposition}` : ""}</span></button>`).join("")}</div>
            ${sel.type?.id !== type.id ? `<p class="hint">Dispozici a materiál zvolíte po výběru domu na parcele.</p>` : ""}
            <ul class="rooms">${layout.rooms.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
            ${layout.renderNote ? `<p class="hint">${esc(layout.renderNote)}</p>` : ""}
            <h3 class="pn__h3">Materiálové řešení</h3>
            <div class="swatches">${variants.map((v) => `<button type="button" class="swatch ${v.id === variant.id ? "is-on" : ""}" aria-pressed="${v.id === variant.id}" data-d-material="${v.id}" ${sel.type?.id !== type.id ? "disabled" : ""}><span class="swatch__chips" aria-hidden="true">${v.swatches.map((c) => `<i style="background:${c}"></i>`).join("")}</span><span class="swatch__name">${esc(v.name)}</span></button>`).join("")}</div>
            <h3 class="pn__h3">Parkování a pozemek</h3>
            <p class="detail__small">${esc(type.parking)}${type.suitability ? `. ${esc(type.suitability)}` : ""}</p>
            <ul class="rules">${P.siteRules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
            <p class="hint detail__note">Prodáváme pouze pozemky. Typové domy jsou inspirace – ukázka, jak může dům na parcele vypadat; dům u nás objednat nelze.</p>
            <div class="pn__actions">
              ${plot && fit?.allowed ? `<button type="button" class="btn btn--red btn--block" data-d-action="enquire">Mám zájem o parcelu č. ${plot.no} <span aria-hidden="true">→</span></button>
                <button type="button" class="btn btn--ghost btn--block" data-d-action="onplot">Zobrazit dům na parcele č. ${plot.no}</button>`
              : `<button type="button" class="btn btn--ink btn--block" data-d-action="pickplot">Vybrat parcelu pro dům ${type.id}</button>
                ${plot && fit && !fit.allowed ? `<p class="hint">Na parcelu č. ${plot.no} tento typ umístit nelze: ${esc(fit.reason)}</p>` : ""}`}
            </div>
          </div>
        </div>
      </div>`;
  }
}
