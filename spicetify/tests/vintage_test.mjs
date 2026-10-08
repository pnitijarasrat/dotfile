// Checks for the Spotify Vintage theme (#53, #61, #64, #54, #55, #56, #57, #58, #59, #63).
// Run: node spicetify/tests/vintage_test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const failures = [];
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}

function eq(actual, expected, what) {
  if (actual !== expected) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const spec = read("docs/theme-spec.md");

// Every role the spec defines, with its hex, from the tables in
// docs/theme-spec.md (`role` | `#hex`).
const roles = Object.fromEntries(
  [...spec.matchAll(/`([a-z0-9_]+)`\s*\|?\s*`(#[0-9A-F]{6})`/g)].map((m) => [m[1], m[2]]),
);

// Reads an ini file into { section: { key: value } }, skipping ; comments
// (whole-line and inline).
function ini(text) {
  const out = {};
  let section = "";
  for (const line of text.split("\n").map((l) => l.trim())) {
    if (!line || line.startsWith(";")) continue;
    const head = line.match(/^\[(.+)\]$/);
    if (head) {
      section = head[1];
      out[section] ??= {};
      continue;
    }
    const kv = line.replace(/\s*;.*$/, "").match(/^([^=]+?)\s*=\s*(.*)$/);
    if (kv) (out[section] ??= {})[kv[1]] = kv[2];
  }
  return out;
}

const scheme = ini(read("spicetify/Themes/Vintage/color.ini")).Vintage ?? {};
const config = ini(read("spicetify/config-xpui.ini"));
const css = read("spicetify/Themes/Vintage/user.css");

// Every Spicetify color slot, with the spec role it takes. Spotify is one
// maximized Win95 window, so the palette is the Frame.
const slotRoles = {
  text: "frame_text",
  subtext: "frame_gray_text",
  main: "frame_face",
  "main-elevated": "frame_face",
  // Hover backgrounds: the same grey, so rows and cards don't highlight.
  highlight: "frame_face",
  "highlight-elevated": "frame_face",
  sidebar: "frame_face",
  player: "frame_face",
  card: "frame_face",
  shadow: "frame_shadow",
  "selected-row": "frame_selection",
  // Spotify green (Spicetify replaces it with these two): Win95 selection navy.
  button: "frame_selection",
  "button-active": "frame_selection",
  // Seek and volume track behind the navy fill.
  "button-disabled": "frame_light",
  // Active filter chip: a pushed-in toggle button.
  "tab-active": "frame_light",
  notification: "frame_face",
  "notification-error": "frame_data_red",
  misc: "frame_gray_text",
};

test("color scheme is a [Vintage] section", () => {
  if (!Object.keys(scheme).length) throw new Error("color.ini has no [Vintage] section");
});

test("every slot takes its spec role", () => {
  for (const [slot, role] of Object.entries(slotRoles)) {
    if (!roles[role]) throw new Error(`role ${role} is not in the spec`);
    eq(`#${(scheme[slot] ?? "").toUpperCase()}`, roles[role], `${slot} (${role})`);
  }
});

test("sets every Spicetify slot and nothing else", () => {
  eq(Object.keys(scheme).sort().join(","), Object.keys(slotRoles).sort().join(","), "color slots");
});

test("spec row gives the same slot-to-role mapping", () => {
  const row = spec.match(/^\| \*\*Spotify\*\* \|.*$/m)?.[0];
  if (!row) throw new Error("no Spotify row in the spec's Per tool table");
  // Groups in the row read "`slot`, `slot` → `role`".
  const written = {};
  for (const m of row.matchAll(/((?:`[a-z-]+`(?:, | and )?)+) → `([a-z0-9_]+)`/g)) {
    for (const slot of m[1].matchAll(/`([a-z-]+)`/g)) written[slot[1]] = m[2];
  }
  eq(JSON.stringify(written, Object.keys(written).sort()), JSON.stringify(slotRoles, Object.keys(slotRoles).sort()), "spec row mapping");
});

// The :root block of role tokens: the only place hex may appear.
const tokenBlock = css.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";

test("stylesheet has a role-token block", () => {
  if (!tokenBlock) throw new Error("no :root token block in user.css");
});

test("every hex token is named by its spec role and has its value", () => {
  const tokens = [...tokenBlock.matchAll(/--([a-z0-9_]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)];
  if (!tokens.length) throw new Error("no hex tokens");
  for (const [, name, value] of tokens) {
    if (!roles[name]) throw new Error(`--${name} is not a spec role`);
    eq(value.toUpperCase(), roles[name], `--${name}`);
  }
});

test("bevels are the --raised and --sunken tokens from docs/web-theme.md", () => {
  const squash = (s) => s.replace(/\s+/g, " ").trim();
  const bevel = (text, name) => squash(text.match(new RegExp(`--${name}:([^;]*);`))?.[1] ?? "");
  const web = read("docs/web-theme.md");
  for (const name of ["raised", "sunken"]) {
    const want = bevel(web, name);
    if (!want) throw new Error(`docs/web-theme.md has no --${name}`);
    eq(bevel(tokenBlock, name), want, `--${name}`);
  }
});

test("hex appears only in the token block", () => {
  const outside = css.replace(tokenBlock, "").match(/#[0-9A-Fa-f]{3,8}\b/g);
  if (outside) throw new Error(`hex outside the token block: ${outside.join(", ")}`);
});

// The stylesheet's rules, comments dropped, as { selector, decls: [[prop, value]] }.
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  decls: m[2]
    .split(";")
    .map((d) => d.match(/^\s*([-a-z_]+)\s*:\s*([\s\S]*?)\s*$/))
    .filter(Boolean)
    .map((d) => [d[1], d[2].replace(/\s*!important$/, "")]),
}));
const decls = rules.flatMap((r) => r.decls.map(([prop, value]) => ({ selector: r.selector, prop, value })));

