// Checks that Ghostty forwards the VSCode-style Cmd keys to Neovim (#196).
// Each is sent as a CSI-u sequence with the super modifier, which Neovim
// reads as <D-…> (nvim/lua/config/keymaps.lua, nvim/tests/keymaps_test.lua).
// Run: node ghostty/tests/keys_test.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// The Cmd keys forwarded, the CSI-u sequence each sends (codepoint;
// 1 + 8 for super + 1 for shift), and the key Neovim reads it as.
const forwarded = [
  ["super+p", "112;9u", "<D-p>"],
  ["super+shift+f", "102;10u", "<D-S-f>"],
  ["super+b", "98;9u", "<D-b>"],
  ["super+s", "115;9u", "<D-s>"],
  ["super+slash", "47;9u", "<D-/>"],
  ["super+period", "46;9u", "<D-.>"],
  ["super+shift+o", "111;10u", "<D-S-o>"],
  ["super+z", "122;9u", "<D-z>"],
  ["super+shift+z", "122;10u", "<D-S-z>"],
];

// Ghostty's own keys that stay Ghostty's, with their default actions.
const kept = {
  "super+shift+p": "toggle_command_palette",
  "super+w": "close_surface",
  "super+c": "copy_to_clipboard:mixed",
  "super+v": "paste_from_clipboard",
  "super+t": "new_tab",
  "super+n": "new_window",
  "ctrl+tab": "next_tab",
};

const keybinds = (text) =>
  Object.fromEntries(
    [...text.matchAll(/^\s*keybind\s*=\s*([^=\s]+)=(.*?)\s*$/gm)].map(([, trigger, action]) => [trigger, action]),
  );

const config = keybinds(read("ghostty/config"));

test("forwards exactly the VSCode-style Cmd keys, as CSI-u sequences", () => {
  eq(config, Object.fromEntries(forwarded.map(([trigger, csi]) => [trigger, `csi:${csi}`])), "keybinds");
});

test("leaves Ghostty's own keys alone", () => {
  for (const trigger of Object.keys(kept)) {
    if (trigger in config) throw new Error(`ghostty/config rebinds ${trigger}`);
  }
});

test("Neovim maps every key Ghostty forwards", () => {
  const keymaps = read("nvim/lua/config/keymaps.lua");
  for (const [trigger, , key] of forwarded) {
    if (!keymaps.includes(`"${key}"`)) throw new Error(`${trigger} sends ${key}, which keymaps.lua doesn't map`);
  }
});

// Ghostty's resolved keybinds, as `ghostty +show-config` prints them for a
// copy of ghostty/config. Skipped if Ghostty isn't installed.
const app = "/Applications/Ghostty.app/Contents/MacOS/ghostty";
if (existsSync(app)) {
  test("Ghostty loads the forwarded keys and keeps its own", () => {
    const home = mkdtempSync(join(tmpdir(), "ghostty-"));
    mkdirSync(join(home, "ghostty"), { recursive: true });
    copyFileSync(join(root, "ghostty/config"), join(home, "ghostty/config"));
    const { stdout } = spawnSync(app, ["+show-config", "--changes-only=false"], {
      env: { ...process.env, XDG_CONFIG_HOME: home },
      encoding: "utf8",
    });
    rmSync(home, { recursive: true });
    const resolved = keybinds(stdout);
    for (const [trigger, csi] of forwarded) eq(resolved[trigger], `csi:${csi}`, trigger);
    for (const [trigger, action] of Object.entries(kept)) eq(resolved[trigger], action, trigger);
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
