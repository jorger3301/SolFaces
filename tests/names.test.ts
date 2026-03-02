import { describe, it, expect } from "vitest";
import {
  deriveName,
  deriveIdentity,
  isValidSolName,
  parseSolName,
  ADJECTIVES,
  NOUNS,
  SOLNAMES_VERSION,
  BLOCKED_COMBOS,
} from "../src/names";
import type { DeriveOptions } from "../src/names";
import { sha256, sha256Hex } from "../src/names/sha256";

// ─── SHA-256 ────────────────────────────────────────────────────

describe("SHA-256 — NIST test vectors", () => {
  it("hashes empty string correctly", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hashes 'abc' correctly", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("hashes 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq' correctly", () => {
    expect(sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("returns Uint8Array of 32 bytes", () => {
    const result = sha256("test");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });
});

// ─── Word Lists ─────────────────────────────────────────────────

describe("Word lists", () => {
  it("has exactly 1000 adjectives", () => {
    expect(ADJECTIVES.length).toBe(1000);
  });

  it("has exactly 1000 nouns", () => {
    expect(NOUNS.length).toBe(1000);
  });

  it("has no duplicate adjectives", () => {
    expect(new Set(ADJECTIVES).size).toBe(ADJECTIVES.length);
  });

  it("has no duplicate nouns", () => {
    expect(new Set(NOUNS).size).toBe(NOUNS.length);
  });

  it("all adjectives are PascalCase", () => {
    for (const w of ADJECTIVES) {
      expect(w).toMatch(/^[A-Z][a-z]+$/);
    }
  });

  it("all nouns are PascalCase", () => {
    for (const w of NOUNS) {
      expect(w).toMatch(/^[A-Z][a-z]+$/);
    }
  });

  it("version is v1", () => {
    expect(SOLNAMES_VERSION).toBe("v1");
  });
});

// ─── Name Formats ───────────────────────────────────────────────

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("deriveName — format shapes", () => {
  it("short returns a single PascalCase word", () => {
    const name = deriveName(WALLET, "short");
    expect(name).toMatch(/^[A-Z][a-z]+$/);
  });

  it("display returns two PascalCase words concatenated", () => {
    const name = deriveName(WALLET, "display");
    expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+$/);
  });

  it("tag returns display + #4hex", () => {
    const name = deriveName(WALLET, "tag");
    expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+#[0-9a-f]{4}$/);
  });

  it("full returns AdjNoun-AdjNoun", () => {
    const name = deriveName(WALLET, "full");
    expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+-[A-Z][a-z]+[A-Z][a-z]+$/);
  });

  it("defaults to display format", () => {
    expect(deriveName(WALLET)).toBe(deriveName(WALLET, "display"));
  });
});

// ─── Frozen Test Vectors ────────────────────────────────────────

describe("deriveName — frozen test vectors", () => {
  const vectors: [string, string][] = [
    ["7JfkjvMnwTvZNGNam2RgJ1BBxMpsqaQRaWmvejig7uCa", "FierceSortie"],
    ["7PjJ2AHq9BMXWYjt3qqeKwZVLXHYFPmHRYrMF6PpRySD", "WavingMistral"],
    ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "FortifiedAlluvium"],
    ["So11111111111111111111111111111111111111112", "JettingSagittarius"],
    ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "CometEscarpment"],
    ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "SeasoningPeat"],
  ];

  for (const [wallet, expected] of vectors) {
    it(`${wallet.slice(0, 8)}... → ${expected}`, () => {
      expect(deriveName(wallet)).toBe(expected);
    });
  }
});

// ─── Determinism ────────────────────────────────────────────────

describe("deriveName — determinism", () => {
  it("same wallet always produces the same name (1000 calls)", () => {
    const first = deriveName(WALLET);
    for (let i = 0; i < 1000; i++) {
      expect(deriveName(WALLET)).toBe(first);
    }
  });

  it("different wallets produce different names (100 samples)", () => {
    const names = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const fakeWallet = `${i}${"1".repeat(43 - String(i).length)}`;
      names.add(deriveName(fakeWallet));
    }
    expect(names.size).toBeGreaterThanOrEqual(90);
  });
});

// ─── deriveIdentity ─────────────────────────────────────────────

