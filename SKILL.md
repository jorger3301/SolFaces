---
name: solfaces
description: Generates deterministic avatars and names for Solana wallet addresses. Use when the user mentions wallet avatars, profile pictures, visual identity, SolFaces, Solana PFP, deterministic identity, wallet names, or needs to represent a Solana wallet visually or with a human-readable name. Provides SVG rendering, natural language descriptions, SHA-256 name derivation, and AI agent identity prompts. 6 tools available.
---

# SolFaces

Deterministic avatar and name generator for Solana wallets. Every wallet address produces a unique, consistent face and name. ~53M unique avatars, ~1M display names (~65.5B unique tags). Zero dependencies, sub-millisecond, works everywhere.

---

## Available Tools

### `generate_solface_svg`
Render an SVG avatar from a wallet address.

**When to use:** User wants to see an avatar, embed one in a page, or display a wallet's face.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | -- | Solana wallet address (base58) |
| `size` | number | No | 64 | Width/height in pixels. >= 48 uses full detail. |
| `theme` | string | No | -- | Preset: default, dark, light, mono, flat, transparent, glass, glassDark, pixel, pixelRetro, pixelClean |
| `enableBlink` | boolean | No | false | CSS eye-blink animation |
| `detail` | string | No | auto | "full", "simplified", or "auto" (full if size >= 48) |

Returns: SVG string. Note: glass/pixel themes are React-only.

### `describe_solface`
Natural language description of a wallet's avatar.

**When to use:** User wants alt text, a profile bio, or to know what a face looks like.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | -- | Solana wallet address |
| `format` | string | No | paragraph | paragraph, structured, or compact |
| `perspective` | string | No | third | third or first |
| `name` | string | No | -- | Name to use instead of "This SolFace" |

Returns: description string. Auto-populates `name` from `deriveName(wallet, "display")` if no name provided.

### `get_solface_traits`
Raw trait data with human-readable labels and hash.

**When to use:** User wants to inspect raw trait values, compare wallets, or build custom rendering logic.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Solana wallet address |

Returns: `{ traits: SolFaceTraits, labels: Record<string, string>, hash: string, name: string }`. Name is auto-populated from `deriveName(wallet, "display")`.

### `get_agent_identity`
System prompt snippet giving an AI agent a visual identity.

**When to use:** User is building an AI agent and wants to give it a visual identity tied to a wallet.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Agent's wallet address |
| `agentName` | string | No | Agent name for personalization |

Returns: First-person identity prompt string. Auto-populates agent name from `deriveName(wallet, "display")` if no `agentName` provided.

### `derive_solname`
Derive a deterministic name from a wallet via SHA-256 hashing and curated word lists.

**When to use:** User needs a name for a wallet, wants to label a wallet, or needs an identity name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | -- | Solana wallet address (base58) |
| `format` | string | No | -- | "short", "display", "tag", or "full". Omit for full identity object. |

Returns: Without format: `SolNameIdentity` object (short/name/tag/full/adjective/noun/hash/discriminator). With format: formatted string.

### `list_solface_themes`
List available preset themes with descriptions.

**When to use:** User wants to see available themes or choose a visual style.

No parameters. Returns: Array of `{ name, description, reactOnly }`.

---

## Installation

```bash
npm install solfaces
```
```html
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
```
```bash
curl -O https://raw.githubusercontent.com/jorger3301/SolFace/main/python/solfaces.py
```

---

## Import Paths

| Project Type | Import Path | What You Get |
|---|---|---|
| React / Next.js | `solfaces/react` | `<SolFace>` component with pixel art and glass modes |
| Vanilla JS / Vue / Svelte | `solfaces/vanilla` | `mountSolFace()`, `setSolFaceImg()`, `autoInit()` |
| Node.js server / API | `solfaces` | `renderSolFaceSVG()`, `renderSolFacePNG()`, descriptions, colors |
| No build step / CDN | `<script>` tag | `window.SolFaces` global |
| AI agent framework | `solfaces/agent` | Tool schemas + format adapters |
| Theme presets only | `solfaces/themes` | 11 preset theme objects |
| Names only | `solfaces/names` | `deriveName()`, `deriveIdentity()`, validation |
| Python backend | `from solfaces import ...` | Full Python port |

---

## Quick Examples

### React
```tsx
import { SolFace } from "solfaces/react";
<SolFace walletAddress="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" size={48} enableBlink showName />
```

### Server-side
```ts
import { renderSolFaceSVG } from "solfaces";
const svg = renderSolFaceSVG("7xKXtg...", { size: 256 });
```

### Name derivation
```ts
import { deriveName, deriveIdentity } from "solfaces";
deriveName("7xKXtg...");           // "Sunny Icon"
deriveName("7xKXtg...", "tag");    // "Sunny Icon#2f95"
const id = deriveIdentity("7xKXtg...");  // full identity object
```

### CDN
```html
<div data-solface="7xKXtg..." data-solface-size="48"></div>
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
<script>
  const name = SolFaces.deriveName("7xKXtg...");
  SolFaces.mount("#avatar", "7xKXtg...", { size: 64 });
</script>
```

### Python
```python
from solfaces import generate_traits, render_svg, describe_appearance, derive_name
svg = render_svg("7xKXtg...", size=256)
name = derive_name("7xKXtg...")
```

---

## Rendering Modes

- **Full detail** (size >= 48): Gradients, specular highlights, cheek blush, chin shadow, glow.
- **Simplified** (size < 48): Flat shapes, no gradients. Override with `detail: "full"` or `"simplified"`.
- **Flat mode**: `theme: { flat: true }` disables all gradients.
- **Pixel art** (React only): `pixelTheme`, `pixelRetroTheme`, `pixelCleanTheme`.
- **Liquid glass** (React only): `glassTheme`, `glassDarkTheme`.

---

## Detailed Reference

For comprehensive documentation on specific topics:

- **React component**: Full props interface, all rendering modes, `useSolName` hook, `showName` prop, color overrides, blink timing. See [reference/react.md](reference/react.md)
- **Themes**: All theme fields, pixel art and glass customization, theme recommendations, custom theme examples. See [reference/themes.md](reference/themes.md)
- **Integrations**: Agent framework adapters (OpenAI, Anthropic, Vercel AI, MCP), server-side routes, bot integration, full API reference, color math utilities, accessibility. See [reference/integrations.md](reference/integrations.md)

---

## Key Facts

- **Deterministic**: Same wallet = same face + same name. djb2 + mulberry32 PRNG (traits), SHA-256 + mulberry32 PRNG (names).
- **10 visual traits**: Skin (10), eye style (9), eye color (8), eyebrows (8), nose (8), mouth (8), hair style (10), hair color (10), accessory (12), background (12) = ~53M unique avatars. Hair style and color are sampled for PRNG ordering but all render as bald. (faceShape field exists for PRNG ordering but all faces render as squircle.)
- **SolNames**: 1000 adjectives + 1000 nouns, SHA-256 derived. Formats: short, display (~1M), tag (~65.5B), full (~1T). Custom word lists supported via `DeriveOptions`.
- **Cross-language parity**: JS and Python produce identical output.
- **Zero dependencies**: Core engine has no runtime deps.
- **SVG viewBox**: All avatars use 64x64 viewBox, scaled by `size`.
- **Alt text**: `solFaceAltText(wallet)` provides accessible descriptions.
