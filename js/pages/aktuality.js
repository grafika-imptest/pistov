import { renderChrome } from "../site/chrome.js";
import { news } from "../projects/pistov/content.js";
import { newsCard } from "../site/ui.js";

renderChrome({ page: "aktuality", solid: true });
const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));
document.querySelector("[data-news]").innerHTML = sorted.map((n, i) => newsCard(n, { big: i === 0 })).join("");
