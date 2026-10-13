export const STATUS = {
  available: { label: "volná", long: "Volná – k prodeji", short: "V" },
  reserved: { label: "rezervovaná", long: "Rezervovaná", short: "R" },
  sold: { label: "prodaná", long: "Prodaná", short: "P" },
};
export const statusLabel = (s) => STATUS[s]?.label ?? s;
export const m2 = (v) => (v == null ? "—" : `${new Intl.NumberFormat("cs-CZ").format(v)} m²`);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

export function statusBadge(status) {
  return `<span class="badge badge--${status}"><i class="sw sw--${status}" aria-hidden="true"></i>${STATUS[status]?.long ?? status}</span>`;
}
