# JetBrains Mono NL for the Work surface, replacing Fixedsys Excelsior

The **Work surface** font was Fixedsys Excelsior (#6, #12). We picked a bitmap font because it's crisp on Retina at whole-pixel sizes, and it looked like Windows. But it's crisp only at those sizes (Ghostty at 32, VSCode at 16 after zoom), so each tool's size was set by pixel arithmetic and not by what reads well. Now the Work surface uses a vector monospace instead, **JetBrains Mono NL** (the build with no ligatures), at a plain readable size: 14 in Ghostty (#78). This replaces the Fixedsys decision. The fallback chain stays the same shape: JetBrains Mono NL → Menlo → Thonburi (for Thai).

The purist rules stay: no ligatures, synthetic styles off, and bold looks the same as normal text. Fixedsys only had a Regular face, so bold and italic fell back to Regular. JetBrains Mono NL has real bold and italic faces, so each tool now turns them off on purpose (in Ghostty, `font-style-bold`, `font-style-italic` and `font-style-bold-italic` are `false`). The **Frame** fonts (Microsoft Sans Serif, Tahoma Bold) don't change.

## Considered options

- **Keep Fixedsys Excelsior**: rejected; the whole-pixel size rule forces sizes that are too big or too small, and it's crisp only at those sizes.
- **The standard JetBrains Mono build, with ligatures turned off by font features**: rejected; the NL build has no ligatures at all, so they can't show up where a tool ignores the font features. Ghostty still sets `-calt, -liga`.
- **JetBrains Mono Nerd Font**: rejected; **Purist fidelity** allows no Nerd Font icons.

## Consequences

- Ghostty switches first, and so Neovim and the Starship prompt (#78). VSCode (#79) and Spotify's lyrics and **Display** (#80) keep Fixedsys Excelsior until their own tickets move them.
- The **Theme spec**'s size rule moves from "whole Fixedsys pixels" to plain readable sizes.
- `fonts/FSEX302.ttf` stays committed but is unused once VSCode and Spotify move. JetBrains Mono NL isn't committed; it's installed into `~/Library/Fonts`. The JetBrains Mono Nerd Font build is still unused.
- ADR 0002 says the Display uses Fixedsys Excelsior at 16px. It follows the Work surface font, so it moves to JetBrains Mono NL in #80.
