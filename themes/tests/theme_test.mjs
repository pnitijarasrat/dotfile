// Checks for `theme`, themes/theme.mjs, which makes a Switch (#133, #135, #137, #138, #153, #154, #158).
// Runs it against a scratch copy of the repo with each tool's reload and every
// macOS command stubbed, so no open window, bar or system setting changes.
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
  mkdirSync(join(root, "starship"));
  return root;
}

// Runs `theme` with args in a scratch repo, listing the tools it reloads and
// the system commands it runs.
function theme(root, ...args) {
  const reloads = [];
  const commands = [];
  const result = run({ root, args, reload: (tool) => reloads.push(tool), system: (...command) => commands.push(command) });
  return { ...result, reloads: reloads.join(), commands };
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

// The committed VSCode settings, with only the lines a Switch owns changed:
// the color theme to label, and the title bar and modern UI if given.
const settings = (label, { titleBar = "custom", modernUI = false } = {}) =>
  readFileSync(join(repo, "vscode/settings.json"), "utf8")
    .replace('"workbench.colorTheme": "Vintage",', `"workbench.colorTheme": "${label}",`)
    .replace('"window.titleBarStyle": "custom",', `"window.titleBarStyle": "${titleBar}",`)
    .replace('"workbench.experimental.modernUI": false,', `"workbench.experimental.modernUI": ${modernUI},`);

// The VSCode shape Marigold and the fixture share: modern UI and the native title bar.
const modern = { titleBar: "native", modernUI: true };

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

test("switching points Starship at the Theme's prompt (#154)", () => {
  const root = scratch();
  theme(root, "tiny");
  eq(read(root, "starship/active-theme"), "tiny\n", "starship/active-theme after theme tiny");
  theme(root, "vintage");
  eq(read(root, "starship/active-theme"), "vintage\n", "starship/active-theme after theme vintage");
  rmSync(root, { recursive: true });
});

test("switching selects the Theme in VSCode's settings by its name and sets its modern UI and title bar, changing nothing else (#153)", () => {
  const root = scratch();
  theme(root, "tiny");
  eq(read(root, "vscode/settings.json"), settings("Tiny", modern), "vscode/settings.json after theme tiny");
  theme(root, "vintage");
  eq(read(root, "vscode/settings.json"), settings("Vintage"), "vscode/settings.json after theme vintage");
  rmSync(root, { recursive: true });
});

test("Marigold turns VSCode's modern UI on with the native title bar; Vintage leaves settings.json as committed (#153)", () => {
  const root = scratch();
  copyFileSync(join(repo, "themes/marigold.json"), join(root, "themes/marigold.json"));
  theme(root, "marigold");
  eq(read(root, "vscode/settings.json"), settings("Marigold", modern), "vscode/settings.json after theme marigold");
  theme(root, "vintage");
  eq(read(root, "vscode/settings.json"), readFileSync(join(repo, "vscode/settings.json"), "utf8"), "vscode/settings.json after theme vintage");
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

test("SketchyBar stays Vintage if the active Theme's Frame palette was never generated", () => {
  const root = scratch();
  theme(root, "tiny");
  rmSync(join(root, "sketchybar/themes/tiny.sh"));
  eq(frameFace(root), "0xffc0c0c0\n", "frame_face");
  rmSync(root, { recursive: true });
});

// The options bordersrc gives JankyBorders' borders.
const borders = (root) => shell(root, 'bash "$HOME/.config/borders/bordersrc"');

// Vintage's borders as bordersrc gave them before Themes could reshape them (#15).
const vintageBorders = "style=square\nwidth=4.0\nhidpi=on\nactive_color=0xffc0c0c0\ninactive_color=0xff808080\n";

test("switching gives JankyBorders the Theme's style, width and colors (#152)", () => {
  const root = scratch();
  eq(borders(root), vintageBorders, "borders before any Switch");
  theme(root, "tiny");
  // The fixture's: rounded corners, width 3, frame_selection and frame_dark_shadow.
  eq(borders(root), "style=round\nwidth=3.0\nhidpi=on\nactive_color=0xff3030a0\ninactive_color=0xff111111\n", "borders after theme tiny");
  theme(root, "vintage");
  eq(borders(root), vintageBorders, "borders after theme vintage");
  rmSync(root, { recursive: true });
});

// The commands that set macOS to a light or dark appearance, an accent (with
// the Aqua variant System Settings writes beside it) and a highlight color.
const macosCommands = (dark, accent, variant, highlight) => [
  ["defaults", "write", "-g", "AppleAccentColor", "-int", accent],
  ["defaults", "write", "-g", "AppleAquaColorVariant", "-int", variant],
  ["defaults", "write", "-g", "AppleHighlightColor", "-string", highlight],
  ["osascript", "-l", "JavaScript", "-e", 'ObjC.import("Foundation"); for (const name of ["AppleColorPreferencesChangedNotification", "AppleAquaColorVariantChanged"]) $.NSDistributedNotificationCenter.defaultCenter.postNotificationNameObjectUserInfoDeliverImmediately(name, null, null, true)'],
  ["osascript", "-e", `tell application "System Events" to tell appearance preferences to set dark mode to ${dark}`],
];

// macOS's highlight colors as System Settings stores them.
const yellow = "1.000000 0.937255 0.690196 Yellow";
const blue = "0.698039 0.843137 1.000000 Blue";

test("switching sets macOS appearance, accent and highlight color to the Theme's", () => {
  const root = scratch();
  eq(JSON.stringify(theme(root, "tiny").commands), JSON.stringify(macosCommands(true, "3", "1", yellow)), "commands for tiny");
  eq(JSON.stringify(theme(root, "vintage").commands), JSON.stringify(macosCommands(false, "-1", "6", blue)), "commands for vintage");
  rmSync(root, { recursive: true });
});

// The manual step that puts a Theme's extension in Chrome, which no Switch can
// do (docs/research/chrome-theme-switch.md).
const chromeStep = (root, id) =>
  `To switch Chrome, open chrome://extensions, turn on Developer mode, click Load unpacked and pick ${root}/chrome/${id}-theme (Cmd+Shift+G types a path).\n`;

test("switching says VSCode needs a reload if the Theme is new, and gives Chrome's manual step", () => {
  const root = scratch();
  const reminder = "If Tiny is new since VSCode's windows opened, run Developer: Reload Window once.\n";
  eq(theme(root, "tiny").out, reminder + chromeStep(root, "tiny"), "output for tiny");
  eq(theme(root, "vintage").out, chromeStep(root, "vintage"), "output for vintage");
  rmSync(root, { recursive: true });
});

test("a VSCode settings.json missing a line the Switch rewrites fails the Switch and changes nothing (#153)", () => {
  for (const key of ["workbench.colorTheme", "window.titleBarStyle", "workbench.experimental.modernUI"]) {
    const root = scratch();
    const without = read(root, "vscode/settings.json").split("\n").filter((line) => !line.includes(`"${key}"`)).join("\n");
    writeFileSync(join(root, "vscode/settings.json"), without);
    const result = theme(root, "tiny");
    eq(result.code, 1, `exit code without ${key}`);
    eq(result.out, `vscode/settings.json has no "${key}" line\n`, `output without ${key}`);
    eq(read(root, "vscode/settings.json"), without, "vscode/settings.json");
    eq(read(root, "themes/active"), undefined, "themes/active");
    eq(read(root, "ghostty/active-theme"), undefined, "ghostty/active-theme");
    eq(read(root, "sketchybar/active-theme"), undefined, "sketchybar/active-theme");
    eq(read(root, "starship/active-theme"), undefined, "starship/active-theme");
    eq(result.reloads, "", "reloads");
    eq(result.commands.length, 0, "commands");
    rmSync(root, { recursive: true });
  }
});

test("a Theme that doesn't say how VSCode is shaped fails the Switch and changes nothing (#153)", () => {
  const tiny = JSON.parse(readFileSync(join(repo, "themes/tests/fixtures/tiny.json"), "utf8"));
  const broken = [
    [undefined, "Tiny doesn't say how VSCode is shaped\n"],
    [{ ...tiny.vscode, modern_ui: undefined }, "Tiny's VSCode modern_ui undefined isn't true or false\n"],
    [{ ...tiny.vscode, modern_ui: "yes" }, 'Tiny\'s VSCode modern_ui "yes" isn\'t true or false\n'],
    [{ ...tiny.vscode, title_bar: "hidden" }, 'Tiny\'s VSCode title_bar "hidden" isn\'t native or custom\n'],
  ];
  for (const [declared, message] of broken) {
    const root = scratch();
    const before = read(root, "vscode/settings.json");
    writeFileSync(join(root, "themes/tiny.json"), JSON.stringify({ ...tiny, vscode: declared }));
    const result = theme(root, "tiny");
    eq(result.code, 1, `exit code for ${JSON.stringify(declared)}`);
    eq(result.out, message, `output for ${JSON.stringify(declared)}`);
    eq(read(root, "vscode/settings.json"), before, "vscode/settings.json");
    eq(read(root, "themes/active"), undefined, "themes/active");
    eq(result.reloads, "", "reloads");
    eq(result.commands.length, 0, "commands");
    rmSync(root, { recursive: true });
  }
});

test("a Theme that doesn't say how macOS looks fails the Switch and changes nothing", () => {
  const tiny = JSON.parse(readFileSync(join(repo, "themes/tests/fixtures/tiny.json"), "utf8"));
  const broken = [
    [undefined, "Tiny doesn't say which appearance, accent and highlight macOS uses\n"],
    [{ ...tiny.macos, appearance: "dim" }, 'Tiny\'s macOS appearance "dim" isn\'t light or dark\n'],
    [{ ...tiny.macos, accent: "teal" }, 'Tiny\'s macOS accent "teal" isn\'t one of graphite, red, orange, yellow, green, blue, purple, pink\n'],
    [{ ...tiny.macos, highlight: "teal" }, 'Tiny\'s macOS highlight "teal" isn\'t one of graphite, red, orange, yellow, green, blue, purple, pink\n'],
  ];
  for (const [declared, message] of broken) {
    const root = scratch();
    writeFileSync(join(root, "themes/tiny.json"), JSON.stringify({ ...tiny, macos: declared }));
    const result = theme(root, "tiny");
    eq(result.code, 1, `exit code for ${JSON.stringify(declared)}`);
    eq(result.out, message, `output for ${JSON.stringify(declared)}`);
    eq(read(root, "themes/active"), undefined, "themes/active");
    eq(read(root, "ghostty/active-theme"), undefined, "ghostty/active-theme");
    eq(result.reloads, "", "reloads");
    eq(result.commands.length, 0, "commands");
    rmSync(root, { recursive: true });
  }
});

test("an unknown Theme changes nothing and lists the available Themes", () => {
  const root = scratch();
  theme(root, "tiny");
  const result = theme(root, "dracula");
  eq(result.code, 1, "exit code");
  eq(result.out, "No Theme named dracula. Available Themes:\n  tiny\n  vintage\n", "output");
  eq(read(root, "themes/active"), "tiny\n", "themes/active");
  eq(read(root, "ghostty/active-theme"), "theme = tiny\n", "ghostty/active-theme");
  eq(read(root, "vscode/settings.json"), settings("Tiny", modern), "vscode/settings.json");
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

// A scratch checkout of every file as committed, so a Switch runs on the real
// Themes and every tool's real files (#158), whatever the working tree holds.
function checkout() {
  const root = mkdtempSync(join(tmpdir(), "checkout-"));
  const archive = spawnSync("git", ["archive", "HEAD"], { cwd: repo, maxBuffer: 1 << 30 });
  spawnSync("tar", ["-x", "-C", root], { input: archive.stdout });
  const { stdout } = spawnSync("git", ["ls-tree", "-r", "-z", "HEAD"], { cwd: repo, encoding: "utf8" });
  // The files, not the links (mode 120000), which point at a listed file or
  // outside the repo.
  const tracked = stdout.split("\0").filter((entry) => entry && !entry.startsWith("120000")).map((entry) => entry.split("\t")[1]);
  return { root, tracked };
}

// STARSHIP_CONFIG as starship/init.zsh sets it before a prompt, with a stub
// `starship` whose init does nothing.
const starshipConfig = (root) =>
  shell(root, `printf '#!/bin/sh\\n' > "$HOME/bin/starship"; chmod +x "$HOME/bin/starship"; zsh -fc '. "$HOME/.config/starship/init.zsh"; _starship_theme; echo "$STARSHIP_CONFIG"'`);

// What each in-scope tool sees after a Switch, through the file it reads.
function sees(root) {
  return {
    ghostty: read(root, "ghostty/active-theme"),
    sketchybar: shell(root, '. "$HOME/.config/sketchybar/color.sh"; echo "$active_theme"'),
    borders: borders(root),
    starship: starshipConfig(root).replace(/^.*\/\.config\//, ""),
    vscode: read(root, "vscode/settings.json").match(/"workbench\.colorTheme": "([^"]*)"/)[1],
  };
}

// Each Theme as the spec and its source file describe it.
const expected = {
  marigold: {
    ghostty: "theme = marigold\n",
    sketchybar: "marigold\n",
    // Rounded, 2 wide, marigold frame_selection and near-black frame_shadow.
    borders: "style=round\nwidth=2.0\nhidpi=on\nactive_color=0xfff2c45a\ninactive_color=0xff111111\n",
    starship: "starship/themes/marigold.toml\n",
    vscode: "Marigold",
    chrome: "Marigold",
    // Dark, yellow accent with the Aqua variant for any color, yellow highlight.
    macos: macosCommands(true, "2", "1", yellow),
  },
  vintage: {
    ghostty: "theme = vintage\n",
    sketchybar: "vintage\n",
    borders: vintageBorders,
    starship: "starship/themes/vintage.toml\n",
    vscode: "Vintage",
    chrome: "Vintage",
    macos: macosCommands(false, "-1", "6", blue),
  },
};

for (const [id, tools] of Object.entries(expected)) {
  test(`theme ${id} switches every in-scope tool to ${id} (#158)`, () => {
    const { root } = checkout();
    // Start from the other Theme, so every tool has something to change.
    theme(root, id === "vintage" ? "marigold" : "vintage");
    const result = theme(root, id);
    eq(result.code, 0, "exit code");
    const { macos, chrome, ...files } = tools;
    for (const [tool, seen] of Object.entries(sees(root))) eq(seen, files[tool], tool);
    eq(result.reloads, "ghostty,sketchybar,borders", "reloads");
    eq(JSON.stringify(result.commands), JSON.stringify(macos), "macOS commands");
    // Each pointer leads to a file the Theme has.
    for (const path of [`ghostty/themes/${id}`, `sketchybar/themes/${id}.sh`, `sketchybar/layouts/${id}.sh`, `starship/themes/${id}.toml`]) {
      if (!existsSync(join(root, path))) throw new Error(`${path} is missing`);
    }
    const labels = JSON.parse(read(root, "vscode/vintage-theme/package.json")).contributes.themes.map(({ label }) => label);
    if (!labels.includes(files.vscode)) throw new Error(`VSCode's extension has no ${files.vscode} color theme`);
    // Chrome's manual step picks a folder Chrome can load.
    if (!result.out.includes(`${root}/chrome/${id}-theme `)) throw new Error(`no Chrome step for ${id}: ${result.out}`);
    eq(JSON.parse(read(root, `chrome/${id}-theme/manifest.json`)).name, chrome, "Chrome theme name");
    rmSync(root, { recursive: true });
  });
}

test("a Marigold → Vintage round trip leaves every tracked file as committed (#158)", () => {
  const { root, tracked } = checkout();
  const before = Object.fromEntries(tracked.map((path) => [path, read(root, path)]));
  theme(root, "marigold");
  const changed = tracked.filter((path) => read(root, path) !== before[path]);
  // VSCode has no include, so its tracked settings are its pointer (ADR 0008).
  eq(changed.join(), "vscode/settings.json", "tracked files Marigold changes");
  theme(root, "vintage");
  for (const path of tracked) eq(read(root, path), before[path], path);
  rmSync(root, { recursive: true });
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