// Fails with every declaration that matches.
function forbid(match) {
  const found = decls.filter(match);
  if (found.length) throw new Error(found.map((d) => `${d.selector} { ${d.prop}: ${d.value} }`).join("; "));
}

test("Purist: no rounded corners", () => {
  forbid((d) => /radius/.test(d.prop) && !/^0(px)?$/.test(d.value));
});

test("Purist: no blur, gradient or translucency, except to remove them", () => {
  // Translucent colors: rgba/hsla, slash alpha (rgb(0 0 0 / 50%)), transparent.
  const translucent = /blur|backdrop-filter|gradient|rgba|hsla|\/\s*[\d.]+%?\s*\)|transparent/;
  forbid(
    (d) =>
      (translucent.test(`${d.prop}: ${d.value}`) && d.value !== "none") ||
      (d.prop === "opacity" && !(Number(d.value) >= 1)),
  );
});

test("Purist: box-shadows are only the bevel tokens", () => {
  forbid((d) => d.prop === "box-shadow" && !["none", "var(--raised)", "var(--sunken)"].includes(d.value));
});

test("Purist: every element loses corners, blur, filters, shadows and gradients", () => {
  // Rules whose selector list reaches every element: `*`, or `*:not(...)`
  // to spare inline photos.
  const universal = rules.filter((r) => r.selector.split(",").some((s) => /^\*(:not\(.*\))?$/.test(s.trim())));
  const universalDecls = Object.fromEntries(universal.flatMap((r) => r.decls));
  const want = { "border-radius": "0", "backdrop-filter": "none", filter: "none", "box-shadow": "none", "background-image": "none", "mask-image": "none" };
  for (const [prop, value] of Object.entries(want)) eq(universalDecls[prop], value, `* { ${prop} }`);
});

test("cover-colored backgrounds Spotify sets inline become Frame grey with Frame text", () => {
  // Headers, Now Playing and the Home band take their color from the cover
  // through these inline styles.
  const hooks = {
    "background-color": ["background-color", "frame_face"],
    "--background-base": ["--background-base", "frame_face"],
    "--background-color": ["--background-color", "frame_face"],
    "--extracted-background-color": ["--extracted-background-color", "frame_face"],
    "--bg-color-from": ["--bg-color-from", "frame_face"],
    "--text-base": ["--text-base", "frame_text"],
  };
  for (const [hook, [prop, role]] of Object.entries(hooks)) {
    const rule = rules.find((r) => r.selector.includes(`[style*="${hook}"]`));
    if (!rule) throw new Error(`no rule for inline ${hook}`);
    eq(Object.fromEntries(rule.decls)[prop], `var(--${role})`, `[style*="${hook}"] ${prop}`);
  }
});