describe("deriveIdentity", () => {
  it("returns all required fields", () => {
    const id = deriveIdentity(WALLET);
    expect(id).toHaveProperty("short");
    expect(id).toHaveProperty("name");
    expect(id).toHaveProperty("tag");
    expect(id).toHaveProperty("full");
    expect(id).toHaveProperty("adjective");
    expect(id).toHaveProperty("noun");
    expect(id).toHaveProperty("hash");
    expect(id).toHaveProperty("discriminator");
  });

  it("hash is 64-char hex string", () => {
    expect(deriveIdentity(WALLET).hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("discriminator is 4-char hex string", () => {
    expect(deriveIdentity(WALLET).discriminator).toMatch(/^[0-9a-f]{4}$/);
  });

  it("adjective is in ADJECTIVES list", () => {
    expect(ADJECTIVES).toContain(deriveIdentity(WALLET).adjective);
  });

  it("noun is in NOUNS list", () => {
    expect(NOUNS).toContain(deriveIdentity(WALLET).noun);
  });

  it("name = adjective + noun", () => {
    const id = deriveIdentity(WALLET);
    expect(id.name).toBe(id.adjective + id.noun);
  });

  it("tag = name + # + discriminator", () => {
    const id = deriveIdentity(WALLET);
    expect(id.tag).toBe(id.name + "#" + id.discriminator);
  });

  it("short = adjective", () => {
    const id = deriveIdentity(WALLET);
    expect(id.short).toBe(id.adjective);
  });
});

// ─── Blocked Combos ─────────────────────────────────────────────

describe("Blocked combinations", () => {
  it("no blocked combos appear in 10000 generated names", () => {
    for (let i = 0; i < 10000; i++) {
      const wallet = `test${i}${"1".repeat(40 - String(i).length)}`;
      const id = deriveIdentity(wallet);
      expect(BLOCKED_COMBOS.has(id.adjective + id.noun)).toBe(false);
    }
  });
});

// ─── Validation ─────────────────────────────────────────────────

describe("isValidSolName / parseSolName", () => {
  it("validates display format", () => {
    expect(isValidSolName(deriveName(WALLET, "display"))).toBe(true);
  });

  it("validates tag format", () => {
    expect(isValidSolName(deriveName(WALLET, "tag"))).toBe(true);
  });

  it("rejects invalid names", () => {
    expect(isValidSolName("notaname")).toBe(false);
    expect(isValidSolName("")).toBe(false);
    expect(isValidSolName("ABC")).toBe(false);
  });

  it("parses display format correctly", () => {
    const parsed = parseSolName(deriveName(WALLET, "display"));
    expect(parsed).not.toBeNull();
    expect(parsed!.adjective).toBeTruthy();
    expect(parsed!.noun).toBeTruthy();
  });

  it("parses tag format correctly", () => {
    const parsed = parseSolName(deriveName(WALLET, "tag"));
    expect(parsed).not.toBeNull();
    expect(parsed!.discriminator).toMatch(/^[0-9a-f]{4}$/);
  });

  it("returns null for invalid names", () => {
    expect(parseSolName("notaname")).toBeNull();
    expect(parseSolName("")).toBeNull();
  });
});

// ─── DeriveOptions — Custom Word Lists ─────────────────────────

describe("DeriveOptions — custom word lists", () => {
  const customOpts: DeriveOptions = {
    adjectives: ["Alpha", "Bravo", "Charlie", "Delta", "Echo"],
    nouns: ["Tiger", "Eagle", "Bear", "Wolf", "Hawk"],
  };

  it("uses custom adjectives", () => {
    const id = deriveIdentity(WALLET, customOpts);
    expect(customOpts.adjectives).toContain(id.adjective);
  });

  it("uses custom nouns", () => {
    const id = deriveIdentity(WALLET, customOpts);
    expect(customOpts.nouns).toContain(id.noun);
  });

  it("produces different names than defaults", () => {
    const defaultName = deriveName(WALLET);
    const customName = deriveName(WALLET, "display", customOpts);
    expect(customName).not.toBe(defaultName);
  });

  it("is deterministic with custom lists", () => {
    const a = deriveName(WALLET, "display", customOpts);
    const b = deriveName(WALLET, "display", customOpts);
    expect(a).toBe(b);
  });

  it("custom domain changes output", () => {
    const defaultId = deriveIdentity(WALLET);
    const customId = deriveIdentity(WALLET, { domain: "custom-v1" });
    expect(customId.hash).not.toBe(defaultId.hash);
  });

  it("custom blocked combos are enforced", () => {
    // Get the default name and block it
    const defaultId = deriveIdentity(WALLET);
    const blockedName = defaultId.adjective + defaultId.noun;
    const opts: DeriveOptions = {
      blockedCombos: new Set([blockedName]),
    };
    const newId = deriveIdentity(WALLET, opts);
    expect(newId.adjective + newId.noun).not.toBe(blockedName);
  });

  it("no options = same as default", () => {
    const withoutOpts = deriveName(WALLET);
    const withEmptyOpts = deriveName(WALLET, "display", {});
    expect(withEmptyOpts).toBe(withoutOpts);
  });

  it("all formats work with custom options", () => {
    const short = deriveName(WALLET, "short", customOpts);
    const display = deriveName(WALLET, "display", customOpts);
    const tag = deriveName(WALLET, "tag", customOpts);
    const full = deriveName(WALLET, "full", customOpts);
    expect(short).toBeTruthy();
    expect(display).toBeTruthy();
    expect(tag).toContain("#");
    expect(full).toContain("-");
  });
});
