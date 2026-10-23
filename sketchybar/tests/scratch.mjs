// A scratch $HOME for running SketchyBar's config and plugins with stub
// `sketchybar` and `yabai` commands that record each call, so the running bar,
// the running yabai and the repo's own sketchybar/active-theme aren't touched.
// Shared by the layout tests.
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// A scratch $HOME whose ~/.config/sketchybar is a copy of the repo's, with no
// Switch made yet, and stub `sketchybar` and `yabai` commands on PATH that
// append each call's arguments, one per line, to sketchybar.log and yabai.log.
// The stub yabai is running, with yabairc's window_gap.
const gap = readFileSync(join(root, "yabai/yabairc"), "utf8").match(/^yabai -m config window_gap (\d+)$/m)[1];

function scratch() {
  const home = mkdtempSync(join(tmpdir(), "home-"));
  const config = join(home, ".config/sketchybar");
  cpSync(join(root, "sketchybar"), config, {
    recursive: true,
    filter: (path) => !/\/(active-theme|tests|icons|\.claude)$/.test(path),
  });
  mkdirSync(join(home, "bin"));
  stub({ home }, "sketchybar", 'printf "%s\\n" "$@" -- >> "$HOME/sketchybar.log"');
  stub({ home }, "yabai", `printf "%s\\n" "$@" -- >> "$HOME/yabai.log"\n[ "$*" = "-m config window_gap" ] && echo ${gap}\nexit 0`);
  return { home, config };
}

// A command on the scratch PATH that runs the shell script body.
export function stub({ home }, name, body) {
  writeFileSync(join(home, "bin", name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(home, "bin", name), 0o755);
}

// Every sketchybar call the script at path makes, as SketchyBar runs it, with
// env added to the environment SketchyBar gives it. Its temporary files go in
// the scratch $HOME.
export function calls({ home, config }, path = join(config, "sketchybarrc"), env = {}) {
  for (const log of ["sketchybar.log", "yabai.log"]) rmSync(join(home, log), { force: true });
  const { stderr, status } = spawnSync("bash", [path], {
    env: { HOME: home, TMPDIR: home, CONFIG_DIR: config, PATH: `${join(home, "bin")}:${process.env.PATH}`, ...env },
    encoding: "utf8",
  });
  if (status !== 0) throw new Error(`${path} failed: ${stderr}`);
  return existsSync(join(home, "sketchybar.log")) ? readFileSync(join(home, "sketchybar.log"), "utf8") : "";
}

// yabai's top and bottom padding after the last call that set each, as
// numbers, or undefined if no call set it.
export function padding({ home }) {
  const log = join(home, "yabai.log");
  const args = existsSync(log) ? readFileSync(log, "utf8").split("\n") : [];
  const set = {};
  args.forEach((arg, i) => {
    const side = arg.match(/^(top|bottom)_padding$/)?.[1];
    if (side && args[i - 1] === "config" && args[i + 1] !== "--") set[side] = Number(args[i + 1]);
  });
  return set;
}

export const switchTo = ({ config }, name) => writeFileSync(join(config, "active-theme"), `active_theme=${name}\n`);

export function withScratch(fn) {
  const bar = scratch();
  try {
    fn(bar);
  } finally {
    rmSync(bar.home, { recursive: true });
  }
}
