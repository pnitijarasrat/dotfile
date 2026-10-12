# Do skhd letter bindings still fire while the Thai input source is active?

Research for [#107](https://github.com/pnitijarasrat/dotfile/issues/107), part of map [#106](https://github.com/pnitijarasrat/dotfile/issues/106) (Shortcut spec).
Researched 2026-10-12 on this Mac: macOS 14.1, Apple Silicon, skhd 0.3.9 (Homebrew, `asmvik/formulae/skhd`), enabled input sources `com.apple.keylayout.ABC` and `com.apple.keylayout.Thai` (Kedmanee).

## TL;DR

- **Yes, for every modifier class.** `alt - h`, `shift + alt - h`, `ctrl + alt - h`, `shift + cmd - h` and the number bindings all fire with Thai active. The modifier doesn't matter.
- **Why:** skhd turns `h` into a **physical keycode** (`0x04`) when it parses the config. On each keypress it compares only that keycode and the modifier flags, in a CGEvent tap. It never looks at the character the key would type.
- **The letter-to-keycode table comes from the most-recently-used ASCII-capable layout**, via `TISCopyCurrentASCIICapableKeyboardLayoutInputSource`, and never from Thai. Thai reports `asciiCapable=false` on this Mac, so it can't be picked. The answer is the same when skhd **starts** while Thai is active.
- **Side effect:** each input-source switch makes skhd rebuild the table and **re-parse `~/.skhdrc`**. That resets any skhd *mode* back to `default`. The current config has no modes, so nothing breaks today.
- **Karabiner's Hyper key is unaffected.** It sends HID usage codes, which identify physical keys. The letter you press with Hyper still reaches skhd as keycode `0x04`, whatever the layout.
- **Recommendation:** keep writing bindings as letters (`alt - h`). Hex keycodes (`alt - 0x04`) are allowed but add nothing here. Avoid skhd modes, or accept that a Thai/English switch drops you back to `default`.

## Mechanism

### 1. Parse time: the letter becomes a keycode

[`src/parse.c`](https://github.com/asmvik/skhd/blob/a7105d5b3db6b25d01c0ded79a25536ab284b34f/src/parse.c) has two ways to read the key:

- `parse_key` handles a letter. It calls `keycode_from_char(*key.text)`, a lookup in `keymap_table`.
- `parse_key_hex` handles `0x..`. It runs `sscanf("%x")` and doesn't touch the table at all.

The README grammar lists both forms: `key = <literal> | <keycode>`, where `keycode = 'apple keyboard kVK_<Key> values (0x3C)'` ([README](https://github.com/asmvik/skhd/blob/a7105d5b3db6b25d01c0ded79a25536ab284b34f/README.md)).

### 2. Where `keymap_table` comes from

`initialize_keycode_map()` in [`src/locale.c`](https://github.com/asmvik/skhd/blob/a7105d5b3db6b25d01c0ded79a25536ab284b34f/src/locale.c) builds the table:

1. It calls `TISCopyCurrentASCIICapableKeyboardLayoutInputSource()` to get a layout.
2. It reads that layout's `kTISPropertyUnicodeKeyLayoutData` (`uchr`).
3. For each `kVK_ANSI_*` keycode (letters, digits, punctuation), it runs `UCKeyTranslate(..., kUCKeyActionDown, modifiers=0, ...)` and stores `character → keycode`.

Apple's `TextInputSources.h` documents the function this way. The quotes come from a [verbatim mirror of the header](https://git.osdyson.ru/pkg-pascal/fpc/plain/fpcsrc/packages/univint/src/TextInputSources.pas), because the header isn't in the Command Line Tools SDK and Apple's web page for it returns 404:

- "Copies a TISInputSourceRef for the most-recently-used ASCII-capable keyboard layout."
- "If no ASCII-capable keyboard input source has been used yet, returns the default ASCII-capable keyboard layout (chosen by Setup Assistant)."

So the Thai layout is never used to build the table. Whether Thai is selected at startup or later, `h` resolves through ABC to `0x04`.

### 3. When the table is built

- **Once at startup:** `skhd.c` calls `initialize_keycode_map()` in `main`.
- **Again on every input-source change:** `skhd.c` registers `keymap_handler` for `kTISNotifySelectedKeyboardInputSourceChanged` on the distributed notification center. The handler rebuilds the table, then frees the mode map and runs `parse_config_helper()` again.
- This behaviour dates from skhd 0.3.1. It was added to fix [koekeishiya/skhd#59 "Changing keymaps requires a restart"](https://github.com/asmvik/skhd/issues/59). The maintainer confirmed it in [#69](https://github.com/asmvik/skhd/issues/69): "changing my input-source would cause the bindings to change."
- Switching ABC → Thai → ABC rebuilds the table from ABC every time, so the bindings come out the same.
- `src/locale.c` hasn't changed since 2023-05-01, so the installed 0.3.9 has this exact logic. The repo's later commits are a rename only.

### 4. Keypress time: keycode plus flags, no characters

`create_eventkey()` in [`src/hotkey.c`](https://github.com/asmvik/skhd/blob/a7105d5b3db6b25d01c0ded79a25536ab284b34f/src/hotkey.c) builds the event key from just two fields:

- `.key = CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode)`
- `.flags` = the event's modifier flags

`find_and_exec_hotkey` matches on those two fields and nothing else. With Thai active, the H key still produces keycode `0x04`, even though it would type `้`. So the binding matches, and skhd swallows the event before any app sees it.

### 5. ⌘ versus ⌥/⌃

The ticket asked whether ⌘ bindings behave differently. They don't, for skhd:

- "With ⌘, macOS falls back to the Latin layout" is an AppKit menu key-equivalent behaviour.
- skhd's event tap runs before AppKit and never translates characters.
- So ⌘, ⌥, ⌃ and ⇧ combinations behave the same.

The only thing that could vary by layout is the table lookup, and that lookup always uses the ASCII-capable layout.

### 6. Karabiner Hyper

`karabiner/karabiner.json` maps Right Option to `left_control` with `left_shift`, `left_option` and `left_command`. That is modifiers only. The letter you press with it is passed through unchanged.

Karabiner's docs say its key code names are HID usage names, "which is similar to a scancode". They also say "Determining which characters are to be input by keyboard event is the later step in the processing flow of macOS" ([Karabiner: symbols with non-ANSI keyboard](https://karabiner-elements.pqrs.org/docs/help/troubleshooting/symbols-with-non-ansi-keyboard/)).

So `hyper + h` reaches skhd as keycode `0x04` plus all four modifier flags, with either layout. The virtual keyboard is set to `ansi`, which matches the kVK_ANSI keycodes skhd uses.

## Local check (read-only)

I compiled a small Swift program (`TISCreateInputSourceList` + `UCKeyTranslate`). It didn't change the input source or touch skhd. Output:

```
enabled: com.apple.keylayout.ABC  asciiCapable=true  selected=true  0x04(h)->'h' 0x26(j)->'j'
enabled: com.apple.keylayout.Thai asciiCapable=false selected=false 0x04(h)->'้' 0x26(j)->'่'
current ASCII-capable layout (what skhd uses): com.apple.keylayout.ABC 0x04-> h
```

This confirms two things:

- Thai Kedmanee is **not** ASCII-capable, so it can never be the layout skhd reads from.
- Under Thai, the H key would type `้`. If skhd translated characters, `alt - h` would break. It doesn't translate characters, so the binding works.

## Known issues and workarounds in the tracker

- [asmvik/skhd#281 "Changing layout breaks skhd modes"](https://github.com/asmvik/skhd/issues/281), open. Each input-source switch re-parses the config and resets the current mode to `default`. This is the one real Thai/English cost.
- In [#59](https://github.com/asmvik/skhd/issues/59), a user asked for a way to turn off the reload-on-switch. No such option exists in 0.3.9.
- [#306 "Use non-alphanumeric character in hotkey definition – across layouts"](https://github.com/asmvik/skhd/issues/306), open. It shows the flip side of hex keycodes: `0x29` is tied to a physical *position*, so on Dvorak it fires on `s` instead of `;`. With ABC as the only ASCII-capable layout here, letters and hex give the same result.
- Hex keycodes (`alt - 0x04`) skip the table entirely. They're the documented fallback when a letter lookup fails. Here the lookup succeeds, so they aren't needed.
- `skhd -o` / `--observe` prints the keycode and flags of each keypress, which helps confirm a key's hex value.

## jackielii/skhd.zig, for reference

- skhd.zig builds its table the same way: `src/Keycodes.zig` uses `TISCopyCurrentASCIICapableKeyboardLayoutInputSource` + `UCKeyTranslate`. So letter bindings work under Thai there too.
- Checked at commit `e4770df` (2026-07-22): it has **no** `kTISNotifySelectedKeyboardInputSourceChanged` observer. It builds the table when it parses the config.
- That means it doesn't reload or reset modes when you switch input source. The catch is that it also won't notice a change of ASCII-capable layout (say ABC → Dvorak) until the config is reloaded. That doesn't matter for an ABC + Thai setup.

## Unconfirmed

- I didn't run a live keypress test with Thai selected, because the brief said not to change the input source. The conclusion rests on reading the source, the API contract and the local TIS/UCKeyTranslate check above.
- I also didn't test starting skhd while Thai is active. Apple's header says the API returns the most-recently-used ASCII-capable layout, which here is ABC.
- To confirm by hand: switch to Thai, press ⌥H, and check that focus moves. Optionally, run `skhd -o` and see `keycode: 0x04`.
