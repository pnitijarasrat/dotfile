// Checks for the Ghostty Vintage theme (#13, #44, #78), each Theme's
// Ghostty theme (#132), and the Switch's override (#133).
// Run: node ghostty/tests/vintage_test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "../../themes/generate.mjs";

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

// Ghostty config lines as { key, value, comment }, where comment is the
// line just above (Ghostty has no trailing comments).
function parse(text) {
  const lines = text.split("\n");
  const entries = [];
  lines.forEach((line, i) => {
    const m = line.match(/^\s*([a-z0-9-]+)\s*=\s*(.*?)\s*$/);
    if (!m) return;
    const above = lines[i - 1]?.match(/^\s*#\s*(.*?)\s*$/);
    entries.push({ key: m[1], value: m[2], comment: above?.[1] });
  });
  return entries;
}

const configText = read("ghostty/config");
const config = parse(configText);

// Every role a Theme defines, with its hex, from its Theme source file.
function roles(theme) {
  const all = Object.assign({}, ...Object.values(theme.palettes));
  return (name) => {
    if (!all[name]) throw new Error(`role ${name} is not in ${theme.name}`);
    return all[name];
  };
}

// The Vintage Theme source file, themes/vintage.json, which the config's
// fonts and split divider come from.
const vintage = JSON.parse(read("themes/vintage.json"));
const role = roles(vintage);

// Every theme line, with the spec role it takes.
const keyRoles = [
  ["background", "work_bg"],
  ["foreground", "work_fg"],
  ["cursor-color", "work_cursor"],
  ["cursor-text", "work_cursor_text"],
  ["selection-background", "work_selection"],
  ["selection-foreground", "work_selection_text"],
  ...Array.from({ length: 16 }, (_, n) => ["palette", `ansi_${n}`]),
];

for (const { id, theme } of themes(root)) {
  const themeRole = roles(theme);
  const path = `ghostty/themes/${id}`;

  test(`${id}: theme sets the Work surface and the ANSI colors`, () => {
    const lines = parse(read(path));
    eq(lines.length, keyRoles.length, `${path} lines`);
    keyRoles.forEach(([key, name], i) => {
      const entry = lines[i];
      eq(entry.key, key, `line ${i + 1} key`);
      const expected = key === "palette" ? `${name.replace("ansi_", "")}=${themeRole(name)}` : themeRole(name);
      eq(entry.value, expected, `${key} (${name})`);
    });
  });

  test(`${id}: each theme line is commented with its role name`, () => {
    const lines = parse(read(path));
    keyRoles.forEach(([key, name], i) => eq(lines[i].comment, name, `comment above ${key} ${lines[i].value}`));
  });
}

test("split divider is work_grid", () => {
  const entry = config.find((e) => e.key === "split-divider-color");
  eq(entry?.value, role("work_grid"), "split-divider-color");
  eq(entry?.comment, "work_grid", "comment above split-divider-color");
});

test("a Switch's active-theme file can override the theme line", () => {
  eq(config.filter((e) => e.key === "config-file").map((e) => e.value).join(" | "), "?active-theme", "config-file");
});

test("bold is not bright and synthetic bold stays off", () => {
  if (/bold-is-bright|bold-color/.test(configText)) throw new Error("config still mentions bright bold");
  eq(config.find((e) => e.key === "font-synthetic-style")?.value, "false", "font-synthetic-style");
});

test("Purist fidelity and the JetBrains Mono NL font", () => {
  const expected = {
    theme: ["vintage"],
    "background-opacity": ["1"],
    "background-blur": ["false"],
    "window-decoration": ["none"],
    "font-family": vintage.fonts.work.family.map((name) => `"${name}"`),
    "font-size": [String(vintage.fonts.work.ghostty_size)],
    "font-feature": ["-calt, -liga"],
    "font-style-bold": ["false"],
    "font-style-italic": ["false"],
    "font-style-bold-italic": ["false"],
  };
  for (const [key, values] of Object.entries(expected)) {
    eq(config.filter((e) => e.key === key).map((e) => e.value).join(" | "), values.join(" | "), key);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
