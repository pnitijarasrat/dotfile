# The Switch sets macOS's appearance, accent and highlight directly

ADR 0006 has each tool load the active **Theme** from a git-ignored pointer over a committed default. macOS has no config file in the repo to hold either: its appearance (light or dark), accent and highlight color are per-user settings in System Settings → Appearance. So each **Theme source file** declares them in `macos` (`appearance`, `accent`, `highlight`), and `theme <name>` writes them straight into macOS (#138):

- `defaults write -g AppleAccentColor` and `AppleAquaColorVariant` for the accent, and `AppleHighlightColor` for the highlight, with the values System Settings itself writes. Then a distributed notification tells running apps to repaint, as System Settings does.
- System Events' `appearance preferences` for light or dark, which applies at once. It needs the terminal to have Automation permission for System Events; macOS asks on the first Switch.

macOS only offers its own named accents and highlights, so a Theme picks one by name, not by role hex.

This doesn't undo ADR 0004's rejection of "Switch with macOS appearance". That option had macOS's light or dark mode choose the Theme. Here the Theme chooses macOS's mode, and a Switch is still made only with `theme <name>`.

## Considered options

- **Leave macOS out, set by hand**, as Chrome's printed step (ADR 0009): rejected; unlike Chrome, there is a supported route, and a dark macOS around a light Theme breaks "tools never mix Themes" (ADR 0004).
- **A custom highlight from a role hex** (`AppleHighlightColor` takes any color as "Other"): rejected for now; macOS keeps the text color under its highlight, so a Theme's selection color is often unreadable there, and named colors keep every Theme's choice to System Settings' own list.

## Consequences

- No committed default: a fresh checkout leaves macOS as it is until the first Switch.
- The source file is checked before anything is written, so a Theme with a missing or unknown `macos` fails the Switch and changes nothing. A macOS command that fails after that, such as System Events being refused, is printed but doesn't undo the rest of the Switch.
- A Mac set to Auto appearance flips back at its next automatic change; the Switch doesn't turn Auto off.
- The Switch test stubs every macOS command, so running it never changes the Mac it runs on.
