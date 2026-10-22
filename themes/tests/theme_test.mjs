// Checks for `theme`, themes/theme.mjs, which makes a Switch (#133, #135).
// Runs it against a scratch copy of the repo with each tool's reload stubbed,
// so no open window or bar changes.
// Run: node themes/tests/theme_test.mjs
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../theme.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

// A scratch repo with two Themes, Vintage and the tiny fixture, and no Switch
// made yet.
function scratch() {
  const root = mkdtempSync(join(tmpdir(), "theme-"));
  mkdirSync(join(root, "themes"));
  mkdirSync(join(root, "ghostty/themes"), { recursive: true });
  copyFileSync(join(repo, "themes/vintage.json"), join(root, "themes/vintage.json"));
  copyFileSync(join(repo, "themes/tests/fixtures/tiny.json"), join(root, "themes/tiny.json"));
  copyFileSync(join(repo, "ghostty/themes/vintage"), join(root, "ghostty/themes/vintage"));
  copyFileSync(join(repo, "themes/tests/fixtures/tiny.ghostty"), join(root, "ghostty/themes/tiny"));
  mkdirSync(join(root, "vscode"));
  copyFileSync(join(repo, "vscode/settings.json"), join(root, "vscode/settings.json"));
  mkdirSync(join(root, "sketchybar/themes"), { recursive: true });
  copyFileSync(join(repo, "sketchybar/color.sh"), join(root, "sketchybar/color.sh"));
  copyFileSync(join(repo, "sketchybar/themes/vintage.sh"), join(root, "sketchybar/themes/vintage.sh"));
  copyFileSync(join(repo, "themes/tests/fixtures/tiny.sketchybar"), join(root, "sketchybar/themes/tiny.sh"));
  mkdirSync(join(root, "borders"));
  copyFileSync(join(repo, "borders/bordersrc"), join(root, "borders/bordersrc"));
  return root;
}

// Runs `theme` with args in a scratch repo, listing the tools it reloads.
function theme(root, ...args) {
  const reloads = [];
  const result = run({ root, args, reload: (tool) => reloads.push(tool) });
  return { ...result, reloads: reloads.join() };
}

// Runs a shell command as if the scratch repo were ~/.config, with a stub
// `borders` on PATH that prints its arguments.
function shell(root, command) {
  const home = mkdtempSync(join(tmpdir(), "home-"));
  symlinkSync(root, join(home, ".config"));
  mkdirSync(join(home, "bin"));
  writeFileSync(join(home, "bin/borders"), '#!/bin/sh\nprintf "%s\\n" "$@"\n');
  chmodSync(join(home, "bin/borders"), 0o755);
  const env = { HOME: home, PATH: `${join(home, "bin")}:${process.env.PATH}` };
  const { stdout, stderr, status } = spawnSync("bash", ["-c", command], { env, encoding: "utf8" });
  rmSync(home, { recursive: true });
  if (status !== 0) throw new Error(`${command} failed: ${stderr}`);
  return stdout;
}

// frame_face as SketchyBar's color.sh sets it.
const frameFace = (root) => shell(root, '. "$HOME/.config/sketchybar/color.sh"; echo "$frame_face"');

// The committed VSCode settings with only the color theme changed to label.
const settings = (label) =>
  readFileSync(join(repo, "vscode/settings.json"), "utf8").replace(
    '"workbench.colorTheme": "Vintage",',
    `"workbench.colorTheme": "${label}",`,
  );

const read = (root, path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : undefined);

test("switching records the active Theme, points Ghostty at it and reloads every tool that needs it", () => {
  const root = scratch();
  const result = theme(root, "tiny");
  eq(result.code, 0, "exit code");
  eq(read(root, "themes/active"), "tiny\n", "themes/active");
  eq(read(root, "ghostty/active-theme"), "theme = tiny\n", "ghostty/active-theme");
  eq(result.reloads, "ghostty,sketchybar,borders", "reloads");
  rmSync(root, { recursive: true });
});

test("switching selects the Theme in VSCode's settings by its name, changing nothing else", () => {
  const root = scratch();
  theme(root, "tiny");
  eq(read(root, "vscode/settings.json"), settings("Tiny"), "vscode/settings.json after theme tiny");
  theme(root, "vintage");
  eq(read(root, "vscode/settings.json"), settings("Vintage"), "vscode/settings.json after theme vintage");
  rmSync(root, { recursive: true });
});

test("switching points SketchyBar at the Theme's Frame palette", () => {
  const root = scratch();
  eq(frameFace(root), "0xffc0c0c0\n", "frame_face before any Switch");
  theme(root, "tiny");
  eq(frameFace(root), "0xffeeeedd\n", "frame_face after theme tiny");
  theme(root, "vintage");
  eq(frameFace(root), "0xffc0c0c0\n", "frame_face after theme vintage");
  rmSync(root, { recursive: true });
});

test("switching points JankyBorders at the Theme's Frame palette", () => {
  const root = scratch();
  theme(root, "tiny");
  const options = shell(root, 'bash "$HOME/.config/borders/bordersrc"');
  for (const option of ["active_color=0xffeeeedd", "inactive_color=0xff999988"]) {
    if (!options.split("\n").includes(option)) throw new Error(`borders wasn't given ${option}: ${options}`);
  }
  rmSync(root, { recursive: true });
});

test("switching to a Theme other than Vintage says VSCode needs a reload if the Theme is new", () => {
  const root = scratch();
  eq(theme(root, "tiny").out, "If Tiny is new since VSCode's windows opened, run Developer: Reload Window once.\n", "output for tiny");
  eq(theme(root, "vintage").out, "", "output for vintage");
  rmSync(root, { recursive: true });
});

test("a VSCode settings.json with no color theme line fails the Switch and changes nothing", () => {
  const root = scratch();
  writeFileSync(join(root, "vscode/settings.json"), "{}\n");
  const result = theme(root, "tiny");
  eq(result.code, 1, "exit code");
  eq(result.out, 'vscode/settings.json has no "workbench.colorTheme" line\n', "output");
  eq(read(root, "themes/active"), undefined, "themes/active");
  eq(read(root, "ghostty/active-theme"), undefined, "ghostty/active-theme");
  eq(result.reloads, "", "reloads");
  rmSync(root, { recursive: true });
});

test("an unknown Theme changes nothing and lists the available Themes", () => {
  const root = scratch();
  theme(root, "tiny");
  const result = theme(root, "dracula");
  eq(result.code, 1, "exit code");
  eq(result.out, "No Theme named dracula. Available Themes:\n  tiny\n  vintage\n", "output");
  eq(read(root, "themes/active"), "tiny\n", "themes/active");
  eq(read(root, "ghostty/active-theme"), "theme = tiny\n", "ghostty/active-theme");
  eq(read(root, "vscode/settings.json"), settings("Tiny"), "vscode/settings.json");
  eq(result.reloads, "", "reloads");
  rmSync(root, { recursive: true });
});

test("with no name, prints the active Theme and changes nothing", () => {
  const root = scratch();
  const before = theme(root);
  eq(before.code, 0, "exit code before any Switch");
  eq(before.out, "vintage\n", "active Theme before any Switch");
  eq(read(root, "themes/active"), undefined, "themes/active before any Switch");
  theme(root, "tiny");
  const after = theme(root);
  eq(after.out, "tiny\n", "active Theme after switching to tiny");
  eq(after.reloads, "", "reloads");
  rmSync(root, { recursive: true });
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