// The Frame and Work surface font stacks from docs/web-theme.md.
const squash = (s) => s.replace(/\s+/g, " ").replace(/'/g, '"').trim();
const webTheme = read("docs/web-theme.md");
const stack = (font) => squash(webTheme.match(new RegExp(`font-family: ("?${font}[^;]*);`))?.[1] ?? "");
const frameStack = stack("Microsoft Sans Serif");
const workStack = stack("Fixedsys Excelsior");

test("only the Frame and Work surface font stacks", () => {
  if (!frameStack || !workStack) throw new Error("docs/web-theme.md has no Frame or Work surface font stack");
  forbid((d) => d.prop === "font");
  // An @font-face names one family, not a stack.
  forbid((d) => d.prop === "font-family" && d.selector !== "@font-face" && ![frameStack, workStack].includes(squash(d.value)));
});

test("every element is in the Frame font at 14px", () => {
  const universal = rules.find((r) => r.selector.split(",").some((s) => s.trim() === "*") && r.decls.some(([p]) => p === "font-family"));
  if (!universal) throw new Error("no * rule sets the font");
  const d = Object.fromEntries(universal.decls);
  eq(squash(d["font-family"]), frameStack, "* font-family");
  eq(d["font-size"], "14px", "* font-size");
});

test("bold Microsoft Sans Serif is Tahoma Bold", () => {
  // The family's faces, each with its weight range, so 400 must land on
  // Microsoft Sans Serif and 600 to 900 on Tahoma Bold.
  const faces = rules
    .filter((r) => r.selector === "@font-face")
    .map((r) => Object.fromEntries(r.decls))
    .filter((f) => squash(f["font-family"] ?? "") === '"Microsoft Sans Serif"')
    .map((f) => ({ src: f.src, weights: (f["font-weight"] ?? "").split(/\s+/).map(Number) }));
  const face = (weight) => faces.find(({ weights: [lo, hi = lo] }) => lo <= weight && weight <= hi)?.src ?? "";
  if (!/^local\("Microsoft Sans Serif"\)/.test(face(400))) throw new Error(`weight 400 is ${face(400) || "no face"}`);
  for (const w of [600, 700, 800, 900]) {
    if (!/^local\("Tahoma Bold"\)/.test(face(w))) throw new Error(`weight ${w} is ${face(w) || "no face"}`);
  }
});

test("big titles are Tahoma Bold 24", () => {
  // The encore headline styles are Spotify's ~96px titles.
  const title = rules.find((r) => r.selector.split(",").some((s) => s.trim() === "[class*=encore-text-headline]"));
  if (!title) throw new Error("no rule for the encore headline styles");
  const d = Object.fromEntries(title.decls);
  eq(d["font-size"], "24px", "headline font-size");
  eq(d["font-weight"], "bold", "headline font-weight");
});

// Each rule with the comment just before it.
const commented = [...css.matchAll(/\/\*([\s\S]*?)\*\/\s*([^{}/]+)\{([^{}]*)\}/g)].map((m) => ({
  comment: m[1],
  selector: m[2].trim(),
  body: m[3],
}));

test("font sizes other than the Frame's 14px are commented deviations", () => {
  // The Work surface's own 16px, in the rule that sets its stack, is not one.
  const isWork = (d) =>
    d.value === "16px" && rules.some((r) => r.selector === d.selector && r.decls.some(([p, v]) => p === "font-family" && squash(v) === workStack));
  for (const d of decls.filter((d) => d.prop === "font-size" && d.value !== "14px" && !isWork(d))) {
    const r = commented.find((r) => r.selector === d.selector);
    if (!r || !/Deviation:/.test(r.comment)) throw new Error(`${d.selector} { font-size: ${d.value} } has no Deviation comment`);
  }
});

test("every deviation comment has a Spotify row in the spec's Deviations table", () => {
  // Comments read "Deviation: <what departs>." and the row "| Spotify | <what departs> |".
  const deviations = [...css.matchAll(/Deviation:\s*([^.]+)\./g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  if (!deviations.length) throw new Error("no Deviation comments in user.css");
  const table = spec.split(/^## Deviations$/m)[1]?.split(/^## /m)[0] ?? "";
  for (const what of deviations) {
    if (!table.includes(`| Spotify | ${what} |`)) throw new Error(`no Deviations row "| Spotify | ${what} |"`);
  }
});

// The declarations of the rule whose selector list has exactly `selector`
// (and that sets `prop`, if given).
function declsFor(selector, prop) {
  const rule = rules.find((r) => r.selector.split(",").some((s) => s.trim() === selector) && (!prop || r.decls.some(([p]) => p === prop)));
  if (!rule) throw new Error(`no rule for ${selector}${prop ? ` that sets ${prop}` : ""}`);
  return Object.fromEntries(rule.decls);
}

// Spotify's encore buttons. Primary ones (Play) paint their face on an
// inner span, so that span is the face.
const buttonFaces = [
  "[data-encore-id=buttonSecondary]",
  "[data-encore-id=buttonTertiary]",
  "[data-encore-id=buttonPrimary] > [class*=button-primary__inner]",
];

test("buttons are raised Frame push buttons", () => {
  for (const face of buttonFaces) {
    const d = declsFor(face);
    eq(d["background-color"], "var(--frame_face)", `${face} background-color`);
    eq(d.color, "var(--frame_text)", `${face} color`);
    eq(d["box-shadow"], "var(--raised)", `${face} box-shadow`);
  }
});

test("pressed buttons sink with a frame_light face", () => {
  // Disabled buttons don't sink; aria-disabled ones still match :active.
  const pressed = [
    "[data-encore-id=buttonSecondary]:active:not([aria-disabled=true])",
    "[data-encore-id=buttonTertiary]:active:not([aria-disabled=true])",
    "[data-encore-id=buttonPrimary]:active:not([aria-disabled=true]) > [class*=button-primary__inner]",
  ];
  for (const face of pressed) {
    const d = declsFor(face);
    eq(d["background-color"], "var(--frame_light)", `${face} background-color`);
    eq(d["box-shadow"], "var(--sunken)", `${face} box-shadow`);
  }
});

test("disabled buttons are opaque frame_gray_text", () => {
  const disabled = [
    "[data-encore-id^=button]:disabled",
    "[data-encore-id^=button][aria-disabled=true]",
    "[data-encore-id=buttonPrimary]:disabled > [class*=button-primary__inner]",
    "[data-encore-id=buttonPrimary][aria-disabled=true] > [class*=button-primary__inner]",
  ];
  for (const face of disabled) {
    const d = declsFor(face);
    eq(d.color, "var(--frame_gray_text)", `${face} color`);
    eq(d.opacity, "1", `${face} opacity`);
  }
});

test("icons are frame_text", () => {
  // Inside a button an icon takes the button's color (gray when disabled).
  const icon = rules.find((r) => r.selector.startsWith("[data-encore-id=icon]"));
  if (!icon) throw new Error("no rule for [data-encore-id=icon]");
  eq(Object.fromEntries(icon.decls).color, "var(--frame_text)", "icon color");
});

test("the playing track and on states are navy", () => {
  // Spotify marks them with its bright accent, the green it used to be.
  const d = declsFor(".encore-dark-theme");
  eq(d["--text-bright-accent"], "var(--frame_selection)", "--text-bright-accent");
  eq(d["--essential-bright-accent"], "var(--frame_selection)", "--essential-bright-accent");
});

// Track lists in the main view (the Library sidebar is also a grid, and
// stays Frame grey).
const trackList = "main [role=grid]";
const trackRow = `${trackList} [role=row]`;
const selectedRow = `${trackRow}[aria-selected=true]`;

test("track lists are sunken frame_window list boxes", () => {
  const d = declsFor(trackList);
  eq(d["background-color"], "var(--frame_window)", "list box background-color");
  eq(d["box-shadow"], "var(--sunken)", "list box box-shadow");
  // Hover and pressed backgrounds Spotify draws from its palette stay white.
  for (const v of ["--background-highlight", "--background-tinted-highlight", "--background-press"]) {
    eq(d[v], "var(--frame_window)", `list box ${v}`);
  }
});

test("rows don't highlight on hover", () => {
  // Pinned white whatever state the row is in, so no hover rule can tint it.
  for (const s of [trackRow, `${trackRow} > *`]) eq(declsFor(s)["background-color"], "var(--frame_window)", `${s} background-color`);
});

// Text and icon colors Spotify draws from its palette, all white on navy.
const selectionText = ["--text-base", "--text-subdued", "--text-bright-accent", "--essential-base", "--essential-subdued", "--essential-bright-accent"];

test("the selected row is frame_selection with frame_selection_text", () => {
  for (const s of [selectedRow, `${selectedRow} > *`]) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_selection)", `${s} background-color`);
    eq(d.color, "var(--frame_selection_text)", `${s} color`);
    // The playing track's navy title would vanish on navy.
    for (const v of selectionText) eq(d[v], "var(--frame_selection_text)", `${s} ${v}`);
  }
  // Every glyph in the row, Spotify's black icons included; buttons keep their faces.
  const inner = rules.find((r) => r.selector.startsWith(`${selectedRow} *`));
  if (!inner) throw new Error(`no rule for ${selectedRow} *`);
  eq(Object.fromEntries(inner.decls).color, "var(--frame_selection_text)", "selected row text color");
});

test("cards don't highlight on hover", () => {
  for (const s of ["[data-encore-id=card]", "[data-encore-id=card]:hover"]) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_face)", `${s} background-color`);
    eq(d.transform, "none", `${s} transform`);
  }
});

