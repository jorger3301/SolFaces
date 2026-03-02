// ═══════════════════════════════════════════════════
// SOLFACES v2 — Deterministic avatar trait engine
// ═══════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────

export interface SolFaceTraits {
  faceShape: number;   // 0-3 (consumed for PRNG ordering, all render as squircle)
  skinColor: number;   // 0-9
  eyeStyle: number;    // 0-7
  eyeColor: number;    // 0-4
  eyebrows: number;    // 0-4
  nose: number;        // 0-3
  mouth: number;       // 0-7
  hairStyle: number;   // 0-9
  hairColor: number;   // 0-9
  accessory: number;   // 0-9
  bgColor: number;     // 0-9
}

export interface SolFaceTheme {
  // Palette overrides
  skinColors?: string[];
  eyeColors?: string[];
  hairColors?: string[];
  bgColors?: string[];

  // Single-color overrides
  mouthColor?: string;
  eyebrowColor?: string;
  accessoryColor?: string;
  eyeWhiteColor?: string;
  noseColor?: string;
  glassesColor?: string;
  earringColor?: string;
  headbandColor?: string;

  // Layout
  bgOpacity?: number;
  bgRadius?: number;
  border?: { color: string; width: number };

  // Rendering options
  flat?: boolean;
  cheekEnabled?: boolean;
  cheekColor?: string;
  cheekOpacity?: number;
  skinOpacity?: number;
  shadowEnabled?: boolean;
  glowIntensity?: number;

  // React-only: pixel art mode
  _pixel?: boolean;
  _pixelDensity?: number;
  _pixelRounded?: boolean;
  _pixelOutline?: boolean;
  _pixelOutlineColor?: string;
  _pixelOutlineWidth?: number;
  _pixelContrast?: number;
  _pixelSaturation?: number;
  _pixelBrightness?: number;
  _pixelScanlines?: boolean;
  _pixelScanlineOpacity?: number;
  _pixelScanlineSpacing?: number;
  _pixelGrid?: boolean;
  _pixelGridOpacity?: number;
  _pixelGridColor?: string;
  _pixelShadow?: boolean;
  _pixelShadowColor?: string;
  _pixelShadowOffset?: number;

  // React-only: liquid glass mode
  _glass?: boolean;
  _blurRadius?: number;
  _saturate?: number;
  _tintOpacity?: number;
  _tintColor?: string;
  _borderOpacity?: number;
  _borderWidth?: number;
  _borderColor?: string;
  _specularOpacity?: number;
  _specularColor?: string;
  _specularEnd?: number;
  _lightAngle?: number;
  _rimIntensity?: number;
  _shadow?: string;
}

export interface RenderOptions {
  size?: number;
  theme?: SolFaceTheme;
  traitOverrides?: Partial<SolFaceTraits>;
  enableBlink?: boolean | {
    duration?: number;
    delay?: number;
  };
  className?: string;
  detail?: "full" | "simplified" | "auto";
  colorOverrides?: {
    skin?: string;
    eyes?: string;
    hair?: string;
    bg?: string;
    mouth?: string;
    eyebrow?: string;
    accessory?: string;
    nose?: string;
    eyeWhite?: string;
  };
}

// ─── Color Palettes ──────────────────────────────

export const SKIN_COLORS = [
  "#faeae5", "#efd6c8", "#e4c5aa", "#d5b590", "#c59e77",
  "#b4875f", "#9d6d4d", "#805742", "#654134", "#4b2d25",
];

export const EYE_COLORS = [
  "#382414", "#3868A8", "#38784C", "#808838", "#586878",
];

export const HAIR_COLORS = [
  "#1A1A24", "#4C3428", "#887058", "#D4B868", "#A84830",
  "#C0C0CC", "#484858", "#783850", "#D8B0A0", "#C08048",
];

export const BG_COLORS = [
  "#b98387", "#a9a360", "#9eb785", "#69ab79", "#81bbb0",
  "#6499af", "#7f8bbd", "#8869ab", "#b785b3", "#ab6984",
];

// ─── Hashing (djb2) ─────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ─── PRNG (mulberry32) ──────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Trait Generation ───────────────────────────

