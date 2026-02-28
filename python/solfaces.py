"""
SOLFACES — Python Port
Deterministic wallet avatar generation for Python backends, bots, and scripts.
Zero dependencies. Generates identical traits to the JavaScript version.

Usage:
    from solfaces import generate_traits, render_svg, describe_appearance

    traits = generate_traits("7xKXq...")
    svg = render_svg("7xKXq...", size=256)
    desc = describe_appearance("7xKXq...")
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict, Any
import ctypes


# ─── Types ────────────────────────────────────────────────────

@dataclass
class SolFaceTraits:
    face_shape: int   # 0-3
    skin_color: int   # 0-5
    eye_style: int    # 0-7
    eye_color: int    # 0-4
    eyebrows: int     # 0-4
    nose: int         # 0-3
    mouth: int        # 0-5
    hair_style: int   # 0-7
    hair_color: int   # 0-7
    accessory: int    # 0-5
    bg_color: int     # 0-4

    def to_dict(self) -> Dict[str, int]:
        return {
            "faceShape": self.face_shape,
            "skinColor": self.skin_color,
            "eyeStyle": self.eye_style,
            "eyeColor": self.eye_color,
            "eyebrows": self.eyebrows,
            "nose": self.nose,
            "mouth": self.mouth,
            "hairStyle": self.hair_style,
            "hairColor": self.hair_color,
            "accessory": self.accessory,
            "bgColor": self.bg_color,
        }


# ─── Color Palettes ──────────────────────────────────────────

SKIN_COLORS = ["#ffd5b0", "#f4c794", "#e0a370", "#c68642", "#8d5524", "#4a2c17"]
EYE_COLORS = ["#3d2b1f", "#4a80c4", "#5a9a5a", "#c89430", "#8a8a8a"]
HAIR_COLORS = ["#1a1a1a", "#6b3a2a", "#d4a844", "#c44a20", "#c8e64a", "#6090e0", "#14F195", "#e040c0"]
BG_COLORS = ["#c8e64a", "#6090e0", "#14F195", "#e8dcc8", "#f85149"]


# ─── Hashing (djb2) — exact JS parity ────────────────────────

def _djb2(s: str) -> int:
    """DJB2 hash — matches JavaScript implementation exactly."""
    hash_val = 5381
    for ch in s:
        # Replicate JS: ((hash << 5) + hash + charCode) | 0
        hash_val = ctypes.c_int32((hash_val << 5) + hash_val + ord(ch)).value
    # Return unsigned 32-bit (>>> 0 in JS)
    return hash_val & 0xFFFFFFFF


# ─── PRNG (mulberry32) — exact JS parity ─────────────────────

def _mulberry32(seed: int):
    """Mulberry32 PRNG — matches JavaScript implementation exactly."""
    s = ctypes.c_int32(seed).value

    def next_val() -> float:
        nonlocal s
        s = ctypes.c_int32(s + 0x6D2B79F5).value

        # Math.imul(s ^ (s >>> 15), 1 | s)
        a = (s ^ ((s & 0xFFFFFFFF) >> 15)) & 0xFFFFFFFF
        b = (1 | s) & 0xFFFFFFFF
        t = ctypes.c_int32(_imul(a, b)).value

        # (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        c = (t ^ ((t & 0xFFFFFFFF) >> 7)) & 0xFFFFFFFF
        d = (61 | t) & 0xFFFFFFFF
        old_t = t
        t = (ctypes.c_int32(old_t + _imul(c, d)).value) ^ old_t

        # ((t ^ (t >>> 14)) >>> 0) / 4294967296
        result = ((t ^ ((t & 0xFFFFFFFF) >> 14)) & 0xFFFFFFFF)
        return result / 4294967296

    return next_val


def _imul(a: int, b: int) -> int:
    """Emulate Math.imul — 32-bit integer multiply."""
    a = a & 0xFFFFFFFF
    b = b & 0xFFFFFFFF
    result = (a * b) & 0xFFFFFFFF
    if result >= 0x80000000:
        result -= 0x100000000
    return result


# ─── Trait Generation ─────────────────────────────────────────

def generate_traits(wallet_address: str) -> SolFaceTraits:
    """
    Generate deterministic avatar traits from a Solana wallet address.
    Produces identical output to the JavaScript version.
    """
    seed = _djb2(wallet_address)
    rand = _mulberry32(seed)

    return SolFaceTraits(
        face_shape=int(rand() * 4),
        skin_color=int(rand() * 6),
        eye_style=int(rand() * 8),
        eye_color=int(rand() * 5),
        eyebrows=int(rand() * 5),
        nose=int(rand() * 4),
        mouth=int(rand() * 6),
        hair_style=int(rand() * 8),
        hair_color=int(rand() * 8),
        accessory=int(rand() * 6),
        bg_color=int(rand() * 5),
    )


def trait_hash(wallet_address: str) -> str:
    """Return 8-char hex hash for cache keys."""
    return f"{_djb2(wallet_address):08x}"


# ─── Trait Labels ─────────────────────────────────────────────

FACE_LABELS = ["Round", "Square", "Oval", "Hexagon"]
EYE_LABELS = ["Round", "Dots", "Almond", "Wide", "Sleepy", "Winking", "Lashes", "Narrow"]
BROW_LABELS = ["None", "Thin", "Thick", "Arched", "Angled"]
NOSE_LABELS = ["None", "Dot", "Triangle", "Button"]
MOUTH_LABELS = ["Smile", "Neutral", "Grin", "Open", "Smirk", "Wide Smile"]
HAIR_LABELS = ["Bald", "Short", "Spiky", "Swept", "Mohawk", "Long", "Bob", "Buzz"]
ACC_LABELS = ["None", "None", "Round Glasses", "Square Glasses", "Earring", "Bandana"]
HAIR_COLOR_LABELS = ["Black", "Brown", "Blonde", "Ginger", "Neon Lime", "Neon Blue", "Solana Mint", "Neon Magenta"]
SKIN_LABELS = ["Light Peach", "Warm Tan", "Golden Brown", "Medium Brown", "Deep Brown", "Rich Dark Brown"]
EYE_COLOR_LABELS = ["Dark Brown", "Blue", "Green", "Amber", "Gray"]
BG_COLOR_LABELS = ["Lime", "Blue", "Mint", "Sand", "Red"]

def get_trait_labels(traits: SolFaceTraits) -> Dict[str, str]:
    """Human-readable labels for all traits."""
    return {
        "faceShape": FACE_LABELS[traits.face_shape],
        "skinColor": SKIN_LABELS[traits.skin_color] if traits.skin_color < len(SKIN_LABELS) else "Warm Tan",
        "eyeStyle": EYE_LABELS[traits.eye_style],
        "eyeColor": EYE_COLOR_LABELS[traits.eye_color] if traits.eye_color < len(EYE_COLOR_LABELS) else "Dark Brown",
        "eyebrows": BROW_LABELS[traits.eyebrows],
        "nose": NOSE_LABELS[traits.nose],
        "mouth": MOUTH_LABELS[traits.mouth],
        "hairStyle": HAIR_LABELS[traits.hair_style],
        "hairColor": HAIR_COLOR_LABELS[traits.hair_color],
        "accessory": ACC_LABELS[traits.accessory],
        "bgColor": BG_COLOR_LABELS[traits.bg_color] if traits.bg_color < len(BG_COLOR_LABELS) else "Lime",
    }


# ─── SVG Rendering ────────────────────────────────────────────

def _render_face(t: SolFaceTraits, skin: str) -> str:
    if t.face_shape == 0: return f'<circle cx="32" cy="34" r="20" fill="{skin}"/>'
    if t.face_shape == 1: return f'<rect x="12" y="14" width="40" height="40" rx="8" ry="8" fill="{skin}"/>'
    if t.face_shape == 2: return f'<ellipse cx="32" cy="34" rx="18" ry="22" fill="{skin}"/>'
    if t.face_shape == 3: return f'<path d="M32 12 L50 24 L50 44 L32 56 L14 44 L14 24 Z" fill="{skin}" stroke-linejoin="round"/>'
    return f'<circle cx="32" cy="34" r="20" fill="{skin}"/>'


def _render_eyes(t: SolFaceTraits, c: str) -> str:
    l, r, y = 24, 40, 30
    if t.eye_style == 0:
        return f'<circle cx="{l}" cy="{y}" r="3.5" fill="white"/><circle cx="{l+1}" cy="{y}" r="2" fill="{c}"/><circle cx="{r}" cy="{y}" r="3.5" fill="white"/><circle cx="{r+1}" cy="{y}" r="2" fill="{c}"/>'
    if t.eye_style == 1:
        return f'<circle cx="{l}" cy="{y}" r="2" fill="{c}"/><circle cx="{r}" cy="{y}" r="2" fill="{c}"/>'
    if t.eye_style == 2:
        return f'<ellipse cx="{l}" cy="{y}" rx="4" ry="2.5" fill="white"/><circle cx="{l+0.5}" cy="{y}" r="1.5" fill="{c}"/><ellipse cx="{r}" cy="{y}" rx="4" ry="2.5" fill="white"/><circle cx="{r+0.5}" cy="{y}" r="1.5" fill="{c}"/>'
    if t.eye_style == 3:
        return f'<circle cx="{l}" cy="{y}" r="4.5" fill="white"/><circle cx="{l}" cy="{y+0.5}" r="2.5" fill="{c}"/><circle cx="{r}" cy="{y}" r="4.5" fill="white"/><circle cx="{r}" cy="{y+0.5}" r="2.5" fill="{c}"/>'
    if t.eye_style == 4:
        return f'<ellipse cx="{l}" cy="{y+1}" rx="3.5" ry="2" fill="white"/><circle cx="{l}" cy="{y+1}" r="1.5" fill="{c}"/><line x1="{l-4}" y1="{y-0.5}" x2="{l+4}" y2="{y-0.5}" stroke="{c}" stroke-width="1" stroke-linecap="round"/><ellipse cx="{r}" cy="{y+1}" rx="3.5" ry="2" fill="white"/><circle cx="{r}" cy="{y+1}" r="1.5" fill="{c}"/><line x1="{r-4}" y1="{y-0.5}" x2="{r+4}" y2="{y-0.5}" stroke="{c}" stroke-width="1" stroke-linecap="round"/>'
    if t.eye_style == 5:
        return f'<path d="M{l-3} {y} Q{l} {y+3} {l+3} {y}" fill="none" stroke="{c}" stroke-width="1.5" stroke-linecap="round"/><circle cx="{r}" cy="{y}" r="3.5" fill="white"/><circle cx="{r+1}" cy="{y}" r="2" fill="{c}"/>'
    if t.eye_style == 6:
        return f'<circle cx="{l}" cy="{y}" r="3" fill="white"/><circle cx="{l+0.5}" cy="{y}" r="1.5" fill="{c}"/><line x1="{l+2}" y1="{y-3}" x2="{l+3.5}" y2="{y-4.5}" stroke="{c}" stroke-width="0.8" stroke-linecap="round"/><line x1="{l+3}" y1="{y-2}" x2="{l+4.5}" y2="{y-3}" stroke="{c}" stroke-width="0.8" stroke-linecap="round"/><circle cx="{r}" cy="{y}" r="3" fill="white"/><circle cx="{r+0.5}" cy="{y}" r="1.5" fill="{c}"/><line x1="{r+2}" y1="{y-3}" x2="{r+3.5}" y2="{y-4.5}" stroke="{c}" stroke-width="0.8" stroke-linecap="round"/><line x1="{r+3}" y1="{y-2}" x2="{r+4.5}" y2="{y-3}" stroke="{c}" stroke-width="0.8" stroke-linecap="round"/>'
    if t.eye_style == 7:
        return f'<ellipse cx="{l}" cy="{y}" rx="4" ry="1.2" fill="white"/><ellipse cx="{l+0.5}" cy="{y}" rx="2" ry="1" fill="{c}"/><ellipse cx="{r}" cy="{y}" rx="4" ry="1.2" fill="white"/><ellipse cx="{r+0.5}" cy="{y}" rx="2" ry="1" fill="{c}"/>'
    return f'<circle cx="{l}" cy="{y}" r="3" fill="white"/><circle cx="{l+1}" cy="{y}" r="2" fill="{c}"/><circle cx="{r}" cy="{y}" r="3" fill="white"/><circle cx="{r+1}" cy="{y}" r="2" fill="{c}"/>'


def _render_eyebrows(t: SolFaceTraits, col: str = "#2a2020") -> str:
    l, r, y = 24, 40, 25
    if t.eyebrows == 0: return ""
    if t.eyebrows == 1: return f'<line x1="{l-3}" y1="{y}" x2="{l+3}" y2="{y}" stroke="{col}" stroke-width="0.8" stroke-linecap="round"/><line x1="{r-3}" y1="{y}" x2="{r+3}" y2="{y}" stroke="{col}" stroke-width="0.8" stroke-linecap="round"/>'
    if t.eyebrows == 2: return f'<line x1="{l-3.5}" y1="{y}" x2="{l+3.5}" y2="{y}" stroke="{col}" stroke-width="2" stroke-linecap="round"/><line x1="{r-3.5}" y1="{y}" x2="{r+3.5}" y2="{y}" stroke="{col}" stroke-width="2" stroke-linecap="round"/>'
    if t.eyebrows == 3: return f'<path d="M{l-3.5} {y+1} Q{l} {y-2} {l+3.5} {y+1}" fill="none" stroke="{col}" stroke-width="1" stroke-linecap="round"/><path d="M{r-3.5} {y+1} Q{r} {y-2} {r+3.5} {y+1}" fill="none" stroke="{col}" stroke-width="1" stroke-linecap="round"/>'
    if t.eyebrows == 4: return f'<line x1="{l-3}" y1="{y-1}" x2="{l+3}" y2="{y+1}" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/><line x1="{r-3}" y1="{y+1}" x2="{r+3}" y2="{y-1}" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>'
    return ""


def _render_nose(t: SolFaceTraits, skin: str) -> str:
    cx, y = 32, 36
    sh = skin + "aa"
    if t.nose == 0: return ""
    if t.nose == 1: return f'<circle cx="{cx}" cy="{y}" r="1.5" fill="{sh}"/>'
    if t.nose == 2: return f'<path d="M{cx} {y-1.5} L{cx+2.5} {y+2} L{cx-2.5} {y+2} Z" fill="{sh}"/>'
    if t.nose == 3: return f'<circle cx="{cx-1.5}" cy="{y}" r="1" fill="{sh}"/><circle cx="{cx+1.5}" cy="{y}" r="1" fill="{sh}"/>'
    return ""


def _render_mouth(t: SolFaceTraits, col: str = "#c05050") -> str:
    cx, y = 32, 42
    if t.mouth == 0: return f'<path d="M{cx-4} {y} Q{cx} {y+4} {cx+4} {y}" fill="none" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>'
    if t.mouth == 1: return f'<line x1="{cx-3}" y1="{y+1}" x2="{cx+3}" y2="{y+1}" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>'
    if t.mouth == 2: return f'<path d="M{cx-6} {y} Q{cx} {y+5} {cx+6} {y}" fill="none" stroke="{col}" stroke-width="1.5" stroke-linecap="round"/>'
    if t.mouth == 3: return f'<ellipse cx="{cx}" cy="{y+1}" rx="3" ry="2.5" fill="{col}" opacity="0.8"/>'
    if t.mouth == 4: return f'<path d="M{cx-4} {y+1} Q{cx-1} {y+1} {cx+4} {y-1}" fill="none" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>'
    if t.mouth == 5: return f'<path d="M{cx-6} {y} Q{cx} {y+6} {cx+6} {y}" fill="white" stroke="{col}" stroke-width="1"/>'
    return f'<path d="M{cx-4} {y} Q{cx} {y+4} {cx+4} {y}" fill="none" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>'


def _render_hair(t: SolFaceTraits, col: str) -> str:
    if t.hair_style == 0: return ""
    if t.hair_style == 1: return f'<rect x="14" y="12" width="36" height="12" rx="6" ry="6" fill="{col}"/>'
    if t.hair_style == 2: return f'<g fill="{col}"><rect x="14" y="16" width="36" height="8" rx="2"/><polygon points="18,16 22,6 26,16"/><polygon points="26,16 30,4 34,16"/><polygon points="34,16 38,6 42,16"/><polygon points="42,16 46,10 48,16"/></g>'
    if t.hair_style == 3: return f'<g fill="{col}"><rect x="14" y="14" width="36" height="10" rx="4"/><path d="M14 18 Q8 14 10 8 Q14 10 20 14 Z"/></g>'
    if t.hair_style == 4: return f'<rect x="26" y="4" width="12" height="20" rx="4" ry="2" fill="{col}"/>'
    if t.hair_style == 5: return f'<g fill="{col}"><rect x="14" y="12" width="36" height="10" rx="4"/><rect x="10" y="18" width="8" height="24" rx="3"/><rect x="46" y="18" width="8" height="24" rx="3"/></g>'
    if t.hair_style == 6: return f'<path d="M12 22 Q12 10 32 10 Q52 10 52 22 L52 38 Q52 42 48 42 L48 26 Q48 16 32 16 Q16 16 16 26 L16 42 Q12 42 12 38 Z" fill="{col}"/>'
    if t.hair_style == 7: return f'<rect x="15" y="13" width="34" height="9" rx="8" ry="4" fill="{col}" opacity="0.7"/>'
    return ""


def _render_accessory(t: SolFaceTraits, col: str = "#444") -> str:
    if t.accessory <= 1: return ""
    if t.accessory == 2: return f'<g fill="none" stroke="{col}" stroke-width="1"><circle cx="24" cy="30" r="5"/><circle cx="40" cy="30" r="5"/><line x1="29" y1="30" x2="35" y2="30"/><line x1="19" y1="30" x2="14" y2="28"/><line x1="45" y1="30" x2="50" y2="28"/></g>'
    if t.accessory == 3: return f'<g fill="none" stroke="{col}" stroke-width="1"><rect x="19" y="26" width="10" height="8" rx="1"/><rect x="35" y="26" width="10" height="8" rx="1"/><line x1="29" y1="30" x2="35" y2="30"/><line x1="19" y1="30" x2="14" y2="28"/><line x1="45" y1="30" x2="50" y2="28"/></g>'
    if t.accessory == 4: return '<circle cx="11" cy="36" r="2" fill="#f0c060" stroke="#d4a030" stroke-width="0.5"/>'
    if t.accessory == 5: return '<g><rect x="12" y="20" width="40" height="4" rx="1" fill="#f85149"/><path d="M12 22 L8 26 L12 24 Z" fill="#f85149"/></g>'
    return ""


def render_svg(
    wallet_address: str,
    size: int = 64,
    bg_opacity: float = 0.15,
    bg_radius: int = 4,
) -> str:
    """
    Render a SolFace as an SVG string.
    Produces identical output to the JavaScript version.
    """
    t = generate_traits(wallet_address)
    skin = SKIN_COLORS[t.skin_color % len(SKIN_COLORS)]
    eye_col = EYE_COLORS[t.eye_color % len(EYE_COLORS)]
    hair_col = HAIR_COLORS[t.hair_color % len(HAIR_COLORS)]
    bg_col = BG_COLORS[t.bg_color % len(BG_COLORS)]

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}">',
        f'<rect x="0" y="0" width="64" height="64" fill="{bg_col}" opacity="{bg_opacity}" rx="{bg_radius}"/>',
        _render_hair(t, hair_col),
        _render_face(t, skin),
        _render_eyes(t, eye_col),
        _render_eyebrows(t),
        _render_nose(t, skin),
        _render_mouth(t),
        _render_accessory(t),
        "</svg>",
    ]
    return "".join(p for p in parts if p)


def render_data_uri(wallet_address: str, **kwargs) -> str:
    """Render as a data URI for use in <img> tags or HTML emails."""
    from urllib.parse import quote
    svg = render_svg(wallet_address, **kwargs)
    return f"data:image/svg+xml;charset=utf-8,{quote(svg)}"


# ─── Description ──────────────────────────────────────────────

_FACE_DESC = {0: "round", 1: "square with softly rounded corners", 2: "oval", 3: "angular, hexagonal"}
_SKIN_DESC = {0: "light peach", 1: "warm tan", 2: "golden brown", 3: "medium brown", 4: "deep brown", 5: "rich dark brown"}
_EYE_STYLE_DESC = {0: "round, wide-open", 1: "small and dot-like", 2: "almond-shaped", 3: "wide and expressive", 4: "sleepy, half-lidded", 5: "playfully winking", 6: "adorned with lashes", 7: "narrow and observant"}
_EYE_COLOR_DESC = {0: "dark brown", 1: "blue", 2: "green", 3: "amber", 4: "gray"}
_BROW_DESC = {0: "", 1: "thin", 2: "thick, prominent", 3: "elegantly arched", 4: "sharply angled"}
_NOSE_DESC = {0: "", 1: "a small dot nose", 2: "a triangular nose", 3: "a button nose with visible nostrils"}
_HAIR_STYLE_DESC = {0: "bald, with no hair", 1: "short, neatly cropped hair", 2: "tall, spiky hair", 3: "side-swept hair", 4: "a bold mohawk", 5: "long hair that falls past the shoulders", 6: "a clean bob cut", 7: "a close buzz cut"}
_HAIR_COLOR_DESC = {0: "jet black", 1: "brown", 2: "blonde", 3: "ginger red", 4: "neon lime green", 5: "neon blue", 6: "Solana mint green", 7: "neon magenta"}
_MOUTH_DESC = {0: "a gentle smile", 1: "a neutral, straight expression", 2: "a wide grin", 3: "a small, open mouth", 4: "a confident smirk", 5: "a broad, toothy smile"}
_ACC_DESC = {0: "", 1: "", 2: "round glasses", 3: "square-framed glasses", 4: "a gold earring", 5: "a red bandana"}
_BG_DESC = {0: "lime green", 1: "blue", 2: "Solana mint green", 3: "warm sand", 4: "red"}


def describe_appearance(
    wallet_address: str,
    perspective: str = "third",
    name: Optional[str] = None,
    include_background: bool = True,
) -> str:
    """
    Generate natural language description of a SolFace.

    Args:
        wallet_address: Solana wallet address
        perspective: "first" for agent self-description, "third" for external
        name: Optional name (e.g., agent name)
        include_background: Include background color in description

    Returns:
        Human-readable appearance description
    """
    t = generate_traits(wallet_address)

    # Subject intro
    if perspective == "first":
        subj = f"I'm {name}. I have" if name else "I have"
        im = "I'm"
    else:
        subj = f"{name} has" if name else "This SolFace has"
        im = "They're"

    # Build parts list
    parts = []

    # Face + skin
    face = _FACE_DESC.get(t.face_shape, "round")
    skin = _SKIN_DESC.get(t.skin_color, "warm")
    parts.append(f"{subj} a {face} face with {skin} skin")

    # Eyes
    eye_s = _EYE_STYLE_DESC.get(t.eye_style, "round")
    eye_c = _EYE_COLOR_DESC.get(t.eye_color, "dark")
    parts.append(f"{eye_s} {eye_c} eyes")

    # Eyebrows
    brows = _BROW_DESC.get(t.eyebrows, "")
    if brows:
        parts.append(f"{brows} eyebrows")

    # Hair
    if t.hair_style == 0:
        parts.append("and is bald")
    else:
        hc = _HAIR_COLOR_DESC.get(t.hair_color, "")
        hs = _HAIR_STYLE_DESC.get(t.hair_style, "")
        parts.append(f"and {hc} {hs}")

    # Assemble main sentence
    desc = parts[0]
    if len(parts) > 2:
        desc += ", " + ", ".join(parts[1:-1]) + ", " + parts[-1]
    elif len(parts) == 2:
        desc += " and " + parts[1]
    desc += "."

    # Nose
    nose = _NOSE_DESC.get(t.nose, "")
    if nose:
        if perspective == "first":
            nose_subj = "I have"
        else:
            nose_subj = f"{name} has" if name else "They have"
        desc += f" {nose_subj} {nose}."

    # Accessory
    acc = _ACC_DESC.get(t.accessory, "")
    if acc:
        desc += f" {im} wearing {acc}."

    # Mouth
    mouth = _MOUTH_DESC.get(t.mouth, "a smile")
    if perspective == "first":
        mouth_subj = "I have"
    else:
        mouth_subj = f"{name} has" if name else "They have"
    desc += f" {mouth_subj} {mouth}."

    # Background
    if include_background:
        bg = _BG_DESC.get(t.bg_color, "colorful")
        desc += f" The background is {bg}."

    return desc


def agent_appearance_prompt(wallet_address: str, agent_name: Optional[str] = None) -> str:
    """
    Generate a system prompt snippet describing an AI agent's SolFace.

    Usage:
        prompt = agent_appearance_prompt("7xKXq...", "Atlas")
        system_prompt = f"You are Atlas, an AI agent. {prompt}"
    """
    desc = describe_appearance(wallet_address, perspective="first", name=agent_name, include_background=False)
    h = trait_hash(wallet_address)
    return f"My visual identity is a SolFace avatar (ID: {h}) derived from my wallet address. {desc} This appearance is deterministic — anyone who looks up my wallet will see the same face."


# ─── CLI ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python solfaces.py <wallet_address> [--svg] [--json] [--describe] [--size N]")
        sys.exit(1)

    wallet = sys.argv[1]
    args = set(sys.argv[2:])

    size = 64
    if "--size" in args:
        idx = sys.argv.index("--size")
        size = int(sys.argv[idx + 1])

    if "--svg" in args:
        print(render_svg(wallet, size=size))
    elif "--json" in args:
        import json
        t = generate_traits(wallet)
        print(json.dumps({
            "wallet": wallet,
            "hash": trait_hash(wallet),
            "traits": t.to_dict(),
            "labels": get_trait_labels(t),
            "description": describe_appearance(wallet),
        }, indent=2))
    elif "--describe" in args:
        print(describe_appearance(wallet))
    else:
        t = generate_traits(wallet)
        labels = get_trait_labels(t)
        print(f"SolFace for {wallet[:8]}...{wallet[-4:]}")
        print(f"Hash: {trait_hash(wallet)}")
        print(f"---")
        for k, v in labels.items():
            print(f"  {k}: {v}")
        print(f"---")
        print(describe_appearance(wallet))