test("menus and dropdowns are raised Frame menus", () => {
  // The menu's own box, whatever class Spotify gives it.
  for (const s of ["[role=menu]", "[role=listbox]"]) {
    eq(declsFor(s)["background-color"], "var(--frame_face)", `${s} background-color`);
  }
  for (const s of [":has(> [role=menu])", ":has(> [role=listbox])"]) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_face)", `${s} background-color`);
    eq(d["box-shadow"], "var(--raised)", `${s} box-shadow`);
    eq(d.border, "none", `${s} border`);
  }
});

test("the hovered menu item is navy", () => {
  const hovered = [
    "[role=menu] [role^=menuitem]:hover",
    "[role=menu] [role^=menuitem]:focus",
    "[role=menu] [role^=menuitem][aria-expanded=true]",
    "[role=listbox] [role=option]:hover",
    "[role=listbox] [role=option][data-focused]",
  ];
  for (const s of hovered) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_selection)", `${s} background-color`);
    eq(d.color, "var(--frame_selection_text)", `${s} color`);
    for (const v of selectionText) eq(d[v], "var(--frame_selection_text)", `${s} ${v}`);
    const inner = declsFor(`${s} *`);
    eq(inner.color, "var(--frame_selection_text)", `${s} * color`);
  }
});

test("checked menu items aren't Spotify green", () => {
  for (const s of ["[role=menu] [role=menuitemradio][aria-checked=true]", "[role=menu] [role=menuitemcheckbox][aria-checked=true]"]) {
    eq(declsFor(s).color, "var(--frame_text)", `${s} color`);
  }
});

