// Studio home page. Every number comes from the project data – nothing typed in by hand.
import { renderChrome } from "../site/chrome.js";
import { project } from "../projects/pistov/project.js";
import { site, developer, pois } from "../projects/pistov/content.js";
import { PanoTeaser } from "../ui/panoTeaser.js";
import { plotsForType, typesForPlot } from "../core/compat.js";
import { renderHomeTeasers } from "../site/teasers.js";
import { mountLocationMap } from "../site/map.js";
import { img, srcset, esc } from "../site/ui.js";
import { STATUS, m2, plural } from "../ui/format.js";
import { reveal, parallax, countUp, lazyLoops } from "./motion.js";
import { reducedMotion } from "../core/motion.js";

renderChrome({ page: "" });
const $ = (s) => document.querySelector(s);
const P = project, nf = (v) => new Intl.NumberFormat("cs-CZ").format(v);
const plots = P.plots, free = plots.filter((p) => p.status === "available"), areas = plots.map((p) => p.area);
const count = (st) => plots.filter((p) => p.status === st).length;

// ---------- hero: the intro film once, then it rests on its last frame (= the aerial view) ----------
{
  const v = $("[data-s-hero-video]"), cfg = P.introVideo;
  if (v && cfg && !reducedMotion() && !navigator.connection?.saveData) {
    v.src = innerWidth >= 900 ? cfg.src.hd : cfg.src.sd;
    v.addEventListener("playing", () => v.classList.add("is-on"), { once: true });
    // the plots are what is for sale – after the film the houses fade away and bare plots stay
    v.addEventListener("ended", () => $("[data-s-hero-empty]")?.classList.add("is-on"), { once: true });
    v.play().catch(() => v.remove());
  }
  $("[data-s-stats]").innerHTML = [
    [free.length, "volných parcel", `z ${plots.length} v lokalitě`],
    [`${Math.min(...areas)}–${nf(Math.max(...areas))}`, "m² výměry", "většina 560–700 m²"],
    [P.houseTypes.length, "typové domy", "A, B, C a D"],
    [P.panoramas.length, "panoramat 360°", "dnešní stav z dronu"],
  ].map(([n, l, s]) => `<div><dt>${l}</dt><dd><b ${typeof n === "number" ? `data-s-count="${n}"` : ""}>${n}</b><small>${s}</small></dd></div>`).join("");
}

// ---------- intro specs ----------
if ($("[data-s-specs]")) $("[data-s-specs]").innerHTML = [
  ["Parcel v plánu", plots.length], ["Volných k prodeji", free.length], ["Rezervovaných", count("reserved")],
  ["Výměry parcel", `${m2(Math.min(...areas))} – ${m2(Math.max(...areas))}`], ["Typové domy", `${P.houseTypes.length} typy · ${P.houseVariants.length} vizualizací`],
].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

