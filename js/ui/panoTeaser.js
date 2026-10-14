// Section "Lokalita": a calm 360° teaser of today's site (60 m above the centre), turned towards the ponds
// and fields. Loaded only when it scrolls into view; slow auto-rotation only while visible.
import { PanoramaViewer } from "../core/panorama.js";
import { reducedMotion } from "../core/motion.js";

export class PanoTeaser {
  constructor(root, app) {
    if (!root) return;
    this.root = root; this.app = app;
    const P = app.project;
    this.station = P.panoramas.find((s) => s.id === "stred-60") || P.panoramas[0];
    root.querySelector("[data-teaser-open]")?.addEventListener("click", () => {
      app.scrollToExplorer();
      app.openPano(this.station.id);
    });
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { this._init(); this.viewer?.autoRotate(); }
      else this.viewer?.stopAuto?.();
    }, { rootMargin: "200px 0px", threshold: 0.15 });
    io.observe(root);
  }
  _init() {
    if (this.viewer) return;
    const host = this.root.querySelector("[data-teaser-gl]");
    this.viewer = new PanoramaViewer(host, {
      stations: this.app.project.panoramas, geo: this.app.project.planGeoref, plots: this.app.project.plots, interactive: false, wheelNeedsModifier: true,
    });
    this.viewer.setStation(this.station, { yaw: 35, pitch: -9, fov: 64 }, { animate: false });
    this.viewer.setState({ statusOf: this.app.statusOf });
    if (reducedMotion()) return;
    // resume auto-rotation a while after the visitor stops dragging
    host.addEventListener("pointerup", () => { clearTimeout(this._t); this._t = setTimeout(() => this.viewer.autoRotate(), 4000); });
  }
}
