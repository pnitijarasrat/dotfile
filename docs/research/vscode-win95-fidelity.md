# How faithfully can VS Code draw Win95 chrome in a mod?

Research for [#85](https://github.com/pnitijarasrat/dotfile/issues/85), part of map [#83](https://github.com/pnitijarasrat/dotfile/issues/83) (Win95 activity mod for Claude Code). Vocabulary follows `CONTEXT.md`; palettes, fonts and **Purist fidelity** are from `docs/theme-spec.md` and ADRs 0001–0003.

## Sources

- **`claude-code.d.ts`**: the mod API's declaration file, Claude Code 2.1.296, bundled with the `plugin-authoring` skill at `/private/tmp/claude-501/bundled-skills/2.1.296/3f3f2ab6284fd040f2ee240c50353c99/plugin-authoring/types/claude-code.d.ts`. `reference.md` beside it calls this file "the authority" and says the API "moves between releases". Cited below as `d.ts:LINE`.
- **`reference.md`**: the skill's long-form notes, same folder. Cited as `ref:LINE`.
- `examples/` (`pane.tsx`, `band.tsx`): use only `Box`/`Text`/`Button` with `dimColor`, no colors, borders or `Svg`. Nothing in them is VS Code-specific.
- Claims marked **(unverified)** are about how Chromium/VS Code webviews behave, and nothing in the declarations settles them. The prototype has to check them.

## Short answer

The `vscode` surface can draw the **Frame** palette exactly, because every color prop takes raw hex. Its `Box`/`Text` elements can't draw a Win95 bevel or set a font. They have one border color for all four sides, every size is in character cells, and `Text` has no font props. **`Svg` is the only way to get exact pixels, per-side bevel colors, chosen fonts and tab shapes.** But an `Svg` can't be clicked, so interactive parts (list rows, tabs, buttons) have to be `Button`s, which VS Code draws as its own native buttons. The realistic design is a hybrid: Svg for the static chrome and the **Display**, and Box/Text/Button for the interactive and text-heavy rows. Those rows will look less like Win95.

## What the `vscode` surface offers

### Elements

`vscode` has `Box`, `Text`, `Button`, `Input`, `Select`, `Svg`, `Link`, `Code`, `Markdown`. It has no `Client`, `Raster` or `Image` (`d.ts:3800-3876`, vscode table `d.ts:3865-3875`; `ref:122-123`). It's described as "the desktop's table without `Client`" (`d.ts:3858-3864`), so it presumably renders like the desktop: `Box` as "a flex div", `Text` as "a styled span" (`d.ts:12214-12217`).

There's a contradiction in the declarations: the `Mounted` test type (`d.ts:15578-15580`) says vscode's table lacks `Input`, but `Elements.vscode` has it. Tests of an `Input` on `vscode` may not type-check.

### Style props

- **`Box`** (`d.ts:907-996`): flex layout, `width`/`height`/`min*` (`number | string`, `d.ts:972-975`), margin and padding, `position: 'absolute'` with `top/left/right/bottom` **in character cells** (`d.ts:930-962`), `borderStyle?: string`, **one** `borderColor`, `borderDimColor`, `backgroundColor`, `overflow`, `display` (`d.ts:990-995`), plus `hover` (`d.ts:868-901`). It has **no per-side border colors** (Ink's `borderTopColor` and the like aren't in the allowlist: "Others are refused", `d.ts:2222-2225`), no border width, no radius, no font props.
- **`borderStyle`** must be one of the terminal's names: `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, `arrow`, `dashed`, `quote`. Any other value draws no border (`ref:130`). How a webview turns these into CSS (width in px, square corners) isn't documented **(unverified)**.
- **`Text`** (`d.ts:12571-12589`): `color`, `backgroundColor`, `dimColor`, `bold`, `italic`, `underline`, `strikethrough`, `inverse`, `wrap`. It has **no `fontFamily`, `fontSize` or `fontWeight`**. A grep of the whole file for font props finds none for elements.
- **`Color`** (`d.ts:1682-1689`): a `ThemeKey` (which follows the person's Claude theme, `d.ts:12592-12598`) **or any raw string, such as hex**. So `#C0C0C0`, `#000080` and the rest can be used exactly. Theme keys should be avoided, so the theme can't recolor the window.
- **`Button`** (`d.ts:1059-1160`): `label`/children (strings and `Text` only; "any other element is refused", `d.ts:1076-1084`), `plain`, `dimColor`, `variant`, `role: 'dismiss'`, `hotkey`, `hover`. "A desktop draws its native button either way", even when `plain` (`d.ts:1059-1064`, `d.ts:1104-1111`). It has no background, border or size props.
- **`Svg`** (`d.ts:12272-12307`): `source` (a full `<svg>` document, at most 131072 characters), `alt` (required), `width`/`height` **in CSS pixels**, and `isInteractive`. The editor draws it "as an image, or in a sandboxed frame when `isInteractive`". Scripts are never allowed, and "presses that other plugins should observe go on an enclosing element". But no element that takes presses can enclose an Svg: `Button` refuses non-Text children (`d.ts:1079`), and `Box` has no `onPress`.
- **`Code` / `Markdown`**: no color or font props. They draw "as an assistant reply is" (`ref:125`).

### Pane sizing and placement

- `$.ui.open({ id, title, focus, closeOnEscape, holdToasts, rows, columns })` (`d.ts:7389-7468`). `rows` is the inline height and `columns` the docked width, both in cells, and both are "a request, not a grant": a size the person dragged wins (`d.ts:7448-7467`).
- An open from a slash command counts as "asked", so it's placed at any width. It docks "beside a fullscreen transcript" from 110 columns, and otherwise goes inline above the prompt (`d.ts:14123-14160`, `d.ts:7391-7396`). The `Pane` render props report `placement: 'dock' | 'inline'`, `bodyColumns`, `isFocused` and `scroll` (`d.ts:10311-10365`).
- On a remote surface the viewport is "the pane's width and height over the advance and line height of its code font", so it's measured **in cells, not pixels** (`d.ts:10390-10422`). `isFullscreen` is absent until the client reports it (`d.ts:10404-10422`). **The mod is never told how many CSS pixels a cell is**, so it can't size an Svg exactly to the slot.
- The engine draws the pane's frame, close mark and (with more than one pane) a tab row (`d.ts:10311-10320`, `d.ts:10335-10336`, `d.ts:10350-10353`, `d.ts:7407-7409`). The Win95 window is drawn *inside* VS Code's own panel chrome, and that outer chrome can't be themed from the mod.
- Several panes are tabs of one pane area: one shown, the rest behind (`d.ts:10311-10313`). A second pane opened as a dialog (`focus` + `closeOnEscape` + `holdToasts`, `ref:133`) *replaces* the view and doesn't float over it.

## Per element, against the Vintage theme

| Element | Box/Text/Button | Svg | Verdict |
|---|---|---|---|
| **Bevel** (2px raised/sunken: `frame_highlight`/`frame_light` top-left, `frame_shadow`/`frame_dark_shadow` bottom-right) | Can't: one `borderColor` for all four sides (`d.ts:991`), and borders are a named line style, not a px width. Nested Boxes give two rings, but each ring is still one color. | Exact: four `<rect>`/`<path>` lines per side with `shape-rendering="crispEdges"`. | **Svg only.** |
| **Title bar** (flat `frame_title` `#000080`, `frame_title_text` white, Tahoma Bold, `_ □ ×` buttons) | Navy bar and white bold text: yes (`backgroundColor`, `color`, `bold`). Tahoma Bold: no (no font prop). Caption buttons: native VS Code `Button`s, not Win95 boxes. | Bar, text in Tahoma Bold and beveled caption buttons all exact, but not clickable. | Svg for the look, no working caption buttons. The engine's close mark (`d.ts:10335-10336`) already closes the pane. |
| **Tabs** (raised notched tabs on `frame_face`) | A row of `Button`s or Texts. Notches, the raised selected tab and per-side edges can't be drawn. | Exact shape, but not clickable. | Hybrid: draw the strip in Svg and switch with `Button`s beside or under it, or use flat text tabs. The look gap stays. |
| **List-view** (`frame_window` white, column headers as raised buttons, `frame_selection` navy row) | Fixed-width Box columns (cells), header Texts on `#C0C0C0`, the selected row with `Text backgroundColor="#000080" color="#FFFFFF"`. To be clickable, each row has to be a `Button` (`d.ts:1076-1084`), which VS Code draws as a native button **(unverified how heavy that chrome is)**. Header bevels aren't possible. | Headers and the sunken list border exact. Rows not clickable. | Hybrid: Svg for headers and border, Button rows for content. Row fidelity depends on how VS Code styles a `plain` Button. |
| **Properties dialog** (raised window, tabs, labeled fields, OK/Cancel) | A `position: "absolute"` Box (`d.ts:917-937`) shown from `$.state` can float over the list within the pane. Fields are Text, buttons native. Or open a second pane as a dialog (`ref:133`), but that replaces the view rather than floating. | Frame, bevel and group-box lines exact. | Feasible as an absolutely placed Box with an Svg frame behind or above it. Whether an Svg inside an absolute Box lines up with the cell grid is **(unverified)**. |
| **Display** (`display_bg` black, `display_fg` cyan lit text over `display_ghost` `88:88`, Work surface font, sunken bevel) | Colors exact. Ghost under lit text works with two Texts, the ghost Box `position: "absolute"` at the same cell. But the font is whatever VS Code uses for a styled span, not JetBrains Mono NL (or Fixedsys until #80), and there's no bevel. | Everything exact: `<text font-family="JetBrains Mono NL">` ghost in `#008080`, lit text in `#00FFFF` over it, beveled black rect. Re-rendered on each state change (≤131072 characters, `d.ts:12284`). | **Svg.** This is the element that most needs it, and it's non-interactive. |
| **Fonts** (Frame: Microsoft Sans Serif 14, Tahoma Bold; Work surface: JetBrains Mono NL) | None can be set: `Text` and `Button` have no font props. Text falls back to the webview's own UI font, and `Code` presumably to the editor font **(unverified)**. | `font-family` in the SVG. Both Frame fonts ship with macOS, and JetBrains Mono NL is in `~/Library/Fonts`. Whether a sandboxed SVG drawn as an image may use locally installed fonts is **(unverified)**. Chromium generally allows local fonts in SVG images and blocks only external fetches. The fallback is a subset font as a `data:` URI `@font-face`, within the 131072-character budget, if the scrub keeps `<style>` **(unverified)**. | Fonts need Svg. |
| **Pane sizing and placement** | Cells only. `rows`/`columns` are requests (`d.ts:7448-7467`). Placed `dock` or `inline` by the surface (`d.ts:10346`). | `width`/`height` in CSS px (`d.ts:12291-12297`). The mod never learns the px-per-cell, so a fixed-width Svg can over- or under-fill the slot. With no width, it scales to the slot (`d.ts:12291`) and loses 1:1 pixels. | Fix the Svg's px width for crisp lines and accept a margin, or scale to the slot and accept soft edges. |

## Is `Svg` the route to exact pixels?

Yes. It's the only element whose geometry is in pixels and whose markup can set per-side colors and fonts (`d.ts:12272-12307`). Every Box/Text measure is in cells (`d.ts:930-962`, `d.ts:10390-10398`). Three limits:

1. **It can't be clicked.** An Svg is an image (or a script-less frame with `isInteractive`, which only gives CSS `:hover`, SMIL and `<title>` tooltips, `d.ts:12298-12306`). Presses need a `Button`, and a `Button` can't wrap an Svg (`d.ts:1079`).
2. **Pixels aren't device pixels.** This repo runs VS Code at `window.zoomLevel: 1` (×1.2) on a 2× Retina display (`docs/theme-spec.md`, VSCode editor row), so 1 CSS px is 2.4 device px. With `crispEdges` a 1px line snaps to 2 or 3 device px, so bevel lines can look uneven. The fix is to author the SVG at a scale where lines land on whole device pixels (for example a 5-CSS-px grid unit = 12 device px), or to accept it **(unverified; check in the prototype)**.
3. **Size isn't known.** The mod has cells, not px (`d.ts:10390-10398`), so it can't match the Svg to the pane exactly.

Purist fidelity is otherwise easy to meet in Svg: square corners, opaque fills, plain glyphs. Box `borderStyle` should be `single` and never `round` (`ref:130`). Whether the VS Code webview rounds Box corners or native Buttons is **(unverified)**. The spec already lists VS Code's own widgets as keeping rounded corners (`docs/theme-spec.md` Known exceptions).

## Known gaps

- No per-side border colors or px border widths on `Box` (`d.ts:990-993`). There's no bevel without Svg.
- No font props on any element (`d.ts:12571-12589`, `d.ts:1059-1160`). Text, list rows and dialog fields will use VS Code's UI font, not Microsoft Sans Serif or JetBrains Mono NL.
- Clickable things are VS Code native `Button`s (`d.ts:1059-1064`, `d.ts:1110`). There are no Win95 push buttons, pressed states or tab shapes.
- No px-per-cell on remote surfaces (`d.ts:10390-10398`).
- The pane's outer frame, close mark and tab row are the engine's or VS Code's (`d.ts:10311-10336`).
- A second pane can't float: panes are tabs (`d.ts:10311-10313`). Use an absolutely placed Box for the Properties dialog.
- Type inconsistency: `Mounted` says vscode lacks `Input` (`d.ts:15578-15580`), but `Elements.vscode` has it (`d.ts:3869`).
- The API is early access and "moves between releases" (`reference.md`, opening section). These findings are for 2.1.296.

## To check in the prototype

1. How a `plain` `Button` with colored `Text` children looks in the VS Code webview (the list-row fidelity depends on it).
2. Whether an Svg drawn as an image can use the locally installed Microsoft Sans Serif, Tahoma and JetBrains Mono NL, and whether a `<style>` with a `data:` `@font-face` survives the scrub.
3. What `borderStyle="single"` becomes in CSS (width, corners).
4. How crisp 1px bevel lines are at zoom 1.2 on Retina, and which CSS-px grid unit lands lines on whole device pixels.
5. How many CSS px one cell (`bodyColumns` unit) is in this VS Code setup, so a fixed-width Svg can be sized to the docked pane.
