"use client";

// ═══════════════════════════════════════════════════════════════
// SOLFACES v2 — React Component
// Gradient-rich SVG avatar with pixel art and liquid glass modes.
// ═══════════════════════════════════════════════════════════════

import { useMemo, type SVGAttributes, type CSSProperties } from "react";
import {
  generateTraits,
  effectiveAccessory,
  SKIN_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  BG_COLORS,
  type SolFaceTraits,
  type SolFaceTheme,
} from "../core/traits";
import { deriveSkinColors, darken, lighten, blend } from "../core/colors";
import { renderSolFaceSVG } from "../core/renderer";
import { solFaceAltText } from "../core/describe";
import { deriveName } from "../names";
import type { NameFormat } from "../names";

/** Props for the `<SolFace>` React component. Extends standard SVG attributes. */
export interface SolFaceProps extends Omit<SVGAttributes<SVGSVGElement>, "viewBox" | "xmlns"> {
  /** Solana wallet address (base58). Deterministically generates the avatar. */
  walletAddress: string;
  /** Avatar size in CSS pixels (width and height). Default: 64. */
  size?: number;
  /** Enable blink animation. Pass `true` for defaults, or an object for custom timing. Default: false. */
  enableBlink?: boolean | {
    /** Interval between blinks in seconds. Default: 4. */
    duration?: number;
    /** Initial delay before first blink in seconds. Default: 0. */
    delay?: number;
  };
  /** Theme configuration for colors, layout, and rendering style. */
  theme?: SolFaceTheme;
  /** Override specific trait indices. Merged on top of the deterministic traits. */
  traitOverrides?: Partial<SolFaceTraits>;
  /** Detail level. "auto" uses full detail at size ≥ 48px. Default: "auto". */
  detail?: "full" | "simplified" | "auto";
  /** Per-instance color overrides (hex strings). Takes precedence over theme color settings. */
  colorOverrides?: {
    /** Override skin color (hex). */
    skin?: string;
    /** Override eye iris color (hex). */
    eyes?: string;
    /** Override hair color (hex). */
    hair?: string;
    /** Override background color (hex). */
    bg?: string;
    /** Override mouth/lip color (hex). */
    mouth?: string;
    /** Override eyebrow color (hex). */
    eyebrow?: string;
    /** Override accessory accent color (hex). */
    accessory?: string;
    /** Override nose shadow/fill color (hex). */
    nose?: string;
    /** Override eye white (sclera) color (hex). */
    eyeWhite?: string;
  };
  /** Show a derived SolName label next to the avatar. Default: false. */
  showName?: boolean;
  /** Position of the name label relative to the avatar. Default: "below". */
  namePosition?: "below" | "above";
  /** Name display format (e.g. "display", "short", "tag"). Default: "display". */
  nameFormat?: NameFormat;
}

// ─── Helpers ────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ─── Hair Back (behind face) ────────────────────

function HairBack(_props: { hi: number; id: string; flat: boolean }) {
  return null;
}

// ─── Ears ───────────────────────────────────────

function Ears({ earFill, earShadow }: { earFill: string; earShadow: string }) {
  return (
    <>
      <ellipse cx="11" cy="34" rx="4" ry="5" fill={earFill} />
      <ellipse cx="11" cy="34" rx="2.5" ry="3.5" fill={earShadow} opacity="0.3" />
      <ellipse cx="53" cy="34" rx="4" ry="5" fill={earFill} />
      <ellipse cx="53" cy="34" rx="2.5" ry="3.5" fill={earShadow} opacity="0.3" />
    </>
  );
}

// ─── Face Overlays ──────────────────────────────

function FaceOverlays({ id }: { id: string }) {
  return (
    <>
      <rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill={`url(#${id}glow)`} />
      <rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill={`url(#${id}chin)`} />
      <ellipse cx="22" cy="42" rx="5" ry="3.5" fill={`url(#${id}cL)`} />
      <ellipse cx="42" cy="42" rx="5" ry="3.5" fill={`url(#${id}cR)`} />
      <line x1="20" y1="50" x2="44" y2="50" stroke="currentColor" strokeWidth="0.3" opacity="0.08" strokeLinecap="round" />
    </>
  );
}

// ─── Hair Front ─────────────────────────────────

function HairFront(_props: { hi: number; id: string; hairCol: string; flat: boolean }) {
  return null;
}

// ─── Eyes ───────────────────────────────────────

