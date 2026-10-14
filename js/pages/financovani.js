import { renderChrome } from "../site/chrome.js";
import { financing } from "../projects/pistov/content.js";
import { esc } from "../site/ui.js";

renderChrome({ page: "financovani", solid: true });
const ex = financing.calculator.example;
const fmt = (v) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Math.round(v));

document.querySelector("[data-financing]").innerHTML = `
  <div class="wrap">
    <p class="notice">${esc(financing.pending)}</p>
    <div class="sechead sechead--tight" id="postup"><div><p class="eyebrow">Postup</p><h2 class="h2">Od výběru parcely <em>po stěhování</em></h2></div><p class="lead">${esc(financing.stepsNote)}</p></div>
    <ol class="steps steps--six">${financing.steps.map((s, i) => `<li class="step"><span class="step__no">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("")}</ol>
  </div>
  <div class="calcwrap section--paper">
    <div class="wrap calc">
      <div>
        <p class="eyebrow">Hypoteční kalkulačka</p>
        <h2 class="h2">Kolik budete <em>měsíčně splácet?</em></h2>
        <p class="lead">Zadejte cenu pozemku a domu, vlastní zdroje a úrokovou sazbu. Výpočet je orientační (anuitní splátka) a nezahrnuje poplatky ani pojištění.</p>
        <p class="hint">Předvyplněné hodnoty jsou jen příklad – nejde o ceny projektu Pístov.</p>
      </div>
      <form class="calc__form" data-calc novalidate>
        <div class="field"><label for="c-price">Cena pozemku a domu</label><div class="field__unit"><input id="c-price" name="price" inputmode="numeric" value="${fmt(ex.price)}"><span>Kč</span></div></div>
        <div class="field"><label for="c-own">Vlastní zdroje</label><div class="field__unit"><input id="c-own" name="own" inputmode="numeric" value="${fmt(ex.own)}"><span>Kč</span></div></div>
        <div class="field-row">
          <div class="field"><label for="c-rate">Úroková sazba</label><div class="field__unit"><input id="c-rate" name="rate" inputmode="decimal" value="${String(ex.rate).replace(".", ",")}"><span>% p. a.</span></div></div>
          <div class="field"><label for="c-years">Doba splácení</label><div class="field__unit"><input id="c-years" name="years" type="range" min="5" max="35" value="${ex.years}"><output name="yearsOut">${ex.years} let</output></div></div>
        </div>
        <div class="calc__result" aria-live="polite">
          <p class="calc__label">Měsíční splátka</p><p class="calc__value" data-calc-pay>—</p>
          <dl class="calc__dl"><div><dt>Výše úvěru</dt><dd data-calc-loan>—</dd></div><div><dt>LTV</dt><dd data-calc-ltv>—</dd></div><div><dt>Zaplatíte celkem</dt><dd data-calc-total>—</dd></div></dl>
          <p class="hint" data-calc-warn></p>
        </div>
        <a class="btn btn--red btn--block" href="kontakty.html#formular">Chci pomoct s financováním <span aria-hidden="true">→</span></a>
      </form>
    </div>
  </div>`;

const f = document.querySelector("[data-calc]");
const num = (s) => Number(String(s).replace(/\s| /g, "").replace(",", ".")) || 0;
function calc() {
  const price = num(f.price.value), own = num(f.own.value), rate = num(f.rate.value) / 100 / 12, n = Number(f.years.value) * 12;
  f.yearsOut.value = `${f.years.value} let`;
  const loan = Math.max(0, price - own);
  const pay = rate ? (loan * rate) / (1 - Math.pow(1 + rate, -n)) : loan / n;
  document.querySelector("[data-calc-pay]").textContent = loan ? `${fmt(pay)} Kč` : "—";
  document.querySelector("[data-calc-loan]").textContent = `${fmt(loan)} Kč`;
  const ltv = price ? (loan / price) * 100 : 0;
  document.querySelector("[data-calc-ltv]").textContent = `${Math.round(ltv)} %`;
  document.querySelector("[data-calc-total]").textContent = loan ? `${fmt(pay * n)} Kč` : "—";
  document.querySelector("[data-calc-warn]").textContent = ltv > 80 ? "Banky obvykle půjčují do 80 % hodnoty nemovitosti (u mladých žadatelů až do 90 %)." : "";
}
f.addEventListener("input", calc);
f.addEventListener("focusout", (e) => { if (["price", "own"].includes(e.target.name)) e.target.value = fmt(num(e.target.value)); });
calc();
