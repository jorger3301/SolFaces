# Changelog

All notable changes to SolFaces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.2.0] — 2026-03-01

### Changed

- **Space-separated SolNames** — Names now use spaces between adjective and noun for natural readability: `"Sunny Icon"` instead of `"SunnyIcon"`. Same words, same wallets — only the formatting changed.

### Added

- **`separator` option in `DeriveOptions`** — Customize the separator between adjective and noun. Default is `" "` (space). Use `""` for legacy PascalCase concatenation, `"-"` for hyphenated, or any custom string.

## [2.1.2] — 2026-03-01

### Improved

- **SKILL.md discoverability** — Added trigger phrases (Solana PFP, deterministic identity, wallet names) and "When to use" sections for all 6 tools.
- **CI workflow** — Added lint step to GitHub Actions pipeline.
- **README badges** — Added TypeScript and dynamic CI status badges.

## [2.1.1] — 2026-03-01

### Added

- **`DeriveOptions`** — `deriveName()` and `deriveIdentity()` now accept an optional options parameter for custom word lists, domain prefix, and blocked combinations. Fully backward-compatible.
- **`glowIntensity` theme field** — Face glow opacity is now customizable via `SolFaceTheme.glowIntensity` (0-1, default 0.10).

### Fixed

- **SKILL.md git casing** — Fixed `skill.md` → `SKILL.md` for case-sensitive filesystems (Linux/CI).
- **Theme image location** — Moved `solfaces-themes-labeled.png` to `assets/` to keep repo root clean.
- **SKILL.md documentation** — Added return types, auto-populate notes, Python example, full wallet address in examples.
- **reference/integrations.md** — Added `RenderOptions` interface documentation and server-side `colorOverrides` example.

## [2.1.0] — 2026-03-01

### Added

- **SolNames — deterministic name derivation** — Every wallet gets a human-friendly name derived via SHA-256 hashing and curated word lists. 1000 adjectives + 1000 nouns produce names like "Sunny Icon". Four formats: short ("Sunny"), display ("Sunny Icon", ~1M unique), tag ("Sunny Icon#2f95", ~65.5B unique), full ("Sunny Icon-Infinite Ore", ~1T unique). Same wallet = same name, forever.
- **`deriveName(wallet, format?)`** — Core name derivation function. Exported from `solfaces` and `solfaces/names`.
- **`deriveIdentity(wallet)`** — Returns full identity bundle: short, name, tag, full, adjective, noun, hash, discriminator.
- **`isValidSolName()` / `parseSolName()`** — Name validation and parsing utilities.
- **`solfaces/names` subpath export** — New entry point for name-only imports.
- **`useSolName()` React hook** — Returns name string or full identity bundle with `useMemo` optimization.
- **`showName` / `namePosition` / `nameFormat` React props** — Display derived name above or below the avatar.
- **`derive_solname` agent tool** — New tool for AI agents to derive wallet names. Supports optional `format` parameter; without format returns full identity object.
- **Auto-populated names in agent tools** — `describe_solface`, `get_solface_traits`, and `get_agent_identity` now use `deriveName(wallet, "display")`.
- **CDN support** — `SolFaces.deriveName()` and `SolFaces.deriveIdentity()` available on the global CDN bundle.
- **Python parity** — `derive_name()` and `derive_identity()` added to `python/solfaces.py` with identical output. `generate_name()` kept as deprecated alias.
- **Pure-JS SHA-256** — Sync, zero-dependency implementation (~80 lines) for name derivation. Works in Node, browser, edge, Bun.
- **Blocked combination enforcement** — Offensive adjective+noun pairs are deterministically skipped.
- **Comprehensive test suite** — SHA-256 NIST vectors, word list validation, all 4 format shapes, frozen test vectors, determinism, blocked combos, validation, Python parity across all formats.

### Removed

- **`generateName()`** — Replaced by `deriveName()`. Old phonetic name system removed entirely.
- **`generate_solface_name` agent tool** — Replaced by `derive_solname`.
- **`src/core/names.ts`** — Phonetic name generator removed. SolNames lives in `src/names/`.

## [2.0.0] — 2026-02-28

### Added

- **Gradient-rich SVG rendering** — Skin-luminance-driven color derivation for cheeks, chin shadow, glow highlights, specular eye reflections, and natural lip/nose/ear colors.
- **Expanded trait space** — ~2.56 billion unique combinations (up from ~11 million in v1).
  - Skin tones: 6 → 10
  - Mouth styles: 6 → 8
  - Hair styles: 8 → 10
  - Hair colors: 8 → 10
  - Accessories: 6 → 10
  - Background colors: 5 → 10
