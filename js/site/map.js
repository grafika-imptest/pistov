// Location map: OpenStreetMap tiles + Leaflet (vendored in assets/vendor), a red pin with the Pístov mark and the
// plots outlined from the site plan (georeferenced). Loaded only when the map scrolls into view.
import { project } from "../projects/pistov/project.js";
import { site } from "../projects/pistov/content.js";
import { planToMetres } from "../core/panorama.js";

const PIN = `<svg viewBox="0 0 44 58" aria-hidden="true"><path class="mappin__body" d="M22 56C22 56 4 34.5 4 21.5a18 18 0 0 1 36 0C40 34.5 22 56 22 56Z"/><g class="mappin__mark" transform="rotate(45 22 21.5)"><rect x="13.5" y="13" width="17" height="17"/><rect x="17.5" y="17" width="9" height="9"/></g></svg>`;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!loadLeaflet.p) {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "assets/vendor/leaflet/leaflet.css"; document.head.append(css);
    loadLeaflet.p = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "assets/vendor/leaflet/leaflet.js"; s.onload = () => res(window.L); s.onerror = rej; document.head.append(s); });
  }
  return loadLeaflet.p;
}

/** mount the map into `el` once it is near the viewport; options: { zoom, color } */
export function mountLocationMap(el, { zoom = 16, color = "#c4372b" } = {}) {
  if (!el) return;
  const { lat, lon } = site.location;
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return; io.disconnect();
    loadLeaflet().then((L) => {
      const map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.5 }).setView([lat, lon], zoom);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">přispěvatelé OpenStreetMap</a>' }).addTo(map);
      const g = project.planGeoref, toLL = (pt) => { const [east, north] = planToMetres(g, pt); return [g.ref[0] + north / g.mLat, g.ref[1] + east / g.mLon]; };
      const plots = project.plots.filter((p) => p.geometry).map((p) => p.geometry.plan.map(toLL));
      L.polygon(plots, { color, weight: 1, opacity: 0.7, fillColor: color, fillOpacity: 0.08, interactive: false }).addTo(map);
      const icon = L.divIcon({ className: "mappin", html: PIN, iconSize: [44, 58], iconAnchor: [22, 56], popupAnchor: [0, -52] });
      L.marker([lat, lon], { icon, title: "Pístov", alt: "Pístov – lokalita" }).addTo(map)
        .bindPopup(`<b>Pístov</b><br>Pozemky a rodinné domy<br><a href="index.html#explorer">Prozkoumat lokalitu →</a>`);
    }).catch(() => { el.innerHTML = `<p class="muted contacts__mapfail">Mapu se nepodařilo načíst.</p>`; });
  }, { rootMargin: "200px" }).observe(el);
}
