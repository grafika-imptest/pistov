import { renderChrome } from "../site/chrome.js";
import { news } from "../projects/pistov/content.js";
import { newsCard, img, srcset, esc, dateLabel } from "../site/ui.js";

renderChrome({ page: "aktuality", solid: true });
const slug = new URLSearchParams(location.search).get("id");
const n = news.find((x) => x.slug === slug) || [...news].sort((a, b) => b.date.localeCompare(a.date))[0];
document.title = `${n.title} — Pístov`;
document.querySelector("[data-article]").innerHTML = `
  <nav class="crumbs" aria-label="Drobečková navigace"><a href="index.html">Pístov</a><span aria-hidden="true">/</span><a href="aktuality.html">Aktuality</a><span aria-hidden="true">/</span><span>${esc(n.title)}</span></nav>
  <p class="article__meta"><time datetime="${n.date}">${dateLabel(n)}</time> · ${esc(n.category)}</p>
  <h1 class="article__title">${esc(n.title)}</h1>
  <p class="article__perex">${esc(n.perex)}</p>
  <figure class="article__img"><img src="${img(n.image, "l")}" srcset="${srcset(n.image)}" sizes="(min-width: 1000px) 70vw, 100vw" alt=""></figure>
  <div class="article__body">${n.body.map((p) => `<p>${esc(p)}</p>`).join("")}
    ${n.cta ? `<p><a class="btn btn--ink" href="${n.cta.href}">${esc(n.cta.label)} <span aria-hidden="true">→</span></a></p>` : ""}
    <p><a class="link" href="aktuality.html">← Zpět na aktuality</a></p>
  </div>`;
document.querySelector("[data-news-more]").innerHTML = news.filter((x) => x !== n).map((x) => newsCard(x)).join("");