- **11 built-in themes** — Default, Dark, Light, Mono, Flat, Transparent (universal), plus Pixel, Pixel Retro, Pixel Clean, Glass, Glass Dark (React-only).
- **Detail level system** — `full` (gradients, cheeks, specular — size ≥ 48px), `simplified` (flat shapes — size < 48px), `auto` (default, switches based on size).
- **AI agent identity system** — `describeAppearance()` generates natural language descriptions in 3 formats (paragraph, structured, compact) × 2 perspectives (first person, third person). `agentAppearancePrompt()` generates system prompt snippets. `solFaceAltText()` for accessibility.
- **Agent tool definitions** — 5 tools (`generate_solface_svg`, `describe_solface`, `get_solface_traits`, `get_agent_identity`, `list_solface_themes`) with JSON schemas compatible with OpenAI, Anthropic, Vercel AI, and MCP.
- **MCP server** — `npx solfaces-mcp` for Model Context Protocol integration.
- **Framework adapters** — `allToolsOpenAI()`, `allToolsAnthropic()`, `allToolsVercelAI()`, `allToolsMCP()` for plug-and-play agent integration.
- **Pixel art mode** — 3 React-only presets (`pixel`, `pixelRetro`, `pixelClean`) with customizable density, scanlines, grid overlay, and drop shadow.
- **Liquid glass mode** — 2 React-only presets (`glass`, `glassDark`) with CSS backdrop-blur, specular highlights, and rim lighting.
- **Flat rendering mode** — `flat: true` disables all SVG gradients for print, email clients, and minimal UIs.
- **Transparent background mode** — `bgOpacity: 0` for compositing over custom backgrounds.
- **Blink animation** — CSS-based eye blink with customizable duration and delay.
- **Color math utilities** — `hexToRgb`, `rgbToHex`, `darken`, `lighten`, `blend`, `luminance`, `deriveSkinColors`, `buzzOpacity`.
- **PNG rasterization** — `renderSolFacePNG()` for Node.js (via sharp or @resvg/resvg-js), `renderSolFacePNGBrowser()` and `renderSolFacePNGDataURL()` for browsers.
- **Vanilla JS helpers** — `mountSolFace()`, `setSolFaceImg()`, `autoInit()` for non-React environments.
- **CDN bundle** — `solfaces/cdn` for `<script>` tag usage with `window.SolFaces` global.
- **Python port** — Full parity implementation in `python/solfaces.py` with zero dependencies.
- **Subpath exports** — `solfaces/core`, `solfaces/react`, `solfaces/vanilla`, `solfaces/themes`, `solfaces/agent` for tree-shaking.
- **Per-instance color overrides** — `colorOverrides` with 9 keys: skin, eyes, hair, bg, mouth, eyebrow, accessory, nose, eyeWhite.
- **Earring suppression** — Earrings and stud earrings automatically hidden on long and bob hair styles to prevent visual conflicts.
- **Visual depth layers** — Ears and hair-back rendering behind the face for long, bob, and wavy hair styles.
- **Test suite** — 116 tests across 8 modules (traits, colors, renderer, describe, names, themes, agent tools, Python parity) with Vitest.
- **CI/CD** — GitHub Actions workflow running typecheck → build → test on Node 18, 20, and 22.

### Changed

- All faces render as squircle shape (faceShape trait still consumed by PRNG for backward-compatible ordering but all shapes render identically).
- Theme system redesigned with `SolFaceTheme` interface supporting 50+ customizable fields.
- React `<SolFace>` component expanded with pixel art, liquid glass, theme, blink, and detail level support.

### Breaking Changes

- **All faces change.** Trait ranges expanded, so every wallet generates a different face than in v1. There is no migration path — v2 faces are a fresh start.
- **Old themes removed.** `solana`, `neon`, `jupiter`, `phantom`, `circle` themes are gone. Use `dark`, `light`, `mono`, `flat`, `transparent`, or the new `glass`/`pixel` families.
- **New rendering engine.** Gradient-rich rendering with skin-luminance-driven colors replaces the flat SVG output from v1.
- **New theme fields.** `flat`, `cheekEnabled`, `shadowEnabled`, and React-only `_glass*`/`_pixel*` fields added to `SolFaceTheme`.
- **`colorOverrides` unchanged.** Per-instance color overrides work the same as v1 — no migration needed for this feature.
