# Research: authentic Classic/XP/TC2000 colors and retro fonts

Answers issue #3 (part of map #2). This is the source material the **Vintage theme**'s **Frame** and **Work surface** palettes and fonts will be built from. It records facts and evidence only. Palette decisions belong in the **Theme spec**.

Researched 2026-10-04. Hex values are `#RRGGBB`. Windows registry and source values are given as decimal `R G B` and converted. ReactOS stores colors as `COLORREF` (`0x00BBGGRR`), so the byte order is reversed during conversion.

## TL;DR

- **Windows 98 "Windows Standard"**: face `#C0C0C0`, navy title `#000080` fading to `#1084D0`, desktop teal `#008080`, 3D edges `#FFFFFF` / `#808080` / `#000000`.
- **Windows 2000 "Windows Standard"**: face `#D4D0C8`, title `#0A246A` fading to `#A6CAF0`, dark shadow `#404040`, desktop `#3A6EA5`. Microsoft's own docs publish this table.
- **XP Luna Blue**: body `#ECE9D8`, selection `#316AC5`, title `#0054E3` fading to `#3D95FF`, taskbar about `#245EDC`, Start button about `#4A9949`, edges `#ACA899` / `#716F64` / `#F1EFE2`. These come from the INI resources inside `luna.msstyles`. The real title bar, taskbar and Start button are bitmaps, so some of these are Microsoft's "average color" hints.
- **TC2000/TeleChart**: Worden publishes **no** default hex values. The first-party TeleChart user guide does document the color meanings: green = buying, red = selling, yellow = neutral BOP, and price bars take BOP colors. Its lossless screenshots show pure VGA colors on black: `#000000`, `#00FF00`, `#FF0000`, `#FFFF00`, `#FF00FF`, `#00FFFF`, `#FFFFFF`, with gridlines `#5A5A5A` or `#848484`. These are best-evidence values, not official defaults.
- **Fonts**: every pixel font here is drawn on a 16 px em. At Ghostty `font-size = 28` on a 2x Retina display that is **3.5 device px per font pixel**, so pixels come out uneven and anti-aliased. Sizes **24** (3x) or **32** (4x) are pixel-exact.
  - Monospace candidates: Fixedsys Excelsior (public domain/CC0, ~6,200 glyphs) and the Ultimate Oldschool PC Font Pack (CC BY-SA 4.0).
  - UI candidates: Tahoma, Microsoft Sans Serif and Trebuchet MS already ship with macOS. Pixel MS Sans Serif lookalikes are W95FA (OFL) and the 98.css "MS Sans Serif" FontStruction (CC BY-SA 3.0).
  - None of these has an official Nerd Font build. **Purist fidelity** makes that moot, and Ghostty draws box drawing, block elements, braille and Powerline separators itself.

---

## 1. Windows 98 / 2000 Classic system colors

### Sources

- **S1, Microsoft Learn, "Theme File Format".** Its `[Control Panel\Colors]` example is the Windows 2000/XP-Classic "Windows Standard" table (`ButtonFace=212 208 200`, `ActiveTitle=10 36 106`, ...). https://learn.microsoft.com/en-us/windows/win32/controls/themesfileformat-overview
- **S2, Microsoft Learn, `GetSysColor`.** Defines every `COLOR_*` index and its role. It notes that most indices are "not supported" on Windows 10+, which doesn't matter here. It gives no default values. https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolor
- **S3, Wine current source.** `dlls/win32u/sysparams.c`, `system_colors[]`. This is the Windows 2000 table and matches S1. https://gitlab.winehq.org/wine/wine/-/blob/master/dlls/win32u/sysparams.c
- **S4, Wine 0.9 source (2005).** `dlls/user/sysparams.c`, `DefSysColors[]`. This is the Win95/98 table. https://gitlab.winehq.org/wine/wine/-/blob/wine-0.9/dlls/user/sysparams.c
- **S5, ReactOS `boot/bootdata/hivedef.inf`.** Scheme 14 ("ReactOS Classic") is the Win9x palette with a Win2000 desktop. https://github.com/reactos/reactos/blob/master/boot/bootdata/hivedef.inf

