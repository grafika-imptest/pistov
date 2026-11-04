// Studio home page. Every number comes from the project data – nothing typed in by hand.
import { renderChrome } from "../site/chrome.js";
import { project } from "../projects/pistov/project.js";
import { site, pois, access } from "../projects/pistov/content.js";
import { poiList, poiPicto } from "../site/pois.js";
import { peopleCards, scheduleItems, pictoItem, socialIcons } from "../site/people.js";
import { PanoTeaser } from "../ui/panoTeaser.js";
import { renderHomeTeasers } from "../site/teasers.js";
import { mountLocationMap } from "../site/map.js";
import { esc } from "../site/ui.js";
import { m2 } from "../ui/format.js";
import { reveal, parallax, countUp, lazyLoops } from "./motion.js";
import { reducedMotion } from "../core/motion.js";

renderChrome({ page: "" });
const $ = (s) => document.querySelector(s);
const P = project, nf = (v) => new Intl.NumberFormat("cs-CZ").format(v);
const plots = P.plots, free = plots.filter((p) => p.status === "available"), areas = plots.map((p) => p.area);
const count = (st) => plots.filter((p) => p.status === st).length;

// ---------- hero: looping film (Magnific, Seedance 2.5) – drone over the bare plots, houses rise as wireframes and get
// their materials, two house types in detail, the finished quarter. Reduced motion / data saver: the poster only.
{
  const v = $("[data-s-hero-video]");
  if (v && !reducedMotion() && !navigator.connection?.saveData) {
    v.muted = true; v.src = P.heroFilm;
    v.addEventListener("playing", () => v.classList.add("is-on"), { once: true });
    // play only while the hero is on screen
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  }
  $("[data-s-stats]").innerHTML = [
    [free.length, "volných parcel", `z ${plots.length} v lokalitě`],
    [`${Math.min(...areas)}–${nf(Math.max(...areas))}`, "m² výměry", "většina 560–700 m²"],
    [nf(P.pricing.perM2), "Kč za m²", "včetně DPH"],
    ["06/2029", "předání pozemků", "podle harmonogramu"],
  ].map(([n, l, s]) => `<div><dt>${l}</dt><dd><b ${typeof n === "number" ? `data-s-count="${n}"` : ""}>${n}</b><small>${s}</small></dd></div>`).join("");
}

// ---------- intro specs ----------
if ($("[data-s-specs]")) $("[data-s-specs]").innerHTML = [
  ["Parcel v plánu", plots.length], ["Volných k prodeji", free.length], ["Rezervovaných", count("reserved")],
  ["Výměry parcel", `${m2(Math.min(...areas))} – ${m2(Math.max(...areas))}`], ["Typové domy", `${P.houseTypes.length} typy · ${P.houseVariants.length} vizualizací`],
].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

// ---------- schedule ----------
$("[data-s-schedule]").innerHTML = scheduleItems();

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
  const BANDS = [["do 3,75 mil.", (v) => v < 3.75e6], ["3,75–4,25 mil.", (v) => v >= 3.75e6 && v <= 4.25e6], ["nad 4,25 mil.", (v) => v > 4.25e6]];
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

// ---------- developer + seller, contact: the sales people ----------
$("[data-s-people]").innerHTML = peopleCards("person person--dark");
$("[data-s-contact]").innerHTML = site.contacts.map((p) => `<span><b>${esc(p.name)}</b> <a href="tel:${p.phone.replace(/\s/g, "")}">${p.phone}</a> <a href="mailto:${p.email}">${p.email}</a>${socialIcons(p.social, p.name, "social social--sm social--inline social--light")}</span>`).join("");

// ---------- location: draggable 360° drone panorama + points of interest ----------
{
  const toNabidka = (q) => (location.href = new URL(`studio/nabidka.html${q}`, document.baseURI).href);
  new PanoTeaser($("[data-pano-teaser]"), { project: P, statusOf: (p) => p.status, scrollToExplorer() {}, openPano: (id) => toNabidka(`?pohled=pano&stanoviste=${id}`) });
  const list = poiList().filter((p) => p.featured);
  $("[data-s-access]").innerHTML = access.map(pictoItem).join("");
  $("[data-s-pois]").innerHTML = list.map(poiPicto).join("");
  $("[data-s-pois-note]").textContent = pois.note;
  mountLocationMap($("[data-s-map]"), { zoom: 15.5, color: "#b94a28", pois: list });
}
renderHomeTeasers();
reveal(); parallax(); countUp(); lazyLoops();
