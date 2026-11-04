// Home hero film, drawn live on a canvas in a loop: a drone glides over the bare plots of the bird's-eye
// visualisation, the houses rise as wireframes in a wave along the flight and get their textures, the camera pulls
// back over the finished quarter, then two house types in detail. Built from the same render as the aerial view
// (tools/build-hero-film.mjs), so every house stands exactly where the architects drew it.
import { filmHouses, filmAtlas } from "../projects/pistov/film.generated.js";

const IMG = "assets/img/";
const LOOP = 24;
const SITE_CAP = "Vizualizace lokality · 11/2026";
const DETAILS = [
  { src: `${IMG}A-garden-larch-1600.webp`, cap: "Typový dům A · inspirace", from: [0.55, 0.55, 1.04], to: [0.45, 0.5, 1.16] },
  { src: `${IMG}C-mat-white-dark-1600.webp`, cap: "Typový dům C · inspirace", from: [0.4, 0.5, 1.16], to: [0.56, 0.48, 1.05] },
];
// drone: [t, centre x, centre y (fractions of the image), zoom over "cover", rotation °]
const CAM = [[0, 0.3, 0.4, 2.1, -2], [6, 0.47, 0.48, 1.7, -1], [11, 0.55, 0.55, 1.25, 0], [15.5, 0.52, 0.52, 1.08, 0]];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const out = (t) => 1 - (1 - t) ** 3;
const load = (src) => { const i = new Image(); i.decoding = "async"; i.src = src; return i.decode().then(() => i); };

function camAt(t) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], k = ease(clamp((t - a[0]) / (b[0] - a[0])));
  return a.slice(1).map((v, j) => v + (b[j + 1] - v) * k);
}

