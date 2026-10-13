// Test fixtures – only active with ?fixture=… in the URL. Never used in normal operation.
// ?fixture=timelapse : gives variant A-m1 an image-sequence "timelapse" generated from catalogue images
//                      (tests/fixtures/timelapse-A/), to exercise the real playback path before the real
//                      animations exist. It is a technical test asset, not a construction animation.
export function applyFixtures(project, name) {
  if (name !== "timelapse") return;
  const v = project.houseVariants.find((x) => x.id === "A-m1");
  const frames = Array.from({ length: 24 }, (_, i) => `tests/fixtures/timelapse-A/f${String(i).padStart(2, "0")}.webp`);
  v.timelapse = { kind: "frames", fps: 12, frames, poster: frames[0] };
  console.info("[fixture] A-m1 uses test frame sequence");
}