export function generateTraits(
  walletAddress: string,
  overrides?: Partial<SolFaceTraits>
): SolFaceTraits {
  const seed = djb2(walletAddress);
  const rand = mulberry32(seed);

  // IMPORTANT: Order must NEVER change — shifts all downstream values.
  // faceShape is consumed for PRNG ordering but unused in rendering (all squircle).
  const traits: SolFaceTraits = {
    faceShape:  Math.floor(rand() * 4),
    skinColor:  Math.floor(rand() * 10),
    eyeStyle:   Math.floor(rand() * 8),
    eyeColor:   Math.floor(rand() * 5),
    eyebrows:   Math.floor(rand() * 5),
    nose:       Math.floor(rand() * 4),
    mouth:      Math.floor(rand() * 8),
    hairStyle:  Math.floor(rand() * 10),
    hairColor:  Math.floor(rand() * 10),
    accessory:  Math.floor(rand() * 10),
    bgColor:    Math.floor(rand() * 10),
  };

  return overrides ? { ...traits, ...overrides } : traits;
}

// ─── Effective Accessory ────────────────────────
// Earrings/studs are suppressed on long/bob hair

export function effectiveAccessory(traits: SolFaceTraits): number {
  const ai = traits.accessory % 10;
  const hi = traits.hairStyle % 10;
  if ((ai === 4 || ai === 7) && (hi === 5 || hi === 6)) return 0;
  return ai;
}

// ─── Trait Labels ───────────────────────────────

const FACE_LABELS = ["Squircle"];
const SKIN_LABELS = [
  "Porcelain", "Ivory", "Fair", "Light", "Sand",
  "Golden", "Warm", "Caramel", "Brown", "Deep",
];
const EYE_STYLE_LABELS = ["Round", "Minimal", "Almond", "Wide", "Relaxed", "Joyful", "Bright", "Gentle"];
const EYE_COLOR_LABELS = ["Chocolate", "Sky", "Emerald", "Hazel", "Storm"];
const BROW_LABELS = ["Wispy", "Straight", "Natural", "Arched", "Angled"];
const NOSE_LABELS = ["Shadow", "Button", "Soft", "Nostrils"];
const MOUTH_LABELS = ["Smile", "Calm", "Happy", "Oh", "Smirk", "Grin", "Flat", "Pout"];
const HAIR_STYLE_LABELS = [
  "Bald", "Short", "Curly", "Side Sweep", "Puff",
  "Long", "Bob", "Buzz", "Wavy", "Topknot",
];
const HAIR_COLOR_LABELS = [
  "Black", "Espresso", "Walnut", "Honey", "Copper",
  "Silver", "Charcoal", "Burgundy", "Strawberry", "Ginger",
];
const ACCESSORY_LABELS = [
  "None", "Beauty Mark", "Round Glasses", "Rect Glasses", "Earring",
  "Headband", "Freckles", "Stud Earrings", "Aviators", "Band-Aid",
];
const BG_COLOR_LABELS = [
  "Rose", "Olive", "Sage", "Fern", "Mint",
  "Ocean", "Sky", "Lavender", "Orchid", "Blush",
];

export function getTraitLabels(traits: SolFaceTraits): Record<string, string> {
  return {
    faceShape: FACE_LABELS[0],
    skinColor: SKIN_LABELS[traits.skinColor] ?? "Fair",
    eyeStyle: EYE_STYLE_LABELS[traits.eyeStyle] ?? "Round",
    eyeColor: EYE_COLOR_LABELS[traits.eyeColor] ?? "Chocolate",
    eyebrows: BROW_LABELS[traits.eyebrows] ?? "Wispy",
    nose: NOSE_LABELS[traits.nose] ?? "Shadow",
    mouth: MOUTH_LABELS[traits.mouth] ?? "Smile",
    hairStyle: HAIR_STYLE_LABELS[traits.hairStyle] ?? "Bald",
    hairColor: HAIR_COLOR_LABELS[traits.hairColor] ?? "Black",
    accessory: ACCESSORY_LABELS[effectiveAccessory(traits)] ?? "None",
    bgColor: BG_COLOR_LABELS[traits.bgColor] ?? "Rose",
  };
}

// ─── Trait Hash ─────────────────────────────────

export function traitHash(walletAddress: string): string {
  return (djb2(walletAddress) >>> 0).toString(16).padStart(8, "0");
}

// ─── Theme Utilities ────────────────────────────

export function resolveTheme(
  themeName?: string,
  themes?: Record<string, SolFaceTheme>
): SolFaceTheme | undefined {
  if (!themeName || !themes) return undefined;
  return themes[themeName];
}

export function mergeTheme(
  base: SolFaceTheme | null | undefined,
  overrides: SolFaceTheme | null | undefined
): SolFaceTheme | null {
  if (!base) return overrides || null;
  if (!overrides) return base;
  return { ...base, ...overrides };
}
