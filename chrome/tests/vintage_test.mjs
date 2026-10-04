// Checks for the Chrome Vintage theme (#37).
// Run: node chrome/tests/vintage_test.mjs
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

// Every role the spec defines, with its hex, from the tables in
// docs/theme-spec.md (`role` | `#hex`).
const roles = Object.fromEntries(
  [...read("docs/theme-spec.md").matchAll(/`([a-z0-9_]+)`\s*\|?\s*`(#[0-9A-F]{6})`/g)].map((m) => [m[1], m[2]]),
);

const manifestPath = "chrome/vintage-theme/manifest.json";
let manifest = {};
test("manifest is strict JSON", () => {
  manifest = JSON.parse(read(manifestPath));
});
const colors = manifest.theme?.colors ?? {};

// Chrome only takes [r, g, b] arrays, so compare as hex.
const hex = (rgb) =>
  Array.isArray(rgb) && rgb.length === 3 && rgb.every((c) => Number.isInteger(c) && c >= 0 && c <= 255)
    ? "#" + rgb.map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("")
    : `not an opaque [r, g, b]: ${JSON.stringify(rgb)}`;

// Every Chrome color key the theme sets, with the spec role it takes. On
// macOS the tab strip is the title bar.
const keyRoles = {
  frame: "frame_title",
  frame_inactive: "frame_title_inactive",
  // Background tabs blend into the title bar, as in Chrome's own themes.
  background_tab: "frame_title",
  background_tab_inactive: "frame_title_inactive",
  tab_background_text: "frame_title_text",
  tab_background_text_inactive: "frame_title_inactive_text",
  toolbar: "frame_face",
  tab_text: "frame_text",
  toolbar_text: "frame_text",
  toolbar_button_icon: "frame_text",
  bookmark_text: "frame_text",
  omnibox_background: "frame_window",
  omnibox_text: "frame_text",
};

test("is an MV3 theme named Vintage", () => {
  eq(manifest.manifest_version, 3, "manifest_version");
  eq(manifest.name, "Vintage", "name");
  if (typeof manifest.version !== "string") throw new Error("version is not set");
});

test("every color key takes its spec role", () => {
  for (const [key, role] of Object.entries(keyRoles)) {
    if (!roles[role]) throw new Error(`role ${role} is not in the spec`);
    eq(hex(colors[key]), roles[role], `${key} (${role})`);
  }
});

test("sets these color keys and nothing else", () => {
  eq(Object.keys(colors).sort().join(","), Object.keys(keyRoles).sort().join(","), "color keys");
});

test("Purist fidelity: no images, tints or properties", () => {
  for (const part of ["images", "tints", "properties"]) {
    if (part in (manifest.theme ?? {})) throw new Error(`theme sets ${part}`);
  }
});

test("active window: navy tab strip with white tab titles, grey tab and toolbar with black text", () => {
  eq(hex(colors.frame), "#000080", "frame");
  eq(hex(colors.tab_background_text), "#FFFFFF", "tab_background_text");
  eq(hex(colors.toolbar), "#C0C0C0", "toolbar");
  for (const key of ["tab_text", "toolbar_text", "toolbar_button_icon", "bookmark_text"]) {
    eq(hex(colors[key]), "#000000", key);
  }
});

test("inactive window: grey tab strip", () => {
  eq(hex(colors.frame_inactive), "#808080", "frame_inactive");
});

test("omnibox is white with black text", () => {
  eq(hex(colors.omnibox_background), "#FFFFFF", "omnibox_background");
  eq(hex(colors.omnibox_text), "#000000", "omnibox_text");
});

test("spec has a Chrome row in Per tool", () => {
  if (!/^\| \*\*Chrome\*\* \|/m.test(read("docs/theme-spec.md"))) {
    throw new Error("no Chrome row in the spec's Per tool table");
  }
});

// The theme keys Chrome knows are NUL-terminated strings in the installed
// Chrome framework. Skip if absent.
const versions = "/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions";
const framework = `${versions}/Current/Google Chrome Framework`;
if (existsSync(framework)) {
  test("every color key is one Chrome knows", () => {
    const bin = readFileSync(framework);
    const unknown = Object.keys(colors).filter((key) => bin.indexOf(`\0${key}\0`) === -1);
    if (unknown.length) {
      const installed = readdirSync(versions).filter((v) => v !== "Current");
      throw new Error(`unknown keys in Chrome ${installed.at(-1)}: ${unknown.join(", ")}`);
    }
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