// ---------- house types: list on the left, the picture follows the active type ----------
{
  const list = $("[data-s-types]"), stage = $("[data-s-types-stage]");
  const mainVariant = (t) => P.houseVariants.find((v) => v.type === t.id);
  list.innerHTML = P.houseTypes.map((t, i) => {
    const areasT = [...new Set(t.layouts.map((l) => (l.builtUpArea !== undefined ? l.builtUpArea : t.builtUpArea)).filter(Boolean))];
    const disp = [...new Set(t.layouts.map((l) => l.disposition).filter(Boolean))];
    const nFree = plotsForType(P, t.id).filter((p) => p.status === "available").length;
    return `<li class="s-type" data-k="${i}" data-s-in>
      <span class="s-type__letter">${t.id}</span>
      <div class="s-type__body">
        <h3 class="s-type__name">${esc(t.name)} <span>${esc(t.tagline)}</span></h3>
        <p class="s-type__text">${esc(t.character)}</p>
        <dl class="s-type__specs">
          <div><dt>Obestavěná plocha</dt><dd>${areasT.map((a) => `${a} m²`).join(" / ")}</dd></div>
          <div><dt>Dispozice</dt><dd>${disp.length ? disp.join(", ") : "podle půdorysů"}</dd></div>
          <div><dt>Střecha</dt><dd>${esc(t.roof)}</dd></div>
          <div><dt>Vejde se na*</dt><dd>${nFree} ${plural(nFree, "volnou parcelu", "volné parcely", "volných parcel")}</dd></div>
        </dl>
        <figure class="s-type__img">${(() => { const v = mainVariant(t); return `<img src="${img(v.images[0], "m")}" srcset="${srcset(v.images[0])}" sizes="100vw" alt="${esc(t.name)} – ${esc(v.name)}, vizualizace" loading="lazy" decoding="async">`; })()}</figure>
        <p class="s-type__links"><a class="s-btn s-btn--dark s-btn--sm" href="domy.html#dum-${t.id.toLowerCase()}">Detail domu ${t.id}</a><a class="s-link" href="index.html?dum=${t.id}&rezim=domy">Parcely pro dům ${t.id} →</a></p>
      </div>
    </li>`;
  }).join("");
  stage.innerHTML = P.houseTypes.map((t, i) => { const v = mainVariant(t); return `<img class="${i ? "" : "is-on"}" data-k="${i}" src="${img(v.images[0], "m")}" srcset="${srcset(v.images[0])}" sizes="(min-width: 1000px) 55vw, 100vw" alt="" loading="${i ? "lazy" : "eager"}" decoding="async">`; }).join("")
    + `<span class="s-types__badge" data-s-types-badge>A</span>`;
  // the type in the middle of the screen drives the picture
  const items = [...list.children], badge = stage.querySelector("[data-s-types-badge]");
  const io = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) {
      const k = en.target.dataset.k;
      items.forEach((li) => li.classList.toggle("is-active", li === en.target));
      stage.querySelectorAll("img").forEach((im) => im.classList.toggle("is-on", im.dataset.k === k));
      badge.textContent = P.houseTypes[k].id;
    }
  }, { rootMargin: "-45% 0px -45% 0px" });
  items.forEach((li) => io.observe(li));
  items[0]?.classList.add("is-active");
}

