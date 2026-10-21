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
$("[data-s-specs]").innerHTML = [
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
          <div><dt>Vhodný pro*</dt><dd>${nFree} ${plural(nFree, "volnou parcelu", "volné parcely", "volných parcel")}</dd></div>
        </dl>
        <figure class="s-type__img">${(() => { const v = mainVariant(t); return `<img src="${img(v.images[0], "m")}" srcset="${srcset(v.images[0])}" sizes="100vw" alt="${esc(t.name)} – ${esc(v.name)}, vizualizace TAM architekti" loading="lazy" decoding="async">`; })()}</figure>
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

// ---------- offer: plot map over the aerial visualisation ----------
{
  const fig = $("[data-s-plotmap]"), view = P.views.find((v) => v.id === "aerial");
  const pts = plots.flatMap((p) => (p.geometry ? p.geometry.aerial : [p.label.aerial]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), pad = 120;
  const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const types = (p) => (p.status === "available" ? typesForPlot(P, p).filter((t) => t.allowed).map((t) => t.type.id).join(" ") : "");
  const shape = (p) => p.geometry
    ? `<polygon points="${p.geometry.aerial.map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ")}"/>`
    : `<circle cx="${p.label.aerial[0]}" cy="${p.label.aerial[1]}" r="26"/>`;
  fig.insertAdjacentHTML("afterbegin", `
    <svg class="s-plotmap" viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Parcely v mapě">
      <image href="${view.sources[2][1]}" x="0" y="0" width="${view.size[0]}" height="${view.size[1]}" preserveAspectRatio="none"/>
      <rect class="s-plotmap__dim" x="0" y="0" width="${view.size[0]}" height="${view.size[1]}"/>
      ${plots.map((p) => `<a href="index.html?parcela=${p.no}" class="s-plot s-plot--${p.status}" data-no="${p.no}" aria-label="Parcela ${p.no}, ${m2(p.area)}, ${STATUS[p.status].label}">${shape(p)}</a>`).join("")}
    </svg>
    <div class="s-plottip" role="status" aria-live="polite" hidden></div>`);
  // the map fills its box edge to edge: grow the plot bounds to the box's aspect ratio (within the image)
  const svgEl = fig.querySelector(".s-plotmap");
  const fitBox = () => {
    const r = fig.getBoundingClientRect(); if (!r.width || !r.height) return;
    const a = r.width / r.height, [IW, IH] = view.size;
    let [x, y, w, h] = vb;
    if (w / h > a) { const nh = w / a; y -= (nh - h) / 2; h = nh; } else { const nw = h * a; x -= (nw - w) / 2; w = nw; }
    if (w > IW) { h *= IW / w; w = IW; } if (h > IH) { w *= IH / h; h = IH; }
    x = Math.min(Math.max(0, x), IW - w); y = Math.min(Math.max(0, y), IH - h);
    svgEl.setAttribute("viewBox", [x, y, w, h].map((n) => n.toFixed(1)).join(" "));
  };
  new ResizeObserver(fitBox).observe(fig); fitBox();
  const tip = fig.querySelector(".s-plottip"), byNo = new Map(plots.map((p) => [String(p.no), p]));
  const show = (a, e) => {
    const p = byNo.get(a.dataset.no), t = types(p), r = fig.getBoundingClientRect();
    tip.innerHTML = `<b>Parcela ${p.no}</b><span>${m2(p.area)}</span><span class="s-dot s-dot--${p.status}">${STATUS[p.status].long}</span>${t ? `<span>Domy ${t.split(" ").join(" · ")}</span>` : ""}`;
    tip.hidden = false;
    const ar = a.getBoundingClientRect(), x = e?.clientX ?? ar.left + ar.width / 2, y = e?.clientY ?? ar.top;
    tip.style.left = `${Math.min(r.width - 180, Math.max(8, x - r.left + 14))}px`; tip.style.top = `${Math.max(8, y - r.top - 70)}px`;
  };
  fig.addEventListener("pointermove", (e) => { const a = e.target.closest(".s-plot"); if (a) show(a, e); else tip.hidden = true; });
  fig.addEventListener("pointerleave", () => (tip.hidden = true));
  fig.addEventListener("focusin", (e) => { const a = e.target.closest(".s-plot"); if (a) show(a); });
  fig.addEventListener("focusout", () => (tip.hidden = true));
  $("[data-s-legend]").innerHTML = ["available", "reserved"].filter((s) => s === "available" || count(s)).map((s) => `<li><i class="s-dot s-dot--${s}"></i><b>${count(s)}</b> ${STATUS[s].label === "volná" ? "volných" : "rezervovaných"}</li>`).join("");
  const bands = [["do 580 m²", (a) => a < 580], ["580–650 m²", (a) => a >= 580 && a <= 650], ["nad 650 m²", (a) => a > 650]];
  $("[data-s-bands]").innerHTML = bands.map(([l, f]) => `<li><span>${l}</span><b>${free.filter((p) => f(p.area)).length}</b></li>`).join("");
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
