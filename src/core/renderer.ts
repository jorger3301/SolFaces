// ═══════════════════════════════════════════════════════════════
// SOLFACES v2 — SVG String Renderer
// Gradient-rich, skin-luminance-driven avatar rendering.
// Generates SVG markup as strings for server-side and non-React use.
// ═══════════════════════════════════════════════════════════════

import {
  generateTraits,
  effectiveAccessory,
  SKIN_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  BG_COLORS,
  type RenderOptions,
} from "./traits";
import { deriveSkinColors, darken, lighten, blend } from "./colors";
import { solFaceAltText } from "./describe";

export type { RenderOptions } from "./traits";

// ─── Helpers ────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ─── Gradient Defs ──────────────────────────────

function buildDefs(
  id: string,
  skin: string,
  skinHi: string,
  skinLo: string,
  hairCol: string,
  bgCol: string,
  cheekColor: string,
  cheekOpacity: number,
  flat: boolean,
  full: boolean,
  glowIntensity: number,
): string {
  if (flat) return "";

  let d = "<defs>";

  // Skin gradient (top → bottom, 3-stop for smoother curve)
  d += `<linearGradient id="${id}sg" x1="0" y1="0" x2="0" y2="1">`;
  d += `<stop offset="0%" stop-color="${skinHi}"/>`;
  d += `<stop offset="50%" stop-color="${skin}"/>`;
  d += `<stop offset="100%" stop-color="${skinLo}"/>`;
  d += `</linearGradient>`;

  // BG gradient
  d += `<linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">`;
  d += `<stop offset="0%" stop-color="${lighten(bgCol, 0.12)}"/>`;
  d += `<stop offset="100%" stop-color="${darken(bgCol, 0.12)}"/>`;
  d += `</linearGradient>`;

  if (full) {
    // Glow (radial, top center)
    d += `<radialGradient id="${id}glow" cx="0.5" cy="0.28" r="0.45">`;
    d += `<stop offset="0%" stop-color="#ffffff" stop-opacity="${glowIntensity}"/>`;
    d += `<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>`;
    d += `</radialGradient>`;

    // Chin shadow
    d += `<radialGradient id="${id}chin" cx="0.5" cy="0.85" r="0.35">`;
    d += `<stop offset="0%" stop-color="${skinLo}" stop-opacity="0.30"/>`;
    d += `<stop offset="100%" stop-color="${skinLo}" stop-opacity="0"/>`;
    d += `</radialGradient>`;

    // Cheek L
    d += `<radialGradient id="${id}cL" cx="0.5" cy="0.5" r="0.5">`;
    d += `<stop offset="0%" stop-color="${cheekColor}" stop-opacity="${cheekOpacity.toFixed(2)}"/>`;
    d += `<stop offset="100%" stop-color="${cheekColor}" stop-opacity="0"/>`;
    d += `</radialGradient>`;

    // Cheek R
    d += `<radialGradient id="${id}cR" cx="0.5" cy="0.5" r="0.5">`;
    d += `<stop offset="0%" stop-color="${cheekColor}" stop-opacity="${cheekOpacity.toFixed(2)}"/>`;
    d += `<stop offset="100%" stop-color="${cheekColor}" stop-opacity="0"/>`;
    d += `</radialGradient>`;
  }

  d += "</defs>";
  return d;
}

// ─── Hair Back (behind face) ────────────────────

function renderHairBack(_hi: number, _id: string, _flat: boolean): string {
  return "";
}

// ─── Ears ───────────────────────────────────────

function renderEars(earFill: string, earShadow: string): string {
  return (
    `<ellipse cx="11" cy="34" rx="4" ry="5" fill="${earFill}"/>` +
    `<ellipse cx="11" cy="34" rx="2.5" ry="3.5" fill="${earShadow}" opacity="0.3"/>` +
    `<ellipse cx="53" cy="34" rx="4" ry="5" fill="${earFill}"/>` +
    `<ellipse cx="53" cy="34" rx="2.5" ry="3.5" fill="${earShadow}" opacity="0.3"/>`
  );
}