S3, S4 and S5 are clean-room reimplementations of Windows behavior, not Microsoft sources. They're included because Microsoft never published the Win9x table and the reimplementations agree with each other.

### Table

| Element (`COLOR_*`, registry name) | Win 98 "Windows Standard" | Win 2000 "Windows Standard" | Notes |
|---|---|---|---|
| `BTNFACE` / `3DFACE` (`ButtonFace`) | `#C0C0C0` (S4, S5) | `#D4D0C8` (S1, S3) | Also used for dialog backgrounds |
| `BTNHIGHLIGHT` / `3DHILIGHT` (`ButtonHilight`) | `#FFFFFF` | `#FFFFFF` | Outer top-left bevel |
| `3DLIGHT` (`ButtonLight`) | `#C0C0C0` (S5) / `#E0E0E0` (S4) | `#D4D0C8` | **Sources disagree for 98.** S1 sets Light = Face on 2000, which matches S5's pattern |
| `BTNSHADOW` / `3DSHADOW` (`ButtonShadow`) | `#808080` | `#808080` | Inner bottom-right bevel |
| `3DDKSHADOW` (`ButtonDkShadow`) | `#000000` | `#404040` | Outer bottom-right bevel |
| `ACTIVECAPTION` (`ActiveTitle`) | `#000080` | `#0A246A` | Left end of the gradient |
| `GRADIENTACTIVECAPTION` | `#1084D0` | `#A6CAF0` | Right end of the gradient (S2) |
| `CAPTIONTEXT` (`TitleText`) | `#FFFFFF` | `#FFFFFF` | |
| `INACTIVECAPTION` | `#808080` | `#808080` | |
| `GRADIENTINACTIVECAPTION` | `#B5B5B5` (S4, S5) | `#C0C0C0` | |
| `INACTIVECAPTIONTEXT` | `#C0C0C0` | `#D4D0C8` | |
| `HIGHLIGHT` (`Hilight`) | `#000080` | `#0A246A` | Selection |
| `HIGHLIGHTTEXT` | `#FFFFFF` | `#FFFFFF` | |
| `WINDOW` | `#FFFFFF` | `#FFFFFF` | Edit and list backgrounds |
| `WINDOWTEXT` / `BTNTEXT` / `MENUTEXT` | `#000000` | `#000000` | |
| `WINDOWFRAME` | `#000000` | `#000000` | |
| `MENU` / `SCROLLBAR` / `ACTIVEBORDER` / `INACTIVEBORDER` | `#C0C0C0` | `#D4D0C8` | |
| `GRAYTEXT` | `#808080` | `#808080` | Disabled text. Classic also draws a white emboss offset by 1 px |
| `APPWORKSPACE` | `#808080` | `#808080` | MDI background |
| `INFOBK` / `INFOTEXT` | `#FFFFE1` / `#000000` | `#FFFFE1` / `#000000` | Tooltip |
| `HOTLIGHT` | `#0000FF` (S4) / `#000080` (S5) | `#0000C8` (S3) | Hyperlink and hot-track |
| `BACKGROUND` / `DESKTOP` | **`#008080` teal** (S4) | **`#3A6EA5`** (S3, S5) | S1's sample sets `Background=166 202 240`. That is a sample value, not the default |

Classic bevel recipes, using the 98 values:
- **Raised button**: outer edge `BTNHIGHLIGHT` (`#FFFFFF`) top-left and `3DDKSHADOW` (`#000000`) bottom-right; inner edge `3DLIGHT` top-left and `BTNSHADOW` (`#808080`) bottom-right.
- **Sunken field**: the same edges inverted.

This is the standard `DrawEdge` `EDGE_RAISED`/`EDGE_SUNKEN` arrangement of the four 3D colors. Which color goes on which edge is not stated in the sources above.

