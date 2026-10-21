// Studio: house types A–D – everything the catalogue says about each type, its drawings and where it can stand.
import { renderChrome } from "../site/chrome.js";
import { project as P } from "../projects/pistov/project.js";
import { plotsForType } from "../core/compat.js";
import { saveButtons, bindSaveButtons, syncSaveButtons, collections, COMPARE_MAX } from "../site/collections.js";
import { img, srcset, esc, lightbox, isDrawing, toast } from "../site/ui.js";
import { plural } from "../ui/format.js";
import { reveal } from "./motion.js";

renderChrome({ page: "domy" });
const root = document.querySelector("[data-s-houses]");
const areaOf = (t, l) => (l.builtUpArea !== undefined ? l.builtUpArea : t.builtUpArea);

root.innerHTML = `
  <nav class="s-subnav" aria-label="Typy domů"><div class="wrap">${P.houseTypes.map((t) => `<a href="#dum-${t.id.toLowerCase()}"><b>${t.id}</b><span>${esc(t.tagline)}</span></a>`).join("")}</div></nav>
  ${P.houseTypes.map((t) => {
    const variants = P.houseVariants.filter((v) => v.type === t.id);
    const shots = [
      ...variants.flatMap((v) => v.images.map((im) => [im, `${t.name} – ${v.name}`])),
      ...[...new Set(t.layouts.map((l) => l.sheet))].map((sh) => [sh, `${t.name} – půdorysy (${sh.includes("v2") ? "varianta 2" : sh.includes("v23") ? "varianty 2 a 3" : "základní varianta"})`]),
      ...(t.sheets.site ? [[t.sheets.site, `${t.name} – situace na parcele`]] : []),
      ...(t.sheets.elevations || []).map((e) => [e, `${t.name} – pohled ${e.includes("street") ? "z ulice" : "ze zahrady"}`]),
    ];
    const nFree = plotsForType(P, t.id).filter((p) => p.status === "available").length;
    return `
  <section class="s-house" id="dum-${t.id.toLowerCase()}" aria-labelledby="h-${t.id}" data-type="${t.id}">
    <div class="wrap s-house__grid">
      <header class="s-house__head" data-s-in>
        <span class="s-house__letter" aria-hidden="true">${t.id}</span>
        <p class="eyebrow">${esc(t.name)}</p>
        <h2 class="s-h2" id="h-${t.id}">${esc(t.tagline)}</h2>
        <p class="lead">${esc(t.character)}</p>
        ${t.suitability ? `<p class="s-house__note">${esc(t.suitability)}</p>` : ""}
      </header>
      <div class="s-house__gallery">
        <button type="button" class="s-house__main" data-shot="0" aria-label="Zvětšit: ${esc(shots[0][1])}">
          <img src="${img(shots[0][0], "l")}" srcset="${srcset(shots[0][0])}" sizes="(min-width: 1000px) 60vw, 100vw" alt="${esc(shots[0][1])}" loading="lazy" decoding="async">
        </button>
        <div class="s-house__thumbs" role="group" aria-label="Vizualizace a výkresy domu ${t.id}">${shots.map(([im, cap], i) => `
          <button type="button" class="s-thumb ${isDrawing(im) ? "is-drawing" : ""} ${i ? "" : "is-on"}" data-pick="${i}" aria-pressed="${!i}" title="${esc(cap)}"><img src="${img(im, "s")}" alt="${esc(cap)}" loading="lazy" decoding="async"></button>`).join("")}
        </div>
      </div>
      <dl class="s-house__specs">
        <div><dt>Obestavěná plocha</dt><dd>${t.layouts.map((l) => { const a = areaOf(t, l); return a ? `${a} m²` : "neuvedena"; }).filter((v, i, a) => a.indexOf(v) === i).join(" / ")}</dd></div>
        <div><dt>Délka domu</dt><dd>${t.length ? `${t.length} m` : "—"}</dd></div>
        <div><dt>Střecha</dt><dd>${esc(t.roof)}</dd></div>
        <div><dt>Parkování</dt><dd>${esc(t.parking)}</dd></div>
        <div><dt>Materiálová řešení</dt><dd>${variants.length}</dd></div>
        <div><dt>Vhodný pro*</dt><dd>${nFree} ${plural(nFree, "volnou parcelu", "volné parcely", "volných parcel")}</dd></div>
      </dl>
      <div class="s-house__layouts">
        <h3 class="s-h3">Dispozice</h3>
        ${t.layouts.map((l) => `
        <details class="s-layout" ${l === t.layouts[0] ? "open" : ""}>
          <summary><b>${esc(l.name)}</b><span>${l.disposition || ""}${l.disposition ? " · " : ""}${areaOf(t, l) ? `${areaOf(t, l)} m² obestavěná` : "plocha neuvedena"}</span></summary>
          <ul>${(l.rooms || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          ${l.renderNote ? `<p class="hint">${esc(l.renderNote)}</p>` : ""}
          <button type="button" class="s-link" data-plan="${esc(l.sheet)}" data-cap="${esc(`${t.name} – ${l.name}, půdorysy`)}">Zobrazit půdorys →</button>
        </details>`).join("")}
      </div>
      <div class="s-house__cta">
        <a class="s-btn s-btn--accent" href="index.html?dum=${t.id}&rezim=domy">Vybrat parcelu pro dům ${t.id} <span aria-hidden="true">→</span></a>
        <span class="savebar">${saveButtons({ kind: "house", type: t.id }, { what: t.name })}</span>
      </div>
    </div>
  </section>`;
  }).join("")}
  <p class="wrap s-source">Fakta podle katalogu Pístov – katalog rodinných domů, TAM architekti, duben 2026. Obestavěná plocha není užitná plocha. Vizualizace jsou ilustrační. Prodáváme pouze pozemky – typové domy jsou inspirace, objednat je nelze. * Přiřazení domů k parcelám je zatím ukázkové – finální vazbu potvrdí developer s architektem.</p>`;

