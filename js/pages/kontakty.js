import { renderChrome } from "../site/chrome.js";
import { site } from "../projects/pistov/content.js";
import { validate } from "../ui/enquiry.js";
import { esc } from "../site/ui.js";
import { mountLocationMap } from "../site/map.js";

renderChrome({ page: "kontakty", solid: true });
const { lat, lon } = site.location;
const card = (title, c, extra = "") => `<div class="contact"><p class="eyebrow">${title}</p>${c.logo ? `<img class="contact__logo" src="${c.logo}" alt="${esc(c.brand)}" width="900" height="529">` : ""}<p class="contact__name">${esc(c.brand || c.name)}</p><p>${esc(c.address)}</p><p class="muted">${esc(c.role)}</p>${extra}</div>`;
const dev = site.developer, tel = (p) => `<a href="tel:${p.replace(/s/g, "")}">${p}</a>`;

document.querySelector("[data-contacts]").innerHTML = `
  <div class="wrap contacts">
    <div class="contacts__cards">
      ${card("Developer a prodej", { ...dev, logo: "assets/img/hv-logo-dark.png" }, `
        <p class="contact__lines">${tel(dev.phone)}<br><a href="mailto:${dev.email}">${dev.email}</a><br><a href="${dev.web}" target="_blank" rel="noopener">hvreality.cz</a></p>
        <p class="muted contact__small">${esc(dev.name)} · IČO ${dev.ico} · ${esc(site.salesContact.note)}</p>
        <p class="contact__actions"><a class="btn btn--red btn--sm" href="#formular">Napsat poptávku</a> <a class="link" href="developer.html">O developerovi</a></p>`)}
    </div>
    <figure class="contacts__map">
      <div class="contacts__mapcanvas" data-map role="region" aria-label="Mapa – ${esc(site.location.label)}"></div>
      <figcaption>${esc(site.location.label)} · hranice parcel orientačně podle situačního plánu · <a class="link" href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}" target="_blank" rel="noopener">Otevřít větší mapu</a></figcaption>
    </figure>
  </div>
  <div class="wrap contacts__form" id="formular">
    <div><p class="eyebrow">Poptávka</p><h2 class="h2">Napište <em>nám</em></h2><p class="lead">Konkrétní parcelu a dům si můžete vybrat v <a class="link" href="index.html#explorer">interaktivní lokalitě</a> – volbu pak doplníme do poptávky za vás.</p></div>
    <form class="form" novalidate data-contact-form>
      <div class="field"><label for="k-name">Jméno a příjmení <span aria-hidden="true">*</span></label><input id="k-name" name="name" autocomplete="name" required aria-describedby="e-name"><p class="field__err" id="e-name"></p></div>
      <div class="field-row">
        <div class="field"><label for="k-email">E-mail <span aria-hidden="true">*</span></label><input id="k-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><p class="field__err" id="e-email"></p></div>
        <div class="field"><label for="k-phone">Telefon</label><input id="k-phone" name="phone" type="tel" autocomplete="tel" aria-describedby="e-phone"><p class="field__err" id="e-phone"></p></div>
      </div>
      <div class="field"><label for="k-msg">Zpráva</label><textarea id="k-msg" name="message" rows="5"></textarea></div>
      <label class="check"><input type="checkbox" name="consent" aria-describedby="e-consent"><span>Souhlasím se <a class="link" href="ochrana-osobnich-udaju.html">zpracováním osobních údajů</a> pro účely odpovědi.</span></label>
      <p class="field__err" id="e-consent"></p>
      <button class="btn btn--red btn--lg btn--block" type="submit">Odeslat</button>
      <p class="form__demo">Prototyp: formulář zatím není napojený na server – odeslání je pouze ukázkové.</p>
      <div class="form__done" data-done hidden tabindex="-1"></div>
    </form>
  </div>`;

// map: OpenStreetMap + Leaflet, red pin with the Pístov mark, plots outlined from the site plan
mountLocationMap(document.querySelector("[data-map]"));

const f = document.querySelector("[data-contact-form]");
f.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = { name: f.elements.name.value, email: f.elements.email.value, phone: f.elements.phone.value, message: f.elements.message.value, consent: f.elements.consent.checked };
  const err = validate(v);
  for (const k of ["name", "email", "phone", "consent"]) { f.querySelector(`#e-${k}`).textContent = err[k] || ""; f.elements[k].setAttribute("aria-invalid", err[k] ? "true" : "false"); }
  const first = Object.keys(err)[0]; if (first) { f.elements[first].focus(); return; }
  const done = f.querySelector("[data-done]"); done.hidden = false; f.classList.add("is-done");
  done.innerHTML = `<p class="form__done-title">Děkujeme, ${esc(v.name.split(" ")[0])}.</p><p><b>Ukázkový režim:</b> zpráva nebyla nikam odeslána – formulář zatím není napojený na server ani e-mail.</p>`;
  done.focus();
});