---

## 2. Windows XP Luna

### Source

- **S6, Luna's own INI resources.** These are the `NormalBlue.ini`, `NormalHomestead.ini` and `NormalMetallic.ini` files packed inside the shipped `luna.msstyles`. They were extracted alongside the msstyles packthem metadata (`PACKTHEM_VERSION`, `FILERESNAMES`) in the QuickXP repo: https://github.com/freitagdavid/QuickXP/tree/master/QuickXP/themes/luna/luna/settings
- Microsoft writes these values into the system colors when Luna is applied. They're the closest thing to a Microsoft-authored Luna palette. Some GitHub hits for these values are leaked Windows source trees; they were not used or cited.

Caveat: the Luna title bar, taskbar, Start button and window frame are **bitmaps**, not flat colors. For those surfaces the INI only gives `FillColorHint`, which Microsoft's comments call "Average background color". `[SysMetrics]` colors paint non-themed (classic-style) controls.

### Luna Blue (default, "NormalColor")

`[SysMetrics]`:

| Role | Hex | INI key |
|---|---|---|
| Window body / dialog / button face | **`#ECE9D8`** | `Btnface = 236 233 216`, `MenuBar` |
| Window (edit/list) | `#FFFFFF` | `Window` (`Menu` is also white) |
| Selection | **`#316AC5`** | `Highlight = 49 106 197`, `MenuHilight` |
| Selection text | `#FFFFFF` | `HighlightText` |
| Active caption (left / right) | `#0054E3` / `#3D95FF` | `ActiveCaption`, `GradientActiveCaption` |
| Inactive caption (left / right) | `#7A96DF` / `#9DB9EB` | |
| Inactive caption text | `#D8E4F8` | |
| 3D shadow / gray text | `#ACA899` | `BtnShadow`, `GrayText` |
| 3D dark shadow | `#716F64` | `DkShadow3d` |
| 3D light | `#F1EFE2` | `Light3d` |
| Desktop (behind Bliss) | `#004E98` | `Background = 0 78 152` |

Bitmap surfaces, using `FillColorHint` averages and explicit colors:

| Surface | Hex | Source line |
|---|---|---|
| Title bar | ≈`#0054E5`; title text shadow `#0A1883` | `[Window.Caption]` and `[Window]` |
| Taskbar | ≈ **`#245EDC`** | `[TaskBar.BackgroundBottom] FillColorHint = 36 94 220` |
| Notification area (tray) | ≈`#0D8DEA` | `[TrayNotifyHoriz::TrayNotify.Background]` |
| Clock text | `#FFFFFF`, Tahoma 8 | `[TrayNotify::Clock]` |
| **Start button** | ≈ **`#4A9949`** green; text `#FFFFFF`; text shadow `#454C10` | `[Start::Button]`, Franklin Gothic Medium 14 italic |
| Start menu user pane | ≈`#1F71D8`; text shadow `#09428B` | `[StartPanel.UserPane]` |
| Push button | fill ≈`#F3F3EF`, border `#003C74`, hover glow `#FAC458`, default/focus glow `#9DBBEB`, disabled text `#A1A192` | `[button.pushbutton]` |
| Checkbox / radio mark | `#21A121` | |
| Progress bar chunk | `#2ED331` | |
| List-view border | `#7F9DB9` | `[ListView]` |
| Toolbar (rebar) background | ≈`#F1F3EF` (light beige) | `[Rebar]` |
| Tab border / hover | `#919B9C` / `#FFC83C` | `[Tab.TabItem]` |

Luna fonts, from `[SysMetrics]`:
- Caption: **Trebuchet MS 10 bold**, caption height 25.
- Menu, status, message box and icon titles: **Tahoma 8**.
- `FlatMenus = true`.

### Olive Green ("Homestead") and Silver ("Metallic"), briefly

