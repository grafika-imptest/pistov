// Line icons for points of interest (24px grid, stroke = currentColor), keyed by pois.items[].icon.
const I = {
  city: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5"/>',
  health: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
  shop: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  school: '<path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/><path d="M6 11.5V16c3.5 2.3 8.5 2.3 12 0v-4.5M22 9.5V15"/>',
  kids: '<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><rect x="8.5" y="4" width="7" height="7" rx="1"/>',
  bus: '<rect x="5" y="3" width="14" height="15" rx="2.5"/><path d="M5 11h14M8 18v3M16 18v3M8.5 14.5h.01M15.5 14.5h.01"/>',
  train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 10h12M9 21l1.5-4M15 21l-1.5-4"/>',
  swim: '<path d="M2 19c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 14.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><circle cx="16.5" cy="6" r="2"/><path d="M7 11.5 11 8l3 3"/>',
  zoo: '<circle cx="6.5" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14.5" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M7.5 17.5c0-3 2-5.5 4.5-5.5s4.5 2.5 4.5 5.5c0 1.8-2 2.5-4.5 2.5s-4.5-.7-4.5-2.5Z"/>',
};
export const poiIcon = (key) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[key] || I.city}</svg>`;