// ---------- offer: full-bleed plot map, price filter and a live plot card ----------
{
  const fig = $("[data-s-plotmap]"), view = P.views.find((v) => v.id === "aerial"), card = $("[data-s-plotcard]");
  const price = (v) => `${(v / 1e6).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil. Kč`;
  const byNo = new Map(plots.map((p) => [String(p.no), p]));
  const pts = plots.flatMap((p) => (p.geometry ? p.geometry.aerial : [p.label.aerial]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), pad = 90;
  const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const shape = (p) => p.geometry
    ? `<polygon points="${p.geometry.aerial.map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ")}"/>`
    : `<circle cx="${p.label.aerial[0]}" cy="${p.label.aerial[1]}" r="26"/>`;
  fig.insertAdjacentHTML("afterbegin", `
    <svg class="s-plotmap" preserveAspectRatio="xMidYMid slice" role="group" aria-label="Parcely v mapě">
      <image href="${(view.sources[3] || view.sources[2])[1]}" x="0" y="0" width="${view.size[0]}" height="${view.size[1]}" preserveAspectRatio="none"/>
      ${plots.map((p) => `<a href="index.html?parcela=${p.no}" class="s-plot s-plot--${p.status}" data-no="${p.no}" aria-label="Parcela ${p.no}, ${m2(p.area)}, ${price(p.price)}">${shape(p)}<text x="${p.label.aerial[0]}" y="${p.label.aerial[1]}">${p.no}</text></a>`).join("")}
    </svg>`);

  // on wide screens the plots sit to the right of the intro text; on small screens they fill the frame
  const svgEl = fig.querySelector(".s-plotmap");
  const fitBox = () => {
    const r = fig.getBoundingClientRect(); if (!r.width || !r.height) return;
    const wide = r.width >= 1000, [IW, IH] = view.size;
    const area = wide ? { w: r.width * 0.44, h: r.height * 0.8 } : { w: r.width * 0.96, h: r.height * 0.96 };
    let k = Math.min(area.w / vb[2], area.h / vb[3]);         // screen px per image px
    k = Math.max(k, r.width / IW, r.height / IH);              // never show beyond the image
    const w = r.width / k, h = r.height / k;
    const cx = vb[0] + vb[2] / 2 - (wide ? (r.width * 0.07) / k : 0), cy = vb[1] + vb[3] / 2;
    const x = Math.min(Math.max(0, cx - w / 2), IW - w), y = Math.min(Math.max(0, cy - h / 2), IH - h);
    svgEl.setAttribute("viewBox", [x, y, w, h].map((n) => n.toFixed(1)).join(" "));
  };
  new ResizeObserver(fitBox).observe(fig); fitBox();

  // price bands – a click highlights the matching plots on the map
  const BANDS = [["do 3,5 mil.", (v) => v < 3.5e6], ["3,5–4 mil.", (v) => v >= 3.5e6 && v <= 4e6], ["nad 4 mil.", (v) => v > 4e6]];
  const bandBox = $("[data-s-pricebands]"); let band = -1;
  bandBox.innerHTML = BANDS.map(([l, f], i) => `<button type="button" class="s-chip" data-band="${i}" aria-pressed="false">${l} Kč<b>${free.filter((p) => f(p.price)).length}</b></button>`).join("");
  bandBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-band]"); if (!b) return;
    band = band === +b.dataset.band ? -1 : +b.dataset.band;
    bandBox.querySelectorAll("[data-band]").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.band === band)));
    fig.classList.toggle("is-filtered", band >= 0);
    fig.querySelectorAll(".s-plot").forEach((a) => a.classList.toggle("is-match", band >= 0 && BANDS[band][1](byNo.get(a.dataset.no).price)));
  });

  // live plot card (hover / focus); starts on the most affordable plot
  const cheapest = [...free].sort((a, b) => a.price - b.price)[0];
  $("[data-s-count-free]").textContent = free.length;
  $("[data-s-price-from]").textContent = price(cheapest.price);
  const showCard = (p, hint) => {
    card.innerHTML = `<p class="s-plots__cardlabel">${hint}</p>
      <p class="s-plots__no">${p.no}</p>
      <dl><div><dt>Výměra</dt><dd>${m2(p.area)}</dd></div><div><dt>Cena</dt><dd>${price(p.price)}</dd></div></dl>
      <a class="s-link" href="index.html?parcela=${p.no}">Detail parcely →</a>`;
    fig.querySelectorAll(".s-plot.is-active").forEach((a) => a.classList.remove("is-active"));
    fig.querySelector(`.s-plot[data-no="${p.no}"]`)?.classList.add("is-active");
  };
  showCard(cheapest, "Nejdostupnější parcela");
  const onPlot = (e) => { const a = e.target.closest(".s-plot"); if (a) showCard(byNo.get(a.dataset.no), "Parcela"); };
  fig.addEventListener("pointerover", onPlot);
  fig.addEventListener("focusin", onPlot);
}

// ---------- developer, contact ----------
$("[data-s-devfacts]").innerHTML = developer.facts.map(([b, s]) => `<div><dt>${esc(s)}</dt><dd>${esc(b)}</dd></div>`).join("");
{
  const d = site.developer;
  $("[data-s-contact]").innerHTML = `<span>${esc(d.brand)}</span><a href="tel:${d.phone.replace(/\s/g, "")}">${d.phone}</a><a href="mailto:${d.email}">${d.email}</a>`;
}

// ---------- location: draggable 360° drone panorama + points of interest ----------
{
  const toNabidka = (q) => (location.href = new URL(`studio/nabidka.html${q}`, document.baseURI).href);
  new PanoTeaser($("[data-pano-teaser]"), { project: P, statusOf: (p) => p.status, scrollToExplorer() {}, openPano: (id) => toNabidka(`?pohled=pano&stanoviste=${id}`) });
  const R = 6371, rad = (d) => (d * Math.PI) / 180, { lat, lon } = site.location;
  const km = (p) => { const a = Math.sin(rad(p.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lon - lon) / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10; };
  const list = pois.items.map((p) => ({ ...p, km: km(p) })).sort((a, b) => a.km - b.km);
  $("[data-s-pois]").innerHTML = list.map((p, i) => `<li><span class="s-pois__no">${i + 1}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></span><span class="s-pois__km">${p.km.toLocaleString("cs-CZ")} km</span></li>`).join("");
  $("[data-s-pois-note]").textContent = pois.note;
  mountLocationMap($("[data-s-map]"), { zoom: 15.5, color: "#b94a28", pois: list });
}
renderHomeTeasers();
reveal(); parallax(); countUp(); lazyLoops();