| Role | Olive | Silver |
|---|---|---|
| Body / button face | `#ECE9D8` | `#E0DFE3` (menu bar `#E0E2EB`) |
| Selection / text | `#93A070` / `#FFFFFF` | `#B2B4BF` / `#000000` |
| Active caption | `#8BA169` → `#C6D2A2` | `#C0C0C0` → `#C8C8C8`, text `#0E1010` |
| Inactive caption | `#D4D6BA` → `#D4D6BA` | `#FFFFFF` → `#EEEFF7`, text `#A2A1A1` |
| 3D shadow / dark / light | `#ACA899` / `#716F64` / `#F1EFE2` | `#9D9DA1` / `#716F64` / `#F1EFE2` |
| Desktop | `#9DACBD` | `#585768` |

---

## 3. TC2000 / TeleChart

### What is authoritative

- **S7, TeleChart User Guide** (Worden Brothers, the TeleChart 2007 edition, first-party PDF): https://videos.worden.com/telechart/telechartmanual.pdf
  - PDF p.71: *"BOP is plotted in color. Green signifies dominant buying, red dominant selling. When BOP is close to the zero line … it is plotted in yellow. (This is all patterned after stop and go lights). … the price bars are plotted in the same colors as the corresponding BOP bars below."*
  - What's-new lists (PDF p.15 and p.161): *"Down Color added to Price graph. You can now set a different color for down days."* and *"Color palette for indicators expanded from 16 to 42 colors."* The original 16-color palette is consistent with the Windows/VGA 16 colors seen in the screenshots.
