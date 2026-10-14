// Shared site chrome for every page: header (nav, favourites/compare counters, menu), footer, cookie consent.
import { site } from "../projects/pistov/content.js";
import { collections } from "./collections.js";

export const NAV = [
  { href: "index.html#explorer", label: "Lokalita", id: "lokalita" },
  { href: "index.html#domy", label: "Typové domy", id: "domy" },
  { href: "galerie.html", label: "Galerie", id: "galerie" },
  { href: "aktuality.html", label: "Aktuality", id: "aktuality" },
  { href: "financovani.html", label: "Financování", id: "financovani" },
  { href: "developer.html", label: "Developer", id: "developer" },
  { href: "kontakty.html", label: "Kontakt", id: "kontakty" },
];
export const MENU = [
  { title: "Projekt", items: [["index.html#explorer", "Interaktivní lokalita"], ["index.html?pohled=pano", "Panorama 360°"], ["index.html#domy", "Typové domy"], ["index.html#projekt", "O projektu"], ["index.html#lokalita", "Lokalita"], ["galerie.html", "Galerie"], ["developer.html", "Developer"]] },
  { title: "Nákup", items: [["financovani.html", "Financování"], ["faq.html", "Časté otázky"], ["aktuality.html", "Aktuality"], ["kontakty.html", "Kontakty"]] },
  { title: "Nástroje", items: [["oblibene.html", "Oblíbené"], ["porovnani.html", "Porovnání"], ["index.html?rezim=navrh", "Můj návrh"]] },
];
const icon = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.1 2.3h2.6C14 6.1 15.4 5 17.4 5c3.4 0 5.3 3.4 3.8 6.4C19 15.6 12 20 12 20Z"/></svg>',
  compare: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

// on the home page, in-page links must stay same-document (no reload of the explorer)
let home = false;
const link = (h) => (home && h.startsWith("index.html#") ? h.slice(10) : h);

