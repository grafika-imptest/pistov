// Points of interest around Pístov: distances, cards and links shared by the home page, Lokalita and the place pages.
import { site, pois } from "../projects/pistov/content.js";
import { poiIcon } from "./poi-icons.js";
import { img, srcset, esc } from "./ui.js";

const R = 6371, rad = (d) => (d * Math.PI) / 180;
/** straight-line distance from the plots, km with one decimal */
export function poiKm(p) {
  const { lat, lon } = site.location;
  const a = Math.sin(rad(p.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lon - lon) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}
export const kmLabel = (km) => `${km.toLocaleString("cs-CZ")} km`;
/** all places, nearest first */
export const poiList = () => pois.items.map((p) => ({ ...p, km: poiKm(p) })).sort((a, b) => a.km - b.km);
export const poiHref = (p) => `misto.html?id=${p.id}`;

/** card: photo (or the category icon when no photo is available yet), category, distance, name, perex */
export const poiCard = (p) => `<a class="poicard" href="${poiHref(p)}">
  <span class="poicard__media">${p.photos?.length
    ? `<img src="${img(p.photos[0].image, "m")}" srcset="${srcset(p.photos[0].image)}" sizes="(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 100vw" alt="" loading="lazy" decoding="async">`
    : `<span class="poicard__ph">${poiIcon(p.icon)}</span>`}</span>
  <span class="poicard__meta"><span class="poicard__ic">${poiIcon(p.icon)}</span>${esc(p.cat)}<b>${kmLabel(p.km)}</b></span>
  <span class="poicard__name">${esc(p.name)}</span>
  <span class="poicard__perex">${esc(p.perex)}</span>
</a>`;
