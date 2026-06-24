import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const TEX_SIZE = 128;

/**
 * Derive a clean domain from a website url. Kept for the HUD / future "hint the corporate
 * identity" treatments; no longer used to fetch textures. null if unparseable / non-domain.
 */
export function domainFromUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s || /^(na|n\/a|none|tbd|-)$/i.test(s)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, '').replace(/\s+/g, '').toLowerCase();
    if (!host || !host.includes('.')) return null;
    return host;
  } catch {
    return null;
  }
}

/** Procedural node face: first letter of the company on a dark, sector-tinted disc. */
function makeLetterTexture(name, sectorHex) {
  const c = document.createElement('canvas');
  c.width = c.height = TEX_SIZE;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const letter = ((name && name.trim()[0]) || '?').toUpperCase();
  ctx.fillStyle = sectorHex || '#94a3b8';
  ctx.font = '700 72px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, TEX_SIZE / 2, TEX_SIZE / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** No-op: textures are now 100% procedural (kept so CompanyNodes' import stays stable). */
export function disposeLogoCache() {}

/**
 * Returns a procedural per-node texture (sector-tinted letter disc).
 *
 * Remote logo fetching was removed after runtime verification: every free source is unusable
 * as a WebGL texture — Clearbit's API is DNS-dead, and Google favicons / corporate CDNs / a
 * CORS image proxy all either lack `Access-Control-Allow-Origin` or fail under the 118-request
 * burst, so the chain only ever produced failed requests before falling back to this letter.
 * Going pure-procedural keeps the GPU cold and the scene instant. `logoUrl`/`domain` are
 * accepted (and ignored) so the call sites don't change.
 */
export function useLogoTexture({ name, sectorHex }) {
  const texRef = useRef(null);
  const [texture] = useState(() => {
    const t = makeLetterTexture(name, sectorHex);
    texRef.current = t;
    return t;
  });

  useEffect(() => () => {
    texRef.current?.dispose();
    texRef.current = null;
  }, []);

  return texture;
}
