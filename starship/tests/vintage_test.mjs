// Checks for each Theme's Starship prompt and the Switch's choice of it (#13, #154).
// Draws real prompts with the installed starship in a scratch $HOME, so the
// repo's own starship/active-theme isn't touched.
// Run: node starship/tests/vintage_test.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "../../themes/generate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

// Nerd Font icons the prompt shows: the folder on the directory, the branch,
// and Node.js as the runtime.
const folder = "";
const branch = "";
const node = "";

// A scratch $HOME whose ~/.config holds the repo's Starship files, and a git
// repo on branch main with a package.json, so the directory, branch and
// Node.js segments all show.
function scratch() {
  const home = mkdtempSync(join(tmpdir(), "home-"));
  mkdirSync(join(home, ".config/starship"), { recursive: true });
  symlinkSync(join(root, "starship.toml"), join(home, ".config/starship.toml"));
  symlinkSync(join(root, "starship/init.zsh"), join(home, ".config/starship/init.zsh"));
  symlinkSync(join(root, "starship/themes"), join(home, ".config/starship/themes"));
  const project = join(home, "project");
  mkdirSync(project);
  spawnSync("git", ["init", "-q", "-b", "main"], { cwd: project });
  writeFileSync(join(project, "package.json"), "{}\n");
  return { home, project };
}

// Draws a prompt as zsh does: runs every precmd function, then expands
// PROMPT, which runs starship.
const draw = 'for f in $precmd_functions; do $f; done; print -r -- "${(e)PROMPT}"';

// What a zsh with ~/.zshrc sourcing starship/init.zsh prints while running
// commands, which default to drawing one prompt.
function prompt({ home, project }, commands = [draw]) {
  const script = ["source ~/.config/starship/init.zsh", ...commands].join("\n");
  const env = { HOME: home, PATH: process.env.PATH, TERM: "xterm-256color" };
  const { stdout, stderr, status } = spawnSync("zsh", ["-f", "-c", script], { cwd: project, env, encoding: "utf8" });
  if (status !== 0) throw new Error(`zsh failed: ${stderr}`);
  // Drop color escapes and zsh's %{ %} wrappers around them.
  return stdout.replace(/%\{|%\}/g, "").replace(/\x1b\[[0-9;]*m/g, "");
}

const point = ({ home }, name) => writeFileSync(join(home, ".config/starship/active-theme"), `${name}\n`);
const hasIcons = (text) => [folder, branch, node].every((icon) => text.includes(icon));

function eqVintage(text, what) {
  if (!text.includes("git main") || hasIcons(text)) throw new Error(`${what}: expected Vintage's prompt, got ${JSON.stringify(text)}`);
}

// Every setting Starship draws a prompt with, its own defaults included.
function settings(config) {
  const { stdout, status, stderr } = spawnSync("starship", ["print-config"], { env: { ...process.env, STARSHIP_CONFIG: config }, encoding: "utf8" });
  if (status !== 0) throw new Error(`starship print-config failed: ${stderr}`);
  return stdout;
}

test("the committed starship.toml is Vintage's prompt, so a fresh checkout shows it", () => {
  eq(realpathSync(join(root, "starship.toml")), realpathSync(join(root, "starship/themes/vintage.toml")), "starship.toml");
});

test("Vintage's prompt keeps > and words, with no Nerd Font icons or emoji", () => {
  const text = readFileSync(join(root, "starship/themes/vintage.toml"), "utf8");
  if (/[^\x00-\x7f]/.test(text)) throw new Error("starship/themes/vintage.toml has a character outside ASCII");
  for (const line of ['success_symbol = "[>](bold green)"', 'error_symbol = "[>](bold red)"', 'vimcmd_symbol = "[<](bold green)"', '[git_branch]\nsymbol = "git "', '[nodejs]\nsymbol = "nodejs "']) {
    if (!text.includes(line)) throw new Error(`starship/themes/vintage.toml has no ${JSON.stringify(line)}`);
  }
});

test("Vintage's prompt is the one from before the Switch, setting for setting (#154)", () => {
  eq(settings(join(root, "starship/themes/vintage.toml")), settings(join(root, "starship/tests/fixtures/before.toml")), "Vintage's Starship settings");
});

test("each Theme's prompt has Nerd Font icons on the directory, branch and runtime exactly when its rules.icons says so", () => {
  for (const { id, theme } of themes(root)) {
    const s = scratch();
    point(s, id);
    const text = prompt(s);
    rmSync(s.home, { recursive: true });
    eq(hasIcons(text), theme.rules.icons, `${id}'s prompt has icons (${JSON.stringify(text)})`);
    if (!text.includes(">")) throw new Error(`${id}'s prompt has no > (${JSON.stringify(text)})`);
  }
});

test("before any Switch, the prompt is Vintage's", () => {
  const s = scratch();
  const text = prompt(s);
  rmSync(s.home, { recursive: true });
  eqVintage(text, "prompt before any Switch");
});

test("a new prompt after a Switch is the new Theme's, in the same shell", () => {
  const s = scratch();
  point(s, "marigold");
  const text = prompt(s, [draw, "print -r -- ---", "print vintage > ~/.config/starship/active-theme", draw]);
  rmSync(s.home, { recursive: true });
  const [marigold, vintage] = text.split("---");
  eq(hasIcons(marigold), true, "first prompt, under Marigold, has icons");
  eq(hasIcons(vintage), false, "next prompt, under Vintage, has icons");
});

test("the prompt stays Vintage's if the active Theme's prompt was never generated", () => {
  const s = scratch();
  point(s, "missing");
  const text = prompt(s);
  rmSync(s.home, { recursive: true });
  eqVintage(text, "prompt under a Theme never generated");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
