// A scratch $HOME for running SketchyBar's config and plugins with a stub
// `sketchybar` that records each call, so the running bar and the repo's own
// sketchybar/active-theme aren't touched. Shared by the layout tests.
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// A scratch $HOME whose ~/.config/sketchybar is a copy of the repo's, with no
// Switch made yet, and a stub `sketchybar` on PATH that appends each call's
// arguments, one per line, to sketchybar.log.
function scratch() {
  const home = mkdtempSync(join(tmpdir(), "home-"));
  const config = join(home, ".config/sketchybar");
  cpSync(join(root, "sketchybar"), config, {
    recursive: true,
    filter: (path) => !/\/(active-theme|tests|icons|\.claude)$/.test(path),
  });
  mkdirSync(join(home, "bin"));
  stub({ home }, "sketchybar", 'printf "%s\\n" "$@" -- >> "$HOME/sketchybar.log"');
  return { home, config };
}

// A command on the scratch PATH that runs the shell script body.
export function stub({ home }, name, body) {
  writeFileSync(join(home, "bin", name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(home, "bin", name), 0o755);
}

// Every sketchybar call the script at path makes, as SketchyBar runs it, with
// env added to the environment SketchyBar gives it.
export function calls({ home, config }, path = join(config, "sketchybarrc"), env = {}) {
  rmSync(join(home, "sketchybar.log"), { force: true });
  const { stderr, status } = spawnSync("bash", [path], {
    env: { HOME: home, CONFIG_DIR: config, PATH: `${join(home, "bin")}:${process.env.PATH}`, ...env },
    encoding: "utf8",
  });
  if (status !== 0) throw new Error(`${path} failed: ${stderr}`);
  return readFileSync(join(home, "sketchybar.log"), "utf8");
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