test("tooltips are frame_tooltip with a 1px frame_dark_shadow border", () => {
  for (const s of ["[role=tooltip]", "[class*=legacy-tooltip]", "[class*=-tooltip]:not([class*=tooltip-trigger])"]) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_tooltip)", `${s} background-color`);
    eq(d.color, "var(--frame_text)", `${s} color`);
    eq(d.border, "1px solid var(--frame_dark_shadow)", `${s} border`);
  }
});

test("scrollbars are Win95: a frame_light track and a raised frame_face thumb", () => {
  // Spotify's OverlayScrollbars, and the native ones where it has none.
  for (const s of [".os-scrollbar-track", "::-webkit-scrollbar-track"]) {
    eq(declsFor(s)["background-color"], "var(--frame_light)", `${s} background-color`);
  }
  for (const s of [".os-scrollbar-handle", "::-webkit-scrollbar-thumb"]) {
    const d = declsFor(s);
    eq(d["background-color"], "var(--frame_face)", `${s} background-color`);
    eq(d["box-shadow"], "var(--raised)", `${s} box-shadow`);
  }
});

test("focus is a 1px dotted frame_text outline inside the control", () => {
  // The browser's :focus-visible, and encore's data-focus-visible.
  for (const s of [
    "html:not(.no-focus-outline) :focus-visible:not(input):not(textarea)",
    "html:not(.no-focus-outline) [data-focus-visible]:not([data-focus-visible=false]):not(input):not(textarea)",
  ]) {
    const d = declsFor(s);
    eq(d.outline, "1px dotted var(--frame_text)", `${s} outline`);
    if (!(parseInt(d["outline-offset"], 10) < 0)) throw new Error(`${s} outline-offset ${d["outline-offset"]} is not inside the control`);
  }
  // Spotify's blue ring around the focused main view.
  eq(declsFor("html:not(.no-focus-outline) main:focus::after").outline, "none", "main view focus ring");
});

