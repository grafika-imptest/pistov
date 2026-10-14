// Display helpers for saved items (favourites / comparison) – shared by the subpages and the home page.
import { project } from "../projects/pistov/project.js";
import { describe } from "./collections.js";
import { typesForPlot } from "../core/compat.js";
import { esc, m2, STATUS } from "../ui/format.js";

export function itemInfo(it) {
  const d = describe(project, it);
  const { plot, type, layout, variant } = d;
  const title = [plot && `Parcela ${plot.no}`, type && type.name].filter(Boolean).join(" + ");
  const generic = it.kind === "house"; // a house type in general – not one layout / material
  const builtUpOf = (l) => (l && l.builtUpArea !== undefined ? l.builtUpArea : type.builtUpArea);
  const meta = generic ? [type.tagline, `${type.builtUpArea} m² obestavěná plocha`]
    : [plot && m2(plot.area), type && layout && layout.name, type && variant && variant.name].filter(Boolean);
  const q = [plot && `parcela=${plot.no}`, type && `dum=${type.id}`, it.layout && `dispozice=${it.layout}`, it.material && `material=${it.material}`, plot && type && "rezim=navrh"].filter(Boolean);
  const href = !plot && type ? `index.html?detail=${type.id}` : `index.html${q.length ? `?${q.join("&")}` : ""}#explorer`;
  const pic = type && variant ? variant.images[0] : null;
  const builtUp = type ? builtUpOf(generic ? null : layout) : null;
  const variantCount = type ? project.houseVariants.filter((v) => v.type === type.id).length : 0;
  const allowed = plot ? typesForPlot(project, plot).filter((t) => t.allowed).map((t) => t.type.id) : null;
  // background position that centres the plot in a crop of the aerial view (background-size 300 %, box 3:2)
  let planPos = "";
  if (plot) {
    const [W, H] = project.views.find((v) => v.id === "aerial").size, [x, y] = plot.label.aerial, S = 3, Hy = S * H / W, Hc = 2 / 3;
    const clamp = (v) => Math.min(100, Math.max(0, v * 100)).toFixed(1);
    planPos = `background-position: ${clamp((S * x / W - 0.5) / (S - 1))}% ${clamp((Hy * y / H - Hc / 2) / (Hy - Hc))}%`;
  }
  return { ...d, generic, planPos, variantCount, title, meta, href, pic, builtUp, allowed, kindLabel: it.kind === "plot" ? "Parcela" : it.kind === "house" ? "Typový dům" : "Kombinace" };
}

export const statusText = (plot) => STATUS[plot.status]?.long ?? plot.status;
export { esc, m2, project };