// ─── Face ───────────────────────────────────────

function renderFace(id: string, skin: string, flat: boolean, opacity: number = 1): string {
  const fill = flat ? skin : `url(#${id}sg)`;
  const opAttr = opacity < 1 ? ` opacity="${opacity}"` : "";
  return `<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="${fill}"${opAttr}/>`;
}

// ─── Face Overlays (full detail) ────────────────

function renderFaceOverlays(id: string, flat: boolean): string {
  if (flat) return "";
  return (
    `<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="url(#${id}glow)"/>` +
    `<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="url(#${id}chin)"/>` +
    `<ellipse cx="22" cy="42" rx="5" ry="3.5" fill="url(#${id}cL)"/>` +
    `<ellipse cx="42" cy="42" rx="5" ry="3.5" fill="url(#${id}cR)"/>` +
    `<line x1="20" y1="50" x2="44" y2="50" stroke="currentColor" stroke-width="0.3" opacity="0.08" stroke-linecap="round"/>`
  );
}

// ─── Hair Front ─────────────────────────────────

function renderHairFront(_hi: number, _id: string, _hairCol: string, _skin: string, _flat: boolean): string {
  return "";
}

// ─── Eyes ───────────────────────────────────────

function renderEyes(
  ei: number,
  eyeCol: string,
  eyeWhite: string,
  lidColor: string,
  full: boolean,
): string {
  const lx = 25, rx = 39, y = 33;
  let s = "";

  switch (ei) {
    case 0: // Round
      s += `<circle cx="${lx}" cy="${y}" r="4" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx + 0.8}" cy="${y}" r="2.2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${lx + 1.5}" cy="${y - 1}" r="0.7" fill="white" opacity="0.8"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="4" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx + 0.8}" cy="${y}" r="2.2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${rx + 1.5}" cy="${y - 1}" r="0.7" fill="white" opacity="0.8"/>`;
      break;
    case 1: // Minimal
      s += `<circle cx="${lx}" cy="${y}" r="2.2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${lx + 0.5}" cy="${y - 0.5}" r="0.5" fill="white" opacity="0.4"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="2.2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${rx + 0.5}" cy="${y - 0.5}" r="0.5" fill="white" opacity="0.4"/>`;
      break;
    case 2: // Almond
      s += `<ellipse cx="${lx}" cy="${y}" rx="4.5" ry="2.8" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx + 0.5}" cy="${y}" r="1.8" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${lx + 1.2}" cy="${y - 0.8}" r="0.6" fill="white" opacity="0.7"/>`;
      s += `<ellipse cx="${rx}" cy="${y}" rx="4.5" ry="2.8" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx + 0.5}" cy="${y}" r="1.8" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${rx + 1.2}" cy="${y - 0.8}" r="0.6" fill="white" opacity="0.7"/>`;
      break;
    case 3: // Wide
      s += `<circle cx="${lx}" cy="${y}" r="5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx}" cy="${y + 0.5}" r="2.8" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${lx + 1.5}" cy="${y - 1}" r="0.8" fill="white" opacity="0.8"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx}" cy="${y + 0.5}" r="2.8" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${rx + 1.5}" cy="${y - 1}" r="0.8" fill="white" opacity="0.8"/>`;
      break;
    case 4: // Relaxed
      s += `<ellipse cx="${lx}" cy="${y + 1}" rx="4" ry="2.2" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx}" cy="${y + 1}" r="1.5" fill="${eyeCol}"/>`;
      if (full) s += `<line x1="${lx - 4.5}" y1="${y - 0.5}" x2="${lx + 4.5}" y2="${y - 0.5}" stroke="${lidColor}" stroke-width="0.8" stroke-linecap="round"/>`;
      s += `<ellipse cx="${rx}" cy="${y + 1}" rx="4" ry="2.2" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx}" cy="${y + 1}" r="1.5" fill="${eyeCol}"/>`;
      if (full) s += `<line x1="${rx - 4.5}" y1="${y - 0.5}" x2="${rx + 4.5}" y2="${y - 0.5}" stroke="${lidColor}" stroke-width="0.8" stroke-linecap="round"/>`;
      break;
    case 5: // Joyful
      s += `<path d="M${lx - 4} ${y} Q${lx} ${y + 4.5} ${lx + 4} ${y}" fill="none" stroke="${eyeCol}" stroke-width="2" stroke-linecap="round"/>`;
      s += `<path d="M${rx - 4} ${y} Q${rx} ${y + 4.5} ${rx + 4} ${y}" fill="none" stroke="${eyeCol}" stroke-width="2" stroke-linecap="round"/>`;
      break;
    case 6: // Bright
      s += `<circle cx="${lx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx + 0.5}" cy="${y}" r="2" fill="${eyeCol}"/>`;
      s += `<circle cx="${lx + 1.5}" cy="${y - 1}" r="1" fill="white" opacity="0.9"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx + 0.5}" cy="${y}" r="2" fill="${eyeCol}"/>`;
      s += `<circle cx="${rx + 1.5}" cy="${y - 1}" r="1" fill="white" opacity="0.9"/>`;
      break;
    case 7: // Gentle
      s += `<ellipse cx="${lx}" cy="${y}" rx="4.5" ry="1.5" fill="${eyeWhite}"/>`;
      s += `<ellipse cx="${lx + 0.5}" cy="${y}" rx="2.2" ry="1.2" fill="${eyeCol}"/>`;
      s += `<ellipse cx="${rx}" cy="${y}" rx="4.5" ry="1.5" fill="${eyeWhite}"/>`;
      s += `<ellipse cx="${rx + 0.5}" cy="${y}" rx="2.2" ry="1.2" fill="${eyeCol}"/>`;
      break;
    case 8: // Side-look — pupils shifted left
      s += `<circle cx="${lx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx - 1}" cy="${y}" r="2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${lx - 0.3}" cy="${y - 0.8}" r="0.7" fill="white" opacity="0.8"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx - 1}" cy="${y}" r="2" fill="${eyeCol}"/>`;
      if (full) s += `<circle cx="${rx - 0.3}" cy="${y - 0.8}" r="0.7" fill="white" opacity="0.8"/>`;
      break;
    default:
      s += `<circle cx="${lx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${lx + 0.8}" cy="${y}" r="2" fill="${eyeCol}"/>`;
      s += `<circle cx="${rx}" cy="${y}" r="3.5" fill="${eyeWhite}"/>`;
      s += `<circle cx="${rx + 0.8}" cy="${y}" r="2" fill="${eyeCol}"/>`;
  }

  // Eyelid strokes in full detail (except joyful/minimal)
  if (full && ei !== 1 && ei !== 5) {
    s += `<path d="M${lx - 4} ${y - 1.5} Q${lx} ${y - 4} ${lx + 4} ${y - 1.5}" fill="none" stroke="${lidColor}" stroke-width="0.5" opacity="0.4"/>`;
    s += `<path d="M${rx - 4} ${y - 1.5} Q${rx} ${y - 4} ${rx + 4} ${y - 1.5}" fill="none" stroke="${lidColor}" stroke-width="0.5" opacity="0.4"/>`;
  }

  return s;
}