// The top bar (back, forward, Home, search) is the window's title bar.
const titleBar = ".Root__globalNav";
const inactiveTitleBar = `html.vintage-window-inactive ${titleBar}`;

test("the top bar is an active title bar", () => {
  const d = declsFor(titleBar);
  eq(d["background-color"], "var(--frame_title)", `${titleBar} background-color`);
  eq(d.color, "var(--frame_title_text)", `${titleBar} color`);
});

test("the top bar is an inactive title bar when Spotify loses focus", () => {
  const d = declsFor(inactiveTitleBar);
  eq(d["background-color"], "var(--frame_title_inactive)", `${inactiveTitleBar} background-color`);
  eq(d.color, "var(--frame_title_inactive_text)", `${inactiveTitleBar} color`);
});

test("theme.js marks the window inactive while Spotify doesn't have focus", () => {
  // Runs theme.js against a stand-in window, then moves focus away and back.
  let focused = true;
  const listeners = {};
  const classes = new Set();
  const window = { addEventListener: (type, fn) => (listeners[type] ??= []).push(fn) };
  const document = {
    hasFocus: () => focused,
    documentElement: { classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) } },
  };
  new Function("window", "document", read("spicetify/Themes/Vintage/theme.js"))(window, document);
  const fire = (type) => (listeners[type] ?? []).forEach((fn) => fn());
  const inactive = () => classes.has("vintage-window-inactive");

  eq(inactive(), false, "inactive at load, with focus");
  focused = false;
  fire("blur");
  eq(inactive(), true, "inactive after blur");
  focused = true;
  fire("focus");
  eq(inactive(), false, "inactive after focus");
  // Focus moving into a frame inside the page blurs the window, but the
  // page still has focus.
  fire("blur");
  eq(inactive(), false, "inactive after blur into a frame");
});

test("the search box is a sunken frame_window edit field", () => {
  const d = declsFor("[data-top-bar-search]");
  eq(d["background-color"], "var(--frame_window)", "search box background-color");
  eq(d.color, "var(--frame_text)", "search box color");
  eq(d["box-shadow"], "var(--sunken)", "search box box-shadow");
});

// The lyrics view, a Work surface. Both lyrics views (the full page and the
// Now Playing panel) set their cover colors inline as --lyrics-color-*.
const lyrics = '[style*="--lyrics-color-background"]';
// Spotify's hashed line classes: every line, then the current, past and
// upcoming ones.
const lyricsLine = `${lyrics} .rzOQhNuCNTsDR8rE8ss1`;
const currentLine = `${lyricsLine}.dPaa_Hg0z0Ql_UBrV9uZ`;
const pastLine = `${lyricsLine}.loNizikBbaCKyI9Gv8xg`;
const upcomingLine = `${lyricsLine}.MZZCOz_ImVH1skMtX3aI`;

test("lyrics are on a work_bg canvas, never a cover color", () => {
  const d = declsFor(lyrics);
  eq(d["--lyrics-color-background"], "var(--work_bg)", "--lyrics-color-background");
  eq(d["background-color"], "var(--work_bg)", "lyrics background-color");
  // The colors Spotify picks from the cover for the lines.
  eq(d["--lyrics-color-active"], "var(--work_fg)", "--lyrics-color-active");
  eq(d["--lyrics-color-inactive"], "var(--work_fg)", "--lyrics-color-inactive");
  eq(d["--lyrics-color-passed"], "var(--work_line_number)", "--lyrics-color-passed");
  eq(d["--lyrics-color-messaging"], "var(--work_fg)", "--lyrics-color-messaging");
});

