import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";
import {
  generateTraits,
  traitHash,
  effectiveAccessory,
  getTraitLabels,
} from "../src/core/traits";
import {
  describeAppearance,
  describeTraits,
  solFaceAltText,
  agentAppearancePrompt,
} from "../src/core/describe";
import { deriveName, deriveIdentity } from "../src/names";

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const PYTHON_DIR = resolve(import.meta.dirname ?? __dirname, "../python");

function runPython(code: string): string {
  return execSync(`python3 -c '${code}'`, {
    cwd: PYTHON_DIR,
    encoding: "utf-8",
  }).trim();
}

function runPythonJSON(code: string): unknown {
  return JSON.parse(runPython(`import json; ${code}`));
}

describe("Python parity — trait generation", () => {
  it("generates identical traits for the same wallet", () => {
    const tsTraits = generateTraits(WALLET);
    const pyTraits = runPythonJSON(`
from solfaces import generate_traits
t = generate_traits("${WALLET}")
print(json.dumps(t.to_dict()))
    `);
    expect(pyTraits).toEqual(tsTraits);
  });

  it("generates identical traits for multiple wallets", () => {
    const wallets = [
      "4Nd1m5drB5pESoEGBqJSrELwTaGEHnNFxcSzJUt8qMBr",
      "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
      "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "So11111111111111111111111111111111111111112",
    ];

    for (const w of wallets) {
      const tsTraits = generateTraits(w);
      const pyTraits = runPythonJSON(`
from solfaces import generate_traits
t = generate_traits("${w}")
print(json.dumps(t.to_dict()))
      `);
      expect(pyTraits).toEqual(tsTraits);
    }
  });

  it("produces identical trait hash", () => {
    const tsHash = traitHash(WALLET);
    const pyHash = runPython(`
from solfaces import trait_hash
print(trait_hash("${WALLET}"))
    `);
    expect(pyHash).toBe(tsHash);
  });

  it("produces identical trait labels", () => {
    const tsLabels = getTraitLabels(generateTraits(WALLET));
    const pyLabels = runPythonJSON(`
from solfaces import generate_traits, get_trait_labels
t = generate_traits("${WALLET}")
print(json.dumps(get_trait_labels(t)))
    `);
    expect(pyLabels).toEqual(tsLabels);
  });

  it("effective accessory suppression matches", () => {
    // No styles suppress earrings anymore — earrings pass through on all styles
    const tsResult = effectiveAccessory({ ...generateTraits(WALLET), accessory: 4, hairStyle: 5 });
    const pyResult = Number(runPython(`
from solfaces import generate_traits, effective_accessory
t = generate_traits("${WALLET}")
t.accessory = 4
t.hair_style = 5
print(effective_accessory(t))
    `));
    expect(pyResult).toBe(tsResult);
    expect(pyResult).toBe(4);
  });
});

describe("Python parity — descriptions", () => {
  it("paragraph format matches", () => {
    const tsDesc = describeAppearance(WALLET);
    const pyDesc = runPython(`
from solfaces import describe_appearance
print(describe_appearance("${WALLET}"))
    `);
    expect(pyDesc).toBe(tsDesc);
  });

  it("compact format matches", () => {
    const tsDesc = describeAppearance(WALLET, { format: "compact" });
    const pyDesc = runPython(`
from solfaces import describe_appearance
print(describe_appearance("${WALLET}", format="compact"))
    `);
    expect(pyDesc).toBe(tsDesc);
  });

  it("structured format matches", () => {
    const tsDesc = describeAppearance(WALLET, { format: "structured" });
    const pyDesc = runPython(`
from solfaces import describe_appearance
print(describe_appearance("${WALLET}", format="structured"))
    `);
    expect(pyDesc).toBe(tsDesc);
  });

  it("first person perspective matches", () => {
    const tsDesc = describeAppearance(WALLET, { perspective: "first" });
    const pyDesc = runPython(`
from solfaces import describe_appearance
print(describe_appearance("${WALLET}", perspective="first"))
    `);
    expect(pyDesc).toBe(tsDesc);
  });

  it("agent appearance prompt matches", () => {
    const tsPrompt = agentAppearancePrompt(WALLET, "Atlas");
    const pyPrompt = runPython(`
from solfaces import agent_appearance_prompt
print(agent_appearance_prompt("${WALLET}", "Atlas"))
    `);
    expect(pyPrompt).toBe(tsPrompt);
  });

  it("alt text matches", () => {
    const tsAlt = solFaceAltText(WALLET);
    const pyAlt = runPython(`
from solfaces import sol_face_alt_text
print(sol_face_alt_text("${WALLET}"))
    `);
    expect(pyAlt).toBe(tsAlt);
  });
});

describe("Python parity — SolNames derivation", () => {
  const wallets = [
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "7JfkjvMnwTvZNGNam2RgJ1BBxMpsqaQRaWmvejig7uCa",
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ];

  it("derive_name display format matches across all wallets", () => {
    for (const w of wallets) {
      const tsName = deriveName(w, "display");
      const pyName = runPython(`
from solfaces import derive_name
print(derive_name("${w}", "display"))
      `);
      expect(pyName).toBe(tsName);
    }
  });

  it("derive_name short format matches", () => {
    for (const w of wallets) {
      const tsName = deriveName(w, "short");
      const pyName = runPython(`
from solfaces import derive_name
print(derive_name("${w}", "short"))
      `);
      expect(pyName).toBe(tsName);
    }
  });

  it("derive_name tag format matches", () => {
    for (const w of wallets) {
      const tsName = deriveName(w, "tag");
      const pyName = runPython(`
from solfaces import derive_name
print(derive_name("${w}", "tag"))
      `);
      expect(pyName).toBe(tsName);
    }
  });

  it("derive_name full format matches", () => {
    for (const w of wallets) {
      const tsName = deriveName(w, "full");
      const pyName = runPython(`
from solfaces import derive_name
print(derive_name("${w}", "full"))
      `);
      expect(pyName).toBe(tsName);
    }
  });

  it("derive_identity hash matches", () => {
    for (const w of wallets) {
      const tsId = deriveIdentity(w);
      const pyHash = runPython(`
from solfaces import derive_identity
print(derive_identity("${w}")["hash"])
      `);
      expect(pyHash).toBe(tsId.hash);
    }
  });

  it("derive_identity discriminator matches", () => {
    for (const w of wallets) {
      const tsId = deriveIdentity(w);
      const pyDisc = runPython(`
from solfaces import derive_identity
print(derive_identity("${w}")["discriminator"])
      `);
      expect(pyDisc).toBe(tsId.discriminator);
    }
  });
});
