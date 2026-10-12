# Key combinations already taken by macOS and the daily apps

Research for [#109](https://github.com/pnitijarasrat/dotfile/issues/109), part of map [#106](https://github.com/pnitijarasrat/dotfile/issues/106) (Shortcut spec).
Researched 2026-10-12 on this Mac: macOS 14.1, input sources ABC and Thai. No config was changed. Everything here was read with `defaults read` / `jq` or taken from the docs linked below.

## TL;DR

- **skhd sees keys before the focused app does.** Every combo bound in `~/.skhdrc` is lost to Chrome, Ghostty, VSCode and Neovim. Today the worst losses are **⇧⌘3** (the full-screen screenshot), **⇧⌘H/J/K/L** (four VSCode commands, plus Chrome Downloads and Home), **⌘1–3 / ⌘8–0** (tab switching in Chrome and Ghostty) and **⌥F** (forward-word in the shell).
- **Hyper+⇧ is not a separate layer.** The Karabiner rule already sends `left_shift`, so physically adding Shift changes nothing. Hyper+⇧+X arrives as Hyper+X.
- **Hyper (⌃⌥⇧⌘) is almost empty.** It is taken only by Hyper+Q (custom macOS "Move focus to next window", hotkey id 27) and Hyper+. (sysdiagnose). It is the safest class.
- **⌃⌘ + a letter is the second-best class.** macOS takes Q (lock screen), F, D and Space, and VSCode takes I. H/J/K/L and most other letters are free in every app checked.
- **⌃Space currently belongs to macOS** ("Select the previous input source", id 60, enabled). **⌘Space belongs to Raycast** (`raycastGlobalHotkey = "Command-49"`), and Spotlight's ⌘Space (id 64) is disabled. To get the planned swap (⌘Space = input source, ⌃Space = Raycast), both hotkeys have to change. VSCode has already moved its ⌃Space (Trigger Suggest) to ⌥Space in the user's keybindings.

## How the inventory was built

| Source | What was read |
|---|---|
| macOS defaults | Apple, [Mac keyboard shortcuts](https://support.apple.com/en-us/102650) |
| macOS as configured | `defaults export com.apple.symbolichotkeys` (decoded below) |
| skhd | `~/.skhdrc` |
| Karabiner | `karabiner/karabiner.json` (selected profile "Default profile") |
| Ghostty | `ghostty/config` (no `keybind=` lines, so defaults apply); defaults from `ghostty +list-keybinds --default`; [config reference](https://ghostty.org/docs/config/reference) for `macos-option-as-alt` |
| VSCode | [Default keybindings](https://code.visualstudio.com/docs/reference/default-keybindings) + `~/Library/Application Support/Code/User/keybindings.json` (not tracked in the repo; `vscode/` has only `settings.json`, which has no keybindings) |
| Chrome | [Chrome keyboard shortcuts (Mac)](https://support.google.com/chrome/answer/157179?platform=mac) |
| Neovim | LazyVim [default keymaps](https://www.lazyvim.org/keymaps) + `nvim/lua/config/keymaps.lua`, `nvim/lua/plugins/*.lua` |
| Raycast | `defaults read com.raycast.macos` (global hotkey only; per-command hotkeys live in Raycast's encrypted database. See [Unconfirmed](#unconfirmed)) |
| sysdiagnose | `man sysdiagnose` |

### Enabled macOS system hotkeys (`com.apple.symbolichotkeys`)

Modifier masks: ⇧ 0x20000, ⌃ 0x40000, ⌥ 0x80000, ⌘ 0x100000, fn 0x800000.

| id | Combo | Action | State |
|---|---|---|---|
| 7–13, 57 | ⌃F1–⌃F8 | Keyboard focus: menu bar, Dock, window, toolbar, etc. | enabled |
| 27 | **Hyper+Q** (⌃⌥⇧⌘Q) | Move focus to next window (customised from the default ⌘\`) | enabled |
| 28 / 29 | ⇧⌘3 / ⌃⇧⌘3 | Screenshot of the screen (file / clipboard) | enabled |
| 30 / 31 | ⇧⌘4 / ⌃⇧⌘4 | Screenshot of an area (file / clipboard) | enabled |
| 184 | ⇧⌘5 | Screenshot toolbar | enabled |
| 32 / 33 | ⌃↑ / ⌃↓ | Mission Control / App windows | **disabled** |
| 34 / 35 | ⌃⇧↑ / ⌃⇧↓ | Mission Control / App windows (shift variants) | enabled |
| 79 / 81 | ⌃← / ⌃→ | Move one Space left / right | **disabled** |
| 80 / 82 | ⌃⇧← / ⌃⇧→ | Move one Space left / right (shift variants) | enabled |
| 118–123 | ⌘1, ⌘2, ⌘3, ⌘8, ⌘9, ⌘0 | Switch to Desktop 1–6 | disabled (yabai/skhd does this) |
| 124–127 | ⌘7, ⌘8, ⌘9, ⌘0 | Switch to Desktop 7–10 | **enabled**. Overlaps skhd's ⌘8/9/0; acts only if those desktops exist |
| 36 / 37 | F11 / ⇧F11 | Show Desktop | enabled |
| 52 | ⌥⌘D | Dock hiding on/off | enabled |
| 59 / 162 | ⌘F5 / ⌥⌘F5 | VoiceOver / Accessibility shortcuts | enabled |
| 60 | **⌃Space** | Select the previous input source | enabled |
| 61 | ⌃⌥Space | Select next input source | disabled |
| 64 / 65 | ⌘Space / ⌥⌘Space | Spotlight / Finder search | **disabled** |
| 98 | ⇧⌘/ | Show Help menu | enabled |
| 190 | fn+Q | Quick Note (inferred from id) | enabled |
| 15, 17, 19, 21, 23, 25, 26 | ⌥⌘8, ⌥⌘=, ⌥⌘-, ⌃⌥⌘8, ⌥⌘\\, ⌃⌥⌘. , ⌃⌥⌘, | Zoom / invert / contrast | disabled |

### What skhd and Karabiner take today

- **skhd:** ⌥H/J/K/L, ⌥F/T/E/R/Y/X; ⇧⌥H/J/K/L, ⇧⌥P/N, ⇧⌥R; ⇧⌘H/J/K/L; ⌃⌥H/J/K/L, ⌃⌥R; ⌘1/2/3/8/9/0; ⇧⌘1/2/3/7/8/9.
- **Karabiner:** Caps Lock → Left Control on every keyboard, and Right Option → Hyper (`left_control` + `left_shift`, `left_option`, `left_command`; `from.modifiers.optional: any`). On the two non-Apple keyboards (vendor 9639 and 65534), left ⌘ and left ⌥ are also swapped and Left Control → Caps Lock. So on those keyboards, "⌥" in this document means the key labelled ⌘.

## Inventory by modifier class

Collision severity: **High** means a daily action is lost. **Med** means a real but occasional action is lost. **Low** means something rarely used or redundant is lost.

### ⌥ (Option alone)

| Combo | Owner | Severity if skhd takes it |
|---|---|---|
| ⌥H/J/K/L (skhd focus) | LazyVim `<A-j>`/`<A-k>` move line (only reaches Neovim if Ghostty sends ⌥ as Meta); ⌥J/K/L/H type ∆ ˚ ¬ ˙ on ABC | Med |
| ⌥F (skhd zoom) | zsh/readline Meta-f **forward-word** (in Ghostty, if option-as-alt); types ƒ | Med |
| ⌥T / ⌥R / ⌥Y / ⌥X (skhd) | readline Meta-t transpose-words, Meta-r revert-line, Meta-y yank-pop; types † ® ¥ ≈ | Low |
| ⌥E (skhd balance) | **Dead key** for the acute accent (´) on ABC | Low (Med if you type accented Latin) |
| ⌥U, ⌥I, ⌥N, ⌥\` | Dead keys: umlaut, circumflex, tilde, grave | Low/Med |
| ⌥B, ⌥D, ⌥. | readline Meta-b back-word, Meta-d kill-word, Meta-. last-arg | **High** in the shell |
| ⌥N / ⌥P | LazyVim next/prev LSP reference | Med |
| ⌥Z, ⌥↑/↓, ⌥Enter | VSCode word wrap, move line, select all find matches | Med |
| ⌥Space | VSCode Trigger Suggest (user keybinding) | **High** in VSCode |
| ⌥←/→, ⌥Delete | Word motion and deletion everywhere (Ghostty sends `esc:b`/`esc:f`) | **High** |

Crowding: **high**. Letters are free in Chrome and VSCode, but in a terminal every ⌥ letter is a potential Meta key, and on ABC they are character or dead keys. Ghostty's `macos-option-as-alt` is unset, and the docs say its default depends on the layout ("true" only for U.S. Standard/International). So whether ⌥ acts as Meta under **ABC** is [unconfirmed](#unconfirmed).

### ⇧⌥ (Shift+Option)

| Combo | Owner | Severity |
|---|---|---|
| ⇧⌥H/J/K/L, P, N, R (skhd) | ABC symbols (Ó Ô  Ò ∏ ˜ ‰); nothing else found | Low |
| ⇧⌥F, ⇧⌥A, ⇧⌥I | VSCode Format Document, Block comment, Cursor at line ends | Med (⇧⌥F is used daily by some people) |
| ⇧⌥↑/↓, ⇧⌥←/→ | VSCode copy line; macOS extend selection by word/paragraph | **High** (arrows only) |

Crowding: **low for letters** except F/A/I in VSCode. A usable class.

### ⌃ (Control alone)

The terminal and Neovim own nearly every ⌃letter: LazyVim ⌃H/J/K/L window nav, ⌃D/U, ⌃S, ⌃A/X, ⌃B/F, ⌃/; macOS Emacs text keys (⌃A/E/B/F/P/N/H/D/K/O/T/L) apply in every text field. VSCode uses ⌃G, ⌃\`, ⌃Tab, ⌃-, ⌃Q. ⌃Tab is next tab in Chrome and Ghostty. ⌃Space is macOS input source (id 60) and LazyVim incremental selection. ⌃F1–F8 are macOS focus keys. Caps Lock now acts as ⌃, which makes all of these easier to hit.

Crowding: **full**. Don't put global shortcuts here. ⌃Space for Raycast (the plan) costs LazyVim treesitter incremental selection (`<c-space>`), which is **Med**.

### ⌃⇧ (Control+Shift)

| Combo | Owner | Severity |
|---|---|---|
| ⌃⇧↑/↓/←/→ | macOS Mission Control / App windows / move Space (ids 34, 35, 80, 82, enabled) | Med |
| ⌃⇧Tab | Previous tab: Chrome, Ghostty, macOS controls | **High** |
| ⌃⇧G, ⌃⇧-, ⌃⇧M | VSCode Source Control, Go Forward, Tab-focus mode | Med |
| ⌃⇧PgUp/PgDn, ⌃⇧Return | Chrome move tab, address-bar autocomplete | Low |
| ⌃⇧letter in a terminal | Usually sent as the same byte as ⌃letter, so it reaches Neovim as ⌃H/J/K/L | Low (it's a duplicate) |

Crowding: **low for letters**. Free for global use, apart from G and M in VSCode.

### ⌃⌥ (Control+Option)

| Combo | Owner | Severity |
|---|---|---|
| ⌃⌥H/J/K/L, ⌃⌥R (skhd resize, restart) | Nothing found in macOS, Chrome, Ghostty, VSCode or LazyVim | — |
| ⌃⌥Space | macOS next input source (disabled here) | — |
| ⌃⌥ + anything | VoiceOver modifier (only while VoiceOver is on) | Low |

Crowding: **essentially free**.

### ⇧⌘ (Shift+Command)

| Combo | Owner | Severity if skhd takes it |
|---|---|---|
| ⇧⌘3 / 4 / 5 | macOS screenshots (skhd currently **steals ⇧⌘3**) | **High** |
| ⇧⌘H | VSCode Replace in Files; Chrome Home page | Med |
| ⇧⌘J | VSCode search details; Chrome Downloads; Ghostty paste screen to file | Med |
| ⇧⌘K | VSCode **Delete Line** | **High** |
| ⇧⌘L | VSCode **Select All Occurrences** | **High** |
| ⇧⌘T, N, W, B, R, D, M, G, Delete | Chrome reopen tab, incognito, close window, bookmarks bar, hard reload, etc.; Ghostty ⇧⌘T/W/D/F/G/P/Z/V/Enter/[ ] | **High** (T, N, W, R, [ ]) |
| ⇧⌘P, ⇧⌘F, ⇧⌘E, ⇧⌘G (VSCode) | Command palette, search, explorer, Panel (user binding) | **High** |
| ⇧⌘/ | macOS Help menu | Low |
| ⇧⌘7/8/9, ⇧⌘1/2 (skhd) | Nothing found | Low |

Crowding: **full**. This is the main application-command layer. skhd's warp on ⇧⌘H/J/K/L and send-to-space on ⇧⌘3 are the most harmful bindings in the current setup.

### ⌘ + digit

⌘1–8 is go-to-tab and ⌘9 is last tab in Chrome and Ghostty. VSCode uses ⌘1–3 to focus editor groups. macOS ids 124–127 also map ⌘7–⌘0 to Desktops 7–10. skhd taking ⌘1/2/3/8/9/0 is **High**: this is the "steals tab switching" complaint in the ticket. Ghostty also uses ⌘0 for reset font size.

### ⌘⌥ (Command+Option)

| Combo | Owner | Severity |
|---|---|---|
| ⌥⌘H, ⌥⌘M, ⌥⌘W, ⌥⌘Esc, ⌥⌘D, ⌥⌘Space, ⌥⌘F5 | macOS hide others, minimize all, close all, force quit, Dock, Finder search, a11y | **High** (H, Esc) |
| ⌥⌘I, ⌥⌘J, ⌥⌘U, ⌥⌘B, ⌥⌘F, ⌥⌘N, ⌥⌘P, ⌥⌘←/→ | Chrome DevTools, Console, Source, Bookmarks, web search, split view, page setup, prev/next tab | **High** (I, J, ←/→) |
| ⌥⌘F, ⌥⌘S, ⌥⌘C/W/R, ⌥⌘[ ], ⌥⌘↑/↓, ⌥⌘. | VSCode replace, save all, find toggles, fold, multi-cursor | **High** |
| ⌥⌘W, ⌥⌘I, ⌥⌘arrows | Ghostty close tab, inspector, goto split | Med |
| ⌥⌘K, ⌥⌘L, ⌥⌘G, ⌥⌘X… | ⌥⌘L Finder Downloads; K mostly free | Low |

Crowding: **high**. Avoid.

### ⌃⌘ (Control+Command)

| Combo | Owner | Severity |
|---|---|---|
| ⌃⌘Q | macOS Lock Screen | **High** |
| ⌃⌘F | macOS/Ghostty/VSCode toggle full screen | Med |
| ⌃⌘Space | macOS Character Viewer (emoji) | Med |
| ⌃⌘D, ⌃⌘N, ⌃⌘T, ⌃⌘A | macOS Look Up, Finder new folder/sidebar/alias | Low |
| ⌃⌘I | VSCode Open Chat | Low/Med |
| ⌃⌘←/→/↑/↓, ⌃⌘= | VSCode move editor to group; Ghostty resize split / equalize | Med |
| ⌃⌘H/J/K/L and most other letters | **Nothing found** | — |

Crowding: **low for letters**. A good layer for window management.

### ⌃⇧⌘ / ⌥⇧⌘ (three modifiers, not Hyper)

- ⌃⇧⌘: macOS ⌃⇧⌘3/4 (screenshot to clipboard), ⌃⇧⌘T (Finder add to Dock); VSCode ⌃⇧⌘←/→ AST selection; Ghostty ⌃⇧⌘J. Letters otherwise free. **Low crowding.**
- ⌥⇧⌘: macOS ⌥⇧⌘Q (**log out immediately**, so never route anything near it), ⌥⇧⌘V (paste and match style), ⌥⇧⌘Delete; Chrome ⌥⇧⌘I/A; Ghostty ⌥⇧⌘W/J. **Low-medium crowding, but Q is dangerous.**

### Hyper (⌃⌥⇧⌘, Right Option via Karabiner)

| Combo | Owner | Severity |
|---|---|---|
| Hyper+Q | macOS "Move focus to next window" (custom, id 27) | Low (yours to reassign) |
| Hyper+. | sysdiagnose (`man sysdiagnose`), which starts a heavy diagnostics capture | Med (avoid) |
| Everything else | Nothing found | — |

Crowding: **essentially free**. Because it's held with one thumb on Right Option, it's also the easiest four-modifier chord to press.

### Hyper+⇧ (via Karabiner)

**This layer does not exist** with the current rule. Hyper already includes `left_shift`, and the `optional: any` modifier lets a physical Shift pass through. Either way, apps see ⌃⌥⇧⌘+key, so Hyper+⇧+H is the same event as Hyper+H. A second layer would need a different Karabiner rule, for example Right Option+Shift → ⌃⌥⌘ ("Meh", without ⇧) or a `set_variable` layer.

## Effectively free modifier classes

1. **Hyper + any key** (avoid Q, which you assigned yourself, and `.`, which is sysdiagnose).
2. **⌃⌥ + letters** (already used by skhd resize; nothing else claims them).
3. **⌃⌘ + letters other than Q, F, D, N, T, A, I** (H/J/K/L are free).
4. **⌃⇧ + letters other than G, M** (in terminals they duplicate ⌃letter, so nothing distinct is lost).
5. **⌃⇧⌘ + letters other than T, J** (awkward to press without the Hyper key).

Not free: ⌥ alone (terminal Meta, dead keys), ⇧⌘ and ⌥⌘ (app commands), ⌘+digit (tab switching), ⌃ alone (terminal, Neovim, Emacs text keys).

## Unconfirmed

- **Whether Ghostty treats ⌥ as Meta under the ABC layout.** The docs say only U.S. Standard/International default to `true`. This decides whether skhd's ⌥ bindings are taking Neovim/readline Meta keys or only typed symbols. Check with `ghostty +show-config --default | grep option-as-alt`, or by pressing ⌥B in zsh.
- **⌥ behaviour on the Thai layout.** Its ⌥ symbol and dead-key map wasn't checked. skhd matches keycodes, so bindings fire whatever the layout is.
- **Raycast per-command hotkeys.** Only the global hotkey (⌘Space) can be read; command hotkeys are in Raycast's encrypted store. Check them in Raycast Settings → Extensions → Hotkey column.
- **Which wins on ⌘8/⌘9/⌘0, skhd or macOS Desktop 8–10 (ids 125–127).** It only matters if 8+ desktops exist.
- **id 190 = Quick Note** is inferred from the fn+Q combo, not from a document.
- Apple's live support page now also lists ⇧⌘Space and ⇧⌘6 for Siri on "macOS 27 or later". These don't apply to 14.1.
