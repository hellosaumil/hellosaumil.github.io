# Design System — hellosaumil.github.io

## Goal
Enforce a strict, simplified design hierarchy across the landing page to ensure consistency and clean aesthetics. Dark-first, code-culture, Swiss minimalism.

---

## Typography Rules

| Level | Font | Size | Weight | Style | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Name** | Forum | `clamp(3rem, 10vw, 12rem)` | `700` | Normal | Full name on hero section |
| **Hero Tagline** | JetBrains Mono | `clamp(0.8rem, 2vw, 1rem)` | `400` | Normal | Typing animation, accent color |
| **Section Label** | JetBrains Mono | `1.17rem` | `500` | Uppercase | "PROJECTS", `letter-spacing: 3px`, muted |
| **Bio Body** | Inter | `1.125rem` | `400` | Normal | About section prose, `line-height: 1.7` |
| **Card Title** | Inter | `1rem` | `600` | Normal | Project card name |
| **Card Desc** | Inter | `1rem` | `400` | Normal | Project description, muted, `line-height: 1.5` |
| **Card Highlight** | JetBrains Mono | `0.92rem` | `400` | Normal | Backtick spans in desc — no bg, mono font, primary color |
| **Nav Brand** | JetBrains Mono | `0.875rem` | `500` | Normal | "Saumil Shah" in nav |
| **Nav Links** | JetBrains Mono | `0.83rem` | `400` | Normal | About, Projects, WebResume — muted |
| **Tag / Pill** | JetBrains Mono | `0.75rem` | `400` | Normal | Tech tags on cards, accent color, bordered |
| **Year Badge** | JetBrains Mono | `0.75rem` | `400` | Normal | Bottom-right on cards, muted, border bg |
| **Social Links** | JetBrains Mono | `0.875rem` | `400` | Normal | GitHub, LinkedIn, Email, WebResume |
| **Footer** | JetBrains Mono | `0.83rem` | `400` | Normal | `© 2026 Saumil Shah`, muted |

**Rule:** Inter for prose and headings. JetBrains Mono for anything "meta" — nav, tagline, tags, dates, labels, footer.

---

## Color Tokens

### Dark Mode (default)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#0A0A0A` | Page background |
| `--bg-card` | `#111111` | Card surfaces |
| `--text` | `#EDEDED` | Primary text |
| `--text-muted` | `#888888` | Labels, nav links, secondary text |
| `--accent` | `#C8FF00` | Links, cursor, highlights, tags |
| `--accent-hover` | `#D4FF4D` | Hover on accent elements |
| `--border` | `#1E1E1E` | Card borders, year badge background |
| `--dot` | `#1E1E1E` | Hero dot-grid pattern |
| `--nav-bg` | `rgba(10,10,10,0.85)` | Nav blur after scrolling past hero |
| `--card-bg-hover` | `#000000` | Project card background on hover |
| `--email-hover` | `#00FFAF` | Email link color on hover (Dark Mode) |

### Light Mode

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#FFFAF0` | Page background (floralwhite) |
| `--bg-card` | `#FFFEFA` | Card surfaces |
| `--text` | `#2D2D2D` | Primary text |
| `--text-muted` | `#757575` | Secondary text |
| `--accent` | `#558B2F` | Links, highlights, tags (Olive Green) |
| `--accent-hover` | `#689F38` | Hover on accent elements |
| `--border` | `#EDE4D3` | Card borders |
| `--dot` | `#E1D8C1` | Hero dot-grid pattern |
| `--nav-bg` | `rgba(255,250,240,0.9)` | Nav blur |
| `--card-bg-hover` | `#FFFFFF` | Project card background on hover |
| `--email-hover` | `#009164` | Email link color on hover (Light Mode) |

---

## Brand Colors

Fixed per brand — not affected by light/dark mode. Applied via `.link-*` classes, detected by `brandClass(url, label)` in JS.

| Brand | Class | Color |
| :--- | :--- | :--- |
| Qualcomm | `.link-qualcomm` | `#3953DC` |
| Snapdragon / Adreno | `.link-snapdragon` | `#E81B23` |
| KORE Wireless / SecurityPro | `.link-kore` | `#FF6B35` |
| GitHub | `.link-github` | `#8957e5` |
| LinkedIn | `.link-linkedin` | `#0A66C2` |
| Email | `.link-email` | `var(--accent)` |
| WebResume | `.link-webresume` | `#FF6000` |

---

## Layout Rules

- **Max content width:** `1000px` (global `.container`). About section overrides to `1200px`.
- **Bio text max-width:** `1100px`, centered.
- **Section padding:** `80px 0` desktop, `60px 0` mobile.
- **Project grid:** 2-column CSS grid, `gap: 24px`. Collapses to 1-column at `≤ 640px`.
- **Card padding:** `24px`. Border-radius: `12px`.
- **Nav height:** `64px`, fixed, `z-index: 100`. Gains blur backdrop after scrolling past hero.
- **Hero:** Full `100vh`, dot-grid background (`radial-gradient`, 24×24px spacing), scroll-snap.

## Card Footer Structure

Cards use `display: flex; flex-direction: column`. The footer row pins to bottom via `margin-top: auto`:

```
[ Tag1 ][ Tag2 ][ Tag3 ]          2025
↑ .project-card__tags (flex: 1)   ↑ .project-card__year
```

---

## Content Sources

| Content | File | Format |
| :--- | :--- | :--- |
| Bio / summary | `data/summary.md` | Markdown with backtick highlights |
| Projects | `data/projects.md` | Custom markdown (see below) |
| Profile photo | `assets/images/profile.jpg` | — |
| Favicon | `favicon.svg` | Inline SVG dolphin |

**`projects.md` entry format:**
```
### [Project Name](url)
##### Tag1, Tag2, Tag3 | YYYY
- Description with `backtick highlights` for key terms.
  Optional second line continuation.
```

---

## Implementation Notes

- **Theme toggle:** Stored in `localStorage` key `theme`. Transitions: `background-color 0.3s, color 0.3s`.
- **Typing animation:** Hero tagline cycles phrases at 80ms/char type, 40ms/char delete.
- **Nav activation:** `IntersectionObserver` on hero — adds blur backdrop when hero leaves viewport.
- **Section fade-in:** `IntersectionObserver` (threshold 0.1), 0.6s ease.
- **Backtick highlights (code blocks):** Rendered as `<mark>` via `renderMd()` — no background, mono font, primary text color, **0.92rem**.
- **URLs (links):** In project descriptions, **0.92rem**.
- **Project description text:** Regular text **1rem**, code blocks and URLs **0.92rem**.
- **Card Interaction:** On hover, project cards lift slightly, gain a background color (`--card-bg-hover`), and the project title automatically underlines.
- **Social Links:** Links in the about section use `var(--accent)` by default and transition to their specific brand colors (GitHub purple, LinkedIn blue, Email cyan/green, etc.) with a `font-weight: 600` on hover.
- **Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: reduce)`.

---

## Verification

- Use Element Inspector to confirm font family switches between Inter (prose) and JetBrains Mono (meta).
- Toggle light/dark mode — accent and card surface tokens must update, brand colors must not change.
- Check card footer alignment: tags left, year right, both at the same baseline.
- Confirm `brandClass()` detection fires for Qualcomm, Snapdragon/Adreno, KORE, SecurityPro URLs and labels.
