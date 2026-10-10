// Checks for the Ghostty Vintage theme (#13, #44, #78).
// Run: node ghostty/tests/vintage_test.mjs
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

// Every role the spec defines, with its hex, from the tables in
// docs/theme-spec.md (`role` | `#hex`, and `ansi_N` `#hex` in the ANSI table).
const roles = Object.fromEntries(
  [...read("docs/theme-spec.md").matchAll(/`([a-z0-9_]+)`\s*\|?\s*`(#[0-9A-F]{6})`/g)].map((m) => [m[1], m[2]]),
);

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

const theme = parse(read("ghostty/themes/vintage"));
const configText = read("ghostty/config");
const config = parse(configText);

function role(name) {
  if (!roles[name]) throw new Error(`role ${name} is not in the spec`);
  return roles[name];
}

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

test("theme sets the light Work surface and the Windows VGA ANSI colors", () => {
  eq(theme.length, keyRoles.length, "theme lines");
  keyRoles.forEach(([key, name], i) => {
    const entry = theme[i];
    eq(entry.key, key, `line ${i + 1} key`);
    const expected = key === "palette" ? `${name.replace("ansi_", "")}=${role(name)}` : role(name);
    eq(entry.value, expected, `${key} (${name})`);
  });
});

test("each theme line is commented with its role name", () => {
  keyRoles.forEach(([key, name], i) => eq(theme[i].comment, name, `comment above ${key} ${theme[i].value}`));
});

test("split divider is work_grid", () => {
  const entry = config.find((e) => e.key === "split-divider-color");
  eq(entry?.value, role("work_grid"), "split-divider-color");
  eq(entry?.comment, "work_grid", "comment above split-divider-color");
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
    "font-family": ['"JetBrains Mono NL"', '"Menlo"', '"Thonburi"'],
    "font-size": ["14"],
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
