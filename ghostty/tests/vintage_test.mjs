// Checks for the Ghostty Vintage theme (#13, #44, #78), each Theme's
// Ghostty theme (#132), the Switch's override (#133), and each Theme's
// window shape (#151).
// Run: node ghostty/tests/vintage_test.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

// The window settings each Theme file ends with, in order, with the rule each
// comes from (#151).
const windowKeys = [
  ["background-opacity", "opacity"],
  ["background-blur", "blur"],
  ["window-decoration", "radius"],
  ["macos-titlebar-style", "radius"],
];

// Each Theme's corners, as its spec sets them: Vintage's square, with no
// window frame; Marigold's rounded, with no title bar.
const corners = {
  vintage: { "window-decoration": "none", "macos-titlebar-style": "transparent" },
  marigold: { "window-decoration": "auto", "macos-titlebar-style": "hidden" },
};

// A Theme's whole window shape: opacity and blur from its Theme rules, and
// its corners.
function windowShape(id) {
  const { rules } = themes(root).find((t) => t.id === id).theme;
  return { "background-opacity": String(rules.opacity), "background-blur": String(rules.blur), ...corners[id] };
}

for (const { id, theme } of themes(root)) {
  const themeRole = roles(theme);
  const path = `ghostty/themes/${id}`;

  test(`${id}: theme sets the Work surface and the ANSI colors`, () => {
    const lines = parse(read(path));
    eq(lines.length, keyRoles.length + windowKeys.length, `${path} lines`);
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

  test(`${id}: theme ends with the window shape, from the Theme rules`, () => {
    const lines = parse(read(path)).slice(keyRoles.length);
    windowKeys.forEach(([key, rule], i) => {
      eq(lines[i]?.key, key, `window line ${i + 1} key`);
      eq(lines[i].comment.split(":")[0], rule, `comment above ${key}`);
    });
    eq(lines[0].value, String(theme.rules.opacity), "background-opacity (opacity)");
    eq(lines[1].value, String(theme.rules.blur), "background-blur (blur)");
  });
}

test("Vintage's window is square with no frame; Marigold's is rounded with no title bar", () => {
  for (const id of Object.keys(corners)) {
    const lines = parse(read(`ghostty/themes/${id}`));
    for (const [key, value] of Object.entries(corners[id])) {
      eq(lines.find((e) => e.key === key)?.value, value, `${id} ${key}`);
    }
  }
});

test("the config leaves the window shape to the active Theme's file", () => {
  // Ghostty's own config wins over its theme's, so setting these here would
  // pin every Theme to one shape.
  for (const [key] of windowKeys) {
    if (config.some((e) => e.key === key)) throw new Error(`ghostty/config sets ${key}`);
  }
});

// Ghostty's resolved config, as `ghostty +show-config` prints it, for a copy
// of ghostty/ and its Themes with activeTheme as the Switch's pointer (none
// before any Switch). Skipped if Ghostty isn't installed.
const app = "/Applications/Ghostty.app/Contents/MacOS/ghostty";
function resolved(activeTheme) {
  const home = mkdtempSync(join(tmpdir(), "ghostty-"));
  mkdirSync(join(home, "ghostty/themes"), { recursive: true });
  copyFileSync(join(root, "ghostty/config"), join(home, "ghostty/config"));
  for (const { id } of themes(root)) copyFileSync(join(root, `ghostty/themes/${id}`), join(home, `ghostty/themes/${id}`));
  if (activeTheme) writeFileSync(join(home, "ghostty/active-theme"), `theme = ${activeTheme}\n`);
  const { stdout } = spawnSync(app, ["+show-config", "--changes-only=false"], {
    env: { ...process.env, XDG_CONFIG_HOME: home },
    encoding: "utf8",
  });
  rmSync(home, { recursive: true });
  return Object.fromEntries(parse(stdout).map((e) => [e.key, e.value]));
}

// Ghostty prints a blur intensity of 0 as false.
const shown = (key, value) => (key === "background-blur" && value === "0" ? "false" : value);

if (existsSync(app)) {
  test("Ghostty resolves Vintage's window before any Switch, and each Theme's after a Switch to it", () => {
    for (const [activeTheme, id] of [[undefined, "vintage"], ["marigold", "marigold"], ["vintage", "vintage"]]) {
      const values = resolved(activeTheme);
      for (const [key, value] of Object.entries(windowShape(id))) {
        eq(values[key], shown(key, value), `${key} with ${activeTheme ?? "no Switch"}`);
      }
    }
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

test("selects Vintage, with the JetBrains Mono NL font", () => {
  const expected = {
    theme: ["vintage"],
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