// gallery: thumbnails switch the main picture, the main picture opens the lightbox
for (const sec of root.querySelectorAll(".s-house")) {
  const thumbs = [...sec.querySelectorAll("[data-pick]")];
  const items = thumbs.map((b) => [b.querySelector("img").getAttribute("src").replace(/^assets\/img\//, "").replace(/-\d+\.webp$/, ""), b.title]);
  const main = sec.querySelector(".s-house__main"), mainImg = main.querySelector("img");
  sec.addEventListener("click", (e) => {
    const t = e.target.closest("[data-pick]");
    if (t) {
      const k = Number(t.dataset.pick), [name, cap] = items[k];
      mainImg.src = img(name, "l"); mainImg.srcset = srcset(name); mainImg.alt = cap; main.dataset.shot = k;
      main.classList.toggle("is-drawing", isDrawing(name)); main.setAttribute("aria-label", `Zvětšit: ${cap}`);
      thumbs.forEach((b) => { b.classList.toggle("is-on", b === t); b.setAttribute("aria-pressed", String(b === t)); });
      return;
    }
    if (e.target.closest(".s-house__main")) lightbox(items).open(Number(main.dataset.shot));
    const plan = e.target.closest("[data-plan]");
    if (plan) lightbox([[plan.dataset.plan, plan.dataset.cap]]).open(0);
  });
}

// sub-navigation follows the section on screen
const links = [...root.querySelectorAll(".s-subnav a")];
const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href").endsWith(`#${en.target.id}`))); }), { rootMargin: "-40% 0px -55% 0px" });
root.querySelectorAll(".s-house").forEach((s) => io.observe(s));

bindSaveButtons(document.body, () => toast(`Porovnat lze nejvýše ${COMPARE_MAX} položky.`));
collections.subscribe(() => syncSaveButtons());
reveal();
if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
