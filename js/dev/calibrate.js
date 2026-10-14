// DEV ONLY (?kalibrace=1, local dev server): overlays OpenStreetMap ponds in the 360° view so the
// heading of each panorama can be tuned with [ and ] (±0.5°) / { and } (±5°). Reads podklady/, which is
// not deployed. Print the result with __pistov.calibration().
const NS = "http://www.w3.org/2000/svg";

export async function startCalibration(app, explorer) {
  const osm = await fetch("podklady/panorama/osm-water.json").then((r) => r.json()).catch(() => null);
  if (!osm) { console.warn("[kalibrace] podklady/panorama/osm-water.json not available"); return; }
  const g = app.project.planGeoref;
  const toM = (lat, lon) => [(lon - g.ref[1]) * g.mLon, (lat - g.ref[0]) * g.mLat];
  const ponds = osm.elements.map((e) => e.geometry.map((p) => toM(p.lat, p.lon)));
  const hud = document.createElement("p"); hud.className = "toast is-on"; hud.style.top = "auto"; hud.style.bottom = "90px";
  explorer.root.append(hud);

  const hook = () => {
    const pano = explorer.pano; if (!pano?.station) return;
    let layer = pano.svg.querySelector(".calib");
    if (!layer) { layer = document.createElementNS(NS, "g"); layer.setAttribute("class", "calib"); pano.svg.append(layer); ponds.forEach(() => { const p = document.createElementNS(NS, "path"); p.setAttribute("fill", "none"); p.setAttribute("stroke", "#00e5ff"); p.setAttribute("stroke-width", "2.5"); layer.append(p); }); }
    const b = pano._basis();
    ponds.forEach((poly, i) => {
      const cam = pano._clip(poly.map((q) => pano._cam(b, q)));
      layer.children[i].setAttribute("d", cam.length > 2 ? cam.map((c, j) => { const s = pano._scr(b, c); return `${j ? "L" : "M"}${s[0].toFixed(1)} ${s[1].toFixed(1)}`; }).join("") + "Z" : "");
    });
    hud.textContent = `KALIBRACE · ${pano.station.id} · heading ${pano.station.heading.toFixed(1)}° · [ ] ±0,5° · { } ±5°`;
  };
  const prev = explorer.pano?.o.onChange;
  const wire = () => { const p = explorer.pano; if (!p || p._calib) return; p._calib = true; const orig = p.o.onChange; p.o.onChange = (v) => { orig?.(v); hook(); }; p.render(); };
  setInterval(wire, 500); void prev;
  document.addEventListener("keydown", (e) => {
    const pano = explorer.pano; if (!pano?.station) return;
    const d = { "[": -0.5, "]": 0.5, "{": -5, "}": 5 }[e.key]; if (!d) return;
    pano.station.heading = (pano.station.heading + d + 360) % 360; pano.render();
  });
  window.__pistov.calibration = () => Object.fromEntries(app.project.panoramas.map((s) => [s.id, s.heading]));
  console.info("[kalibrace] ready");
}
