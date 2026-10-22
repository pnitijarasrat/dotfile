#!/usr/bin/env node
// Makes a Switch (#133): `theme <name>` makes <name> the active Theme.
// Run: theme <name>, or theme to print the active Theme.
// So far Ghostty, VSCode (#135, #153), SketchyBar and JankyBorders (#136) switch, as
// do macOS's appearance, accent and highlight (#138); Chrome (#137) can't, so
// it prints Chrome's manual step.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "./generate.mjs";

// The active Theme before any Switch: the one ghostty/config selects.
const DEFAULT = "vintage";

// The lines of VSCode's settings a Switch owns (ADR 0008), each with the value
// it takes from a Theme: the color theme, and the shape the Theme gives VSCode.
const vscodeSettings = {
  "workbench.colorTheme": (theme) => theme.name,
  "window.titleBarStyle": (theme) => theme.vscode.title_bar,
  "workbench.experimental.modernUI": (theme) => theme.vscode.modern_ui,
};

// A line of VSCode's settings, with its key and its string or boolean value.
const settingsLine = (key) => new RegExp(`("${key.replaceAll(".", "\\.")}": )("[^"]*"|true|false)`);

// macOS accents as System Settings stores them in AppleAccentColor.
const accents = { graphite: -1, red: 0, orange: 1, yellow: 2, green: 3, blue: 4, purple: 5, pink: 6 };

// macOS highlight colors as System Settings stores them in AppleHighlightColor.
const highlights = {
  graphite: "0.847059 0.847059 0.862745 Graphite",
  red: "1.000000 0.733333 0.721569 Red",
  orange: "1.000000 0.874510 0.701961 Orange",
  yellow: "1.000000 0.937255 0.690196 Yellow",
  green: "0.752941 0.964706 0.678431 Green",
  blue: "0.698039 0.843137 1.000000 Blue",
  purple: "0.968627 0.831373 1.000000 Purple",
  pink: "1.000000 0.749020 0.823529 Pink",
};

// Why a Theme's macOS appearance, accent and highlight can't be set, if they can't.
function macosProblem({ name, macos }) {
  if (!macos) return `${name} doesn't say which appearance, accent and highlight macOS uses`;
  const { appearance, accent, highlight } = macos;
  if (!["light", "dark"].includes(appearance)) return `${name}'s macOS appearance ${JSON.stringify(appearance)} isn't light or dark`;
  if (!Object.hasOwn(accents, accent)) {
    return `${name}'s macOS accent ${JSON.stringify(accent)} isn't one of ${Object.keys(accents).join(", ")}`;
  }
  if (!Object.hasOwn(highlights, highlight)) {
    return `${name}'s macOS highlight ${JSON.stringify(highlight)} isn't one of ${Object.keys(highlights).join(", ")}`;
  }
}

// Why a Theme's VSCode shape can't be set, if it can't.
function vscodeProblem({ name, vscode }) {
  if (!vscode) return `${name} doesn't say how VSCode is shaped`;
  const { modern_ui, title_bar } = vscode;
  if (typeof modern_ui !== "boolean") return `${name}'s VSCode modern_ui ${JSON.stringify(modern_ui)} isn't true or false`;
  if (!["native", "custom"].includes(title_bar)) return `${name}'s VSCode title_bar ${JSON.stringify(title_bar)} isn't native or custom`;
}

// The commands that set macOS to a Theme's appearance, accent and highlight.
function macosCommands({ appearance, accent, highlight }) {
  return [
    ["defaults", "write", "-g", "AppleAccentColor", "-int", String(accents[accent])],
    // System Settings also writes the Aqua variant: 6 for Graphite, 1 otherwise.
    ["defaults", "write", "-g", "AppleAquaColorVariant", "-int", accent === "graphite" ? "6" : "1"],
    ["defaults", "write", "-g", "AppleHighlightColor", "-string", highlights[highlight]],
    // Running apps only pick up the new accent and highlight when told, as
    // System Settings tells them.
    ["osascript", "-l", "JavaScript", "-e", 'ObjC.import("Foundation"); for (const name of ["AppleColorPreferencesChangedNotification", "AppleAquaColorVariantChanged"]) $.NSDistributedNotificationCenter.defaultCenter.postNotificationNameObjectUserInfoDeliverImmediately(name, null, null, true)'],
    ["osascript", "-e", `tell application "System Events" to tell appearance preferences to set dark mode to ${appearance === "dark"}`],
  ];
}

