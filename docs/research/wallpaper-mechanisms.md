# Setting the wallpaper from a CLI on macOS 14.1 (Sonoma)

Research for [#100](https://github.com/pnitijarasrat/dotfile/issues/100), part of map [#99](https://github.com/pnitijarasrat/dotfile/issues/99) (wallpaper CLI with `set` and `random`).
Researched 2026-10-11 on this Mac: macOS 14.1 (23B74), Apple M1, one display (built-in), Swift 5.10 (Command Line Tools, no Xcode).

## TL;DR

- Every mechanism, including `desktoppr` and `wallpaper` (Homebrew), ends up calling the same public API, `NSWorkspace.setDesktopImageURL(_:for:options:)`. The only exception is System Events, and it offers fewer options. A third-party tool adds nothing that roughly 50 lines of Swift can't do.
- **Displays:** all of them work. Loop over `NSScreen.screens`, or use `every desktop` in System Events.
- **Spaces:** none of the public APIs can target a Space you aren't on. Sonoma added a "Show on all Spaces" mode, and with it on, a programmatic set *may* reach every Space. That is **not confirmed on 14.1** (see [Unconfirmed](#unconfirmed)).
- **Centering works.** `imageScaling = NSImageScaling.scaleNone` (2) with `allowClipping = false` gives Center.
- **The background colour is broken on macOS 14.x.** `fillColor` is ignored and reset to a default blue. Reading it back returns nothing. Apple fixed this in macOS 15.4. The workaround is to composite the image onto a canvas of the colour first.
- **Reading the current wallpaper works** with `NSWorkspace.desktopImageURL(for:)` or System Events `picture of every desktop`.
- **Recommendation:** a small Swift program that uses NSWorkspace and is compiled with `swiftc` at install time. It should composite "image centred on a background colour" itself, rather than relying on `fillColor`.

## The mechanisms

### 1. `osascript` and System Events

The dictionary is in `/System/Library/CoreServices/System Events.app/Contents/Resources/SystemEvents.sdef`, read on this Mac. The `desktop` class ("desktop picture settings") has these properties:

- `picture`, `pictures folder`, `picture rotation`, `change interval`, `random order`, `display name`, `dynamic style` and `translucent menu bar`.
- **No scaling, clipping or colour property.** System Events can't centre an image or set the background colour.
- One `desktop` element per **display**. `current desktop` is "the primary desktop". So `tell every desktop to set picture to …` covers every display.
- There is nothing for Spaces. A Feb 2026 Apple forum thread asks for exactly this and has no answer ([forums/784381](https://developer.apple.com/forums/thread/784381)).
- Finder's `desktop picture` property covers only "the desktop picture of the main monitor" (`Finder.sdef`), so it is worse.

On Spaces, there is one forum report, on macOS Tahoe rather than Sonoma ([forums/814926](https://developer.apple.com/forums/thread/814926)):

- `tell every desktop to set picture` with "Show on all Spaces" ON worked on all Spaces the first time.
- After that, System Settings switched "Show on all Spaces" OFF, and later runs updated only the active Space.
- No one has answered the thread.

Reading works:

```sh
osascript -e 'tell application "System Events" to get picture of every desktop'
```

On this Mac it returned `/Users/puriwat.n/docs/win 95 wallpaper/HUTCettXQAAdh_f.jpeg` in about 0.10 s.

Permissions:

- Sending Apple Events to System Events is gated by **Automation** consent. The first use from each host app (Ghostty, iTerm2, Raycast …) shows an "Allow" dialog. Later changes are made under System Settings > Privacy & Security > Automation ([Apple: Allow apps to control your Mac](https://support.apple.com/guide/mac-help/allow-apps-to-control-your-mac-mchl108e1718/mac)).
- My read from this session didn't trigger a prompt. Consent may already have been granted to this host, so I couldn't observe the first-run prompt.

### 2. Swift `NSWorkspace`, the public AppKit API

Sources: the Apple docs for [`setDesktopImageURL(_:for:options:)`](https://developer.apple.com/documentation/appkit/nsworkspace/setdesktopimageurl(_:for:options:)), [`desktopImageURL(for:)`](https://developer.apple.com/documentation/appkit/nsworkspace/desktopimageurl(for:)), [`desktopImageOptions(for:)`](https://developer.apple.com/documentation/appkit/nsworkspace/desktopimageoptions(for:)) and [`DesktopImageOptionKey`](https://developer.apple.com/documentation/appkit/nsworkspace/desktopimageoptionkey), plus `AppKit.framework/Headers/NSWorkspace.h` in the SDK on this Mac.

What the API offers:

- **Per screen:** `setDesktopImageURL(url, for: NSScreen, options:)`. You loop over `NSScreen.screens` for every display. It "must be called from your app's main thread"; top-level code in a script or `main.swift` already runs there.
- **No Space parameter.** The header and docs never mention Spaces.
- **Not for off-screen Spaces.** Both tool authors say the API can't reach Spaces you aren't on, and that it only affects the active Space:
  - desktoppr: [#2](https://github.com/scriptingosx/desktoppr/issues/2), [#8](https://github.com/scriptingosx/desktoppr/issues/8), [#27](https://github.com/scriptingosx/desktoppr/issues/27) ("the api that desktoppr is using doesn't provide that option") and [#34](https://github.com/scriptingosx/desktoppr/issues/34) ("Apple provides no API for manipulating spaces/multiple desktops").
  - sindresorhus/macos-wallpaper: [#4](https://github.com/sindresorhus/macos-wallpaper/issues/4) and [#23](https://github.com/sindresorhus/macos-wallpaper/issues/23) ("practically impossible … listening to space changes … doesn't work for a short-running command-line tool").
  - Those reports are mostly pre-Sonoma. For Sonoma's "Show on all Spaces" mode, see [Unconfirmed](#unconfirmed).

Options, quoted from the docs and header:

- `imageScaling` takes an `NSImageScaling`. The default is `scaleProportionallyUpOrDown`, and `scaleProportionallyDown` isn't supported.
  - **Centre with no scaling is `scaleNone` (2).** desktoppr's source maps `center` to 2, `stretch` to 1, `fit` to 3, and `fill` to "key absent" ([main.swift](https://github.com/scriptingosx/desktoppr/blob/main/desktoppr/main.swift)).
  - macos-wallpaper sends `.center` as `scaleNone` with `allowClipping = false` ([Wallpaper.swift](https://github.com/sindresorhus/macos-wallpaper/blob/main/Sources/wallpaper/Wallpaper.swift)).
- `allowClipping` takes a Bool and only affects the proportional scaling modes.
- `fillColor` takes an `NSColor` that fills any empty space. It must be convertible to calibrated RGB, and alpha is ignored.

**Sonoma bug: `fillColor` is broken on 14.x**

- [desktoppr #22](https://github.com/scriptingosx/desktoppr/issues/22) (author, tested 14.0–14.2, Apple feedback FB13463850):
  - `desktoppr color` always returns "cannot get color".
  - Setting a colour resets it to the default macOS blue.
  - Changing the scaling *also* resets the colour to blue, because the options are rewritten.
  - Closed with "Fixed by Apple in macOS 15.4". The desktoppr README says the same.
- [macos-wallpaper #41](https://github.com/sindresorhus/macos-wallpaper/issues/41): the maintainer calls it "a macOS 14 bug". [#43](https://github.com/sindresorhus/macos-wallpaper/issues/43) reports that every colour comes out `#5372A4` on 14.1.2.
- [pascalpp/current-desktop-color](https://github.com/pascalpp/current-desktop-color): `setDesktopImageURL` "seems to ignore the `fillColor` option and always sets the fill color to some default blue". Reading it back gives `fillColor: nil`.
- **Seen on this Mac.** `desktopImageOptions(for:)` returns only `[NSWorkspaceDesktopImageScalingKey: 2]`, with no fill colour. Yet Sonoma's own store (below) holds a teal `backgroundColor` (≈ `#0E6E6D`) for the same wallpaper. Reading is broken too.

Other known problems:

- **Same path, new content.** Setting the same path again after changing the file is a no-op. macos-wallpaper works around it by first setting an empty URL, then sleeping 0.4 s (`forceRefreshIfNeeded` in Wallpaper.swift). Reports: [desktoppr #37](https://github.com/scriptingosx/desktoppr/issues/37), [macos-wallpaper #44](https://github.com/sindresorhus/macos-wallpaper/issues/44) (14.2.1, "unable to change wallpaper for second time").
  - **Use a unique filename for every generated image.**
- **Several set calls in a row may not "take".** The desktoppr README recommends a `sleep 1` between calls. So set the image and its options in **one** call.
- **Scaling seems to be stored per image.** Changing the image can bring back an older scaling ([desktoppr #38](https://github.com/scriptingosx/desktoppr/issues/38), 2026). Always pass the full options dictionary on every set.
- **Full-screen apps.** If a full-screen app is in front on a display, the set goes to that full-screen Space. The normal desktop keeps the old image ([desktoppr #17](https://github.com/scriptingosx/desktoppr/issues/17), [macos-wallpaper #49](https://github.com/sindresorhus/macos-wallpaper/issues/49)). That matters if you run the CLI from a full-screen terminal.
- **Rotating folders.** When the wallpaper is set to a rotating folder, `desktopImageURL` returns the folder, not the current image ([desktoppr #20](https://github.com/scriptingosx/desktoppr/issues/20), [macos-wallpaper #42](https://github.com/sindresorhus/macos-wallpaper/issues/42)). This doesn't apply here because the CLI always sets a single file.

Reading the current wallpaper with `desktopImageURL(for:)`:

- Run as `swift read.swift` on this Mac, it printed the same JPEG path as System Events.
- If the CLI sets a *generated* image (see the recommendation), this returns the generated file, not the source. `random` then has to map back to the source, for example by encoding it in the generated filename or a state file.

Permissions:

- No Automation (Apple Events) consent is involved, because this is an in-process AppKit call.
- Reading triggered no prompt here.
- desktoppr is widely deployed via MDM with no PPPC entry other than login-item approval for its LaunchAgent (README).
- I did *not* test setting (the brief said not to change the wallpaper).

### 3. Third-party tools (both thin wrappers over NSWorkspace)

| | `desktoppr` (scriptingosx) | `wallpaper` (sindresorhus/macos-wallpaper) |
|---|---|---|
| Install | `brew install --cask desktoppr`: a signed **.pkg** into `/usr/local/bin`. It needs an admin password, and you uninstall with `pkgutil` ([cask JSON](https://formulae.brew.sh/api/cask/desktoppr.json), v0.5) | `brew install wallpaper`: a formula with an arm64_sonoma bottle, v2.3.4 ([formula JSON](https://formulae.brew.sh/api/formula/wallpaper.json)) |
| All displays | Yes, the default (README) | Yes, the default (`--screen all`) |
| Other Spaces | No (#2, #8, #27, #34) | No (#4, #23). #45 asks for "Show on all spaces" and is open |
| Centre | `desktoppr scale center` (a separate command) | `wallpaper set img --scale center` |
| Background colour | `desktoppr color RRGGBB`, **broken on 14.x** (#22) | `--fill-color`, **broken on 14.x** (#41, #43) |
| Solid colour | No direct verb | `set-solid-color RRGGBB`: system `Transparent.tiff` + `fillColor`, so **broken on 14.x** (always blue) |
| Read current | `desktoppr` with no arguments | `wallpaper get` (falls back to `desktoppicture.db` for folders) |
| Startup | Compiled binary | Compiled binary |

Neither gets around the Sonoma bugs, because both call the same API. desktoppr also needs separate commands, with sleeps between them, to set the image and its scaling.

## Sonoma's wallpaper store (context, undocumented)

On 14.x, wallpaper state lives in `~/Library/Application Support/com.apple.wallpaper/Store/Index.plist`, managed by `WallpaperAgent`. On this Mac, `~/Library/Application Support/Dock/desktoppicture.db` was last modified in Nov 2023, which is when Sonoma was installed, and has been stale since. An Apple forum thread notes the database is no longer used under Sonoma ([forums/761394](https://developer.apple.com/forums/thread/761394)).

This Mac's `Index.plist` (read with `plutil`):

- `AllSpacesAndDisplays.Desktop` holds the current JPEG, provider `com.apple.wallpaper.choice.image`.
- `Displays` and `Spaces` are both **empty**. That is what "Show on all Spaces" ON looks like.
- The `Configuration` blob decodes to `{placement: 3, backgroundColor: {components: [0.054, 0.431, 0.426, 1], GenericRGB}}`. Here placement 3 means Center, the value NSWorkspace reports as `imageScaling` 2.

The format isn't documented and changes between releases (macos-wallpaper's README says `desktoppicture.db` no longer works on macOS 26). **Don't write to it.** It is useful only as a diagnostic when testing.

Apple's Wallpaper help for 14.0 says: "Turn on 'Show on all Spaces' to use the same wallpaper on every desktop space and display" ([Wallpaper settings, macOS 14](https://support.apple.com/guide/mac-help/mchlp1103/14.0/mac/14.0)). It doesn't say how programmatic sets behave in that mode.

## Solid colour with no image

There are three options:

- **System colours.** Apple's built-in solid colours are small opaque PNGs, for example `/System/Library/Desktop Pictures/Solid Colors/Teal.png` at 128×128.
- **Transparent image + `fillColor`.** This is what `wallpaper set-solid-color` does. It is broken on 14.x.
- **Generate an opaque PNG yourself.** This is the approach that works on 14.1.
  - With "always center" (#99), a 1×1 image would show a single pixel on a blue field. Either generate it **at the screen's pixel size** (the largest `NSScreen.frame × backingScaleFactor` across displays) and set it centred, or set the small image with `scaleAxesIndependently` (stretch).
  - Generating at screen size keeps the "always centre" rule.

## Background colour around a centred image (workaround for 14.x)

Since `fillColor` is broken until 15.4:

1. Composite the source image, unscaled and centred, onto a canvas filled with the background colour. Use CoreGraphics / `NSBitmapImageRep`.
2. Write it as a PNG with a unique name in a cache directory, for example `~/Library/Caches/<tool>/`.
3. Set it with `imageScaling = scaleNone`, `allowClipping = false`.

Size the canvas to the largest display. Centre mode crops a larger canvas evenly on smaller displays, so the image stays centred on every display. On 15.4+ you could pass `fillColor` instead, but compositing works on both.

## Startup time (measured on this Mac, M1, Swift 5.10 CLT)

| How | Time |
|---|---|
| `swift read.swift`, first ever run (module cache cold) | **7.1 s** |
| `swift read.swift`, warm | 0.20–0.23 s |
| `swiftc -O read.swift`, one-off compile | 3.7 s |
| Compiled binary | 0.03 s (0.59 s the very first launch) |
| `osascript` System Events read | 0.10 s |

`swift` needs the Command Line Tools, which are already installed (`swift --version` shows 5.10). A compiled binary needs nothing at run time. The interpreter's cold start comes back whenever the module cache is invalidated, for example after a CLT update.

## Recommendation for #99

- **Use NSWorkspace from a small Swift program, compiled with `swiftc -O` by the README install step.** It is all built in and has no Automation prompt. It is about 7× faster than the warm interpreter and avoids the 7 s cold start.
  - Running it as a `swift` script also works if one fewer install step matters more than 0.2 s.
  - Skip desktoppr and `wallpaper`: they add an install step and have the same bugs.
  - Skip System Events: it can't centre or set colours, and it needs an Automation grant per host app.
- **`set <image>`**
  - Loop over every `NSScreen` in one `setDesktopImageURL` call per screen, with `[.imageScaling: NSImageScaling.scaleNone.rawValue, .allowClipping: false]`.
  - If a background colour is wanted, composite it onto a canvas first (above), and don't rely on `fillColor` on 14.x.
- **`set <color>`**: generate a screen-sized opaque PNG with a unique name, then set it the same way.
- **`random <folder>`**: compare candidates against `desktopImageURL(for:)`. If the CLI sets generated or composited files, record the source path in the filename or a small state file so it can be compared.
- **Spaces**: document "keep 'Show on all Spaces' ON in System Settings". Also document that a full-screen app in front means you should exit full screen first.

## Unconfirmed

- **Whether `setDesktopImageURL` with "Show on all Spaces" ON updates every Space on 14.1.** It is also unconfirmed whether the set switches that toggle off, as reported for System Events on Tahoe ([forums/814926](https://developer.apple.com/forums/thread/814926)). No primary source covers Sonoma's behaviour.
  - Suggested manual test: with two Spaces and the toggle ON, set from Space 1, switch to Space 2, then re-read `Index.plist`. Check whether entries appear under `Spaces`/`Displays` and whether the toggle is still on.
- **Whether `setDesktopImageURL` ever triggers a TCC prompt.** Setting wasn't run, by instruction. Reading triggered none.
- **The first-run Automation prompt for System Events from this host.** It wasn't observed; consent may already exist.
- **Multi-display behaviour.** Only one display was connected, so this is from documentation and issue reports only.
