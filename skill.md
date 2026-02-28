# SolFaces — AI Agent Skill

You have access to SolFaces, a deterministic avatar generator for Solana wallets. Every wallet address produces a unique, consistent face — same wallet = same face, always. No API calls, no database, no randomness. ~11M unique combinations across 11 traits.

Use these tools whenever a user mentions wallet avatars, profile pictures, visual identity, or when you need to represent a Solana wallet visually.

---

## Available Tools

### `generate_solface_svg`
Render an SVG avatar from a wallet address.

**When to use:** User wants to see an avatar, embed one in a page, save an image, or display a wallet's face.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | — | Solana wallet address (base58) |
| `size` | number | No | 64 | Width/height in pixels |
| `theme` | string | No | — | Preset: solana, dark, light, mono, neon, jupiter, phantom, circle |
| `enableBlink` | boolean | No | false | CSS eye-blink animation |

Returns: SVG string.

### `describe_solface`
Generate a natural language description of a wallet's avatar.

**When to use:** User wants alt text, a profile bio, accessibility text, or to know what a face looks like.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | — | Solana wallet address |
| `format` | string | No | paragraph | paragraph, structured, or compact |
| `perspective` | string | No | third | third or first |
| `name` | string | No | — | Name to use instead of "This SolFace" |

Returns: Description string.

### `get_solface_traits`
Get raw trait data with human-readable labels and a deterministic hash.

**When to use:** User wants structured data, wants to compare wallets, or needs the trait hash.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Solana wallet address |

Returns: `{ traits, labels, hash }`

### `get_agent_identity`
Generate a system prompt snippet giving an AI agent a visual identity.

**When to use:** Setting up an AI agent's persona or bot profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Agent's wallet address |
| `agentName` | string | No | Agent name for personalization |

Returns: First-person identity prompt string.

### `list_solface_themes`
List available preset themes with descriptions.

**When to use:** User asks what themes exist or you need to recommend one.

No parameters. Returns: Array of `{ name, description }`.

---

## Installation

### npm / yarn / pnpm
```bash
npm install solfaces
```

### CDN (no build step)
```html
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
```

### Python (zero dependencies)
```bash
curl -O https://raw.githubusercontent.com/jorger3301/solfaces/main/python/solfaces.py
```

---

## Import Paths — Choose the Right One

| Project Type | Import Path | What You Get |
|---|---|---|
| React / Next.js app | `solfaces/react` | `<SolFace>` component with JSX |
| Vanilla JS / Vue / Svelte | `solfaces/vanilla` | `mountSolFace()`, `setSolFaceImg()`, `autoInit()` |
| Node.js server / API route | `solfaces` | `renderSolFaceSVG()`, `renderSolFacePNG()`, descriptions |
| No build step / CDN | `<script>` tag | `window.SolFaces` global |
| AI agent framework | `solfaces/agent` | Tool schemas + format adapters |
| Theme presets only | `solfaces/themes` | 8 preset theme objects |
| Python backend | `from solfaces import ...` | Full Python port |

---

## React Integration

### Basic usage
```tsx
import { SolFace } from "solfaces/react";

<SolFace walletAddress="7xKXtg..." size={48} />
```

### With theme
```tsx
import { SolFace } from "solfaces/react";
import { darkTheme } from "solfaces/themes";

<SolFace walletAddress="7xKXtg..." size={48} theme={darkTheme} />
```

### With blink animation
```tsx
<SolFace walletAddress="7xKXtg..." enableBlink />
```

### With trait overrides (pin specific traits)
```tsx
<SolFace walletAddress="7xKXtg..." traitOverrides={{ hairStyle: 0 }} />
```

### With custom styling
```tsx
<SolFace
  walletAddress="7xKXtg..."
  size={48}
  className="my-avatar"
  style={{ borderRadius: "50%" }}
  onClick={handleClick}
/>
```

### All props
```tsx
interface SolFaceProps {
  walletAddress: string;           // Required
  size?: number;                   // Default: 64
  enableBlink?: boolean;           // Default: false
  theme?: SolFaceTheme;            // Optional theme object
  traitOverrides?: Partial<SolFaceTraits>;  // Pin specific traits
  className?: string;
  style?: React.CSSProperties;
  // ...all SVG element props
}
```

---

## Server-Side / API Routes

### Next.js App Router
```ts
import { renderSolFaceSVG } from "solfaces";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const svg = renderSolFaceSVG(wallet, { size: 256 });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
```