// Makes a Switch, or prints the active Theme, in the repo at root. reload(tool)
// makes a running tool re-read its config; system(command, ...args) runs a
// command that changes macOS settings. Returns { code, out }.
export function run({ root, args, reload, system }) {
  const [name] = args;
  const activeFile = join(root, "themes/active");
  if (name === undefined) {
    return { code: 0, out: existsSync(activeFile) ? readFileSync(activeFile, "utf8") : `${DEFAULT}\n` };
  }
  const all = themes(root);
  const ids = all.map(({ id }) => id);
  if (!ids.includes(name)) {
    return { code: 1, out: `No Theme named ${name}. Available Themes:\n${ids.map((id) => `  ${id}\n`).join("")}` };
  }
  // Checked before anything is written, so a failed Switch changes nothing.
  const { theme } = all.find(({ id }) => id === name);
  const problem = macosProblem(theme) ?? vscodeProblem(theme);
  if (problem) return { code: 1, out: `${problem}\n` };
  const settingsFile = join(root, "vscode/settings.json");
  const settings = readFileSync(settingsFile, "utf8");
  const missing = Object.keys(vscodeSettings).find((key) => !settingsLine(key).test(settings));
  if (missing) return { code: 1, out: `vscode/settings.json has no "${missing}" line\n` };
  writeFileSync(activeFile, `${name}\n`);
  // ghostty/config loads this after its own theme line, so it wins.
  writeFileSync(join(root, "ghostty/active-theme"), `theme = ${name}\n`);
  // VSCode has no include, so its pointer is the lines it owns in the tracked
  // settings.json (ADR 0008). VSCode applies them to open windows.
  const switched = Object.entries(vscodeSettings).reduce(
    (text, [key, value]) => text.replace(settingsLine(key), (_, start) => start + JSON.stringify(value(theme))),
    settings,
  );
  writeFileSync(settingsFile, switched);
  // sketchybar/color.sh, which JankyBorders' bordersrc also sources, loads
  // this after its own default.
  writeFileSync(join(root, "sketchybar/active-theme"), `active_theme=${name}\n`);
  for (const tool of ["ghostty", "sketchybar", "borders"]) reload(tool);
  for (const command of macosCommands(theme.macos)) system(...command);
  // VSCode only sees a Theme added to its extension after a reload (ADR 0008),
  // and Vintage is always there.
  const vscode = name === DEFAULT ? "" : `If ${theme.name} is new since VSCode's windows opened, run Developer: Reload Window once.\n`;
  // No supported route outside Chrome can change its theme, and Chrome uninstalls a theme
  // it switches away from, so every Switch loads the Theme's extension (ADR 0009).
  const chrome = `To switch Chrome, open chrome://extensions, turn on Developer mode, click Load unpacked and pick ${join(root, "chrome", `${name}-theme`)} (Cmd+Shift+G types a path).\n`;
  return { code: 0, out: vscode + chrome };
}

// How each running tool re-reads its config. A tool that isn't running is
// fine: it reads the new config when it starts.
const reloaders = {
  // Ghostty reloads its config on SIGUSR2.
  ghostty: () => spawnSync("pkill", ["-USR2", "-x", "ghostty"]),
  sketchybar: () => spawnSync("sketchybar", ["--reload"]),
  // Running borders with options hands them to the running instance; with
  // none running, bordersrc would start one in the foreground, so skip it.
  borders: () => {
    if (spawnSync("pgrep", ["-x", "borders"]).status === 0) {
      spawnSync("bash", [join(process.env.HOME, ".config/borders/bordersrc")]);
    }
  },
};

// Run directly or through a symlink on PATH, not when imported by a test.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  // A failed macOS command, such as System Events being refused, is reported
  // but doesn't undo the Switch.
  const system = (command, ...args) => {
    const { status, stderr } = spawnSync(command, args, { encoding: "utf8" });
    if (status !== 0) process.stderr.write(stderr || `${command} failed\n`);
  };
  const { code, out } = run({ root, args: process.argv.slice(2), reload: (tool) => reloaders[tool](), system });
  (code ? process.stderr : process.stdout).write(out);
  process.exit(code);
}
