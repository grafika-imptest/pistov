// Printable plot sheet ("Exportovat do PDF"): one A4 page with the plot, its price, the schedule, payment terms
// and the sales contacts. The browser's print dialog saves it as PDF.
import { renderChrome } from "../site/chrome.js";
import { project as P } from "../projects/pistov/project.js";
import { site, financing } from "../projects/pistov/content.js";
import { esc } from "../site/ui.js";
import { m2, STATUS } from "../ui/format.js";
import { plotDims } from "../ui/panel.js";
import { scheduleItems } from "../site/people.js";
import { LOGO } from "../site/logo.js";

renderChrome({ page: "nabidka", solid: true });
const no = new URLSearchParams(location.search).get("parcela");
const plot = P.plots.find((p) => String(p.no) === no) || P.plots[0];
const kc = (v) => `${v.toLocaleString("cs-CZ")} Kč`;
document.title = `Parcela č. ${plot.no} — Pístov`;

/** the plot outlined in a crop of the aerial view or the site plan */
function crop(key, label) {
  const view = P.views.find((v) => v.id === key), pts = plot.geometry ? plot.geometry[key] : [plot.label[key]];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 60) * 3, w = span, h = span * 0.75;
  const src = view.sources[Math.min(2, view.sources.length - 1)][1];
  const shape = plot.geometry ? `<polygon points="${pts.map((p) => p.join(",")).join(" ")}"/>` : `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="40"/>`;
  return `<figure class="sheet__crop"><svg viewBox="${(cx - w / 2).toFixed(0)} ${(cy - h / 2).toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="${label} – parcela č. ${plot.no}">
    <image href="${src}" x="0" y="0" width="${view.size[0]}" height="${view.size[1]}" preserveAspectRatio="none"/>${shape}</svg><figcaption>${label}</figcaption></figure>`;
}

const s = STATUS[plot.status], dims = plotDims(P, plot);
document.querySelector("[data-print]").innerHTML = `
  <div class="sheet-tools">
    <p>Tisková verze parcely č. ${plot.no}. V dialogu tisku zvolte <b>Uložit jako PDF</b>.</p>
    <button type="button" class="btn btn--red" data-print-now>Exportovat do PDF <span aria-hidden="true">↓</span></button>
    <a class="link" href="index.html?parcela=${plot.no}">← Zpět na parcelu</a>
  </div>
  <article class="sheet">
    <header class="sheet__head">
      <span class="sheet__logo">${LOGO}</span>
      <img class="sheet__partner" src="${site.seller.logo.darkTrim}" alt="${esc(site.seller.brand)}" width="636" height="267">
    </header>
    <div class="sheet__title">
      <p class="eyebrow">Stavební parcela · Pístov u Jihlavy</p>
      <h1>Parcela č. ${plot.no}</h1>
      <p class="sheet__status sheet__status--${plot.status}"><i class="sw sw--${plot.status}" aria-hidden="true"></i>${s.long}</p>
    </div>
    <dl class="sheet__facts">
      <div><dt>Výměra</dt><dd>${m2(plot.area)}</dd></div>
      <div><dt>Cena pozemku</dt><dd>${kc(plot.price)}</dd><small>${P.pricing.perM2.toLocaleString("cs-CZ")} Kč/m² vč. DPH</small></div>
      <div><dt>Šířka × délka</dt><dd>${dims ? `cca ${dims} m` : "—"}</dd><small>orientačně ze situačního plánu</small></div>
      <div><dt>Rezervační poplatek</dt><dd>${kc(financing.reservationFee)}</dd><small>doplatek po kolaudaci</small></div>
    </dl>
    <div class="sheet__crops">${crop("aerial", "Letecký pohled")}${crop("plan", "Situační plán")}</div>
    <section class="sheet__block"><h2>Harmonogram</h2><ol class="plan plan--print">${scheduleItems()}</ol></section>
    <section class="sheet__block sheet__people"><h2>Kontakt – prodej parcel</h2>
      ${site.contacts.map((p) => `<p><b>${esc(p.name)}</b> · ${esc(p.role)}<br>${esc(p.phone)} · ${esc(p.email)}</p>`).join("")}
      <p class="muted">${esc(site.seller.brand)}, ${esc(site.seller.address)} · developer ${esc(site.developer.name)}</p>
    </section>
    <footer class="sheet__foot">Vytištěno ${new Date().toLocaleDateString("cs-CZ")} z webu projektu Pístov. Výměra a umístění jsou orientační podle situačního plánu; konečná výměra a cena se určí podle zápisu v katastru. Ceny vč. DPH.</footer>
  </article>`;

document.querySelector("[data-print-now]").addEventListener("click", () => print());
// open the print dialog by itself once the images are in (the button stays for a second try)
const srcs = [...document.querySelectorAll(".sheet img")].map((i) => i.src).concat([...document.querySelectorAll(".sheet image")].map((i) => i.getAttribute("href")));
Promise.all(srcs.map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = u; }))).then(() => setTimeout(() => print(), 500));
