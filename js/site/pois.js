// Places around Pístov: distances and pictogram tiles shared by the home page and Lokalita.
import { site, pois } from "../projects/pistov/content.js";
import { pictoItem } from "./people.js";

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
/** pictogram tile of a place: the travel time when known, otherwise the distance */
export const poiPicto = (p) => pictoItem({ icon: p.icon, title: p.name, info: p.info || `${kmLabel(p.km)} vzdušnou čarou` });
