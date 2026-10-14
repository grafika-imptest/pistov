import { renderChrome } from "../site/chrome.js";
import { site } from "../projects/pistov/content.js";

renderChrome({ page: "legal", solid: true });

// Structure of the privacy notice. The legal text itself must be supplied / approved by the controller –
// nothing here is presented as the final wording.
document.querySelector("[data-legal]").innerHTML = `
  <p class="notice">Znění zásad zpracování osobních údajů doplní a schválí správce (developer projektu). Níže je přehled toho, jak web funguje dnes.</p>
  <nav class="legal__toc" aria-label="Obsah"><ol><li><a href="#spravce">Správce údajů</a></li><li><a href="#formular">Kontaktní formulář</a></li><li><a href="#prohlizec">Údaje ve vašem prohlížeči</a></li><li><a href="#cookies">Cookies</a></li><li><a href="#prava">Vaše práva</a></li></ol></nav>
  <h2 id="spravce" class="h3">1. Správce údajů</h2>
  <p>Správcem osobních údajů bude developer projektu <b>${site.developer.name}</b>, IČO ${site.developer.ico}, ${site.developer.address}, zapsaná v obchodním rejstříku vedeném u ${site.developer.register.replace("Krajský soud v Brně", "Krajského soudu v Brně")}. Dotazy k osobním údajům můžete posílat na <a class="link" href="mailto:${site.developer.email}">${site.developer.email}</a>.</p>
  <h2 id="formular" class="h3">2. Kontaktní a poptávkový formulář</h2>
  <p>Formuláře na webu zatím nejsou napojené na server ani e-mail – vyplněné údaje se nikam neodesílají a neukládají. Po napojení budou sloužit jen k odpovědi na váš dotaz nebo poptávku; účel, dobu uložení a příjemce doplní správce.</p>
  <h2 id="prohlizec" class="h3">3. Údaje uložené ve vašem prohlížeči</h2>
  <p>Oblíbené položky, porovnání a vaše volba cookies se ukládají pouze v úložišti vašeho prohlížeče (localStorage). Nikam se neodesílají a smažete je vymazáním dat webu v prohlížeči.</p>
  <h2 id="cookies" class="h3">4. Cookies</h2>
  <table class="legal__table">
    <thead><tr><th scope="col">Kategorie</th><th scope="col">K čemu slouží</th><th scope="col">Stav na webu</th></tr></thead>
    <tbody>
      <tr><td>Nezbytné</td><td>Uložení vaší volby cookies, oblíbených a porovnání</td><td>Aktivní vždy</td></tr>
      <tr><td>Analytické</td><td>Anonymní měření návštěvnosti</td><td>Zatím se nepoužívají – jen s vaším souhlasem</td></tr>
      <tr><td>Marketingové</td><td>Relevantní reklama</td><td>Zatím se nepoužívají – jen s vaším souhlasem</td></tr>
    </tbody>
  </table>
  <p><button type="button" class="btn btn--ink btn--sm" data-cookie-settings>Změnit nastavení cookies</button></p>
  <p>Mapa na stránce Kontakty se načítá z OpenStreetMap; při jejím zobrazení se váš prohlížeč připojí k serverům OpenStreetMap.</p>
  <h2 id="prava" class="h3">5. Vaše práva</h2>
  <p>Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, omezení zpracování, přenositelnost, právo vznést námitku a podat stížnost u Úřadu pro ochranu osobních údajů (uoou.gov.cz).</p>`;
