// Sales people, the project schedule and pictogram lists – shared by the home page and the subpages.
import { site, schedule } from "../projects/pistov/content.js";
import { img, srcset, esc } from "./ui.js";
import { poiIcon } from "./poi-icons.js";

const tel = (p) => `<a href="tel:${p.replace(/\s/g, "")}">${esc(p)}</a>`;

/** contact card with photo, role, phone and e-mail */
export const personCard = (p, cls = "person") => `<article class="${cls}">
  <img class="person__photo" src="${img(p.photo, "m")}" srcset="${srcset(p.photo)}" sizes="160px" alt="${esc(p.name)}" width="480" height="600" loading="lazy" decoding="async">
  <div class="person__body"><h3 class="person__name">${esc(p.name)}</h3><p class="person__role">${esc(p.role)}</p>
  <p class="person__lines">${tel(p.phone)}<br><a href="mailto:${p.email}">${esc(p.email)}</a></p></div>
</article>`;
export const peopleCards = (cls) => site.contacts.map((p) => personCard(p, cls)).join("");
export const personByEmail = (email) => site.contacts.find((p) => p.email === email);

/** schedule milestones; the first one not yet in the past is marked as the current step */
export function scheduleItems() {
  const now = new Date(), key = (d) => { const [m, y] = d.split("/").map(Number); return y * 12 + m; };
  const cur = schedule.findIndex((s) => key(s.date) >= now.getFullYear() * 12 + now.getMonth() + 1);
  return schedule.map((s, i) => `<li class="plan__step${i === cur ? " is-now" : ""}${i < cur ? " is-done" : ""}">
    <span class="plan__date">${esc(s.date)}</span><span class="plan__dot" aria-hidden="true"></span>
    <h3 class="plan__title">${esc(s.title)}</h3><p class="plan__text">${esc(s.text)}</p>${i === cur ? '<span class="plan__now">Právě teď</span>' : ""}
  </li>`).join("");
}

/** pictogram tile: icon, title and one short line */
export const pictoItem = ({ icon, title, info, todo }) => `<li class="picto__item${todo ? " is-todo" : ""}"><span class="picto__ic">${poiIcon(icon)}</span><b>${esc(title)}</b><span>${esc(info)}</span></li>`;