test("lyrics are in the Work surface font at 16px, crisp and upright", () => {
  // Buttons in the view stay Frame push buttons.
  for (const s of [lyrics, `${lyrics} *:not([data-encore-id^=button]):not([data-encore-id^=button] *)`]) {
    // The canvas colors are a rule of their own.
    const d = declsFor(s, "font-family");
    eq(squash(d["font-family"]), workStack, `${s} font-family`);
    eq(d["font-size"], "16px", `${s} font-size`);
    eq(d["line-height"], "16px", `${s} line-height`);
    eq(d["font-variant-ligatures"], "none", `${s} font-variant-ligatures`);
    eq(d["font-synthesis"], "none", `${s} font-synthesis`);
    eq(d["font-style"], "normal", `${s} font-style`);
  }
});

test("the current lyrics line is work_fg on a work_cursorline band", () => {
  const d = declsFor(currentLine);
  eq(d.color, "var(--work_fg)", "current line color");
  eq(d["background-color"], "var(--work_cursorline)", "current line background-color");
});

test("past lyrics lines are opaque work_line_number, upcoming ones work_fg", () => {
  const past = declsFor(pastLine);
  eq(past.color, "var(--work_line_number)", "past line color");
  // Spotify fades past lines to 50%.
  eq(past.opacity, "1", "past line opacity");
  eq(declsFor(upcomingLine).color, "var(--work_fg)", "upcoming line color");
  // Hovering a past line, which seeks to it, brings it back to work_fg.
  eq(declsFor(`${pastLine}:hover`).color, "var(--work_fg)", "hovered past line color");
});

// The player bar, a Media Rack unit (#63): LCD displays over a row of
// transport buttons.
const rack = "[data-testid=now-playing-bar]";
const trackLcd = "[data-testid=now-playing-widget] > div:nth-child(2)";
const timeLcd = "[data-testid=player-controls] > div:last-child";
const rackButton = `${rack} button:not([data-testid=cover-art-button])`;

test("the spec's Display roles are VGA values, and the stylesheet's tokens", () => {
  const vga = { display_bg: "ansi_0", display_fg: "ansi_14", display_ghost: "ansi_6" };
  for (const [role, ansi] of Object.entries(vga)) {
    if (!roles[role]) throw new Error(`role ${role} is not in the spec`);
    eq(roles[role], roles[ansi], `${role} (${ansi})`);
    if (!new RegExp(`--${role}:`).test(tokenBlock)) throw new Error(`--${role} is not in the token block`);
  }
});

test("CONTEXT.md defines Display, and an ADR says why", () => {
  if (!/^\*\*Display\*\*:$/m.test(read("CONTEXT.md"))) throw new Error("CONTEXT.md has no **Display** entry");
  read("docs/adr/0002-display-surface.md");
});

test("the rack is a raised frame_face panel", () => {
  const d = declsFor(rack);
  eq(d["background-color"], "var(--frame_face)", "rack background-color");
  eq(d["box-shadow"], "var(--raised)", "rack box-shadow");
});

test("the time and track LCDs are sunken display_bg", () => {
  const d = declsFor(trackLcd, "background-color");
  if (!rules.some((r) => r.selector.split(",").map((s) => s.trim()).includes(timeLcd) && r.decls.some(([p]) => p === "background-color"))) {
    throw new Error("the time LCD has no background");
  }
  eq(d["background-color"], "var(--display_bg)", "LCD background-color");
  eq(d["box-shadow"], "var(--sunken)", "LCD box-shadow");
});

test("LCD text is display_fg in the Work surface font at 16px", () => {
  for (const s of [`${trackLcd} *`, "[data-testid=playback-position]"]) {
    const d = declsFor(s, "font-family");
    eq(squash(d["font-family"]), workStack, `${s} font-family`);
    eq(d["font-size"], "16px", `${s} font-size`);
    eq(d.color, "var(--display_fg)", `${s} color`);
    eq(d["font-synthesis"], "none", `${s} font-synthesis`);
  }
});

