// ═══════════════════════════════════════════════════════════════
// SolNames v1 — Name Validation & Parsing
// ═══════════════════════════════════════════════════════════════

import { ADJECTIVES, NOUNS } from "./constants";

const adjSet = new Set(ADJECTIVES);
const nounSet = new Set(NOUNS);

export interface ParsedSolName {
  adjective: string;
  noun: string;
  discriminator?: string;
}

/**
 * Check if a string is a valid SolName (display, tag, or full format).
 */
export function isValidSolName(name: string): boolean {
  return parseSolName(name) !== null;
}

/**
 * Parse a SolName string into its component parts.
 * Supports display ("Sunny Icon"), tag ("Sunny Icon#2f95"),
 * and full ("Sunny Icon-Infinite Ore") formats.
 *
 * Returns null if the name doesn't match any valid format.
 */
export function parseSolName(
  name: string,
): ParsedSolName | null {
  // Tag format: Adj Noun#xxxx
  const tagMatch = name.match(/^([A-Z][a-z]+) ([A-Z][a-z]+)#([0-9a-f]{4})$/);
  if (tagMatch) {
    const [, adj, noun, disc] = tagMatch;
    if (adjSet.has(adj) && nounSet.has(noun)) {
      return { adjective: adj, noun, discriminator: disc };
    }
    return null;
  }

  // Full format: Adj Noun-Adj Noun
  const fullMatch = name.match(
    /^([A-Z][a-z]+) ([A-Z][a-z]+)-([A-Z][a-z]+) ([A-Z][a-z]+)$/,
  );
  if (fullMatch) {
    const [, adj1, noun1] = fullMatch;
    if (adjSet.has(adj1) && nounSet.has(noun1)) {
      return { adjective: adj1, noun: noun1 };
    }
    return null;
  }

  // Display format: Adj Noun
  const displayMatch = name.match(/^([A-Z][a-z]+) ([A-Z][a-z]+)$/);
  if (displayMatch) {
    const [, adj, noun] = displayMatch;
    if (adjSet.has(adj) && nounSet.has(noun)) {
      return { adjective: adj, noun };
    }
    return null;
  }

  return null;
}