export function mountHeroFilm({ root, still, caption }) {
  const canvas = document.createElement("canvas");
  canvas.className = "s-hero__film"; canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, imgs = null, t = 0, last = 0, raf = 0, visible = true, cap = "";

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.round(root.clientWidth * dpr); H = Math.round(root.clientHeight * dpr);
    canvas.width = W; canvas.height = H;
  };
  const setCap = (c) => { if (c !== cap && caption) { cap = c; caption.textContent = c; } };

  // houses grow in a wave along the flight (start → end of the camera path), a little jitter so it feels built
  const dir = [CAM.at(-2)[1] - CAM[0][1], CAM.at(-2)[2] - CAM[0][2]], dl = Math.hypot(...dir);
  const proj = filmHouses.map(([, , , , , x, y, w, h]) => ((x + w / 2 - CAM[0][1]) * dir[0] + (y + h / 2 - CAM[0][2]) * dir[1]) / dl);
  const pMin = Math.min(...proj), pMax = Math.max(...proj);
  const start = filmHouses.map((hs, i) => 2 + 7.2 * ((proj[i] - pMin) / (pMax - pMin)) + ((hs[0] * 37) % 10) / 25);

  function siteFrame(st, alpha) {
    const { empty, built, wire, houses } = imgs, IW = empty.naturalWidth, IH = empty.naturalHeight;
    let [cx, cy, z, rot] = camAt(st);
    if (W < H) z = 1 + (z - 1) * 0.35; // portrait: the cover scale is already close
    const s = Math.max(W / IW, H / IH) * z;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2); ctx.rotate((rot * Math.PI) / 180); ctx.scale(s, s); ctx.translate(-cx * IW, -cy * IH);
    const builtA = clamp((st - 12) / 1.2);
    if (builtA < 1) {
      ctx.drawImage(empty, 0, 0, IW, IH);
      // a cool, slightly darker "blueprint" light while the wireframes stand
      const tint = 0.28 * clamp((st - 1.2) / 1.2) * (1 - clamp((st - 8.5) / 3));
      if (tint > 0) { ctx.fillStyle = `rgba(14, 26, 38, ${tint})`; ctx.fillRect(0, 0, IW, IH); }
      const f = [IW, IH];
      filmHouses.forEach(([, sx, sy, sw, sh, x, y, w, h], i) => {
        const r = st - start[i]; if (r <= 0) return;
        const dx = x * f[0], dy = y * f[1], dw = w * f[0], dh = h * f[1];
        const p = out(clamp(r / 1.1)), wireA = 1 - clamp((r - 1.7) / 0.9), texA = clamp((r - 1.15) / 0.9);
        if (wireA > 0 && p > 0) {
          ctx.globalAlpha = alpha * wireA;
          ctx.drawImage(wire, sx, sy + sh * (1 - p), sw, sh * p, dx, dy + dh * (1 - p), dw, dh * p);
          if (p < 1) { // the rising front
            const fy = dy + dh * (1 - p), lw = Math.max(1.2, dh * 0.012);
            ctx.globalAlpha = alpha * (1 - p) * 0.9; ctx.fillStyle = "#e6f4ff"; ctx.fillRect(dx + dw * 0.04, fy - lw / 2, dw * 0.92, lw);
          }
        }
        if (texA > 0) { ctx.globalAlpha = alpha * texA; ctx.drawImage(houses, sx, sy, sw, sh, dx, dy, dw, dh); }
      });
      ctx.globalAlpha = alpha * builtA;
    }
    if (builtA > 0) ctx.drawImage(built, 0, 0, IW, IH);
    ctx.restore();
  }

  function detailFrame(d, k, alpha) {
    const img = d.img, IW = img.naturalWidth, IH = img.naturalHeight, e = ease(clamp(k));
    const [cx, cy, z] = d.from.map((v, j) => v + (d.to[j] - v) * e), s = Math.max(W / IW, H / IH) * z;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2); ctx.scale(s, s);
    ctx.translate(-clamp(cx, W / s / IW / 2, 1 - W / s / IW / 2) * IW, -clamp(cy, H / s / IH / 2, 1 - H / s / IH / 2) * IH);
    ctx.drawImage(img, 0, 0); ctx.restore();
  }

  function frame(tt) {
    ctx.clearRect(0, 0, W, H);
    // 0–15.5 site · 15–19.5 house A · 19–23.5 house C · 23–24 back to the bare plots (= t 0)
    const x1 = clamp((tt - 15) / 0.8), x2 = clamp((tt - 19) / 0.8), x3 = clamp((tt - 23) / 1);
    if (x1 < 1) siteFrame(tt, 1);
    if (tt >= 15 && x2 < 1) detailFrame(DETAILS[0], (tt - 15) / 4.5, x1);
    if (tt >= 19 && x3 < 1) detailFrame(DETAILS[1], (tt - 19) / 4.5, x2);
    if (x3 > 0) siteFrame(0, x3);
    setCap(tt >= 15.4 && tt < 19.4 ? DETAILS[0].cap : tt >= 19.4 && tt < 23.5 ? DETAILS[1].cap : SITE_CAP);
  }

  const tick = (now) => {
    raf = 0; if (!visible || document.hidden) { last = 0; return; }
    if (last) t = (t + Math.min(0.1, (now - last) / 1000)) % LOOP;
    last = now; frame(t); raf = requestAnimationFrame(tick);
  };
  const play = () => { if (!raf && imgs) raf = requestAnimationFrame(tick); };

  const big = Math.max(screen.width, screen.height) * Math.min(2, window.devicePixelRatio || 1) > 1800;
  Promise.all([
    load(`${IMG}aerial-empty-${big ? 3400 : 2200}.webp`), load(`${IMG}aerial-${big ? 3400 : 2200}.webp`),
    load(`${IMG}film-wire.webp`), load(`${IMG}film-houses.webp`), ...DETAILS.map((d) => load(d.src)),
  ]).then(([empty, built, wire, houses, ...det]) => {
    imgs = { empty, built, wire, houses }; det.forEach((img, i) => (DETAILS[i].img = img));
    resize(); frame(0);
    root.append(canvas); requestAnimationFrame(() => canvas.classList.add("is-on"));
    still?.classList.add("is-under");
    new ResizeObserver(() => { resize(); frame(t); }).observe(root);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); }).observe(root);
    document.addEventListener("visibilitychange", play);
    // review hook: heroFilm.seek(12) freezes the film at 12 s (heroFilm.seek() plays on)
    window.heroFilm = { seek: (v) => { if (v == null) { visible = true; play(); return; } visible = false; t = v % LOOP; frame(t); } };
    play();
  }).catch(() => canvas.remove());
}
