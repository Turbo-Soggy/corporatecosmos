// Shared company search, used by both the live SearchSpotlight (HUD input) and the dim/blaze
// treatment in CompanyNodes, so the DOM filter and the 3D highlight never disagree.

export function searchText(meta) {
  return `${meta.name ?? ''} ${meta.fullName ?? ''} ${meta.category ?? ''} ${meta.sector ?? ''} ${meta.region ?? ''}`.toLowerCase();
}

/** Set of matching indices, or null when the query is empty (= no active search). */
export function matchIndices(metaArr, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return null;
  const set = new Set();
  for (let i = 0; i < metaArr.length; i++) {
    if (searchText(metaArr[i]).includes(q)) set.add(i);
  }
  return set;
}
