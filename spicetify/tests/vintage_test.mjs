// Checks for the Spotify Vintage theme (#53, #61, #64, #54, #55, #56).
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
  for (const d of decls.filter((d) => d.prop === "font-size" && d.value !== "14px")) {
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

// The declarations of the rule whose selector list has exactly `selector`.
function declsFor(selector) {
  const rule = rules.find((r) => r.selector.split(",").some((s) => s.trim() === selector));
  if (!rule) throw new Error(`no rule for ${selector}`);
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

test("config selects Vintage with the color scheme and CSS injection on", () => {
  const s = config.Setting ?? {};
  eq(s.current_theme, "Vintage", "current_theme");
  eq(s.color_scheme, "Vintage", "color_scheme");
  eq(s.inject_css, "1", "inject_css");
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
