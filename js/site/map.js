// Location map: OpenStreetMap tiles + Leaflet (vendored in assets/vendor), a red pin with the Pístov mark and the
// plots outlined from the site plan (georeferenced). Loaded only when the map scrolls into view.
import { poiIcon } from "./poi-icons.js";
import { project } from "../projects/pistov/project.js";
import { site } from "../projects/pistov/content.js";
import { planToMetres } from "../core/panorama.js";

const PIN = `<svg viewBox="0 0 44 58" aria-hidden="true"><path class="mappin__body" d="M22 56C22 56 4 34.5 4 21.5a18 18 0 0 1 36 0C40 34.5 22 56 22 56Z"/><svg class="mappin__mark" x="8" y="15.2" width="28" height="12.6" viewBox="0 0 112.1 50.43"><polygon points="17.9 1.93 24.3 4.66 32.04 3.33 25.88 .73 17.9 1.93"/><polygon points="31.18 1.11 35.25 2.74 44.76 1.41 39.82 0 31.18 1.11"/><polygon points="0 14.44 6.78 12.52 32.05 29.19 24.08 32.96 0 14.44"/><polygon points="36.64 12.69 36.64 27.53 35.88 27.83 10.64 11.5 25.74 7.55 36.64 12.69"/><path d="M73.73,12.61l-2.11.86c-3.16-2.38-7.32-3.72-12.17-3.72h-20.42l-7.8-3.57,16.01-2.99,26.49,9.42Z"/><polygon points="34.78 30.81 36.64 31.690 36.64 39.6 30.41 37.15 26.12 34.62 34.78 30.81"/><path d="M83.9,29.9l-6.64,4.04c.59-1.75.92-3.67.97-5.72l5.67,1.68Z"/><path d="M100.17,20.4l-12.87,7.42-9.21-2.66c-.47-4.12-2.150-7.61-4.77-10.22l3.08-1.29,23.77,6.75Z"/><path d="M112.1,21.97l-14.48,11.07-24.79,15.65-8.85-1.64,3.93-3.11c2.77-1.16,5.08-2.92,6.8-5.17l28.33-17.57,9.06.77Z"/><path d="M42.31,50.43V15.41h17.14c7.79,0,13.12,4.440,13.12,12.23s-5.33,12.230-13.12,12.230h-11.5v10.56h-5.64ZM47.96,20.48v14.32h10.97c5.28,0,8-1.99,8-7.16s-2.72-7.160-8-7.160h-10.97Z"/></svg></svg>`;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!loadLeaflet.p) {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "assets/vendor/leaflet/leaflet.css"; document.head.append(css);
    loadLeaflet.p = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "assets/vendor/leaflet/leaflet.js"; s.onload = () => res(window.L); s.onerror = rej; document.head.append(s); });
  }
  return loadLeaflet.p;
}

/** mount the map into `el` once it is near the viewport; options: { zoom, color } */
export function mountLocationMap(el, { zoom = 16, color = "#c4372b", pois = null } = {}) {
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
      // numbered points of interest; the view fits the site and all of them
      if (pois?.length) {
        pois.forEach((p, i) => L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "mappoi", html: `<span>${poiIcon(p.icon)}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }), title: p.name })
          .addTo(map).bindPopup(`<b>${p.name}</b><br>${p.cat} · ${p.km.toLocaleString("cs-CZ")} km vzdušnou čarou`));
        map.fitBounds(L.latLngBounds([[lat, lon], ...pois.map((p) => [p.lat, p.lon])]), { padding: [36, 36] });
      }
    }).catch(() => { el.innerHTML = `<p class="muted contacts__mapfail">Mapu se nepodařilo načíst.</p>`; });
  }, { rootMargin: "200px" }).observe(el);
}