function Eyes({ ei, eyeCol, eyeWhite, lidColor, full }: { ei: number; eyeCol: string; eyeWhite: string; lidColor: string; full: boolean }) {
  const lx = 25, rx = 39, y = 33;

  const lids = full && ei !== 1 && ei !== 5 ? (
    <>
      <path d={`M${lx - 4} ${y - 1.5} Q${lx} ${y - 4} ${lx + 4} ${y - 1.5}`} fill="none" stroke={lidColor} strokeWidth="0.5" opacity="0.4" />
      <path d={`M${rx - 4} ${y - 1.5} Q${rx} ${y - 4} ${rx + 4} ${y - 1.5}`} fill="none" stroke={lidColor} strokeWidth="0.5" opacity="0.4" />
    </>
  ) : null;

  switch (ei) {
    case 0:
      return (
        <>
          <circle cx={lx} cy={y} r="4" fill={eyeWhite} />
          <circle cx={lx + 0.8} cy={y} r="2.2" fill={eyeCol} />
          {full && <circle cx={lx + 1.5} cy={y - 1} r="0.7" fill="white" opacity="0.8" />}
          <circle cx={rx} cy={y} r="4" fill={eyeWhite} />
          <circle cx={rx + 0.8} cy={y} r="2.2" fill={eyeCol} />
          {full && <circle cx={rx + 1.5} cy={y - 1} r="0.7" fill="white" opacity="0.8" />}
          {lids}
        </>
      );
    case 1:
      return (
        <>
          <circle cx={lx} cy={y} r="2.2" fill={eyeCol} />
          {full && <circle cx={lx + 0.5} cy={y - 0.5} r="0.5" fill="white" opacity="0.4" />}
          <circle cx={rx} cy={y} r="2.2" fill={eyeCol} />
          {full && <circle cx={rx + 0.5} cy={y - 0.5} r="0.5" fill="white" opacity="0.4" />}
        </>
      );
    case 2:
      return (
        <>
          <ellipse cx={lx} cy={y} rx="4.5" ry="2.8" fill={eyeWhite} />
          <circle cx={lx + 0.5} cy={y} r="1.8" fill={eyeCol} />
          {full && <circle cx={lx + 1.2} cy={y - 0.8} r="0.6" fill="white" opacity="0.7" />}
          <ellipse cx={rx} cy={y} rx="4.5" ry="2.8" fill={eyeWhite} />
          <circle cx={rx + 0.5} cy={y} r="1.8" fill={eyeCol} />
          {full && <circle cx={rx + 1.2} cy={y - 0.8} r="0.6" fill="white" opacity="0.7" />}
          {lids}
        </>
      );
    case 3:
      return (
        <>
          <circle cx={lx} cy={y} r="5" fill={eyeWhite} />
          <circle cx={lx} cy={y + 0.5} r="2.8" fill={eyeCol} />
          {full && <circle cx={lx + 1.5} cy={y - 1} r="0.8" fill="white" opacity="0.8" />}
          <circle cx={rx} cy={y} r="5" fill={eyeWhite} />
          <circle cx={rx} cy={y + 0.5} r="2.8" fill={eyeCol} />
          {full && <circle cx={rx + 1.5} cy={y - 1} r="0.8" fill="white" opacity="0.8" />}
          {lids}
        </>
      );
    case 4:
      return (
        <>
          <ellipse cx={lx} cy={y + 1} rx="4" ry="2.2" fill={eyeWhite} />
          <circle cx={lx} cy={y + 1} r="1.5" fill={eyeCol} />
          {full && <line x1={lx - 4.5} y1={y - 0.5} x2={lx + 4.5} y2={y - 0.5} stroke={lidColor} strokeWidth="0.8" strokeLinecap="round" />}
          <ellipse cx={rx} cy={y + 1} rx="4" ry="2.2" fill={eyeWhite} />
          <circle cx={rx} cy={y + 1} r="1.5" fill={eyeCol} />
          {full && <line x1={rx - 4.5} y1={y - 0.5} x2={rx + 4.5} y2={y - 0.5} stroke={lidColor} strokeWidth="0.8" strokeLinecap="round" />}
          {lids}
        </>
      );
    case 5:
      return (
        <>
          <path d={`M${lx - 4} ${y} Q${lx} ${y + 4.5} ${lx + 4} ${y}`} fill="none" stroke={eyeCol} strokeWidth="2" strokeLinecap="round" />
          <path d={`M${rx - 4} ${y} Q${rx} ${y + 4.5} ${rx + 4} ${y}`} fill="none" stroke={eyeCol} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 6:
      return (
        <>
          <circle cx={lx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={lx + 0.5} cy={y} r="2" fill={eyeCol} />
          <circle cx={lx + 1.5} cy={y - 1} r="1" fill="white" opacity="0.9" />
          <circle cx={rx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={rx + 0.5} cy={y} r="2" fill={eyeCol} />
          <circle cx={rx + 1.5} cy={y - 1} r="1" fill="white" opacity="0.9" />
          {lids}
        </>
      );
    case 7:
      return (
        <>
          <ellipse cx={lx} cy={y} rx="4.5" ry="1.5" fill={eyeWhite} />
          <ellipse cx={lx + 0.5} cy={y} rx="2.2" ry="1.2" fill={eyeCol} />
          <ellipse cx={rx} cy={y} rx="4.5" ry="1.5" fill={eyeWhite} />
          <ellipse cx={rx + 0.5} cy={y} rx="2.2" ry="1.2" fill={eyeCol} />
          {lids}
        </>
      );
    case 8: // Side-look — pupils shifted left
      return (
        <>
          <circle cx={lx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={lx - 1} cy={y} r="2" fill={eyeCol} />
          {full && <circle cx={lx - 0.3} cy={y - 0.8} r="0.7" fill="white" opacity="0.8" />}
          <circle cx={rx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={rx - 1} cy={y} r="2" fill={eyeCol} />
          {full && <circle cx={rx - 0.3} cy={y - 0.8} r="0.7" fill="white" opacity="0.8" />}
          {lids}
        </>
      );
    default:
      return (
        <>
          <circle cx={lx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={lx + 0.8} cy={y} r="2" fill={eyeCol} />
          <circle cx={rx} cy={y} r="3.5" fill={eyeWhite} />
          <circle cx={rx + 0.8} cy={y} r="2" fill={eyeCol} />
          {lids}
        </>
      );
  }
}

// ─── Eyebrows ───────────────────────────────────

function Eyebrows({ bi, browColor, full = true }: { bi: number; browColor: string; full?: boolean }) {
  const lx = 25, rx = 39, y = 27;
  switch (bi) {
    case 0:
      return (
        <>
          <line x1={lx - 3} y1={y} x2={lx + 3} y2={y - 0.5} stroke={browColor} strokeWidth="0.7" strokeLinecap="round" />
          <line x1={rx - 3} y1={y - 0.5} x2={rx + 3} y2={y} stroke={browColor} strokeWidth="0.7" strokeLinecap="round" />
        </>
      );
    case 1:
      return (
        <>
          <line x1={lx - 3.5} y1={y} x2={lx + 3.5} y2={y} stroke={browColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1={rx - 3.5} y1={y} x2={rx + 3.5} y2={y} stroke={browColor} strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case 2:
      return (
        <>
          <path d={`M${lx - 3.5} ${y + 0.5} Q${lx} ${y - 1.5} ${lx + 3.5} ${y + 0.5}`} fill="none" stroke={browColor} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${rx - 3.5} ${y + 0.5} Q${rx} ${y - 1.5} ${rx + 3.5} ${y + 0.5}`} fill="none" stroke={browColor} strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case 3:
      return (
        <>
          <path d={`M${lx - 4} ${y + 1} Q${lx} ${y - 3} ${lx + 4} ${y + 1}`} fill="none" stroke={browColor} strokeWidth="1" strokeLinecap="round" />
          <path d={`M${rx - 4} ${y + 1} Q${rx} ${y - 3} ${rx + 4} ${y + 1}`} fill="none" stroke={browColor} strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case 4:
      return (
        <>
          <polyline points={`${lx - 3},${y + 1} ${lx},${y - 2} ${lx + 3},${y}`} fill="none" stroke={browColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`${rx - 3},${y} ${rx},${y - 2} ${rx + 3},${y + 1}`} fill="none" stroke={browColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 5: // Worried
      return (
        <>
          <line x1={lx - 3} y1={y - 1} x2={lx + 3} y2={y + 1} stroke={browColor} strokeWidth="1.1" strokeLinecap="round" />
          <line x1={rx - 3} y1={y + 1} x2={rx + 3} y2={y - 1} stroke={browColor} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case 6: { // Bushy
      const bw = full ? "2.0" : "1.5";
      return (
        <>
          <path d={`M${lx - 4} ${y + 0.5} Q${lx} ${y - 2} ${lx + 4} ${y + 0.5}`} fill="none" stroke={browColor} strokeWidth={bw} strokeLinecap="round" />
          <path d={`M${rx - 4} ${y + 0.5} Q${rx} ${y - 2} ${rx + 4} ${y + 0.5}`} fill="none" stroke={browColor} strokeWidth={bw} strokeLinecap="round" />
        </>
      );
    }
    case 7: // Thin
      return (
        <>
          <path d={`M${lx - 3.5} ${y} Q${lx} ${y - 1.5} ${lx + 3.5} ${y}`} fill="none" stroke={browColor} strokeWidth="0.5" strokeLinecap="round" />
          <path d={`M${rx - 3.5} ${y} Q${rx} ${y - 1.5} ${rx + 3.5} ${y}`} fill="none" stroke={browColor} strokeWidth="0.5" strokeLinecap="round" />
        </>
      );
    default: return null;
  }
}

// ─── Nose ───────────────────────────────────────

function Nose({ ni, noseFill }: { ni: number; noseFill: string }) {
  const cx = 32, y = 39;
  switch (ni) {
    case 0: return <ellipse cx={cx} cy={y} rx="2" ry="1.2" fill={noseFill} opacity="0.35" />;
    case 1: return <circle cx={cx} cy={y} r="1.8" fill={noseFill} opacity="0.5" />;
    case 2: return <path d={`M${cx - 2} ${y + 1} Q${cx} ${y - 2} ${cx + 2} ${y + 1}`} fill="none" stroke={noseFill} strokeWidth="1" strokeLinecap="round" opacity="0.5" />;
    case 3:
      return (
        <>
          <circle cx={cx - 1.8} cy={y} r="1.2" fill={noseFill} opacity="0.4" />
          <circle cx={cx + 1.8} cy={y} r="1.2" fill={noseFill} opacity="0.4" />
        </>
      );
    case 4: // Pointed
      return <path d={`M${cx} ${y - 2} L${cx - 2} ${y + 1.5} L${cx + 2} ${y + 1.5} Z`} fill={noseFill} opacity="0.4" />;
    case 5: // Wide
      return <ellipse cx={cx} cy={y} rx="3.5" ry="1.5" fill={noseFill} opacity="0.35" />;
    case 6: // Bridge
      return <line x1={cx} y1={y - 3} x2={cx} y2={y + 1} stroke={noseFill} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />;
    case 7: // Snub
      return (
        <>
          <circle cx={cx} cy={y + 0.5} r="2" fill={noseFill} opacity="0.35" />
          <ellipse cx={cx} cy={y - 0.5} rx="1" ry="0.5" fill={noseFill} opacity="0.15" />
        </>
      );
    default: return <ellipse cx={cx} cy={y} rx="2" ry="1.2" fill={noseFill} opacity="0.35" />;
  }
}

// ─── Mouth ──────────────────────────────────────

function Mouth({ mi, lipColor, isDark }: { mi: number; lipColor: string; isDark: boolean }) {
  const cx = 32, y = 45;
  const teethCol = isDark ? "#e8e0d8" : "#ffffff";
  switch (mi) {
    case 0: return <path d={`M${cx - 4} ${y} Q${cx} ${y + 4} ${cx + 4} ${y}`} fill="none" stroke={lipColor} strokeWidth="1.4" strokeLinecap="round" />;
    case 1: return <line x1={cx - 3} y1={y + 1} x2={cx + 3} y2={y + 1} stroke={lipColor} strokeWidth="1.2" strokeLinecap="round" />;
    case 2: return <path d={`M${cx - 5} ${y} Q${cx} ${y + 5} ${cx + 5} ${y}`} fill="none" stroke={lipColor} strokeWidth="1.5" strokeLinecap="round" />;
    case 3: return <ellipse cx={cx} cy={y + 1} rx="2.5" ry="3" fill={lipColor} opacity="0.7" />;
    case 4: return <path d={`M${cx - 4} ${y + 1} Q${cx + 1} ${y + 1} ${cx + 4} ${y - 1.5}`} fill="none" stroke={lipColor} strokeWidth="1.3" strokeLinecap="round" />;
    case 5:
      return (
        <>
          <path d={`M${cx - 5} ${y} Q${cx} ${y + 6} ${cx + 5} ${y}`} fill={teethCol} stroke={lipColor} strokeWidth="1" />
          <line x1={cx - 4} y1={y + 1.5} x2={cx + 4} y2={y + 1.5} stroke={lipColor} strokeWidth="0.3" opacity="0.3" />
        </>
      );
    case 6: return <path d={`M${cx - 4} ${y + 0.5} Q${cx} ${y + 1.5} ${cx + 4} ${y + 0.5}`} fill="none" stroke={lipColor} strokeWidth="1.4" strokeLinecap="round" />;
    case 7:
      return (
        <>
          <ellipse cx={cx} cy={y + 1} rx="3.5" ry="2" fill={lipColor} opacity="0.25" />
          <path d={`M${cx - 3} ${y} Q${cx} ${y + 2.5} ${cx + 3} ${y}`} fill="none" stroke={lipColor} strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    default: return <path d={`M${cx - 4} ${y} Q${cx} ${y + 4} ${cx + 4} ${y}`} fill="none" stroke={lipColor} strokeWidth="1.4" strokeLinecap="round" />;
  }
}

// ─── Accessory ──────────────────────────────────

function Accessory({ ai, accessoryColor, glassesColor, earringColor, headbandColor, beautyMarkColor = "#3a2a2a", freckleColor = "#a0785a", skinColor = "#E8BA8B" }: {
  ai: number; accessoryColor: string; glassesColor: string; earringColor: string; headbandColor: string; beautyMarkColor?: string; freckleColor?: string; skinColor?: string;
}) {
  switch (ai) {
    case 0: return null;
    case 1: return <circle cx="40" cy="44" r="0.8" fill={beautyMarkColor} />;
    case 2:
      return (
        <g fill="none" stroke={glassesColor} strokeWidth="1">
          <circle cx="25" cy="33" r="5.5" />
          <circle cx="39" cy="33" r="5.5" />
          <line x1="30.5" y1="33" x2="33.5" y2="33" />
          <line x1="19.5" y1="33" x2="14" y2="31" />
          <line x1="44.5" y1="33" x2="50" y2="31" />
        </g>
      );
    case 3:
      return (
        <g fill="none" stroke={glassesColor} strokeWidth="1">
          <rect x="19" y="29" width="12" height="8" rx="1.5" />
          <rect x="33" y="29" width="12" height="8" rx="1.5" />
          <line x1="31" y1="33" x2="33" y2="33" />
          <line x1="19" y1="33" x2="14" y2="31" />
          <line x1="45" y1="33" x2="50" y2="31" />
        </g>
      );
    case 4:
      return (
        <>
          <circle cx="10" cy="38" r="1.5" fill={earringColor} />
          <circle cx="10" cy="41" r="2" fill={earringColor} opacity="0.8" />
        </>
      );
    case 5:
      return <rect x="13" y="20" width="38" height="3.5" rx="1.5" fill={headbandColor} opacity="0.85" />;
    case 6:
      return (
        <g fill={freckleColor} opacity="0.35">
          <circle cx="21" cy="40" r="0.6" />
          <circle cx="23" cy="42" r="0.5" />
          <circle cx="19" cy="41.5" r="0.5" />
          <circle cx="43" cy="40" r="0.6" />
          <circle cx="41" cy="42" r="0.5" />
          <circle cx="45" cy="41.5" r="0.5" />
        </g>
      );
    case 7:
      return (
        <>
          <circle cx="10" cy="37" r="1.2" fill={earringColor} />
          <circle cx="54" cy="37" r="1.2" fill={earringColor} />
        </>
      );
    case 8:
      return (
        <g fill="none" stroke={glassesColor} strokeWidth="1.2">
          <path d="M19 30 Q19 28 25 28 Q31 28 31 33 Q31 38 25 38 Q19 38 19 33 Z" fill={glassesColor} fillOpacity="0.15" />
          <path d="M33 30 Q33 28 39 28 Q45 28 45 33 Q45 38 39 38 Q33 38 33 33 Z" fill={glassesColor} fillOpacity="0.15" />
          <line x1="31" y1="32" x2="33" y2="32" />
          <line x1="19" y1="31" x2="14" y2="29" />
          <line x1="45" y1="31" x2="50" y2="29" />
        </g>
      );
    case 9:
      return (
        <g>
          <rect x="38" y="38" width="9" height="4.5" rx="1.2" fill="#f0d0a0" transform="rotate(-15 42 40)" />
          <rect x="39.5" y="38.5" width="6" height="3.5" rx="0.8" fill="#f5ddb5" transform="rotate(-15 42 40)" />
          <circle cx="42.5" cy="40.25" r="0.5" fill="#d4b898" transform="rotate(-15 42 40)" />
        </g>
      );
    case 10: // Left Eyebrow Slit
      return <line x1="23" y1="24.8" x2="23.8" y2="29.2" stroke={skinColor} strokeWidth="1.3" strokeLinecap="butt" />;
    case 11: // Right Eyebrow Slit
      return <line x1="41" y1="24.8" x2="40.2" y2="29.2" stroke={skinColor} strokeWidth="1.3" strokeLinecap="butt" />;
    default: return null;
  }
}

// ─── Pixel Art Wrapper ──────────────────────────

function PixelWrapper({ svgString, size, theme, alt = "" }: { svgString: string; size: number; theme: SolFaceTheme; alt?: string }) {
  const scale = size / 64;

  const density = theme._pixelDensity ?? 16;
  const rounded = theme._pixelRounded ?? true;
  const outline = theme._pixelOutline ?? false;
  const outlineColor = theme._pixelOutlineColor ?? "#000";
  const outlineWidth = Math.max(1, Math.round((theme._pixelOutlineWidth ?? 1) * scale));
  const scanlines = theme._pixelScanlines ?? false;
  const scanlineOpacity = theme._pixelScanlineOpacity ?? 0.08;
  const scanlineSpacing = Math.max(1, Math.round((theme._pixelScanlineSpacing ?? 2) * scale));
  const grid = theme._pixelGrid ?? false;
  const gridOpacity = theme._pixelGridOpacity ?? 0.06;
  const gridColor = theme._pixelGridColor ?? "#000";
  const shadow = theme._pixelShadow ?? false;
  const shadowColor = theme._pixelShadowColor ?? "rgba(0,0,0,0.3)";
  const shadowOffset = Math.max(1, Math.round((theme._pixelShadowOffset ?? 2) * scale));
  const contrast = theme._pixelContrast;
  const saturation = theme._pixelSaturation;
  const brightness = theme._pixelBrightness;

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  // Build CSS filter string
  const filters: string[] = [];
  if (shadow) filters.push(`drop-shadow(${shadowOffset}px ${shadowOffset}px 0px ${shadowColor})`);
  if (contrast !== undefined) filters.push(`contrast(${contrast})`);
  if (saturation !== undefined) filters.push(`saturate(${saturation})`);
  if (brightness !== undefined) filters.push(`brightness(${brightness})`);

  const containerStyle: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    display: "inline-block",
    ...(filters.length ? { filter: filters.join(" ") } : {}),
  };

  const imgStyle: CSSProperties = {
    width: size,
    height: size,
    imageRendering: "pixelated",
    borderRadius: rounded ? "12%" : 0,
    display: "block",
    border: outline ? `${outlineWidth}px solid ${outlineColor}` : "none",
  };

  return (
    <div style={containerStyle}>
      <img src={dataUri} width={density} height={density} style={imgStyle} alt={alt} />
      {scanlines && (
        <div style={{
          position: "absolute", inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent ${scanlineSpacing}px, rgba(0,0,0,${scanlineOpacity}) ${scanlineSpacing}px, rgba(0,0,0,${scanlineOpacity}) ${scanlineSpacing + 1}px)`,
          pointerEvents: "none",
          borderRadius: rounded ? "12%" : 0,
        }} />
      )}
      {grid && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundSize: `${size / density}px ${size / density}px`,
          backgroundImage: `linear-gradient(${gridColor} ${gridOpacity}, transparent ${gridOpacity}), linear-gradient(90deg, ${gridColor} ${gridOpacity}, transparent ${gridOpacity})`,
          pointerEvents: "none",
          borderRadius: rounded ? "12%" : 0,
        }} />
      )}
    </div>
  );
}

// ─── Liquid Glass Wrapper ───────────────────────

function GlassWrapper({ children, size, theme }: { children: React.ReactNode; size: number; theme: SolFaceTheme }) {
  const scale = size / 64;

  const blurRadius = (theme._blurRadius ?? 12) * scale;
  const saturate = theme._saturate ?? 1.8;
  const tintOpacity = theme._tintOpacity ?? 0.12;
  const tintColor = theme._tintColor ?? "rgba(255,255,255,1)";
  const borderOpacity = theme._borderOpacity ?? 0.25;
  const borderWidth = Math.max(0.5, (theme._borderWidth ?? 1) * scale);
  const borderColor = theme._borderColor ?? `rgba(255,255,255,${borderOpacity})`;
  const specularOpacity = theme._specularOpacity ?? 0.25;
  const specularColor = theme._specularColor ?? "rgba(255,255,255,1)";
  const specularEnd = theme._specularEnd ?? 50;
  const lightAngle = theme._lightAngle ?? 135;
  const rimIntensity = theme._rimIntensity ?? 0.08;

  // Decomposed shadow scales with size; legacy _shadow string used as-is for backward compat
  const shadowY = Math.round((theme._shadowY ?? 8) * scale);
  const shadowBlurR = Math.round((theme._shadowBlur ?? 32) * scale);
  const shadowOpacity = theme._shadowOpacity ?? 0.12;
  const shadowStr = theme._shadow ?? `0 ${shadowY}px ${shadowBlurR}px rgba(0,0,0,${shadowOpacity})`;

  const bgRadius = (theme.bgRadius ?? 16) * scale;

  const containerStyle: CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    display: "inline-block",
    borderRadius: bgRadius,
    overflow: "hidden",
    backdropFilter: `blur(${blurRadius}px) saturate(${saturate})`,
    WebkitBackdropFilter: `blur(${blurRadius}px) saturate(${saturate})`,
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: shadowStr,
  };

  return (
    <div style={containerStyle}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: tintColor, opacity: tintOpacity,
        borderRadius: bgRadius, pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(${lightAngle}deg, ${specularColor.replace("1)", `${specularOpacity})`)} 0%, transparent ${specularEnd}%)`,
        borderRadius: bgRadius, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: bgRadius,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,${rimIntensity})`,
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────

export function SolFace({
  walletAddress,
  size = 64,
  enableBlink = false,
  theme,
  traitOverrides,
  colorOverrides,
  detail: detailProp,
  showName = false,
  namePosition = "below",
  nameFormat = "display",
  className,
  style,
  ...rest
}: SolFaceProps) {
  const traits = useMemo(
    () => generateTraits(walletAddress, traitOverrides),
    [walletAddress, traitOverrides],
  );

  const detailOpt = detailProp ?? "auto";
  const full = detailOpt === "full" || (detailOpt === "auto" && size >= 48);
  const flat = theme?.flat ?? false;

  const skinColors = theme?.skinColors ?? SKIN_COLORS;
  const eyeColors = theme?.eyeColors ?? EYE_COLORS;
  const hairColors = theme?.hairColors ?? HAIR_COLORS;
  const bgColors = theme?.bgColors ?? BG_COLORS;

  const skin = colorOverrides?.skin ?? skinColors[traits.skinColor % skinColors.length];
  const eyeCol = colorOverrides?.eyes ?? eyeColors[traits.eyeColor % eyeColors.length];
  const hairCol = colorOverrides?.hair ?? hairColors[traits.hairColor % hairColors.length];
  const bgCol = colorOverrides?.bg ?? bgColors[traits.bgColor % bgColors.length];

  const derived = useMemo(() => deriveSkinColors(skin), [skin]);

  const bgOpacity = theme?.bgOpacity ?? 1;
  const bgRadius = theme?.bgRadius ?? 4;
  const browColor = colorOverrides?.eyebrow ?? theme?.eyebrowColor ?? derived.browColor;
  const noseFill = colorOverrides?.nose ?? theme?.noseColor ?? derived.noseFill;
  const lipColor = colorOverrides?.mouth ?? theme?.mouthColor ?? derived.lipColor;
  const eyeWhite = colorOverrides?.eyeWhite ?? theme?.eyeWhiteColor ?? derived.eyeWhiteAdapted;
  const glassesColor = theme?.glassesColor ?? "#4a4a5a";
  const earringColor = theme?.earringColor ?? blend(skin, "#d4a840", 0.4);
  const headbandColor = theme?.headbandColor ?? blend(hairCol, "#c04040", 0.5);
  const accColor = colorOverrides?.accessory ?? theme?.accessoryColor ?? derived.accessoryColor;
  const earFillFinal = theme?.earColor ?? derived.earFill;
  const lidFinal = theme?.lidColor ?? derived.lidColor;
  const beautyMarkColor = theme?.beautyMarkColor ?? "#3a2a2a";
  const freckleColor = theme?.freckleColor ?? "#a0785a";

  const id = useMemo(() => "sf" + djb2(walletAddress).toString(36), [walletAddress]);

  const cheekEnabled = theme?.cheekEnabled ?? true;
  const cheekColor = theme?.cheekColor ?? derived.cheekColor;
  const cheekOpacity = theme?.cheekOpacity ?? derived.cheekOpacity;

  const hi = traits.hairStyle % 10;
  const ai = effectiveAccessory(traits);

  const blinkEnabled = !!enableBlink;
  const blinkDuration = typeof enableBlink === "object" ? (enableBlink.duration ?? 4) : 4;
  const blinkDelay = typeof enableBlink === "object" ? (enableBlink.delay ?? 0) : 0;
  const delayStr = blinkDelay ? ` ${blinkDelay}s` : "";

  const bgFill = flat ? bgCol : `url(#${id}bg)`;
  const skinFill = flat ? skin : `url(#${id}sg)`;

  // Pixel art mode — use string renderer and wrap in pixel div
  if (theme?._pixel) {
    const pixelSvg = renderSolFaceSVG(walletAddress, {
      size,
      theme: { ...theme, _pixel: false, _glass: false },
      traitOverrides,
      colorOverrides,
      detail: detailProp,
    });
    return <PixelWrapper svgString={pixelSvg} size={size} theme={theme} alt={solFaceAltText(walletAddress)} />;
  }

  const svgElement = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", ...style }}
      role="img"
      aria-label={solFaceAltText(walletAddress)}
      {...rest}
    >
      {!flat && (
        <defs>
          <linearGradient id={`${id}sg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={derived.skinHi} />
            <stop offset="50%" stopColor={skin} />
            <stop offset="100%" stopColor={derived.skinLo} />
          </linearGradient>
          <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lighten(bgCol, 0.12)} />
            <stop offset="100%" stopColor={darken(bgCol, 0.12)} />
          </linearGradient>
          {full && cheekEnabled && (
            <>
              <radialGradient id={`${id}glow`} cx="0.5" cy="0.28" r="0.45">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={theme?.glowIntensity ?? 0.10} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </radialGradient>
              <radialGradient id={`${id}chin`} cx="0.5" cy="0.85" r="0.35">
                <stop offset="0%" stopColor={derived.skinLo} stopOpacity={0.30} />
                <stop offset="100%" stopColor={derived.skinLo} stopOpacity={0} />
              </radialGradient>
              <radialGradient id={`${id}cL`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={cheekColor} stopOpacity={cheekOpacity} />
                <stop offset="100%" stopColor={cheekColor} stopOpacity={0} />
              </radialGradient>
              <radialGradient id={`${id}cR`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={cheekColor} stopOpacity={cheekOpacity} />
                <stop offset="100%" stopColor={cheekColor} stopOpacity={0} />
              </radialGradient>
            </>
          )}
        </defs>
      )}

      {blinkEnabled && (
        <style>{`
          @keyframes ${id}-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          .${id}-eyes {
            animation: ${id}-blink ${blinkDuration}s ease-in-out${delayStr} infinite;
            transform-origin: 32px 33px;
          }
        `}</style>
      )}

      <rect x="0" y="0" width="64" height="64" fill={bgFill} opacity={bgOpacity} rx={bgRadius} />

      {theme?.hairEnabled !== false && <HairBack hi={hi} id={id} flat={flat} />}
      {theme?.earsEnabled !== false && <Ears earFill={earFillFinal} earShadow={derived.earShadow} />}
      <rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill={skinFill} opacity={theme?.skinOpacity ?? 1} />

      {full && cheekEnabled && !flat && (theme?.shadowEnabled ?? true) && <FaceOverlays id={id} />}

      {theme?.hairEnabled !== false && <HairFront hi={hi} id={id} hairCol={hairCol} flat={flat} />}

      {ai === 5 && theme?.accessoriesEnabled !== false && <Accessory ai={5} accessoryColor={accColor} glassesColor={glassesColor} earringColor={earringColor} headbandColor={headbandColor} beautyMarkColor={beautyMarkColor} freckleColor={freckleColor} skinColor={skin} />}

      <g className={blinkEnabled ? `${id}-eyes` : undefined}>
        <Eyes ei={traits.eyeStyle % 9} eyeCol={eyeCol} eyeWhite={eyeWhite} lidColor={lidFinal} full={full} />
      </g>

      {theme?.eyebrowsEnabled !== false && <Eyebrows bi={traits.eyebrows % 8} browColor={browColor} full={full} />}
      {theme?.noseEnabled !== false && <Nose ni={traits.nose % 8} noseFill={noseFill} />}
      <Mouth mi={traits.mouth % 8} lipColor={lipColor} isDark={derived.isDark} />

      {ai !== 0 && ai !== 5 && theme?.accessoriesEnabled !== false && (
        <Accessory ai={ai} accessoryColor={accColor} glassesColor={glassesColor} earringColor={earringColor} headbandColor={headbandColor} beautyMarkColor={beautyMarkColor} freckleColor={freckleColor} skinColor={skin} />
      )}

      {theme?.border && (
        <rect x="0" y="0" width="64" height="64" fill="none" stroke={theme.border.color} strokeWidth={theme.border.width} rx={bgRadius} />
      )}
    </svg>
  );

  // Liquid glass mode
  if (theme?._glass) {
    const glassEl = (
      <GlassWrapper size={size} theme={theme}>
        {svgElement}
      </GlassWrapper>
    );
    if (!showName) return glassEl;
    const glassName = deriveName(walletAddress, nameFormat);
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {namePosition === "above" && <span style={{ fontSize: Math.max(10, size / 5), fontFamily: "inherit" }}>{glassName}</span>}
        {glassEl}
        {namePosition === "below" && <span style={{ fontSize: Math.max(10, size / 5), fontFamily: "inherit" }}>{glassName}</span>}
      </div>
    );
  }

  if (!showName) return svgElement;
  const walletName = deriveName(walletAddress, nameFormat);
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {namePosition === "above" && <span style={{ fontSize: Math.max(10, size / 5), fontFamily: "inherit" }}>{walletName}</span>}
      {svgElement}
      {namePosition === "below" && <span style={{ fontSize: Math.max(10, size / 5), fontFamily: "inherit" }}>{walletName}</span>}
    </div>
  );
}
