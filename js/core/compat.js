// Plot ↔ house compatibility engine. Data-driven: see projects/<name>/plotHouseCompatibility.js.

export const SELLABLE = new Set(["available"]);

/** @returns {{type: object, allowed: boolean, reason: string|null}[]} */
export function typesForPlot(project, plot) {
  const { rules = [], overrides = {} } = project.compatibility;
  return project.houseTypes.map((type) => {
    if (!plot) return { type, allowed: true, reason: null };
    const table = overrides[plot.no];
    if (table) return { type, allowed: table.includes(type.id), reason: table.includes(type.id) ? null : "Podle tabulky přiřazení není tento typ na parcele povolen." };
    const failed = rules.find((r) => r.types.includes(type.id) && !r.test(plot));
    return { type, allowed: !failed, reason: failed ? failed.reason : null };
  });
}

export function isAllowed(project, plot, typeId) {
  if (!plot || !typeId) return true;
  return typesForPlot(project, plot).find((t) => t.type.id === typeId)?.allowed ?? false;
}

export function plotsForType(project, typeId) {
  return project.plots.filter((p) => isAllowed(project, p, typeId));
}

export const canConfigure = (plot) => !!plot && SELLABLE.has(plot.status);
