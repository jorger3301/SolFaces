// ═══════════════════════════════════════════════════════════════
// SOLFACES v2 — AI Agent Description Generator
// Produces natural language descriptions of a wallet's SolFace
// for use in system prompts, bios, and self-reference.
// ═══════════════════════════════════════════════════════════════

import { generateTraits, effectiveAccessory, type SolFaceTraits } from "./traits";

// ─── Vocabulary Maps ─────────────────────────────────────────

const SKIN_TONES: Record<number, string> = {
  0: "porcelain",
  1: "ivory",
  2: "fair",
  3: "light",
  4: "sand",
  5: "golden",
  6: "warm",
  7: "caramel",
  8: "brown",
  9: "deep",
};

const EYE_STYLES: Record<number, string> = {
  0: "round, wide-open",
  1: "small and minimal",
  2: "almond-shaped",
  3: "wide and expressive",
  4: "relaxed, half-lidded",
  5: "joyful, crescent-shaped",
  6: "bright and sparkling",
  7: "gentle and narrow",
};

const EYE_COLORS_DESC: Record<number, string> = {
  0: "dark brown",
  1: "blue",
  2: "green",
  3: "hazel",
  4: "gray",
};

const EYEBROW_STYLES: Record<number, string> = {
  0: "wispy",
  1: "straight",
  2: "natural",
  3: "elegantly arched",
  4: "sharply angled",
};

const NOSE_STYLES: Record<number, string> = {
  0: "a subtle shadow nose",
  1: "a small button nose",
  2: "a soft curved nose",
  3: "a button nose with visible nostrils",
};

const MOUTH_STYLES: Record<number, string> = {
  0: "a gentle smile",
  1: "a calm, neutral expression",
  2: "a happy grin",
  3: "a surprised O-shaped mouth",
  4: "a confident smirk",
  5: "a wide, toothy grin",
  6: "a flat, straight expression",
  7: "a soft pout",
};

const HAIR_STYLES: Record<number, string> = {
  0: "bald, with no hair",
  1: "short, neatly cropped hair",
  2: "bouncy, curly hair",
  3: "side-swept hair",
  4: "a voluminous puff",
  5: "long hair that falls past the shoulders",
  6: "a clean bob cut",
  7: "a close buzz cut",
  8: "flowing, wavy hair",
  9: "a neat topknot",
};

const HAIR_COLORS_DESC: Record<number, string> = {
  0: "jet black",
  1: "espresso brown",
  2: "walnut",
  3: "honey blonde",
  4: "copper red",
  5: "silver",
  6: "charcoal",
  7: "burgundy",
  8: "strawberry",
  9: "ginger",
};

const ACCESSORY_DESC: Record<number, string> = {
  0: "",
  1: "a beauty mark",
  2: "round glasses",
  3: "rectangular glasses",
  4: "a dangling earring",
  5: "a headband",
  6: "freckles",
  7: "stud earrings",
  8: "aviator sunglasses",
  9: "a band-aid",
};

const BG_COLORS_DESC: Record<number, string> = {
  0: "rose",
  1: "olive",
  2: "sage",
  3: "fern",
  4: "mint",
  5: "ocean",
  6: "sky",
  7: "lavender",
  8: "orchid",
  9: "blush",
};

// ─── Description Builder ─────────────────────────────────────

export interface DescribeOptions {
  includeBackground?: boolean;
  format?: "paragraph" | "structured" | "compact";
  perspective?: "first" | "third";
  name?: string;
}

export function describeAppearance(
  walletAddress: string,
  options?: DescribeOptions,
): string {
  const traits = generateTraits(walletAddress);
  const {
    includeBackground = true,
    format = "paragraph",
    perspective = "third",
    name,
  } = options ?? {};

  if (format === "structured") return buildStructured(traits, includeBackground);
  if (format === "compact") return buildCompact(traits);
  return buildParagraph(traits, perspective, name, includeBackground);
}

export function describeTraits(
  traits: SolFaceTraits,
  options?: DescribeOptions,
): string {
  const {
    includeBackground = true,
    format = "paragraph",
    perspective = "third",
    name,
  } = options ?? {};

  if (format === "structured") return buildStructured(traits, includeBackground);
  if (format === "compact") return buildCompact(traits);
  return buildParagraph(traits, perspective, name, includeBackground);
}

// ─── Builders ────────────────────────────────────────────────

