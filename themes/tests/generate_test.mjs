// Checks for the Theme generator, themes/generate.mjs (#132, #135).
// Run: node themes/tests/generate_test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, ghostty, vscode, vscodeExtension } from "../generate.mjs";

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

// A small Theme with the roles Ghostty and VSCode take, and its Ghostty theme
// written by hand.
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

test("every committed generated file is what the generator produces", () => {
  const files = generate(root);
  for (const path of ["ghostty/themes/vintage", "vscode/vintage-theme/themes/vintage-color-theme.json", "vscode/vintage-theme/package.json"]) {
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
