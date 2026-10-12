# Modifiers and Hyper: HHKB vs MacBook built-in keyboard

Research for [#108](https://github.com/pnitijarasrat/dotfile/issues/108), part of map [#106](https://github.com/pnitijarasrat/dotfile/issues/106) (Shortcut spec).
Researched 2026-10-12 on this Mac: macOS 14.1, Apple Silicon MacBook, Karabiner-Elements 16.3.0.

## TL;DR

- **The user's HHKB is a Professional HYBRID-family board.** It is paired over Bluetooth as `HHKB-Hybrid_1`, vendor `0x04FE` (1278, PFU) and product `0x0021` (33). That Bluetooth name is what the HYBRID / HYBRID Type-S manual says the board advertises. It was not connected during this research, so its DIP-switch mode (HHK or Mac) and its layout (US or JP) are **unconfirmed**.
- **Hyper works on the HHKB unchanged.** The Hyper rule has no `device_if` condition, and Karabiner grabbed `HHKB-Hybrid_1` several times today (`/var/log/karabiner/core_service.log`). The HHKB's outer-right **Alt** key sends `right_option` in both HHK mode and Mac mode, so Right Option → ⌃⇧⌥⌘ fires on both keyboards. **No Karabiner change is needed.**
- **Caps Lock → Control is harmless on the HHKB.** The HHKB already has **Control on the home row** (left of A) and no physical Caps Lock. The profile-level `caps_lock → left_control` therefore only affects the HHKB's **Fn+Tab** (its Caps Lock), which becomes a second Control.
- **The modifier order is the same on both keyboards:** Option on the outside, Command next to Space, Control left of A (on the MacBook, via Karabiner). The differences are three:
  - the HHKB has **no Globe/fn key the Mac can see**
  - it has **no physical arrows or F-keys** (they live on its firmware Fn layer)
  - its Right Option sits one key further right, and the Fn key is up next to Right Shift
- **Recommendation:** keep the current Karabiner config. In the Shortcut spec:
  - only pair Hyper with **letters, digits and punctuation**
  - never use **Globe/fn**
  - avoid **Hyper + arrows / F-keys / Home / End / PgUp / PgDn**; on the HHKB they need Right Alt + Fn + a key, all under the right hand
  - prefer **left-hand keys** for Hyper, because the right thumb is holding Right Option
  - keep the HHKB on **Mac mode** with **SW4 and SW5 off**

## Which HHKB the user has

| Evidence | Source |
|---|---|
| Bluetooth device `HHKB-Hybrid_1`, Vendor ID `0x04FE`, Product ID `0x0021`, "Not Connected" | `system_profiler SPBluetoothDataType`, run on this Mac |
| The manual says the board advertises itself as "HHKB-Hybrid_n (n indicates a number key from 1 to 4, which is used to register pairing information)" | PFU, *Happy Hacking Keyboard Professional HYBRID User's Guide* P3PC-6641-05EN ([PDF](https://origin.pfultd.com/downloads/hhkb/manual/P3PC-6641-05EN.pdf)), "Connecting the Keyboard (via a Bluetooth Connection)" |
| Regulatory model PD-KB800. The HYBRID and the HYBRID Type-S are both in the PD-KB800 family and share this user's guide, layout and DIP switches | same manual, last page |
| Karabiner logged `HHKB-Hybrid_1 ... hid device events monitor is started (grabbed)` on 2026-10-08 and on 2026-10-12 (20:45 and 21:29) | `/var/log/karabiner/core_service.log` |

From this Mac it's not possible to tell a HYBRID from a HYBRID **Type-S**, but it doesn't matter here: the Type-S changes the switches (silenced), not the layout or the firmware modes. What does matter, and can't be detected while the board is disconnected:

- **US or JP layout.** The JP layout has a different bottom row (extra 英数/かな keys and a separate Fn). This document assumes the **US** layout. (When pairing, the manual tells you to pick "ANSI (United States and others)".)
- **DIP-switch positions** (see below).

## HHKB DIP switches (HYBRID / HYBRID Type-S / Professional Classic)

The HYBRID (P3PC-6641-05EN) and the Professional Classic ([P3PC-6661-04EN](https://www.pfuemea.com/assets/pdfs/gpsr/hhkb/hhkb-professional-classic_manual_en.pdf)) have the same table, "Switching the Setting Mode":

| SW | OFF | ON | Notes |
|---|---|---|---|
| SW1 / SW2 | OFF/OFF = **HHK mode** (factory default) | ON/OFF = Win mode; OFF/ON = **Mac mode** | "In Mac mode, ◇ functions as the [Command] key." |
| SW3 | Delete key = Delete | Delete key = BS | "In Mac mode, SW3 is disabled." |
| SW4 | Left ◇ = ◇ | **Left ◇ = Fn** | ON would cost you **left Command**. Keep it OFF. |
| SW5 | Alt and ◇ in normal places | **Alt and ◇ swapped** | ON puts Option next to Space and **Command on the outside**. Keep it OFF, or the Hyper key moves. |
| SW6 | Power saving on (HYBRID) | Power saving off | Not about modifiers. |

On the HYBRID and the Classic, `Fn + Control + M` switches to Mac mode and `Fn + Control + W` switches to Win mode without touching the DIP switches ("Switching to the Mac mode" row of the key-combination table). If the DIP switches are set for HHK mode, that mode is restored.

**Professional2** (PD-KB400, the older model) is not the user's board. PFU no longer hosts its manual, and secondary sources disagree on its SW1/SW2 table ([Deskthority talk page](https://deskthority.net/wiki/Talk:HHKB_Professional2)). For our purposes it has the same bottom row (Alt ◇ Space ◇ Alt), a SW2 "Mac mode", and the same SW4/SW5 options. This is **unconfirmed** against a PFU primary source.

## Side-by-side modifier table

The MacBook is the ANSI built-in keyboard (VID 1452 / PID 641). The HHKB is the US layout with SW4 and SW5 OFF. "Sends" is the Karabiner `key_code` the OS receives before any Karabiner rule.

| Modifier | MacBook built-in: where / sends | HHKB (Mac mode): where / sends | After Karabiner (both) |
|---|---|---|---|
| Control (left) | Caps Lock position, sends `caps_lock` → **`left_control`** via Karabiner; also a physical `left_control` at bottom-left (2nd key) | **Left of A**, sends `left_control` natively | ⌃ on the home row on both. Same place. |
| Caps Lock | Caps Lock key (remapped to ⌃) | None physical; **Fn+Tab** sends `caps_lock` | Caps Lock → ⌃ on both. **No Caps Lock on either keyboard** (already true on the MacBook). |
| Option (left) | Bottom row, 3rd from left | Bottom row, outer-left "Alt" (`left_option`) | Same relative place (outer of left ⌘) |
| Command (left) | Next to Space | "◇" next to Space (`left_command`) | Same |
| Command (right) | Next to Space | "◇" next to Space (`right_command`) | Same |
| **Option (right) = Hyper trigger** | Between right ⌘ and ← (`right_option`) | Bottom row, outer-right "Alt" (`right_option`) | **⌃⇧⌥⌘** on both. Same relative place, one key outward of right ⌘. |
| Shift L/R | Normal | Normal (right Shift is shorter; Fn sits to its right) | Same |
| Control (right) | None | None | n/a |
| Globe / fn | Bottom-left key; macOS sees `fn` | **Fn is a firmware layer.** The Mac never sees it. | **Not on the HHKB.** Don't use in Shortcuts. |
| Arrows | Physical inverted-T | **Fn + `[` `;` `'` `/`** (↑ ← → ↓) | Hyper+arrow = R-Alt + Fn + key, all under the right hand |
| F1–F12 | Top row (media by default; F-keys with fn) | **Fn + 1 … =** | Hyper+F-key needs Fn on the HHKB |

**HHK mode vs Mac mode for modifiers.** In HHK mode the board sends the standard HID usages too. ◇ is the GUI key, which macOS treats as Command, and Alt is Option. So the modifier table above holds in either mode. Mac mode changes the Fn layer's media keys and makes Delete send BS (macOS "delete"). (Manual: "Assigning the Mac OS Keys"; the [Fn] key table; footnotes \*1 and \*2.) HHK mode with SW3 OFF makes the Delete key send forward-delete, which is a typing annoyance but not a Shortcut issue.

## Do the current Karabiner rules apply to the HHKB?

`karabiner/karabiner.json` (repo) has one profile with:

- **`complex_modifications`:** one rule, Right Option → `left_control` + `left_shift` + `left_option` + `left_command` (Hyper). It has **no `conditions`**, so it applies to every grabbed keyboard. Karabiner's device conditions (`device_if` / `device_unless`) are opt-in, and the rule has none ([conditions/device docs](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/conditions/device/)).
- **Profile-level `simple_modifications`:** `caps_lock → left_control`, for all devices.
- **`devices[]`:** per-device `simple_modifications` for four devices. None of them is the HHKB (1278/33):
  - 1452/641, the Apple Internal Keyboard: caps → ctrl
  - 9639/9248, "5075BP-1" (BEKEN): caps → ctrl
  - 1452/591 and 65534/21, two other external boards: caps → ctrl plus Option/Command and Control/Caps swaps

How Karabiner combines these, from the source, [`simple_modifications_manipulator_manager.hpp`](https://github.com/pqrs-org/Karabiner-Elements/blob/main/src/apps/CoreService/include/core_service/daemon/device_grabber_details/simple_modifications_manipulator_manager.hpp):

- Each `devices[].simple_modifications` pair becomes a manipulator with a `device_if` condition for that device, and those are pushed first.
- Then the profile-level pairs are pushed **with no condition**, so they apply to every device.
- The pipeline order in [`device_grabber.hpp`](https://github.com/pqrs-org/Karabiner-Elements/blob/main/src/apps/CoreService/include/core_service/daemon/device_grabber.hpp) is simple → complex → fn_function_keys → post.

So the HHKB gets the profile-level caps → ctrl and then the Hyper rule. The device-specific Option/Command swaps do **not** touch it, which is correct: the HHKB's Mac-mode order already matches the MacBook's.

Karabiner modifies keyboards by default. Only mice are off by default: "Mice are disabled by default" ([Configure devices](https://karabiner-elements.pqrs.org/docs/manual/configuration/configure-devices/)). The log line `HHKB-Hybrid_1 ... (grabbed)` confirms that this one is grabbed.

**Is caps → ctrl redundant or harmful on the HHKB?** It is redundant, not harmful. The HHKB's Control key already sends `left_control`. The rule only turns Fn+Tab into another Control. If the user ever wants Caps Lock on the HHKB, a `devices[]` entry for 1278/33 with no caps mapping would *not* help, because profile-level pairs still apply. The profile-level pair would have to move into the per-device entries instead. Nobody has asked for this, so **no change**.

## Comfort: which combos work on both

The right thumb holds Hyper (Right Option) on both keyboards: on the MacBook it's a narrow key left of ←, and on the HHKB it's the outer-right Alt, a slightly longer thumb stretch past ◇. With that in mind:

| Combo | MacBook | HHKB | Verdict |
|---|---|---|---|
| Hyper + left-hand letter or digit (Q–T, A–G, Z–B, 1–6) | Easy | Easy | **Good on both** |
| Hyper + right-hand letter (Y–P, H–L, N–M) | OK (right hand curls) | OK, slightly worse (thumb further right) | Usable. Prefer left-hand keys. |
| Hyper + arrows | Easy-ish (right thumb + right fingers on the arrow keys) | **Awkward**: R-Alt + Fn (right of R-Shift) + `[;'/`, all right hand, or two hands | **Avoid** |
| Hyper + F-keys | Needs fn on the MacBook too (F-row is media by default) | Fn + digit + R-Alt | **Avoid** |
| ⌃ + key (home-row Control) | Left pinky on Caps | Left pinky on Control (same place) | Same on both |
| ⌥ / ⌘ / ⇧⌥ / ⌃⌥ combos (the current yabai scheme) | Left thumb/fingers | Same relative order | Same on both |
| Anything with Globe/fn (e.g. Globe+F, Globe+arrow) | Works | **Impossible** (Fn is firmware-only) | **Never use** |
| ⌃Space (Raycast), ⌘Space (input source) | Fine | Fine | Same on both |

## Does the HHKB's Fn layer clash with anything?

The Fn layer is resolved **inside the keyboard**. The Mac, and so Karabiner and skhd, receive only the resulting key code: Fn+`[` arrives as `up_arrow`, and the Fn key itself sends nothing. So there is no clash *with* a Shortcut, only reachability limits.

- **Arrows, F1–F12, Home/End/PgUp/PgDn, Ins/Del, Caps, volume/mute/eject** are all Fn-layer keys. They are listed in the manual's "How to Use the [Fn] Key" table: Fn+1…= → F1–F12, Fn+`[`/`;`/`'`/`/` → ↑/←/→/↓, Fn+K/L/,/. → Home/PgUp/End/PgDn, Fn+Tab → Caps, and Fn+A/S/D/F → Vol−/Vol+/Mute/Eject. A Shortcut on any of these costs an extra key on the HHKB.
- Some **Fn+Control+key** combos are reserved by the firmware and never reach the Mac:
  - Fn+Control+1–4: switch Bluetooth device
  - Fn+Control+0: switch to USB
  - Fn+Control+W / M: switch to Win / Mac mode
  - Fn+Q: pairing mode
  - Fn+Z+Delete: erase pairings
  - Fn+X: cancel pairing

  None of these are reachable as Shortcuts anyway, because a Mac Shortcut can't include the HHKB's Fn.
- The MacBook's top row sends media keys unless fn is held, so **F-key Shortcuts are awkward on both**. That is another reason to avoid them.

## Recommendation

1. **Change nothing in Karabiner.** Hyper (Right Option → ⌃⇧⌥⌘) and Caps → Control already behave the same on the HHKB as on the built-in keyboard, as long as the HHKB is in **Mac mode** (or HHK mode) with **SW4 OFF and SW5 OFF**.
2. In the Shortcut spec:
   - give Hyper to **letters, digits and punctuation only**, favouring **left-hand keys**
   - don't put any Shortcut on **Globe/fn**, **arrows** or **F-keys/Home/End/PgUp/PgDn** if it must work on the HHKB
   - for window moves, use letters (e.g. HJKL- or WASD-style) instead of arrows
3. Optional: if the user wants Caps Lock back on the HHKB (as Fn+Tab), move the caps → ctrl pair from the profile level into the per-device entries. Not needed today.

## Unconfirmed

- The user's HHKB variant (HYBRID or Type-S), its **layout (US/JP)**, and its **DIP-switch settings**, especially SW1/SW2 (Mac or HHK) and **SW5** (Alt/◇ swap). The board was disconnected during research. To check: connect it, open Karabiner-EventViewer, and press the outer-right bottom key. It should show `right_option`. If it shows `right_command`, SW5 is ON.
- The Professional2 DIP table (not the user's board). There is no PFU primary source online.
