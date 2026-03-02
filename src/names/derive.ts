// ═══════════════════════════════════════════════════════════════
// SolNames v1 — Name Derivation Engine
// SHA-256("solnames-v1:" + wallet) → PRNG → adjective + noun
// ═══════════════════════════════════════════════════════════════

import { sha256, sha256Hex } from "./sha256";
import { ADJECTIVES, NOUNS, BLOCKED_COMBOS, SOLNAMES_VERSION } from "./constants";
import type { NameFormat, SolNameIdentity } from "./constants";

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOMAIN = `solnames-${SOLNAMES_VERSION}:`;

/** Options for customizing name derivation. */
export interface DeriveOptions {
  /** Custom adjective word list (default: built-in 1000 adjectives) */
  adjectives?: readonly string[];
  /** Custom noun word list (default: built-in 1000 nouns) */
  nouns?: readonly string[];
  /** Custom blocked adjective+noun combinations (default: built-in set) */
  blockedCombos?: Set<string>;
  /** Custom domain prefix for SHA-256 hashing (default: "solnames-v1") */
  domain?: string;
}

/**
 * Derive a deterministic name from a Solana wallet address.
 *
 * @param wallet  Base58 wallet address
 * @param format  Name format (default: "display")
 * @param options  Custom word lists, domain, or blocked combos
 * @returns Formatted name string
 */
export function deriveName(
  wallet: string,
  format: NameFormat = "display",
  options?: DeriveOptions,
): string {
  const id = deriveIdentity(wallet, options);
  switch (format) {
    case "short":
      return id.short;
    case "display":
      return id.name;
    case "tag":
      return id.tag;
    case "full":
      return id.full;
  }
}

/**
 * Derive the full identity bundle for a wallet address.
 * Returns all four name formats plus component parts.
 */
export function deriveIdentity(
  wallet: string,
  options?: DeriveOptions,
): SolNameIdentity {
  const adjectives = options?.adjectives ?? ADJECTIVES;
  const nouns = options?.nouns ?? NOUNS;
  const blocked = options?.blockedCombos ?? BLOCKED_COMBOS;
  const domain = options?.domain ? `${options.domain}:` : DOMAIN;

  const hash = sha256(domain + wallet);
  const hex = sha256Hex(domain + wallet);

  // Seed PRNG from first 4 bytes (big-endian)
  const seed =
    ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) >>> 0;
  const rng = mulberry32(seed);

  // Pick first adj+noun pair, retrying if blocked
  let adj1 = adjectives[Math.floor(rng() * adjectives.length)];
  let noun1 = nouns[Math.floor(rng() * nouns.length)];
  while (blocked.has(adj1 + noun1)) {
    adj1 = adjectives[Math.floor(rng() * adjectives.length)];
    noun1 = nouns[Math.floor(rng() * nouns.length)];
  }

  // Pick second adj+noun pair for full format
  const adj2 = adjectives[Math.floor(rng() * adjectives.length)];
  const noun2 = nouns[Math.floor(rng() * nouns.length)];

  // Discriminator from bytes 8-9 (4 hex chars)
  const discriminator = hex.slice(16, 20);

  return {
    short: adj1,
    name: adj1 + noun1,
    tag: adj1 + noun1 + "#" + discriminator,
    full: adj1 + noun1 + "-" + adj2 + noun2,
    adjective: adj1,
    noun: noun1,
    hash: hex,
    discriminator,
  };
}
