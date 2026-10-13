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
