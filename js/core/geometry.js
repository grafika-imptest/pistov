export const centroid = (pts) => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);

export function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export const unionBox = (boxes) => bbox(boxes.flatMap((b) => [[b.x, b.y], [b.x + b.w, b.y + b.h]]));
export const toPoints = (pts) => pts.map((p) => `${+p[0].toFixed(1)},${+p[1].toFixed(1)}`).join(" ");
export const toPath = (pts, close = true) => pts.map((p, i) => `${i ? "L" : "M"}${+p[0].toFixed(1)} ${+p[1].toFixed(1)}`).join("") + (close ? "Z" : "");

export function applyH(h, [x, y]) {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}
/** CSS matrix3d() string for a 2D homography (row-major 3×3), optionally pre-scaling the source. */
export function homographyToCss(h, s = 1) {
  const m = [h[0] * s, h[1] * s, h[2], h[3] * s, h[4] * s, h[5], h[6] * s, h[7] * s, h[8]];
  return `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, m[8]].join(",")})`;
}
/** bearing (deg, clockwise from screen-up) of plan north as seen in a view given by homography h */
export function northBearing(h, at) {
  const a = applyH(h, at), b = applyH(h, [at[0], at[1] - 200]);
  return (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI;
}
export const polyArea = (p) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;

/** smallest enclosing rectangle of a polygon (rotating calipers over the convex hull) → { w, h } with w ≤ h */
export function minRect(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
  let best = null;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!len) continue;
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const q of hull) { const u = q[0] * ux + q[1] * uy, v = -q[0] * uy + q[1] * ux; minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
    const w = maxU - minU, h = maxV - minV;
    if (!best || w * h < best.w * best.h) best = { w, h };
  }
  return best ? { w: Math.min(best.w, best.h), h: Math.max(best.w, best.h) } : null;
}
