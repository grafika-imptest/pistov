import { renderChrome } from "../site/chrome.js";
import { pois, access } from "../projects/pistov/content.js";
import { poiList, poiPicto } from "../site/pois.js";
import { pictoItem } from "../site/people.js";
import { mountLocationMap } from "../site/map.js";

renderChrome({ page: "lokalita", solid: true });
const list = poiList();
document.querySelector("[data-poi-access]").innerHTML = access.map(pictoItem).join("");
document.querySelector("[data-poi-grid]").innerHTML = list.map(poiPicto).join("");
document.querySelector("[data-poi-note]").textContent = pois.note;
mountLocationMap(document.querySelector("[data-poi-map]"), { zoom: 15, color: "#b94a28", pois: list });
