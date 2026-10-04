# Light K-95-style Work surface, with no dark variant

The **Work surface** was a TC2000-style dark canvas: soft IBM 5153 colors on black, with bold drawn bright. We replaced it with a light, K-95-style canvas (Kermit 95 on Windows: navy text on white, Windows VGA colors) and kept no dark variant: the Work surface doesn't switch with macOS appearance. Role names stay the same; only their values change, and the **Frame** is untouched (#43).

Bold is no longer bright. On white, the bright VGA yellow, green, cyan and white can't be read as text, so bold-as-bright would make bold text vanish. Synthetic bold stays off, so bold looks the same as normal text; emphasis comes from color, as in K-95.

## Considered options

- **Keep the dark TC2000 Work surface**: rejected; we want the light K-95 look.
- **Keep both and switch with macOS appearance**: rejected; every Work surface tool would need two palettes and two sets of tests, and the **Vintage theme** has one look.

## Consequences

- Ghostty, Neovim and VSCode have to be re-themed (#44, #45, #46). Until they are, their files don't match the spec, and the VSCode test, which reads the spec's values, fails.
- litecli needs a light Pygments style.
- Several VSCode deviations that only existed because of the black `work_bg` go away (icons, links), and the Ghostty bold-is-bright deviation goes with bold-as-bright.
