// Which house types may be placed on which plot.
//
// !!! DEMO RULES – NOT CONFIRMED. The developer/architect will supply the permitted types
// per plot. Until then these transparent placeholder rules demonstrate the behaviour of the configurator.
// Replace `rules` / `overrides` with the confirmed table; the engine (js/core/compat.js) stays the same.

export const plotHouseCompatibility = {
  confirmed: false,
  note: "Pravidla přiřazení domů k parcelám jsou ukázková – potvrdí je developer a architekt.",
  // A rule removes the listed types from plots where `test(plot)` is false.
  rules: [
    { id: "area-A", types: ["A"], test: (plot) => plot.area >= 560, reason: "Ukázkové pravidlo: nejdelší dům A (17 m) jen na parcely od 560 m²." },
    { id: "area-D", types: ["D"], test: (plot) => plot.area >= 540, reason: "Ukázkové pravidlo: dům D jen na parcely od 540 m²." },
  ],
  // Explicit per-plot table (plot number → permitted type ids). Takes precedence over `rules`.
  overrides: {},
};
