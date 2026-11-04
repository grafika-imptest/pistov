// Home hero reel: the AI clips play one after another and cross-dissolve into each other (also from the last back to
// the first), on two stacked <video> elements. Each clip may start later (`from`) to skip a still opening.
const XF = 0.8; // cross-dissolve, s

export function mountHeroReel(first, clips) {
  const second = first.cloneNode();
  first.after(second);
  const els = [first, second];
  for (const v of els) { v.muted = true; v.playsInline = true; v.preload = "auto"; v.style.transition = `opacity ${XF * 1000}ms linear`; }
  let i = 0, cur = first, next = second, fading = false, z = 1;

  const load = (v, clip) => new Promise((res) => {
    v.src = clip.src;
    v.addEventListener("loadedmetadata", () => { v.currentTime = clip.from || 0; res(); }, { once: true });
  });
  const endOf = (v, clip) => (clip.to ?? v.duration) - XF;

  const tick = () => {
    const clip = clips[i];
    if (!fading && cur.duration && cur.currentTime >= endOf(cur, clip)) {
      fading = true;
      next.style.zIndex = ++z; next.classList.add("is-on");
      next.play().catch(() => {});
      setTimeout(() => {
        cur.pause(); cur.classList.remove("is-on");
        [cur, next] = [next, cur]; i = (i + 1) % clips.length; fading = false;
        load(next, clips[(i + 1) % clips.length]);
      }, XF * 1000);
    }
  };

  load(cur, clips[0]).then(() => cur.play()).catch(() => {});
  cur.addEventListener("playing", () => { cur.classList.add("is-on"); }, { once: true });
  load(next, clips[1]);
  let timer = setInterval(tick, 100);

  // play only while the hero is on screen
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) { cur.play().catch(() => {}); if (fading) next.play().catch(() => {}); timer = setInterval(tick, 100); }
    else els.forEach((v) => v.pause());
  }).observe(first.parentElement);
}