### PNG for Discord/Telegram (requires `sharp` or `@resvg/resvg-js`)
```ts
import { renderSolFacePNG } from "solfaces";

const pngBuffer = await renderSolFacePNG("7xKXtg...", { pngSize: 512 });

// Save to file
fs.writeFileSync("avatar.png", pngBuffer);

// HTTP response
return new Response(pngBuffer, {
  headers: { "Content-Type": "image/png" },
});
```

### Express
```ts
import { renderSolFaceSVG } from "solfaces";

app.get("/avatar/:wallet", (req, res) => {
  const svg = renderSolFaceSVG(req.params.wallet, { size: 256 });
  res.type("image/svg+xml").send(svg);
});
```

---

## Bot Integration

### Telegram Bot (grammy)
```ts
import { renderSolFacePNG } from "solfaces";

bot.command("avatar", async (ctx) => {
  const wallet = ctx.match;
  const png = await renderSolFacePNG(wallet, { pngSize: 256 });
  await ctx.replyWithPhoto(new InputFile(png, "solface.png"));
});
```

### Discord Bot (discord.js)
```ts
import { renderSolFacePNG } from "solfaces";
import { AttachmentBuilder } from "discord.js";

const png = await renderSolFacePNG(wallet, { pngSize: 256 });
const attachment = new AttachmentBuilder(png, { name: "solface.png" });
await interaction.reply({ files: [attachment] });
```

---

## Custom Themes — Match Your UI

### Use a preset theme
```ts
import { renderSolFaceSVG } from "solfaces";
import { darkTheme } from "solfaces/themes";

const svg = renderSolFaceSVG(wallet, { theme: darkTheme });
```

### Extend a preset
```ts
import { getPresetTheme } from "solfaces/themes";

const myTheme = getPresetTheme("dark", {
  bgRadius: 999,                           // Make it circular
  border: { color: "#14F195", width: 2 },  // Add Solana green border
});
```

### Build a fully custom theme
```ts
import type { SolFaceTheme } from "solfaces";

const brandTheme: SolFaceTheme = {
  // Override color palettes (arrays — one per trait variant)
  skinColors: ["#ffd5b0", "#f4c794", "#e0a370", "#c68642", "#8d5524", "#4a2c17"],
  eyeColors: ["#333", "#4a80c4", "#5a9a5a", "#c89430", "#8a8a8a"],
  hairColors: ["#1a1a1a", "#6b3a2a", "#d4a844", "#c44a20", "#c8e64a", "#6090e0", "#14F195", "#e040c0"],
  bgColors: ["#0a0f1a", "#1a0a2e", "#0a1628"],  // Your brand backgrounds

  // Override single colors
  mouthColor: "#e06070",
  eyebrowColor: "#aaa",
  accessoryColor: "#888",

  // Layout
  bgOpacity: 1,          // 0-1, background fill opacity
  bgRadius: 999,         // Border radius (999 = circle)
  border: { color: "#14F195", width: 2 },  // Optional border
};
```

### Theme field reference

| Field | Type | What it controls |
|-------|------|-----------------|
| `skinColors` | `string[]` | Face/skin fill colors (6 variants) |
| `eyeColors` | `string[]` | Iris/pupil colors (5 variants) |
| `hairColors` | `string[]` | Hair fill colors (8 variants) |
| `bgColors` | `string[]` | Background fill colors (5 variants) |
| `mouthColor` | `string` | Mouth stroke/fill color |
| `eyebrowColor` | `string` | Eyebrow stroke color |
| `accessoryColor` | `string` | Glasses/accessory stroke color |
| `bgOpacity` | `number` | Background opacity (0-1) |
| `bgRadius` | `number` | SVG rect border radius |
| `border` | `{ color, width }` | Optional border around avatar |

### Theme recommendations by context

| Context | Theme | Why |
|---------|-------|-----|
| Dark UI / dark mode | `dark` | Dark backgrounds, muted tones |
| Light UI / white background | `light` | Soft pastels |
| Solana-branded | `solana` | Vibrant #14F195, #9945FF |
| Minimal / clean | `mono` | Full grayscale |
| Gaming / cyberpunk | `neon` | High-contrast neon + green border |
| Jupiter DEX | `jupiter` | Matches Jupiter palette |
| Phantom wallet | `phantom` | Purple tones |
| Circular profile pic | `circle` | border-radius: 999 |

---

## Agent Framework Integration

### OpenAI Function Calling
```ts
import { allToolsOpenAI, handleToolCall } from "solfaces/agent";

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages,
  tools: allToolsOpenAI(),
});

// Handle tool calls
for (const call of response.choices[0].message.tool_calls) {
  const result = await handleToolCall(call.function.name, JSON.parse(call.function.arguments));
}
```

