// Checks for the Theme generator, themes/generate.mjs (#132, #135, #137).
// Run: node themes/tests/generate_test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chrome, generate, ghostty, sketchybar, vscode, vscodeExtension } from "../generate.mjs";

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

// A small Theme with the roles Ghostty, SketchyBar, VSCode and Chrome take, and its Ghostty
// theme, SketchyBar palette and Chrome theme written by hand.
const tiny = JSON.parse(read("themes/tests/fixtures/tiny.json"));

test("generates a Ghostty theme for any Theme source file", () => {
  eq(ghostty("tiny", tiny), read("themes/tests/fixtures/tiny.ghostty"), "ghostty/themes/tiny");
});

test("refuses a Theme missing a role Ghostty takes", () => {
  const { work_cursor, ...work } = tiny.palettes.work;
  const broken = { ...tiny, palettes: { ...tiny.palettes, work } };
  let message = "";
  try {
    ghostty("tiny", broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("work_cursor")) throw new Error(`expected an error naming work_cursor, got ${JSON.stringify(message)}`);
});

test("a Theme with square corners drops Ghostty's window frame", () => {
  const square = ghostty("tiny", { ...tiny, rules: { opacity: 1, blur: 0, radius: 0, icons: false } });
  const window = square.slice(square.indexOf("# Window shape"));
  eq(window, [
    "# Window shape, from the Theme rules",
    "# opacity",
    "background-opacity = 1",
    "# blur",
    "background-blur = 0",
    "# radius: square corners, no window frame",
    "window-decoration = none",
    "# radius",
    "macos-titlebar-style = transparent",
    "",
  ].join("\n"), "window shape");
});

test("refuses a Theme without Theme rules for Ghostty", () => {
  const { rules, ...broken } = tiny;
  let message = "";
  try {
    ghostty("tiny", broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("rules")) throw new Error(`expected an error naming rules, got ${JSON.stringify(message)}`);
});

test("generates a SketchyBar Frame palette for any Theme source file", () => {
  eq(sketchybar("tiny", tiny), read("themes/tests/fixtures/tiny.sketchybar"), "sketchybar/themes/tiny.sh");
});

test("a Theme with square corners gives JankyBorders square borders", () => {
  const square = sketchybar("tiny", { ...tiny, rules: { ...tiny.rules, radius: 0 } });
  if (!square.includes('export border_style="square"\n')) throw new Error(`no square style in:\n${square}`);
});

test("refuses a Theme without borders or Theme rules for JankyBorders", () => {
  const { borders, ...noBorders } = tiny;
  const { rules, ...noRules } = tiny;
  for (const [broken, key] of [[noBorders, "borders"], [noRules, "rules"]]) {
    let message = "";
    try {
      sketchybar("tiny", broken);
    } catch (err) {
      message = err.message;
    }
    if (!message.includes(key)) throw new Error(`expected an error naming ${key}, got ${JSON.stringify(message)}`);
  }
});

test("refuses JankyBorders colors that aren't Frame roles of the Theme", () => {
  let message = "";
  try {
    sketchybar("tiny", { ...tiny, borders: { ...tiny.borders, active: "frame_nope" } });
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("frame_nope")) throw new Error(`expected an error naming frame_nope, got ${JSON.stringify(message)}`);
});

test("generates a VSCode color theme for any Theme source file", () => {
  const text = vscode(tiny);
  if (!text.startsWith("// Tiny theme for VSCode")) throw new Error(`header: ${text.split("\n")[0]}`);
  if (text.includes("{{")) throw new Error("a placeholder is left in");
  if (!text.includes('"name": "Tiny",')) throw new Error("name isn't Tiny");
  if (!text.includes('"type": "light",')) throw new Error("type isn't light");
  // Spot checks against the fixture's own values.
  for (const line of [
    '"editor.background": "#FFF8E7", // work_bg',
    '"titleBar.activeBackground": "#202060", // frame_title',
    '"terminal.ansiBrightWhite": "#0000F1" // ansi_15',
    '"settings": { "foreground": "#A01010", "fontStyle": "" } // syntax_error',
  ]) {
    if (!text.includes(line)) throw new Error(`missing ${line}`);
  }
});

test("a Theme with a dark Frame gets a dark VSCode theme", () => {
  const dark = { ...tiny, palettes: { ...tiny.palettes, frame: { ...tiny.palettes.frame, frame_face: "#202020" } } };
  if (!vscode(dark).includes('"type": "dark",')) throw new Error("type isn't dark");
});

test("a Theme with shadows keeps VSCode's own; one without turns them off", () => {
  if (vscode(tiny).includes("shadow\": \"#00000000\"")) throw new Error("tiny's shadows are turned off");
  const flat = vscode({ ...tiny, shadows: false });
  for (const key of ["widget.shadow", "scrollbar.shadow"]) {
    if (!flat.includes(`"${key}": "#00000000"`)) throw new Error(`${key} isn't turned off`);
  }
});

test("refuses a Theme that doesn't say whether it has shadows", () => {
  const { shadows, ...broken } = tiny;
  let message = "";
  try {
    vscode(broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("shadows")) throw new Error(`expected an error naming shadows, got ${JSON.stringify(message)}`);
});

test("VSCode's selection, match highlights and matched completion letters are the role the Theme chooses", () => {
  // tiny chooses work_selection, #AACCEE.
  for (const line of [
    '"editor.selectionBackground": "#AACCEE", // work_selection',
    '"peekViewEditor.matchHighlightBackground": "#AACCEE", // work_selection',
    '"peekViewResult.matchHighlightBackground": "#AACCEE", // work_selection',
    '"editorSuggestWidget.focusHighlightForeground": "#AACCEE", // work_selection',
  ]) {
    if (!vscode(tiny).includes(line)) throw new Error(`missing ${line}`);
  }
});

test("refuses a Theme that doesn't choose VSCode's selection role", () => {
  const { vscode: _, ...broken } = tiny;
  let message = "";
  try {
    vscode(broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("selection")) throw new Error(`expected an error naming selection, got ${JSON.stringify(message)}`);
});

test("the VSCode extension contributes one color theme per Theme", () => {
  const json = JSON.parse(vscodeExtension([{ id: "tiny", theme: tiny }, { id: "vintage", theme: { name: "Vintage", palettes: { frame: { frame_face: "#C0C0C0" } } } }]));
  eq(JSON.stringify(json.contributes.themes), JSON.stringify([
    { label: "Tiny", uiTheme: "vs", path: "./themes/tiny-color-theme.json" },
    { label: "Vintage", uiTheme: "vs", path: "./themes/vintage-color-theme.json" },
  ]), "contributes.themes");
});

test("refuses a Theme missing a role VSCode takes", () => {
  const { frame_title, ...frame } = tiny.palettes.frame;
  const broken = { ...tiny, palettes: { ...tiny.palettes, frame } };
  let message = "";
  try {
    vscode(broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("frame_title")) throw new Error(`expected an error naming frame_title, got ${JSON.stringify(message)}`);
});

test("generates a Chrome theme extension for any Theme source file", () => {
  eq(chrome(tiny), read("themes/tests/fixtures/tiny.chrome.json"), "chrome/tiny-theme/manifest.json");
});

test("refuses a Theme missing a role Chrome takes", () => {
  const { frame_desktop, ...frame } = tiny.palettes.frame;
  const broken = { ...tiny, palettes: { ...tiny.palettes, frame } };
  let message = "";
  try {
    chrome(broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("frame_desktop")) throw new Error(`expected an error naming frame_desktop, got ${JSON.stringify(message)}`);
});

test("every committed generated file is what the generator produces", () => {
  const files = generate(root);
  for (const path of ["ghostty/themes/vintage", "sketchybar/themes/vintage.sh", "vscode/vintage-theme/themes/vintage-color-theme.json", "vscode/vintage-theme/package.json", "chrome/vintage-theme/manifest.json"]) {
    if (!files.some((f) => f.path === path)) throw new Error(`generator doesn't produce ${path}`);
  }
  for (const { path, text } of files) {
    if (read(path) !== text) throw new Error(`${path} is stale: run node themes/generate.mjs`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
