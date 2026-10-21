#!/usr/bin/env node
// Makes a Switch (#133): `theme <name>` makes <name> the active Theme.
// Run: theme <name>, or theme to print the active Theme.
// So far Ghostty and VSCode (#135) switch.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "./generate.mjs";

// The active Theme before any Switch: the one ghostty/config selects.
const DEFAULT = "vintage";

// The color theme line of VSCode's settings, with its key and value.
const colorTheme = /("workbench\.colorTheme": )"[^"]*"/;

// Makes a Switch, or prints the active Theme, in the repo at root. reload makes open Ghostty windows
// re-read their config. Returns { code, out }.
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
  reload();
  return { code: 0, out: "" };
}

// Ghostty reloads its config on SIGUSR2. pkill finding no Ghostty is fine:
// a window opened later reads the new config anyway.
function reloadGhostty() {
  spawnSync("pkill", ["-USR2", "-x", "ghostty"]);
}

// Run directly or through a symlink on PATH, not when imported by a test.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { code, out } = run({ root, args: process.argv.slice(2), reload: reloadGhostty });
  (code ? process.stderr : process.stdout).write(out);
  process.exit(code);
}