// ─── Eyebrows ───────────────────────────────────

function renderEyebrows(bi: number, browColor: string, full: boolean = true): string {
  const lx = 25, rx = 39, y = 27;
  switch (bi) {
    case 0: // Wispy
      return (
        `<line x1="${lx - 3}" y1="${y}" x2="${lx + 3}" y2="${y - 0.5}" stroke="${browColor}" stroke-width="0.7" stroke-linecap="round"/>` +
        `<line x1="${rx - 3}" y1="${y - 0.5}" x2="${rx + 3}" y2="${y}" stroke="${browColor}" stroke-width="0.7" stroke-linecap="round"/>`
      );
    case 1: // Straight
      return (
        `<line x1="${lx - 3.5}" y1="${y}" x2="${lx + 3.5}" y2="${y}" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round"/>` +
        `<line x1="${rx - 3.5}" y1="${y}" x2="${rx + 3.5}" y2="${y}" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round"/>`
      );
    case 2: // Natural
      return (
        `<path d="M${lx - 3.5} ${y + 0.5} Q${lx} ${y - 1.5} ${lx + 3.5} ${y + 0.5}" fill="none" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round"/>` +
        `<path d="M${rx - 3.5} ${y + 0.5} Q${rx} ${y - 1.5} ${rx + 3.5} ${y + 0.5}" fill="none" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round"/>`
      );
    case 3: // Arched
      return (
        `<path d="M${lx - 4} ${y + 1} Q${lx} ${y - 3} ${lx + 4} ${y + 1}" fill="none" stroke="${browColor}" stroke-width="1" stroke-linecap="round"/>` +
        `<path d="M${rx - 4} ${y + 1} Q${rx} ${y - 3} ${rx + 4} ${y + 1}" fill="none" stroke="${browColor}" stroke-width="1" stroke-linecap="round"/>`
      );
    case 4: // Angled
      return (
        `<polyline points="${lx - 3},${y + 1} ${lx},${y - 2} ${lx + 3},${y}" fill="none" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<polyline points="${rx - 3},${y} ${rx},${y - 2} ${rx + 3},${y + 1}" fill="none" stroke="${browColor}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    case 5: // Worried
      return (
        `<line x1="${lx - 3}" y1="${y - 1}" x2="${lx + 3}" y2="${y + 1}" stroke="${browColor}" stroke-width="1.1" stroke-linecap="round"/>` +
        `<line x1="${rx - 3}" y1="${y + 1}" x2="${rx + 3}" y2="${y - 1}" stroke="${browColor}" stroke-width="1.1" stroke-linecap="round"/>`
      );
    case 6: { // Bushy
      const bw = full ? "2.0" : "1.5";
      return (
        `<path d="M${lx - 4} ${y + 0.5} Q${lx} ${y - 2} ${lx + 4} ${y + 0.5}" fill="none" stroke="${browColor}" stroke-width="${bw}" stroke-linecap="round"/>` +
        `<path d="M${rx - 4} ${y + 0.5} Q${rx} ${y - 2} ${rx + 4} ${y + 0.5}" fill="none" stroke="${browColor}" stroke-width="${bw}" stroke-linecap="round"/>`
      );
    }
    case 7: // Thin
      return (
        `<path d="M${lx - 3.5} ${y} Q${lx} ${y - 1.5} ${lx + 3.5} ${y}" fill="none" stroke="${browColor}" stroke-width="0.5" stroke-linecap="round"/>` +
        `<path d="M${rx - 3.5} ${y} Q${rx} ${y - 1.5} ${rx + 3.5} ${y}" fill="none" stroke="${browColor}" stroke-width="0.5" stroke-linecap="round"/>`
      );
    default:
      return "";
  }
}

// ─── Nose ───────────────────────────────────────

function renderNose(ni: number, noseFill: string): string {
  const cx = 32, y = 39;
  switch (ni) {
    case 0: // Shadow
      return `<ellipse cx="${cx}" cy="${y}" rx="2" ry="1.2" fill="${noseFill}" opacity="0.35"/>`;
    case 1: // Button
      return `<circle cx="${cx}" cy="${y}" r="1.8" fill="${noseFill}" opacity="0.5"/>`;
    case 2: // Soft
      return `<path d="M${cx - 2} ${y + 1} Q${cx} ${y - 2} ${cx + 2} ${y + 1}" fill="none" stroke="${noseFill}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`;
    case 3: // Nostrils
      return (
        `<circle cx="${cx - 1.8}" cy="${y}" r="1.2" fill="${noseFill}" opacity="0.4"/>` +
        `<circle cx="${cx + 1.8}" cy="${y}" r="1.2" fill="${noseFill}" opacity="0.4"/>`
      );
    case 4: // Pointed
      return `<path d="M${cx} ${y - 2} L${cx - 2} ${y + 1.5} L${cx + 2} ${y + 1.5} Z" fill="${noseFill}" opacity="0.4"/>`;
    case 5: // Wide
      return `<ellipse cx="${cx}" cy="${y}" rx="3.5" ry="1.5" fill="${noseFill}" opacity="0.35"/>`;
    case 6: // Bridge
      return `<line x1="${cx}" y1="${y - 3}" x2="${cx}" y2="${y + 1}" stroke="${noseFill}" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>`;
    case 7: // Snub
      return (
        `<circle cx="${cx}" cy="${y + 0.5}" r="2" fill="${noseFill}" opacity="0.35"/>` +
        `<ellipse cx="${cx}" cy="${y - 0.5}" rx="1" ry="0.5" fill="${noseFill}" opacity="0.15"/>`
      );
    default:
      return `<ellipse cx="${cx}" cy="${y}" rx="2" ry="1.2" fill="${noseFill}" opacity="0.35"/>`;
  }
}

// ─── Mouth ──────────────────────────────────────

function renderMouth(mi: number, lipColor: string, isDark: boolean): string {
  const cx = 32, y = 45;
  const teethCol = isDark ? "#e8e0d8" : "#ffffff";
  switch (mi) {
    case 0: // Smile
      return `<path d="M${cx - 4} ${y} Q${cx} ${y + 4} ${cx + 4} ${y}" fill="none" stroke="${lipColor}" stroke-width="1.4" stroke-linecap="round"/>`;
    case 1: // Calm
      return `<line x1="${cx - 3}" y1="${y + 1}" x2="${cx + 3}" y2="${y + 1}" stroke="${lipColor}" stroke-width="1.2" stroke-linecap="round"/>`;
    case 2: // Happy
      return `<path d="M${cx - 5} ${y} Q${cx} ${y + 5} ${cx + 5} ${y}" fill="none" stroke="${lipColor}" stroke-width="1.5" stroke-linecap="round"/>`;
    case 3: // Oh
      return `<ellipse cx="${cx}" cy="${y + 1}" rx="2.5" ry="3" fill="${lipColor}" opacity="0.7"/>`;
    case 4: // Smirk
      return `<path d="M${cx - 4} ${y + 1} Q${cx + 1} ${y + 1} ${cx + 4} ${y - 1.5}" fill="none" stroke="${lipColor}" stroke-width="1.3" stroke-linecap="round"/>`;
    case 5: // Grin
      return (
        `<path d="M${cx - 5} ${y} Q${cx} ${y + 6} ${cx + 5} ${y}" fill="${teethCol}" stroke="${lipColor}" stroke-width="1"/>` +
        `<line x1="${cx - 4}" y1="${y + 1.5}" x2="${cx + 4}" y2="${y + 1.5}" stroke="${lipColor}" stroke-width="0.3" opacity="0.3"/>`
      );
    case 6: // Flat
      return `<path d="M${cx - 4} ${y + 0.5} Q${cx} ${y + 1.5} ${cx + 4} ${y + 0.5}" fill="none" stroke="${lipColor}" stroke-width="1.4" stroke-linecap="round"/>`;
    case 7: // Pout
      return (
        `<ellipse cx="${cx}" cy="${y + 1}" rx="3.5" ry="2" fill="${lipColor}" opacity="0.25"/>` +
        `<path d="M${cx - 3} ${y} Q${cx} ${y + 2.5} ${cx + 3} ${y}" fill="none" stroke="${lipColor}" stroke-width="1.2" stroke-linecap="round"/>`
      );
    default:
      return `<path d="M${cx - 4} ${y} Q${cx} ${y + 4} ${cx + 4} ${y}" fill="none" stroke="${lipColor}" stroke-width="1.4" stroke-linecap="round"/>`;
  }
}

// ─── Accessories ────────────────────────────────

function renderAccessory(
  ai: number,
  accessoryColor: string,
  glassesColor: string,
  earringColor: string,
  headbandColor: string,
  beautyMarkColor: string = "#3a2a2a",
  freckleColor: string = "#a0785a",
  skinColor: string = "#E8BA8B",
): string {
  switch (ai) {
    case 0: return ""; // None
    case 1: // Beauty mark
      return `<circle cx="40" cy="44" r="0.8" fill="${beautyMarkColor}"/>`;
    case 2: // Round glasses
      return (
        `<g fill="none" stroke="${glassesColor}" stroke-width="1">` +
        `<circle cx="25" cy="33" r="5.5"/>` +
        `<circle cx="39" cy="33" r="5.5"/>` +
        `<line x1="30.5" y1="33" x2="33.5" y2="33"/>` +
        `<line x1="19.5" y1="33" x2="14" y2="31"/>` +
        `<line x1="44.5" y1="33" x2="50" y2="31"/>` +
        `</g>`
      );
    case 3: // Rect glasses
      return (
        `<g fill="none" stroke="${glassesColor}" stroke-width="1">` +
        `<rect x="19" y="29" width="12" height="8" rx="1.5"/>` +
        `<rect x="33" y="29" width="12" height="8" rx="1.5"/>` +
        `<line x1="31" y1="33" x2="33" y2="33"/>` +
        `<line x1="19" y1="33" x2="14" y2="31"/>` +
        `<line x1="45" y1="33" x2="50" y2="31"/>` +
        `</g>`
      );
    case 4: // Earring
      return (
        `<circle cx="10" cy="38" r="1.5" fill="${earringColor}"/>` +
        `<circle cx="10" cy="41" r="2" fill="${earringColor}" opacity="0.8"/>`
      );
    case 5: // Headband
      return `<rect x="13" y="20" width="38" height="3.5" rx="1.5" fill="${headbandColor}" opacity="0.85"/>`;
    case 6: // Freckles
      return (
        `<g fill="${freckleColor}" opacity="0.35">` +
        `<circle cx="21" cy="40" r="0.6"/>` +
        `<circle cx="23" cy="42" r="0.5"/>` +
        `<circle cx="19" cy="41.5" r="0.5"/>` +
        `<circle cx="43" cy="40" r="0.6"/>` +
        `<circle cx="41" cy="42" r="0.5"/>` +
        `<circle cx="45" cy="41.5" r="0.5"/>` +
        `</g>`
      );
    case 7: // Stud earrings
      return (
        `<circle cx="10" cy="37" r="1.2" fill="${earringColor}"/>` +
        `<circle cx="54" cy="37" r="1.2" fill="${earringColor}"/>`
      );
    case 8: // Aviators
      return (
        `<g fill="none" stroke="${glassesColor}" stroke-width="1.2">` +
        `<path d="M19 30 Q19 28 25 28 Q31 28 31 33 Q31 38 25 38 Q19 38 19 33 Z" fill="${glassesColor}" fill-opacity="0.15"/>` +
        `<path d="M33 30 Q33 28 39 28 Q45 28 45 33 Q45 38 39 38 Q33 38 33 33 Z" fill="${glassesColor}" fill-opacity="0.15"/>` +
        `<line x1="31" y1="32" x2="33" y2="32"/>` +
        `<line x1="19" y1="31" x2="14" y2="29"/>` +
        `<line x1="45" y1="31" x2="50" y2="29"/>` +
        `</g>`
      );
    case 9: // Band-Aid
      return (
        `<g>` +
        `<rect x="38" y="38" width="9" height="4.5" rx="1.2" fill="#f0d0a0" transform="rotate(-15 42 40)"/>` +
        `<rect x="39.5" y="38.5" width="6" height="3.5" rx="0.8" fill="#f5ddb5" transform="rotate(-15 42 40)"/>` +
        `<circle cx="42.5" cy="40.25" r="0.5" fill="#d4b898" transform="rotate(-15 42 40)"/>` +
        `</g>`
      );
    case 10: // Left Eyebrow Slit
      return `<line x1="23" y1="24.8" x2="23.8" y2="29.2" stroke="${skinColor}" stroke-width="1.3" stroke-linecap="butt"/>`;
    case 11: // Right Eyebrow Slit
      return `<line x1="41" y1="24.8" x2="40.2" y2="29.2" stroke="${skinColor}" stroke-width="1.3" stroke-linecap="butt"/>`;
    default:
      return "";
  }
}

// ─── Main Render Functions ──────────────────────

/**
 * Render a SolFace avatar as an SVG string. Deterministic — same wallet always produces the same SVG.
 *
 * @param walletAddress  Base58 Solana wallet address.
 * @param options        Render options (size, theme, detail level, color overrides, etc.).
 * @returns Complete SVG markup string.
 */
export function renderSolFaceSVG(
  walletAddress: string,
  options?: RenderOptions,
): string {
  const { size = 64, theme, traitOverrides, enableBlink, className, colorOverrides } = options ?? {};
  const traits = generateTraits(walletAddress, traitOverrides);

  // Resolve detail level
  const detailOpt = options?.detail ?? "auto";
  const full = detailOpt === "full" || (detailOpt === "auto" && size >= 48);
  const flat = theme?.flat ?? false;

  // Color palettes
  const skinColors = theme?.skinColors ?? SKIN_COLORS;
  const eyeColors = theme?.eyeColors ?? EYE_COLORS;
  const hairColors = theme?.hairColors ?? HAIR_COLORS;
  const bgColors = theme?.bgColors ?? BG_COLORS;

  const skin = colorOverrides?.skin ?? skinColors[traits.skinColor % skinColors.length];
  const eyeCol = colorOverrides?.eyes ?? eyeColors[traits.eyeColor % eyeColors.length];
  const hairCol = colorOverrides?.hair ?? hairColors[traits.hairColor % hairColors.length];
  const bgCol = colorOverrides?.bg ?? bgColors[traits.bgColor % bgColors.length];

  // Derived skin colors
  const derived = deriveSkinColors(skin);

  const bgOpacity = theme?.bgOpacity ?? 1;
  const bgRadius = theme?.bgRadius ?? 4;
  const browColor = colorOverrides?.eyebrow ?? theme?.eyebrowColor ?? derived.browColor;
  const noseFill = colorOverrides?.nose ?? theme?.noseColor ?? derived.noseFill;
  const lipColor = colorOverrides?.mouth ?? theme?.mouthColor ?? derived.lipColor;
  const accColor = colorOverrides?.accessory ?? theme?.accessoryColor ?? derived.accessoryColor;
  const eyeWhite = colorOverrides?.eyeWhite ?? theme?.eyeWhiteColor ?? derived.eyeWhiteAdapted;
  const glassesColor = theme?.glassesColor ?? "#4a4a5a";
  const earringColor = theme?.earringColor ?? blend(skin, "#d4a840", 0.4);
  const headbandColor = theme?.headbandColor ?? blend(hairCol, "#c04040", 0.5);
  const beautyMarkColor = theme?.beautyMarkColor ?? "#3a2a2a";
  const freckleColor = theme?.freckleColor ?? "#a0785a";

  // Unique gradient ID prefix (collision-resistant)
  const id = "sf" + djb2(walletAddress).toString(36);

  // Cheek
  const cheekEnabled = theme?.cheekEnabled ?? true;
  const cheekColor = theme?.cheekColor ?? derived.cheekColor;
  const cheekOpacity = theme?.cheekOpacity ?? derived.cheekOpacity;

  const hi = traits.hairStyle % 10;
  const ai = effectiveAccessory(traits);

  const classAttr = className ? ` class="${className}"` : "";
  const altText = solFaceAltText(walletAddress).replace(/"/g, "&quot;");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"${classAttr} role="img" aria-label="${altText}">`;

  // Defs
  const glowIntensity = theme?.glowIntensity ?? 0.10;
  svg += buildDefs(id, skin, derived.skinHi, derived.skinLo, hairCol, bgCol, cheekColor, cheekOpacity, flat, full && cheekEnabled, glowIntensity);

  // Blink animation
  const blinkEnabled = !!enableBlink;
  const blinkDuration = typeof enableBlink === "object" ? (enableBlink.duration ?? 4) : 4;
  const blinkDelay = typeof enableBlink === "object" ? (enableBlink.delay ?? 0) : 0;
  if (blinkEnabled) {
    const uid = `sf-${walletAddress.slice(0, 8)}`;
    const delayStr = blinkDelay ? ` ${blinkDelay}s` : "";
    svg += `<style>@keyframes ${uid}-blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}.${uid}-eyes{animation:${uid}-blink ${blinkDuration}s ease-in-out${delayStr} infinite;transform-origin:32px 33px}</style>`;
  }

  // Background
  const bgFill = flat ? bgCol : `url(#${id}bg)`;
  svg += `<rect x="0" y="0" width="64" height="64" fill="${bgFill}" opacity="${bgOpacity}" rx="${bgRadius}"/>`;

  // Hair back (unused — all styles bald)
  if (theme?.hairEnabled !== false) svg += renderHairBack(hi, id, flat);

  // Ears
  if (theme?.earsEnabled !== false) svg += renderEars(theme?.earColor ?? derived.earFill, derived.earShadow);

  // Face
  const skinOpacity = theme?.skinOpacity ?? 1;
  svg += renderFace(id, skin, flat, skinOpacity);

  // Face overlays (glow, chin shadow, cheeks, jawline) — full detail only
  const shadowEnabled = theme?.shadowEnabled ?? true;
  if (full && cheekEnabled && shadowEnabled) {
    svg += renderFaceOverlays(id, flat);
  }

  // Hair front (unused — all styles bald)
  if (theme?.hairEnabled !== false) svg += renderHairFront(hi, id, hairCol, skin, flat);

  // Headband (renders after hair front so it's visible)
  if (ai === 5 && theme?.accessoriesEnabled !== false) {
    svg += renderAccessory(5, accColor, glassesColor, earringColor, headbandColor, beautyMarkColor, freckleColor, skin);
  }

  // Eyes
  if (blinkEnabled) {
    const uid = `sf-${walletAddress.slice(0, 8)}`;
    svg += `<g class="${uid}-eyes">`;
  }
  svg += renderEyes(traits.eyeStyle % 9, eyeCol, eyeWhite, theme?.lidColor ?? derived.lidColor, full);
  if (blinkEnabled) svg += `</g>`;

  // Eyebrows
  if (theme?.eyebrowsEnabled !== false) svg += renderEyebrows(traits.eyebrows % 8, browColor, full);

  // Nose
  if (theme?.noseEnabled !== false) svg += renderNose(traits.nose % 8, noseFill);

  // Mouth
  svg += renderMouth(traits.mouth % 8, lipColor, derived.isDark);

  // Accessories (except headband, already rendered)
  if (ai !== 0 && ai !== 5 && theme?.accessoriesEnabled !== false) {
    svg += renderAccessory(ai, accColor, glassesColor, earringColor, headbandColor, beautyMarkColor, freckleColor, skin);
  }

  // Border
  if (theme?.border) {
    svg += `<rect x="0" y="0" width="64" height="64" fill="none" stroke="${theme.border.color}" stroke-width="${theme.border.width}" rx="${bgRadius}"/>`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Render a SolFace avatar as a `data:image/svg+xml` URI (URL-encoded). Suitable for `<img src>` attributes.
 *
 * @param walletAddress  Base58 Solana wallet address.
 * @param options        Render options.
 * @returns Data URI string.
 */
export function renderSolFaceDataURI(
  walletAddress: string,
  options?: RenderOptions,
): string {
  const svg = renderSolFaceSVG(walletAddress, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Render a SolFace avatar as a base64-encoded `data:image/svg+xml` URI. Suitable for environments that don't support URL-encoded SVGs.
 *
 * @param walletAddress  Base58 Solana wallet address.
 * @param options        Render options.
 * @returns Base64 data URI string.
 */
export function renderSolFaceBase64(
  walletAddress: string,
  options?: RenderOptions,
): string {
  const svg = renderSolFaceSVG(walletAddress, options);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
