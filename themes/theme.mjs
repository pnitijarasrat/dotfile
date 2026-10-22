#!/usr/bin/env node
// Makes a Switch (#133): `theme <name>` makes <name> the active Theme.
// Run: theme <name>, or theme to print the active Theme.
// So far Ghostty, VSCode (#135), SketchyBar and JankyBorders (#136) switch;
// Chrome (#137) can't, so it prints Chrome's manual step.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "./generate.mjs";

// The active Theme before any Switch: the one ghostty/config selects.
const DEFAULT = "vintage";

// The color theme line of VSCode's settings, with its key and value.
const colorTheme = /("workbench\.colorTheme": )"[^"]*"/;

// Makes a Switch, or prints the active Theme, in the repo at root. reload(tool)
// makes a running tool re-read its config. Returns { code, out }.
export function run({ root, args, reload }) {
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
  const settingsFile = join(root, "vscode/settings.json");
  const settings = readFileSync(settingsFile, "utf8");
  if (!colorTheme.test(settings)) {
    return { code: 1, out: 'vscode/settings.json has no "workbench.colorTheme" line\n' };
  }
  const label = all.find(({ id }) => id === name).theme.name;
  writeFileSync(activeFile, `${name}\n`);
  // ghostty/config loads this after its own theme line, so it wins.
  writeFileSync(join(root, "ghostty/active-theme"), `theme = ${name}\n`);
  // VSCode has no include, so its pointer is the color theme line of the
  // tracked settings.json (ADR 0008). VSCode applies it to open windows.
  writeFileSync(settingsFile, settings.replace(colorTheme, (_, key) => key + JSON.stringify(label)));
  // sketchybar/color.sh, which JankyBorders' bordersrc also sources, loads
  // this after its own default.
  writeFileSync(join(root, "sketchybar/active-theme"), `active_theme=${name}\n`);
  for (const tool of ["ghostty", "sketchybar", "borders"]) reload(tool);
  // VSCode only sees a Theme added to its extension after a reload (ADR 0008),
  // and Vintage is always there.
  const vscode = name === DEFAULT ? "" : `If ${label} is new since VSCode's windows opened, run Developer: Reload Window once.\n`;
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
  const { code, out } = run({ root, args: process.argv.slice(2), reload: (tool) => reloaders[tool]() });
  (code ? process.stderr : process.stdout).write(out);
  process.exit(code);
}
