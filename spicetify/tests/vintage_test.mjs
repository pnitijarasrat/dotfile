// Checks for the Spotify Vintage theme (#53, #61).
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
  // Spotify green: Win95 selection navy.
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

// Spicetify replaces Spotify's greens with these slots.
const greenSlots = ["button", "button-active"];

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

test("no Spotify green: green slots are frame_selection", () => {
  for (const slot of greenSlots) eq(slotRoles[slot], "frame_selection", slot);
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
