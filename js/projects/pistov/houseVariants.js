// Exterior / material variants – one entry per architectural visualisation in the catalogue.
// Names describe what is visible in the render (catalogue only titles the page "Variace materiálového řešení").
//
// timelapse: construction animation supplied by the visualisation team. Not delivered yet → null.
// Supported shapes (see js/core/timelapse.js):
//   { kind: "video",  src: "assets/timelapse/A-m1.mp4", srcWebm?: "...webm", poster: "assets/timelapse/A-m1-empty.webp", final?: "...webp" }
//   { kind: "frames", frames: ["…/0001.webp", …], fps: 24, final?: "…" }
// The first frame is expected to show the empty plot, the last one the finished house from the same camera.

export const houseVariants = [
  // --- Dům A ---
  { id: "A-m1", type: "A", name: "Omítka · pálená taška · šedé dřevo", swatches: ["#f1eee8", "#b4502f", "#8d867b"], images: ["A-garden-warm", "A-street"], timelapse: null },
  { id: "A-m2", type: "A", name: "Omítka · tmavá krytina · modřín", swatches: ["#f1eee8", "#3a3d42", "#b07a45"], images: ["A-garden-larch"], timelapse: null },
  { id: "A-m3", type: "A", name: "Omítka · pálená taška", swatches: ["#f3f1ec", "#b8532f", "#f3f1ec"], images: ["A-mat-white-tile"], timelapse: null },
  { id: "A-m4", type: "A", name: "Světlá cihla · tmavá krytina", swatches: ["#d9cdb4", "#3a3d42", "#d9cdb4"], images: ["A-mat-sandbrick"], timelapse: null },
  { id: "A-m5", type: "A", name: "Bílá cihla · světlý plech", swatches: ["#ece8df", "#cfd2d3", "#ece8df"], images: ["A-mat-lightbrick"], timelapse: null },
  { id: "A-m6", type: "A", name: "Režná cihla · světlý plech", swatches: ["#9a4a32", "#cfd2d3", "#9a4a32"], images: ["A-mat-redbrick"], timelapse: null },
  // --- Dům B ---
  { id: "B-m1", type: "B", name: "Režná cihla · tmavá krytina", swatches: ["#a0583d", "#3a3d42", "#b07a45"], images: ["B-garden-brick"], timelapse: null },
  { id: "B-m2", type: "B", name: "Omítka · pálená taška", swatches: ["#f3f1ec", "#b8532f", "#f3f1ec"], images: ["B-mat-white-tile"], timelapse: null },
  { id: "B-m3", type: "B", name: "Omítka · tmavá krytina · dřevo", swatches: ["#f3f1ec", "#3a3d42", "#a8743f"], images: ["B-mat-white-larch"], timelapse: null },
  // --- Dům C ---
  { id: "C-m1", type: "C", name: "Omítka · pálená taška", swatches: ["#f3f1ec", "#b8532f", "#a8743f"], images: ["C-garden-white-tile"], timelapse: null },
  { id: "C-m2", type: "C", name: "Režná cihla · tmavá krytina", swatches: ["#9c4b33", "#3a3d42", "#a8743f"], images: ["C-mat-redbrick"], timelapse: null },
  { id: "C-m3", type: "C", name: "Omítka · tmavá krytina", swatches: ["#f3f1ec", "#3a3d42", "#a8743f"], images: ["C-mat-white-dark"], timelapse: null },
  // --- Dům D ---
  { id: "D-m1", type: "D", name: "Bílá omítka", swatches: ["#f3f1ec", "#e9e6df", "#a8743f"], images: ["D-garden-white"], timelapse: null },
  { id: "D-m2", type: "D", name: "Světlá cihla", swatches: ["#e7e3da", "#cfcac0", "#a8743f"], images: ["D-mat-lightbrick"], timelapse: null },
  { id: "D-m3", type: "D", name: "Režná cihla", swatches: ["#a3533a", "#8f4430", "#a8743f"], images: ["D-mat-redbrick"], timelapse: null },
];