export function renderChrome({ page = "", solid = false } = {}) {
  home = !page;
  const header = document.querySelector("[data-topbar]");
  if (header) {
    header.classList.toggle("is-solid", solid);
    if (solid) header.dataset.alwaysSolid = "";
    header.innerHTML = `
      <a class="brand" href="${home ? "#explorer" : "index.html"}" aria-label="${site.name} – úvod"><span class="brand__mark" aria-hidden="true"></span><span class="brand__name">${site.name}</span></a>
      <nav class="topnav" aria-label="Hlavní navigace">${NAV.map((n) => `<a href="${link(n.href)}" ${n.id === page ? 'aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
      <div class="topbar__tools">
        <a class="toolbtn" href="oblibene.html" aria-label="Oblíbené" title="Oblíbené">${icon.heart}<span class="toolbtn__count" data-count="fav" hidden></span></a>
        <a class="toolbtn" href="porovnani.html" aria-label="Porovnání" title="Porovnání">${icon.compare}<span class="toolbtn__count" data-count="cmp" hidden></span></a>
        <a class="btn btn--ink btn--sm topbar__cta" href="${page ? "kontakty.html#formular" : "#poptavka"}" data-cta-global>Poptat</a>
        <button class="toolbtn toolbtn--menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="sitemenu" data-menu-open>${icon.menu}</button>
      </div>`;
  }
  // full-screen menu
  if (!document.getElementById("sitemenu")) {
    const m = document.createElement("div");
    m.className = "sitemenu"; m.id = "sitemenu"; m.hidden = true; m.setAttribute("role", "dialog"); m.setAttribute("aria-label", "Menu");
    m.innerHTML = `
      <div class="sitemenu__inner">
        <button class="toolbtn sitemenu__close" type="button" aria-label="Zavřít menu" data-menu-close>${icon.close}</button>
        <div class="sitemenu__cols">${MENU.map((c) => `<div><p class="eyebrow">${c.title}</p><ul>${c.items.map(([h, l]) => `<li><a href="${link(h)}">${l}</a></li>`).join("")}</ul></div>`).join("")}</div>
        <a class="btn btn--red btn--lg" href="${home ? "#poptavka" : "kontakty.html#formular"}">Poptat parcelu a dům <span aria-hidden="true">→</span></a>
      </div>`;
    document.body.append(m);
    const open = (on) => {
      m.hidden = !on; document.documentElement.classList.toggle("has-menu", on);
      document.querySelector("[data-menu-open]")?.setAttribute("aria-expanded", String(on));
      if (on) m.querySelector("a")?.focus(); else document.querySelector("[data-menu-open]")?.focus();
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-menu-open]")) open(true);
      else if (e.target.closest("[data-menu-close]") || (e.target.closest("#sitemenu a"))) open(false);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) open(false); });
  }
  // logo on a subpage = open the site again from the start, including the intro film
  if (!home) header?.querySelector(".brand")?.addEventListener("click", () => { try { sessionStorage.removeItem("pistov:intro-seen"); } catch { /* private mode */ } });
  renderFooter();
  updateCounts();
  collections.subscribe(updateCounts);
  cookies.init();
}

function updateCounts() {
  for (const el of document.querySelectorAll("[data-count]")) {
    const n = collections.list(el.dataset.count).length;
    el.textContent = n; el.hidden = !n;
    el.closest("a")?.setAttribute("aria-label", `${el.dataset.count === "fav" ? "Oblíbené" : "Porovnání"}${n ? ` (${n})` : ""}`);
  }
}

function renderFooter() {
  const f = document.querySelector("[data-site-footer]"); if (!f) return;
  f.className = "footer";
  f.innerHTML = `
    <div class="wrap footer__top">
      <div class="footer__brand">
        <p class="brand brand--footer"><span class="brand__mark" aria-hidden="true"></span><span class="brand__name">${site.name}</span></p>
        <p class="footer__claim">${site.claim} u Jihlavy. Vyberte si parcelu, typový dům a podívejte se, jak by vaše bydlení mohlo vypadat.</p>
        <a class="btn btn--paper btn--sm" href="${link("index.html#explorer")}">Prozkoumat lokalitu <span aria-hidden="true">→</span></a>
      </div>
      ${MENU.map((c) => `<nav class="footer__col" aria-label="${c.title}"><p class="eyebrow">${c.title}</p><ul>${c.items.map(([h, l]) => `<li><a href="${link(h)}">${l}</a></li>`).join("")}</ul></nav>`).join("")}
      <div class="footer__col">
        <p class="eyebrow">Kontakt</p>
        <p class="footer__small"><span class="muted">${site.developer.role}</span><br><b>${site.developer.brand}</b><br>${site.developer.address}</p>
        <p class="footer__small"><a href="tel:${site.developer.phone.replace(/s/g, "")}">${site.developer.phone}</a><br><a href="mailto:${site.developer.email}">${site.developer.email}</a></p>
        <p class="footer__small"><a class="link" href="developer.html">O developerovi</a> · <a class="link" href="kontakty.html">Všechny kontakty</a></p>
      </div>
    </div>
    <div class="wrap"><p class="footer__disclaimer">Vizualizace jsou ilustrační. Ceny, dostupnost parcel a pravidla umístění domů doplní a potvrdí developer.</p></div>
    <div class="wrap footer__bottom">
      <p>© ${new Date().getFullYear()} ${site.name} · Vizualizace a výkresy: ${site.architect.name}</p>
      <nav aria-label="Právní informace"><a href="ochrana-osobnich-udaju.html">Ochrana osobních údajů</a><button type="button" class="link" data-cookie-settings>Nastavení cookies</button></nav>
      <p class="footer__made">Web realizovalo <a href="${site.realisation.url}" target="_blank" rel="noopener">${site.realisation.label}</a></p>
    </div>`;
}

// ---------------- cookie consent ----------------
// The site currently runs no analytics or marketing scripts; the consent only stores the visitor's choice so
// such tools can be enabled later according to it.
const CKEY = "pistov:cookie-consent";
export const cookies = {
  get() { try { return JSON.parse(localStorage.getItem(CKEY)); } catch { return null; } },
  set(v) { try { localStorage.setItem(CKEY, JSON.stringify({ ...v, necessary: true, at: new Date().toISOString() })); } catch { /* private mode */ } },
  init() {
    if (this._done) return; this._done = true;
    document.addEventListener("click", (e) => { if (e.target.closest("[data-cookie-settings]")) this.show(true); });
    if (!this.get()) this.show(false);
  },
  show(expanded) {
    let el = document.querySelector(".cookies");
    const cur = this.get() || { analytics: false, marketing: false };
    if (!el) { el = document.createElement("section"); el.className = "cookies"; el.setAttribute("aria-label", "Nastavení cookies"); document.body.append(el); }
    el.innerHTML = `
      <p class="eyebrow">Souhlas se zpracováním dat</p>
      <p class="cookies__title">Tento web používá cookies</p>
      <p class="cookies__text">Nezbytné cookies potřebujeme pro fungování webu (např. uložení oblíbených a porovnání). Analytické a marketingové použijeme jen s vaším souhlasem. <a class="link" href="ochrana-osobnich-udaju.html#cookies">Více informací</a></p>
      <form class="cookies__opts" ${expanded ? "" : "hidden"}>
        <label class="check"><input type="checkbox" checked disabled><span><b>Nezbytné</b> – vždy aktivní</span></label>
        <label class="check"><input type="checkbox" name="analytics" ${cur.analytics ? "checked" : ""}><span><b>Analytické</b> – měření návštěvnosti</span></label>
        <label class="check"><input type="checkbox" name="marketing" ${cur.marketing ? "checked" : ""}><span><b>Marketingové</b> – relevantní reklama</span></label>
      </form>
      <div class="cookies__actions">
        <button type="button" class="link" data-c="toggle">${expanded ? "Skrýt nastavení" : "Nastavit"}</button>
        <button type="button" class="btn btn--ghost btn--sm" data-c="${expanded ? "save" : "necessary"}">${expanded ? "Uložit výběr" : "Pouze nezbytné"}</button>
        <button type="button" class="btn btn--ink btn--sm" data-c="all">Přijmout vše</button>
      </div>`;
    el.hidden = false;
    el.onclick = (e) => {
      const b = e.target.closest("[data-c]"); if (!b) return;
      const f = el.querySelector("form");
      if (b.dataset.c === "toggle") { this.show(f.hidden); return; }
      if (b.dataset.c === "all") this.set({ analytics: true, marketing: true });
      if (b.dataset.c === "necessary") this.set({ analytics: false, marketing: false });
      if (b.dataset.c === "save") this.set({ analytics: f.analytics.checked, marketing: f.marketing.checked });
      el.hidden = true;
    };
  },
};
