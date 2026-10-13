// Hand-drawn annotation primitives (catalogue style: thin red ink + Caveat lettering).
// Lines are drawn on with stroke-dashoffset (pathLength = 1) when they get .is-drawn.

/** slightly irregular curved arrow from a to b, in a local SVG of given size */
export function arrowSVG({ w = 160, h = 90, from = [8, 12], to = [148, 78], bend = 0.35, cls = "" } = {}) {
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const cx = mx - dy * bend, cy = my + dx * bend;
  // arrow head aligned with the curve's end tangent
  const tx = to[0] - cx, ty = to[1] - cy, tl = Math.hypot(tx, ty);
  const ux = tx / tl, uy = ty / tl, s = 11;
  const h1 = [to[0] - ux * s - uy * s * 0.55, to[1] - uy * s + ux * s * 0.55];
  const h2 = [to[0] - ux * s + uy * s * 0.55, to[1] - uy * s - ux * s * 0.55];
  const f = (n) => n.toFixed(1);
  return `<svg class="sketch ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path pathLength="1" d="M${f(from[0])} ${f(from[1])} Q ${f(cx)} ${f(cy)} ${f(to[0])} ${f(to[1])}"/><path pathLength="1" d="M${f(h1[0])} ${f(h1[1])} L${f(to[0])} ${f(to[1])} L${f(h2[0])} ${f(h2[1])}"/></svg>`;
}

/** loose hand-drawn ellipse around something */
export function circleSVG({ w = 120, h = 60, cls = "" } = {}) {
  return `<svg class="sketch ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" preserveAspectRatio="none"><path pathLength="1" d="M${w * 0.55} ${h * 0.06} C ${w * 0.95} ${h * 0.02}, ${w * 1.02} ${h * 0.82}, ${w * 0.5} ${h * 0.94} C ${w * 0.08} ${h * 1.02}, ${w * -0.02} ${h * 0.3}, ${w * 0.38} ${h * 0.1} C ${w * 0.5} ${h * 0.05}, ${w * 0.62} ${h * 0.08}, ${w * 0.7} ${h * 0.12}"/></svg>`;
}

/** mark sketches inside root as drawn (replays the draw-on) */
export function draw(root) {
  root.querySelectorAll(".sketch").forEach((s) => { s.classList.remove("is-drawn"); void s.getBoundingClientRect(); s.classList.add("is-drawn"); });
}
