// Enquiry form – prefilled from the configuration. No backend is configured: submission is a clearly
// labelled demo state; nothing is sent anywhere.
import { priceSummary, formatPrice } from "../core/pricing.js";
import { esc, m2 } from "./format.js";

export function validate(values) {
  const err = {};
  if (!values.name || values.name.trim().length < 2) err.name = "Vyplňte prosím jméno a příjmení.";
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) err.email = "Zadejte platný e-mail, např. jana@novakova.cz.";
  if (values.phone && !/^\+?[\d\s()-]{9,}$/.test(values.phone.trim())) err.phone = "Telefon zadejte ve tvaru +420 777 123 456.";
  if (!values.consent) err.consent = "Pro odeslání potřebujeme váš souhlas se zpracováním údajů.";
  return err;
}

export class Enquiry {
  constructor(form, summary, app) {
    this.form = form; this.summary = summary; this.app = app;
    form.innerHTML = `
      <div class="field"><label for="f-name">Jméno a příjmení <span aria-hidden="true">*</span></label><input id="f-name" name="name" autocomplete="name" required aria-describedby="e-name"><p class="field__err" id="e-name"></p></div>
      <div class="field-row">
        <div class="field"><label for="f-email">E-mail <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><p class="field__err" id="e-email"></p></div>
        <div class="field"><label for="f-phone">Telefon</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" aria-describedby="e-phone"><p class="field__err" id="e-phone"></p></div>
      </div>
      <div class="field"><label for="f-msg">Zpráva</label><textarea id="f-msg" name="message" rows="5"></textarea></div>
      <label class="check"><input type="checkbox" name="consent" aria-describedby="e-consent"><span>Souhlasím se zpracováním osobních údajů pro účely odpovědi na poptávku.</span></label>
      <p class="field__err" id="e-consent"></p>
      <button class="btn btn--red btn--lg btn--block" type="submit" data-submit>Odeslat poptávku</button>
      <p class="form__demo">Prototyp: formulář zatím není napojený na server – odeslání je pouze ukázkové.</p>
      <div class="form__done" data-done hidden tabindex="-1"></div>`;
    form.addEventListener("submit", (e) => { e.preventDefault(); this.submit(); });
    form.addEventListener("input", (e) => { if (e.target.name === "message") this.touched = true; this._clearErr(e.target.name); });
    form.addEventListener("change", (e) => this._clearErr(e.target.name));
  }

  /** a crop of the aerial view / site plan centred on the plot, with its outline */
  crop(plot, key, label) {
    const P = this.app.project, view = P.views.find((v) => v.id === key);
    const pts = plot.geometry ? plot.geometry[key] : [plot.label[key]];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 60) * 2.6;
    const w = span, h = span * 0.75, src = view.sources[Math.min(2, view.sources.length - 1)][1];
    const shape = plot.geometry ? `<polygon points="${pts.map((p) => p.join(",")).join(" ")}"/>` : `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="40"/>`;
    return `<figure class="ecard__crop"><svg viewBox="${(cx - w / 2).toFixed(0)} ${(cy - h / 2).toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="${label} – parcela č. ${plot.no}">
      <image href="${src}" x="0" y="0" width="${view.size[0]}" height="${view.size[1]}" preserveAspectRatio="none"/>${shape}</svg><figcaption>${label}</figcaption></figure>`;
  }

  /** text describing the current configuration */
  /** the enquiry may be for the plot alone even while a house is configured ("Poptat jen pozemek") */
  // only plots are for sale – the house shown on the plot is inspiration and never part of the enquiry
  sel() { const s = this.app.selection(); return { plot: s.plot, type: null, layout: null, variant: null }; }

  configText() {
    const { plot, type, layout, variant } = this.sel();
    const parts = [];
    if (plot) parts.push(`parcela č. ${plot.no} (${plot.area} m²)`);
    if (type) parts.push(`${type.name}${layout ? ` – ${layout.name}${layout.disposition ? ` ${layout.disposition}` : ""}` : ""}`);
    if (variant && type) parts.push(`materiál: ${variant.name}`);
    return parts.join(", ");
  }

  update() {
    const P = this.app.project, sel = this.sel();
    const sum = priceSummary(P, sel);
    const cfg = this.configText();
    this.summary.innerHTML = cfg ? `
      <div class="ecard ecard--plot">
        <div class="ecard__crops">${this.crop(sel.plot, "aerial", "Letecký pohled")}${this.crop(sel.plot, "plan", "Situační plán")}</div>
        <div class="ecard__body">
          <p class="eyebrow">Vybraná parcela</p>
          <p class="ecard__title">Parcela č. ${sel.plot.no}</p>
          <dl class="ecard__facts">
            <div><dt>Výměra</dt><dd>${m2(sel.plot.area)}</dd></div>
            <div><dt>Cena</dt><dd>${sel.plot.price != null ? formatPrice(sel.plot.price) : esc(P.pricing.plotPriceNote)}</dd></div>
          </dl>
          <button type="button" class="link" data-edit-config>Upravit výběr</button>
        </div>
      </div>` : `<p class="muted">Zatím nemáte vybranou parcelu – poptávku můžete poslat i obecně, nebo si nejdřív <button type="button" class="link" data-edit-config>vyberte parcelu</button>.</p>`;
    this.summary.querySelector("[data-edit-config]")?.addEventListener("click", () => this.app.scrollToExplorer());
    const msg = this.form.elements.message;
    if (!this.touched) msg.value = !cfg ? "" : `Dobrý den, mám zájem o pozemek: ${cfg}${sel.plot.price ? `, cena ${sel.plot.price.toLocaleString("cs-CZ")} Kč` : ""}. Prosím o informace o dostupnosti a dalším postupu.`;
    const btn = this.form.querySelector("[data-submit]");
    btn.textContent = sel.plot ? `Mám zájem o parcelu č. ${sel.plot.no}` : "Odeslat poptávku";
  }

  submit() {
    const f = this.form;
    const values = { name: f.elements.name.value, email: f.elements.email.value, phone: f.elements.phone.value, message: f.elements.message.value, consent: f.elements.consent.checked };
    const err = validate(values);
    for (const k of ["name", "email", "phone", "consent"]) {
      const input = f.elements[k]; const p = f.querySelector(`#e-${k}`);
      p.textContent = err[k] || ""; input.setAttribute("aria-invalid", err[k] ? "true" : "false");
    }
    const first = Object.keys(err)[0];
    if (first) { f.elements[first].focus(); return; }
    const done = f.querySelector("[data-done]");
    done.hidden = false;
    done.innerHTML = `<p class="form__done-title">Děkujeme, ${esc(values.name.split(" ")[0])}.</p>
      <p><b>Ukázkový režim:</b> poptávka nebyla nikam odeslána – formulář zatím není napojený na server ani e-mail. Takto by vypadala zpráva:</p>
      <blockquote>${esc(values.message || "(bez zprávy)")}<br><small>${esc(values.email)}${values.phone ? ` · ${esc(values.phone)}` : ""}</small></blockquote>
      <button type="button" class="link" data-again>Upravit poptávku</button>`;
    f.classList.add("is-done");
    done.querySelector("[data-again]").addEventListener("click", () => { f.classList.remove("is-done"); done.hidden = true; f.elements.name.focus(); });
    done.focus();
  }
  _clearErr(name) { const p = this.form.querySelector(`#e-${name}`); if (p && p.textContent) { p.textContent = ""; this.form.elements[name]?.setAttribute("aria-invalid", "false"); } }
}
