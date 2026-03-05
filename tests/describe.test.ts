import { describe, it, expect } from "vitest";
import {
  describeAppearance,
  describeTraits,
  solFaceAltText,
  agentAppearancePrompt,
} from "../src/core/describe";
import { generateTraits } from "../src/core/traits";

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("describeAppearance", () => {
  it("is deterministic", () => {
    const a = describeAppearance(WALLET);
    const b = describeAppearance(WALLET);
    expect(a).toBe(b);
  });

  it("third person contains 'This SolFace has'", () => {
    const desc = describeAppearance(WALLET, { perspective: "third" });
    expect(desc).toContain("This SolFace has");
  });

  it("first person contains 'I have'", () => {
    const desc = describeAppearance(WALLET, { perspective: "first" });
    expect(desc).toContain("I have");
  });

  it("named third person uses name", () => {
    const desc = describeAppearance(WALLET, { perspective: "third", name: "Atlas" });
    expect(desc).toContain("Atlas has");
  });

  it("named first person uses name", () => {
    const desc = describeAppearance(WALLET, { perspective: "first", name: "Atlas" });
    expect(desc).toContain("I'm Atlas");
  });

  it("bald first person says 'and am bald'", () => {
    const desc = describeAppearance(WALLET, {
      perspective: "first",
    });
    // Force a bald wallet by using describeTraits directly
    const traits = { ...generateTraits(WALLET), hairStyle: 0 };
    const baldDesc = describeTraits(traits, { perspective: "first" });
    expect(baldDesc).toContain("and am bald");
    expect(baldDesc).not.toContain("and is bald");
  });

  it("bald third person says 'and is bald'", () => {
    const traits = { ...generateTraits(WALLET), hairStyle: 0 };
    const desc = describeTraits(traits, { perspective: "third" });
    expect(desc).toContain("and is bald");
  });

  it("includes background by default", () => {
    const desc = describeAppearance(WALLET);
    expect(desc.toLowerCase()).toContain("background");
  });

  it("excludes background when requested", () => {
    const desc = describeAppearance(WALLET, { includeBackground: false });
    expect(desc.toLowerCase()).not.toContain("background");
  });
});

describe("structured format", () => {
  it("contains labeled lines", () => {
    const desc = describeAppearance(WALLET, { format: "structured" });
    expect(desc).toContain("Face:");
    expect(desc).toContain("Skin:");
    expect(desc).toContain("Eyes:");
    expect(desc).toContain("Mouth:");
  });
});

describe("compact format", () => {
  it("is comma-separated with no periods", () => {
    const desc = describeAppearance(WALLET, { format: "compact" });
    expect(desc).toContain(",");
    expect(desc).not.toContain(".");
  });

  it("always describes as bald regardless of hair style", () => {
    const traits = { ...generateTraits(WALLET), hairStyle: 2 };
    const desc = describeTraits(traits, { format: "compact" });
    expect(desc).toContain("bald");
    expect(desc).not.toMatch(/voluminous|hair/i);
  });
});

describe("solFaceAltText", () => {
  it("returns string starting with 'SolFace avatar:'", () => {
    const alt = solFaceAltText(WALLET);
    expect(alt).toMatch(/^SolFace avatar:/);
  });
});

describe("agentAppearancePrompt", () => {
  it("contains key identity phrases", () => {
    const prompt = agentAppearancePrompt(WALLET);
    expect(prompt).toContain("visual identity");
    expect(prompt).toContain("SolFace avatar");
    expect(prompt).toContain("deterministic");
  });

  it("uses agent name when provided", () => {
    const prompt = agentAppearancePrompt(WALLET, "Atlas");
    expect(prompt).toContain("Atlas");
  });
});

describe("describeTraits", () => {
  it("produces same output as describeAppearance for same wallet", () => {
    const traits = generateTraits(WALLET);
    const fromTraits = describeTraits(traits);
    const fromWallet = describeAppearance(WALLET);
    expect(fromTraits).toBe(fromWallet);
  });
});