### Claude / Anthropic Tool Use
```ts
import { allToolsAnthropic, handleToolCall } from "solfaces/agent";

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  messages,
  tools: allToolsAnthropic(),
});

// Handle tool use blocks
for (const block of response.content) {
  if (block.type === "tool_use") {
    const result = await handleToolCall(block.name, block.input);
  }
}
```

### Vercel AI SDK
```ts
import { allToolsVercelAI } from "solfaces/agent";
import { generateText } from "ai";

const { text } = await generateText({
  model: yourModel,
  prompt: "Show me the avatar for wallet 7xKXtg...",
  tools: allToolsVercelAI(),
});
```

### MCP Server (Claude Code / Cursor)
Add to your MCP config (`~/.claude/settings.json` or `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "solfaces": {
      "command": "npx",
      "args": ["solfaces-mcp"]
    }
  }
}
```

### Universal dispatcher (any framework)
```ts
import { handleToolCall } from "solfaces/agent";

const svg = await handleToolCall("generate_solface_svg", {
  wallet: "7xKXtg...",
  theme: "dark",
  size: 128,
});
```

---

## Accessibility

Always provide alt text for SolFace avatars:

```ts
import { solFaceAltText } from "solfaces";

const alt = solFaceAltText("7xKXtg...");
// → "SolFace avatar: angular, hexagonal face, light peach skin, green round, wide-open eyes, ..."
```

Or use the `describe_solface` tool with `format: "compact"` for the same result.

In React:
```tsx
<img src={dataUri} alt={solFaceAltText(wallet)} />
```

---

## API Reference

| Function | Import | Returns | Description |
|----------|--------|---------|-------------|
| `generateTraits(wallet, overrides?)` | `solfaces` | `SolFaceTraits` | Deterministic traits from wallet |
| `renderSolFaceSVG(wallet, options?)` | `solfaces` | `string` | Raw SVG markup |
| `renderSolFaceDataURI(wallet, options?)` | `solfaces` | `string` | Data URI for `<img>` tags |
| `renderSolFaceBase64(wallet, options?)` | `solfaces` | `string` | Base64 data URI |
| `renderSolFacePNG(wallet, options?)` | `solfaces` | `Promise<Buffer>` | PNG buffer (Node, needs sharp/resvg) |
| `renderSolFacePNGBrowser(wallet, options?)` | `solfaces` | `Promise<Blob>` | PNG blob (browser) |
| `describeAppearance(wallet, options?)` | `solfaces` | `string` | Natural language description |
| `agentAppearancePrompt(wallet, name?)` | `solfaces` | `string` | System prompt for AI agents |
| `solFaceAltText(wallet)` | `solfaces` | `string` | Accessible alt text |
| `getTraitLabels(traits)` | `solfaces` | `Record<string, string>` | Human-readable trait names |
| `traitHash(wallet)` | `solfaces` | `string` | 8-char hex hash |
| `getPresetTheme(name, overrides?)` | `solfaces/themes` | `SolFaceTheme` | Get/extend a preset theme |
| `SOLFACE_TOOLS` | `solfaces/agent` | `SolFaceTool[]` | All 5 tool definitions |
| `handleToolCall(name, params)` | `solfaces/agent` | `unknown` | Universal tool dispatcher |
| `allToolsOpenAI()` | `solfaces/agent` | `OpenAITool[]` | Tools in OpenAI format |
| `allToolsAnthropic()` | `solfaces/agent` | `AnthropicTool[]` | Tools in Anthropic format |
| `allToolsVercelAI()` | `solfaces/agent` | `Record<string, VercelAITool>` | Tools in Vercel AI format |
| `allToolsMCP()` | `solfaces/agent` | `MCPTool[]` | Tools in MCP format |

---

## Key Facts

- **Deterministic**: Same wallet = same face, always. Guaranteed by djb2 hash + mulberry32 PRNG.
- **11 traits**: Face shape (4), skin (6), eye style (8), eye color (5), eyebrows (5), nose (4), mouth (6), hair style (8), hair color (8), accessory (6), background (5) = ~11M unique combinations.
- **Cross-language parity**: JavaScript and Python produce identical output.
- **Zero dependencies**: Core engine has no runtime deps.
- **Sub-millisecond**: Trait generation and SVG rendering are nearly instant.
- **SVG viewBox**: All avatars use a 64x64 viewBox, scaled by the `size` parameter.
