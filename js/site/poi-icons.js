// Line icons for points of interest (24px grid, stroke = currentColor), keyed by pois.items[].icon.
const I = {
  city: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5"/>',
  health: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
  shop: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  school: '<path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/><path d="M6 11.5V16c3.5 2.3 8.5 2.3 12 0v-4.5M22 9.5V15"/>',
  kids: '<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><rect x="8.5" y="4" width="7" height="7" rx="1"/>',
  bus: '<rect x="5" y="3" width="14" height="15" rx="2.5"/><path d="M5 11h14M8 18v3M16 18v3M8.5 14.5h.01M15.5 14.5h.01"/>',
  mall: '<path d="M3 10h18M4 10l1.5-5h13L20 10v10H4Z"/><path d="M9 20v-5h6v5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M8.5 12l3.5-4 3 2 2.5 2.5M12 8l-1 6"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4M3 16h18v2.5H3Z"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/><path d="M5 12h14"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h6l2 7M10 9l3 7H6M14.5 6H17"/>',
};
export const poiIcon = (key) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[key] || I.city}</svg>`;