function buildParagraph(
  t: SolFaceTraits,
  perspective: "first" | "third",
  name?: string,
  includeBg?: boolean,
): string {
  const parts: string[] = [];
  const ai = effectiveAccessory(t);

  const subject = perspective === "first"
    ? (name ? `I'm ${name}. I have` : "I have")
    : (name ? `${name} has` : "This SolFace has");

  const im = perspective === "first" ? "I'm" : "They're";

  // Face + skin (all squircle now)
  parts.push(`${subject} a squircle face with ${SKIN_TONES[t.skinColor] ?? "warm"} skin`);

  // Eyes
  const eyeStyle = EYE_STYLES[t.eyeStyle] ?? "round";
  const eyeColor = EYE_COLORS_DESC[t.eyeColor] ?? "dark";
  parts.push(`${eyeStyle} ${eyeColor} eyes`);

  // Eyebrows
  const brows = EYEBROW_STYLES[t.eyebrows];
  if (brows) parts.push(`${brows} eyebrows`);

  // Hair
  const hairStyle = HAIR_STYLES[t.hairStyle] ?? "";
  const hairColor = HAIR_COLORS_DESC[t.hairColor] ?? "";
  if (t.hairStyle === 0) {
    parts.push(perspective === "first" ? "and am bald" : "and is bald");
  } else if (hairStyle.startsWith("a ")) {
    parts.push(`and a ${hairColor} ${hairStyle.slice(2)}`);
  } else {
    parts.push(`and ${hairColor} ${hairStyle}`);
  }

  // Build main sentence
  let desc = parts[0];
  if (parts.length > 2) {
    desc += ", " + parts.slice(1, -1).join(", ") + ", " + parts[parts.length - 1];
  } else if (parts.length === 2) {
    desc += " and " + parts[1];
  }
  desc += ".";

  // Nose
  const nose = NOSE_STYLES[t.nose];
  if (nose) {
    const noseSubject = perspective === "first"
      ? "I have"
      : (name ?? "They") + (name ? " has" : " have");
    desc += ` ${noseSubject} ${nose}.`;
  }

  // Accessory
  const acc = ACCESSORY_DESC[ai];
  if (acc) {
    desc += ` ${im} wearing ${acc}.`;
  }

  // Mouth
  const mouth = MOUTH_STYLES[t.mouth] ?? "a smile";
  const mouthVerb = perspective === "first"
    ? "I have"
    : (name ?? "They") + (name ? " has" : " have");
  desc += ` ${mouthVerb} ${mouth}.`;

  // Background
  if (includeBg) {
    const bg = BG_COLORS_DESC[t.bgColor] ?? "colorful";
    desc += ` The background is ${bg}.`;
  }

  return desc;
}

function buildStructured(t: SolFaceTraits, includeBg: boolean): string {
  const ai = effectiveAccessory(t);
  const lines: string[] = [
    `Face: squircle`,
    `Skin: ${SKIN_TONES[t.skinColor] ?? "warm"}`,
    `Eyes: ${EYE_STYLES[t.eyeStyle] ?? "round"}, ${EYE_COLORS_DESC[t.eyeColor] ?? "dark"}`,
    `Eyebrows: ${EYEBROW_STYLES[t.eyebrows] ?? "wispy"}`,
  ];

  const nose = NOSE_STYLES[t.nose];
  if (nose) lines.push(`Nose: ${nose.replace(/^a /, "")}`);

  lines.push(`Mouth: ${MOUTH_STYLES[t.mouth] ?? "smile"}`);

  if (t.hairStyle === 0) {
    lines.push("Hair: bald");
  } else {
    const hs = HAIR_STYLES[t.hairStyle] ?? "";
    const hc = HAIR_COLORS_DESC[t.hairColor] ?? "";
    lines.push(`Hair: ${hc} ${hs.startsWith("a ") ? hs.slice(2) : hs}`);
  }

  const acc = ACCESSORY_DESC[ai];
  if (acc) lines.push(`Accessory: ${acc}`);

  if (includeBg) {
    lines.push(`Background: ${BG_COLORS_DESC[t.bgColor] ?? "colorful"}`);
  }

  return lines.join("\n");
}

function buildCompact(t: SolFaceTraits): string {
  const ai = effectiveAccessory(t);
  const parts: string[] = [];

  parts.push(`squircle face`);
  parts.push(`${SKIN_TONES[t.skinColor] ?? "warm"} skin`);
  parts.push(`${EYE_COLORS_DESC[t.eyeColor] ?? "dark"} ${EYE_STYLES[t.eyeStyle] ?? "round"} eyes`);

  if (t.hairStyle === 0) {
    parts.push("bald");
  } else {
    const raw = HAIR_STYLES[t.hairStyle] ?? "hair";
    const hs = raw.includes(",") ? raw.replace(/.*,\s*/, "") : raw;
    const hc = HAIR_COLORS_DESC[t.hairColor] ?? "";
    parts.push(`${hc} ${hs.startsWith("a ") ? hs.slice(2) : hs}`);
  }

  const acc = ACCESSORY_DESC[ai];
  if (acc) parts.push(acc);

  parts.push((MOUTH_STYLES[t.mouth] ?? "smiling").replace(/^a /, ""));

  return parts.join(", ");
}

// ─── Alt Text Helper ─────────────────────────────────────────

export function solFaceAltText(walletAddress: string): string {
  return `SolFace avatar: ${describeAppearance(walletAddress, { format: "compact", includeBackground: false })}`;
}

// ─── System Prompt Helper ────────────────────────────────────

export function agentAppearancePrompt(
  walletAddress: string,
  agentName?: string,
): string {
  const desc = describeAppearance(walletAddress, {
    perspective: "first",
    name: agentName,
    includeBackground: false,
    format: "paragraph",
  });

  const hash = (djb2Simple(walletAddress) >>> 0).toString(16).padStart(8, "0");

  return `My visual identity is a SolFace avatar (ID: ${hash}) derived from my wallet address. ${desc} This appearance is deterministic — anyone who looks up my wallet will see the same face.`;
}

// Inline djb2 to avoid circular dependency
function djb2Simple(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