- **S8, current TC2000 help** (help.tc2000.com, e.g. "How to Set a Default Chart Style", https://help.tc2000.com/m/69401/l/798118-how-to-set-a-default-chart-style). It describes picking colors from a palette but gives **no default hex values**.

**Plainly: there are no published authoritative hex values for TC2000/TeleChart defaults.**

### Best-evidenced approximations (from S7's own screenshots)

The figures in S7 are embedded as **lossless indexed PNGs**, so the pixel values are exact for what was captured. Two caveats:
- Some captures were taken in 16-bit color mode. Those show `#04FE04`, `#FC0204` and so on, which are the 16-bit renderings of `#00FF00` and `#FF0000`.
- They show the defaults *or* a Worden staffer's setup; the manual doesn't say which.

Screens sampled (PDF page numbers):
- TCNet 2002 chart (p.146–148)
- Notes window (p.55)
- Dual-chart layout (p.99)
- LinReg (p.79)
- Fibonacci (p.68)
- TeleChart Platinum 6.0.4 full window on XP Luna, 2005 (p.13)

| Role | Hex | Evidence |
|---|---|---|
| Chart canvas | **`#000000`** | All chart figures (70–95% of pixels) |
| Up / buying price bars, BOP buying, positive change text, volume up | **`#00FF00`** | p.13, 55, 68, 79, 99, 146 |
| Down / selling bars, BOP selling, volume down | **`#FF0000`** | p.55, 99, 146 |
| BOP neutral; MoneyStream (MS) line | **`#FFFF00`** | p.99, 146 ("Middle (MoneyStream)" pane) |
| Time Segmented Volume (TSV) line | `#FF00FF` | p.13 ("TSV 28") |
| Accent / markers (price-arrow, channel) | `#00FFFF` | p.79, 146 |
| Moving average / regression center | `#FF0000` (solid) or `#FFFFFF` (dashed) | p.13, 79 |
| Stochastics lines | `#0000FF` + `#FFFF00` | p.99 |
| Trendlines / drawing tools / labels / price text | `#FFFFFF` | p.68, 146 |
| Gridlines | `#5A5A5A` (p.13, 68, 79: 2003–05) or `#848484` (p.146, 2002; likely `#808080` at reduced depth) | |
| Current-price tag | `#FFFFFF` box, black text | p.79, 146 |
| Date tag | `#FFFF00` box, black text | p.146 |
| Pane separator | `#D6D6CE` light grey band | p.146 |
| Chat pane | `#000000` background, ~`#FF8000` message text, `#FFFF00` user names | p.13 |
| WatchList grid | Standard Windows list: `#FFFFFF` background, `#000000` text, system-face header (`#ECE9D8` under Luna) | p.13 |

The p.13 screenshot is effectively the **Vintage theme** in one picture. It shows a light XP **Frame** (menus, toolbar, WatchList) around a black **Work surface** chart drawn in VGA green, red, yellow and magenta.

---

## 4. Retro fonts

### How the Retina numbers were measured

- Ghostty `font-size` is in points. Docs: *"13.5pt @ 2px/pt = 27px"*, with the nearest integer pixel size chosen. https://ghostty.org/docs/config/reference
- So `font-size = 28` on a 2x display is a **56 px em**.
- Each font's pixel unit was measured with fontTools: the GCD of glyph outline coordinates, against `unitsPerEm`.
- The Oldschool pack's own guidance: *"They'll only look best at their native pixel height (or an integer multiple thereof)."* https://int10h.org/oldschool-pc-fonts/readme/

### Coverage note specific to Ghostty

Ghostty draws these ranges itself with its sprite renderer, regardless of the font:
- U+2500–257F (box drawing)
- U+2580–259F (block elements)
- U+2800–28FF (braille)
- Powerline separators U+E0B0–E0BF

Source: `src/font/sprite/draw/{box,block,braille,powerline}.zig` (`draw2500_257F`, `draw2580_259F`, `draw2800_28FF`, `drawE0B0`…), at ghostty-org/ghostty commit `f96c9711`. Font coverage of these ranges therefore only matters in Neovim GUIs, VSCode and other apps, not in the Ghostty terminal.

### Monospace (Work surface) candidates

| Font | License | Formats | Pixel grid → px/font-pixel at 28 pt@2x | Pixel-exact Ghostty sizes | Coverage (measured) | Ligatures | Nerd Font build |
|---|---|---|---|---|---|---|---|
| **Fixedsys Excelsior 3.022**, kika/fixedsys build ([repo](https://github.com/kika/fixedsys), release `v3.09.10`) | **Public domain / CC0** (README: "released it to the public domain … Creative Commons Zero") | TTF (outlines plus embedded EBDT bitmaps) | 16 px em → **3.5** | 8, 16, **24**, **32**, 40, 48 | 6,192 codepoints: Latin-1 complete, Greek 120, Cyrillic 246, box 128/128, blocks 32/32, braille 256/256. Its PUA holds other material (not Powerline separators or Nerd icons) | Yes (`calt`/`liga`, `<=`/`=>` etc.). Disable with `font-feature = -calt,-liga` | None official |
| **Ultimate Oldschool PC Font Pack v2.2**, e.g. `PxPlus IBM VGA 8x16` / `9x16` ([site](https://int10h.org/oldschool-pc-fonts/)) | **CC BY-SA 4.0** (attribution to VileR; derivatives share-alike) | TTF (`Px` outline, `Mx` outline plus bitmap, `Ac` aspect-corrected), FON, OTB, WOFF | 16 px em → **3.5** | 8, 16, **24**, **32**, 40, 48 | `Px437`: 288 glyphs (CP437). `PxPlus`: 781 glyphs (Latin-1 complete, Greek 75, Cyrillic 98, box 40/128, blocks 9/32) | No | None for the VGA fonts. **BigBlueTerminal**, another VileR font, *is* in Nerd Fonts' patched list |
| **Perfect DOS VGA 437** (Zeh Fernando, [dafont](https://www.dafont.com/perfect-dos-vga-437.font)) | Freeware, with its own terms: "distribute as you wish … Do NOT sell this font" (bundled `dos437.txt`) | TTF (`437` and `437 Win` codepage variants) | 16 px em (256-unit pixel, 4096 upm, 9×16 cell) → **3.5** | 8, 16, **24**, **32**… | 256 glyphs only. No Unicode box drawing mapped | No | None. The author's own note now recommends the int10h pack instead |

Retina verdict:
- At **28 pt** all three render each font pixel as 3.5 device px. Core Text anti-aliases the half pixels, so stems alternate between 3 and 4 px with soft edges. That is readable, but neither bitmap-crisp nor smooth.
- **24 pt** (48 px em, 3x) and **32 pt** (64 px em, 4x) are exact.
- For Fixedsys Excelsior and the VGA fonts at 24 pt, a cell is 24×48 device px (`8x16`) or 27×48 (`9x16`). At 32 pt it is 32×64.
- Ghostty documents no option to turn off anti-aliasing. `font-thicken` exists on macOS.

### UI (Frame) candidates

| Font | What it is | License / availability | Formats | Notes |
|---|---|---|---|---|
| **Tahoma** | The XP Luna UI font (S6: `MenuFont = Tahoma, 8`) and the Win2000 "MS Shell Dlg 2" | **Ships with macOS** (`/System/Library/Fonts/Supplemental/Tahoma.ttf`, plus Bold) | TTF | Outline font, smooth at any size. Latin-1, Greek, Cyrillic. No box drawing |
| **Microsoft Sans Serif** | The TrueType successor of the Win9x bitmap "MS Sans Serif" | **Ships with macOS** (`…/Supplemental/Microsoft Sans Serif.ttf`) | TTF | Outline. 2,788 glyphs. No box drawing |
| **Trebuchet MS** (Bold) | XP Luna caption font (S6: `CaptionFont = Trebuchet MS, 10, bold`) | **Ships with macOS** | TTF | For title-like text |
| **Franklin Gothic Medium** (Italic) | XP Start button / Start menu font (S6) | Not bundled with macOS (ships with Windows/Office) | — | Only needed for a literal "start" label |
| **W95FA** (Alina Sava, [FontsArena](https://fontsarena.com/w95fa-by-alina-sava/)) | Pixel-style recreation of Win95 MS Sans Serif | **SIL OFL 1.1** | OTF, WOFF, WOFF2 | Proportional. 167 glyphs (Latin, partial Latin-1, no Greek or Cyrillic, no box drawing). Outlines aren't on a single integer pixel grid (measured), so it reads as "soft pixel" at any size and has no pixel-exact size |
| **"MS Sans Serif" FontStruction by "lou"**, as bundled in [98.css](https://github.com/jdan/98.css/tree/main/fonts/src/ms-sans-serif) | Pixel lookalike of the Win9x 8 pt (11 px) UI font | **CC BY-SA 3.0** (98.css itself is MIT; the font carries its own license file) | TTF, plus WOFF/WOFF2 in 98.css | Readme: "best displayed at a font-size of 11" px. Pixel-exact on a 2x display at 11, 16.5 and 22 pt |

### Nerd Font patches

- None of these fonts appears in Nerd Fonts' `patched-fonts` list: https://github.com/ryanoasis/nerd-fonts/tree/master/patched-fonts. The retro-adjacent entries there are BigBlueTerminal, Terminus, Gohu, ProggyClean and DepartureMono.
- Self-patching would be legal for the CC0, CC BY-SA and OFL fonts (OFL requires renaming if a Reserved Font Name is declared). Perfect DOS VGA's terms are informal.
- **Purist fidelity** forbids Nerd Font icons, so a patch isn't needed. Box drawing, blocks and Powerline separators come from Ghostty's sprite renderer anyway.

---

## Open questions for the Theme spec (not decided here)

- **98 vs 2000 Classic**. These are two different greys (`#C0C0C0` vs `#D4D0C8`), two title gradients and two desktops (teal vs `#3A6EA5`). XP Luna `#ECE9D8` is a third option for the **Frame** body.
- **Terminal size**. Keep 28 pt (soft pixel fonts, or switch to an outline font for the **Work surface**), or move to 24 or 32 pt for pixel-exact Fixedsys or VGA.
- **TC2000 gridline grey**: `#5A5A5A` (later) or `#808080` (earlier).
