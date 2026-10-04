# Theming a web app with the Vintage theme

Hand-off for an agent re-theming a web app (any framework) to the **Vintage theme**. You work in the app's repo; this file and the spec live in the dotfiles repo at `~/.config`.

Read these first, in full:

- `~/.config/docs/theme-spec.md`: the **Theme spec**, the only source of hex values, fonts and **Purist fidelity**. If the local file is missing, use `https://raw.githubusercontent.com/pnitijarasrat/dotfile/main/docs/theme-spec.md`.
- `~/.config/CONTEXT.md`: the vocabulary (**Frame**, **Work surface**, **Frame data colors**). Use these words in your code comments and report.

Take every hex value from the spec's tables. This file decides _where_ each role goes in a web app; the spec decides _what color_ it is.

## The model: the app is a maximized Win95 window

The viewport is one maximized window, so almost everything is **Frame**. Name each element by what it means in Win95 terms, then take that element's role:

| Web element | Win95 meaning | Roles |
|---|---|---|
| `body`, toolbars, sidebars, nav, footers, cards, panels | window face | `frame_face`, text `frame_text` |
| app header / top bar | active title bar | `frame_title`, text `frame_title_text` |
| modal and dialog | a child window: title bar on top, face below | title `frame_title` / `frame_title_text`; body `frame_face` |
| unfocused dialog behind another | inactive title bar | `frame_title_inactive` / `frame_title_inactive_text` |
| text inputs, textareas, selects, list boxes, table bodies, document content | edit fields and lists | `frame_window`, text `frame_text`, **sunken** bevel |
| buttons | push button | `frame_face`, text `frame_text`, **raised** bevel; pressed: **sunken**, face `frame_light` |
| menus, dropdowns, popovers, command palettes, toasts | menus and pickers | `frame_face`, `frame_text`, **raised** bevel; hovered/active item `frame_selection` / `frame_selection_text` |
| selected rows, active nav item, `::selection` | selected item | `frame_selection` / `frame_selection_text` |
| disabled controls, placeholders, secondary text, captions | gray text | `frame_gray_text` |
| tooltips | tooltip | `frame_tooltip`, text `frame_text`, 1px `frame_dark_shadow` border |
| scrollbars | scrollbar | track `frame_light`, thumb `frame_face` with **raised** bevel |
| tabs | tab control | `frame_face`; active tab joins its panel, others sit lower |
| status, badges, error/success/warning text, chart series | data on Frame grey | **Frame data colors** (`frame_data_red`, `frame_data_green`, ...); never the Work surface brights |
| links | links on Frame | `frame_data_blue` |
| page behind a centered card (login, empty state, 404) | the Classic desktop | `frame_desktop`, text `frame_desktop_text`; the card is a dialog |
| code blocks, terminals, log viewers, embedded editors, JSON/diff views | **Work surface** | `work_bg`, `work_fg`, `work_selection` / `work_selection_text`, line numbers `work_line_number`, rules `work_grid`; highlighting from the spec's Syntax roles; 1px `work_popup_border` around inline code popups |

An element that fits no row: pick the nearest Win95 meaning, apply its roles, and list it in your report. Chrome's New Tab page (`frame_desktop` with `frame_desktop_text`) is the built precedent for the Classic desktop.

### Bevels

The spec's bevel roles are the four Win95 edges. Draw them with hard `box-shadow` insets (no blur):

```css
--raised: inset -1px -1px var(--frame_dark_shadow), inset 1px 1px var(--frame_highlight),
          inset -2px -2px var(--frame_shadow), inset 2px 2px var(--frame_light);
--sunken: inset -1px -1px var(--frame_highlight), inset 1px 1px var(--frame_shadow),
          inset -2px -2px var(--frame_light), inset 2px 2px var(--frame_dark_shadow);
```

Focus: a `1px dotted var(--frame_text)` outline inset inside the control, as Win95 draws it.

## Steps

1. **Inventory.** Find every place the app sets a color, font, radius, shadow, opacity or blur: stylesheets, CSS-in-JS, Tailwind classes and config, component-library theme objects (MUI `createTheme`, shadcn/Radix CSS variables, Chakra, Bootstrap Sass variables), inline `style`, SVG `fill`/`stroke`, `<meta name="theme-color">`, and canvas/chart configs. Done when you have a list of files and a list of every distinct value.
2. **Tokens.** Add one global block of CSS custom properties, one per spec role, named exactly by role (`--frame_face`, `--work_bg`, `--frame_data_red`, ...), plus `--raised` and `--sunken`. Copy values from the spec's tables. If the app has a theme config (Tailwind `theme.colors`, a library theme object, existing CSS variables), point that config at these properties so components pick them up through the library rather than through overrides. Done when every role you will use exists exactly once.
3. **Map.** Go through the inventory and replace every value with a role token chosen from the table above. Done when a search for raw colors outside the token block (`#[0-9a-fA-F]{3,8}\b`, `rgb(`, `rgba(`, `hsl(`, named colors like `white`/`gray`, Tailwind palette classes like `bg-gray-100`, `text-blue-600`) finds nothing.
4. **Purist fidelity.** Across the whole app: `border-radius: 0`; every `box-shadow` is a hard inset bevel or nothing; no `opacity` below 1 on surfaces, no `backdrop-filter`, no `rgba`/`transparent` overlays (a modal's backdrop is no backdrop, or `frame_desktop`); no gradients; no icon fonts and no emoji (use plain characters or small pixel PNG/SVG icons). Set `color-scheme: light` and `accent-color: var(--frame_selection)` so native checkboxes, radios and date pickers follow. Remove dark-mode variants: the theme has one look. Done when searches for `border-radius`, `rounded`, `blur`, `opacity`, `gradient`, `shadow` and `dark:` turn up only the bevels.
5. **Fonts.**
   - Frame: `font-family: "Microsoft Sans Serif", Tahoma, sans-serif; font-size: 14px;`. Where the design needs bold, use `Tahoma` bold, since Microsoft Sans Serif has none.
   - Work surface: copy `~/.config/fonts/FSEX302.ttf` (Fixedsys Excelsior, CC0) into the app's static assets, load it with `@font-face`, and use `font-family: "Fixedsys Excelsior", Menlo, Thonburi, monospace; font-size: 16px; line-height: 16px;`. Its em is 16 px, so it is crisp only at multiples of 8px. Set `font-variant-ligatures: none` and `font-synthesis: none`.
   - No italics on the Work surface: syntax comments and `em` inside code are `font-style: normal`.
   Done when every `font-family` in the app is one of these two stacks.
6. **Verify in a browser.** Run the app and visit every route, and open every dialog, menu, toast, tooltip, error state, empty state and form-validation state you found in step 1. Done when each one shows only spec roles, square corners and opaque surfaces, and text reads clearly on its background (4.5:1 contrast or better).

## Departing from the spec

Where the app forces a departure (a third-party widget you can't style, a brand color that must stay, a library that won't take a token), put a comment at that spot naming the role you wanted and why it couldn't be used, as the spec's Deviations require. If a part can't be changed at all, it is a known exception: leave it and say so.

## Report

End with:
- the surfaces you classified as Work surface;
- elements that fit no row of the table, and the role you gave each;
- every departure from the spec and every known exception, with file and line;
- the routes and states you checked in the browser.
