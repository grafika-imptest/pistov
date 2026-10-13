// Indicative price summary. Never fabricates a value – missing prices are reported as missing.

const fmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
export const formatPrice = (v, cur = "Kč") => `${fmt.format(v)} ${cur}`;

export function priceSummary(project, { plot, type, layout }) {
  const plotPrice = plot?.price ?? null;
  const housePrice = layout?.price ?? type?.price ?? null;
  const lines = [
    { key: "plot", label: plot ? `Pozemek č. ${plot.no}` : "Pozemek", value: plotPrice, missing: plot ? project.pricing.plotPriceNote : "Vyberte parcelu" },
    { key: "house", label: type ? `${type.name}${layout ? ` – ${layout.name.toLowerCase()}` : ""}` : "Dům", value: housePrice, missing: type ? project.pricing.housePriceNote : "Vyberte dům" },
  ];
  const complete = plotPrice != null && housePrice != null;
  return {
    lines,
    complete,
    total: complete ? plotPrice + housePrice : null,
    note: complete ? project.pricing.disclaimer : "Souhrn je zatím neúplný – ceny pozemků a orientační ceny domů doplní developer. Celkovou cenu vám sdělíme v odpovědi na poptávku.",
  };
}
