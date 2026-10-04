// Checks for the Vintage VSCode theme (#19, #20, #33).
// Run: node vscode/tests/vintage_test.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// JSONC: drop comments outside strings, then trailing commas.
function parseJsonc(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i) + 1;
    } else {
      out += c;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const theme = parseJsonc(read("vscode/vintage-theme/themes/vintage-color-theme.json"));
const settings = parseJsonc(read("vscode/settings.json"));
const colors = theme.colors;

// Every role the spec defines, with its hex, from the tables in
// docs/theme-spec.md (`role` | `#hex`, and `ansi_N` `#hex` in the ANSI table).
const roles = Object.fromEntries(
  [...read("docs/theme-spec.md").matchAll(/`([a-z0-9_]+)`\s*\|?\s*`(#[0-9A-F]{6})`/g)].map((m) => [m[1], m[2]]),
);

// Keys allowed to be fully transparent: they turn a shadow off.
const noShadow = new Set(["widget.shadow", "scrollbar.shadow"]);

const color = (key) => {
  if (!(key in colors)) throw new Error(`${key} is not set`);
  return colors[key];
};
const expect = (key, hex) => eq(color(key), hex, key);

test("every color is commented with the spec role it plays", () => {
  const commented = new Map(
    [...read("vscode/vintage-theme/themes/vintage-color-theme.json").matchAll(/^\s*"([\w.]+)": "(#\w+)",? \/\/ (\w+)/gm)].map(
      (m) => [m[1], m[3]],
    ),
  );
  for (const [key, value] of Object.entries(colors)) {
    if (noShadow.has(key) && value === "#00000000") continue;
    const role = commented.get(key);
    if (!role) throw new Error(`${key} has no role comment`);
    if (roles[role] !== value) throw new Error(`${key} = ${value}, but ${role} is ${roles[role]}`);
  }
});

// The registered color IDs live in the installed VSCode: the workbench bundle
// and the built-in extensions' contributed colors (git). Skip if absent.
const app = "/Applications/Visual Studio Code.app/Contents/Resources/app";
const bundle = `${app}/out/vs/workbench/workbench.desktop.main.js`;
if (existsSync(bundle)) {
  test("every color key is one VSCode registers", () => {
    const js = readFileSync(bundle, "utf8");
    const contributed = new Set(
      readdirSync(`${app}/extensions`)
        .map((dir) => `${app}/extensions/${dir}/package.json`)
        .filter(existsSync)
        .flatMap((path) => JSON.parse(readFileSync(path, "utf8")).contributes?.colors ?? [])
        .map((c) => c.id),
    );
    const unknown = Object.keys(colors).filter(
      (key) => !js.includes(`"${key}",`) && !js.includes(`"${key}":{`) && !contributed.has(key),
    );
    if (unknown.length) throw new Error(`unknown keys: ${unknown.join(", ")}`);
  });
}

test("activity bar, sidebar, tabs and panel titles are Frame grey with black text", () => {
  for (const key of [
    "activityBar.background",
    "sideBar.background",
    "sideBarSectionHeader.background",
    "editorGroupHeader.tabsBackground",
    "tab.inactiveBackground",
    "panelSectionHeader.background",
  ]) {
    expect(key, "#C0C0C0");
  }
  for (const key of [
    "activityBar.foreground",
    "sideBar.foreground",
    "sideBarTitle.foreground",
    "sideBarSectionHeader.foreground",
    "tab.activeForeground",
    "tab.inactiveForeground",
    "panelSectionHeader.foreground",
  ]) {
    expect(key, "#000000");
  }
});

test("the active tab is clearly distinguished", () => {
  // The modern UI ignores tab.activeBackground.
  eq(settings["workbench.experimental.modernUI"], false, "workbench.experimental.modernUI");
  expect("tab.activeBackground", "#E0E0E0");
  expect("tab.activeBorderTop", "#000080");
});

test("scrollbars use Frame greys", () => {
  expect("scrollbarSlider.background", "#808080");
  expect("scrollbarSlider.hoverBackground", "#808080");
});

test("custom title bar: navy active, grey inactive", () => {
  eq(settings["window.titleBarStyle"], "custom", "window.titleBarStyle");
  expect("titleBar.activeBackground", "#000080");
  expect("titleBar.activeForeground", "#FFFFFF");
  expect("titleBar.inactiveBackground", "#808080");
  expect("titleBar.inactiveForeground", "#C0C0C0");
});

test("status bar is Frame grey with Frame data colors", () => {
  expect("statusBar.background", "#C0C0C0");
  expect("statusBar.foreground", "#000000");
  expect("statusBarItem.errorBackground", "#C0C0C0");
  expect("statusBarItem.errorForeground", "#800000");
  expect("statusBarItem.warningBackground", "#C0C0C0");
  expect("statusBarItem.warningForeground", "#808000");
});

test("menus and pickers are Frame: grey, black text, navy selection", () => {
  eq(settings["window.menuStyle"], "custom", "window.menuStyle");
  const frame = [
    ["quickInput.background", "quickInput.foreground", "quickInputList.focusBackground", "quickInputList.focusForeground"],
    ["menu.background", "menu.foreground", "menu.selectionBackground", "menu.selectionForeground"],
    ["notifications.background", "notifications.foreground", "list.activeSelectionBackground", "list.activeSelectionForeground"],
  ];
  for (const [bg, fg, sel, selText] of frame) {
    expect(bg, "#C0C0C0");
    expect(fg, "#000000");
    expect(sel, "#000080");
    expect(selText, "#FFFFFF");
  }
});

test("inline code popups are Work surface with a work_popup_border", () => {
  for (const [bg, border] of [
    ["editorSuggestWidget.background", "editorSuggestWidget.border"],
    ["editorHoverWidget.background", "editorHoverWidget.border"],
    ["peekViewEditor.background", "peekView.border"],
    ["peekViewResult.background", "peekView.border"],
  ]) {
    expect(bg, "#000000");
    expect(border, "#808080");
  }
  eq(color("editorSuggestWidget.selectedBackground"), "#000080", "suggest selection");
});

test("the terminal uses the editor's Work surface font (#33)", () => {
  for (const key of ["fontFamily", "fontSize", "fontWeight"]) {
    eq(settings[`terminal.integrated.${key}`], settings[`editor.${key}`], `terminal.integrated.${key}`);
  }
  // terminal lineHeight multiplies the font's cell height (1 em for Fixedsys
  // Excelsior); editor lineHeight is in px.
  eq(
    settings["terminal.integrated.lineHeight"] * settings["terminal.integrated.fontSize"],
    settings["editor.lineHeight"],
    "terminal line height in px",
  );
  eq(settings["terminal.integrated.fontLigatures.enabled"], settings["editor.fontLigatures"], "terminal ligatures");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