test("unlit 88:88 ghost segments sit behind the time", () => {
  const d = declsFor("[data-testid=playback-position]::before");
  eq(d.content, '"88:88"', "ghost content");
  eq(d.color, "var(--display_ghost)", "ghost color");
});

test("transport buttons are square raised push buttons, Play the same size", () => {
  const d = declsFor(rackButton);
  eq(d["background-color"], "var(--frame_face)", "button background-color");
  eq(d["box-shadow"], "var(--raised)", "button box-shadow");
  eq(d.color, "var(--frame_text)", "button color");
  const pressed = declsFor(`${rackButton}:active`);
  eq(pressed["background-color"], "var(--frame_light)", "pressed background-color");
  eq(pressed["box-shadow"], "var(--sunken)", "pressed box-shadow");
  // No rule sizes Play apart from the rest, and its big circle is gone.
  forbid((d) => d.selector.includes("control-button-playpause") && /^(min-)?(width|height)$/.test(d.prop) && d.value !== "auto");
  const play = declsFor("[data-testid=control-button-playpause] > span");
  eq(play["background-color"], "var(--frame_face)", "Play face background-color");
});

test("shuffle, repeat and liked have an LED: frame_shadow off, frame_data_green on", () => {
  const off = [
    `${rack} button[aria-label*=huffle]::before`,
    "[data-testid=control-button-repeat]::before",
    "[data-testid=now-playing-widget] > div:nth-child(3) button::before",
  ];
  const on = [
    `${rack} button[aria-label^="Disable Shuffle"]::before`,
    // Repeat one is mixed.
    "[data-testid=control-button-repeat][aria-checked=true]::before",
    "[data-testid=control-button-repeat][aria-checked=mixed]::before",
    "[data-testid=now-playing-widget] > div:nth-child(3) button[aria-checked=true]::before",
  ];
  for (const s of off) eq(declsFor(s)["background-color"], "var(--frame_shadow)", `${s} background-color`);
  for (const s of on) eq(declsFor(s)["background-color"], "var(--frame_data_green)", `${s} background-color`);
});

test("the seek bar is a sunken track with a frame_selection fill", () => {
  const track = declsFor("[data-testid=playback-progressbar] [data-testid=progress-bar-background]");
  eq(track["box-shadow"], "var(--sunken)", "seek track box-shadow");
  const fill = declsFor("[data-testid=playback-progressbar] [data-testid=progress-bar-background] > div:nth-child(3) > div");
  eq(fill["background-color"], "var(--frame_selection)", "seek fill background-color");
});

test("volume is a Win95 slider: a raised frame_face thumb in a sunken slot", () => {
  const slot = declsFor("[data-testid=volume-bar] [data-testid=progress-bar-background]");
  eq(slot["box-shadow"], "var(--sunken)", "volume slot box-shadow");
  const thumb = declsFor("[data-testid=volume-bar] [data-testid=progress-bar-handle]");
  eq(thumb["background-color"], "var(--frame_face)", "volume thumb background-color");
  eq(thumb["box-shadow"], "var(--raised)", "volume thumb box-shadow");
});

test("config selects Vintage with the color scheme, CSS and theme.js injection on", () => {
  const s = config.Setting ?? {};
  eq(s.current_theme, "Vintage", "current_theme");
  eq(s.color_scheme, "Vintage", "color_scheme");
  eq(s.inject_css, "1", "inject_css");
  eq(s.inject_theme_js, "1", "inject_theme_js");
  eq(s.replace_colors, "1", "replace_colors");
});

test("no Marketplace, extensions or custom apps", () => {
  const a = config.AdditionalOptions ?? {};
  eq(a.extensions, "", "extensions");
  eq(a.custom_apps, "", "custom_apps");
});

test("Spicetify's generated folders are gitignored", () => {
  const ignore = read(".gitignore").split("\n");
  for (const dir of ["Backup", "Extracted", "CustomApps", "Extensions"]) {
    if (!ignore.includes(`spicetify/${dir}/`)) throw new Error(`spicetify/${dir}/ is not in .gitignore`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
