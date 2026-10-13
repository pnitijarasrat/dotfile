// Checks for the launch/focus/cycle script behind Hyper+D (#126). Runs it
// against stub yabai and open on PATH, so nothing on the real desktop moves.
// Run: node skhd/tests/go_test.mjs
import { execFileSync } from "node:child_process";
import { accessSync, chmodSync, constants, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(root, "skhd/scripts/go.sh");

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

const scratch = mkdtempSync(join(tmpdir(), "skhd-go-"));
const bin = join(scratch, "bin");
const log = join(scratch, "calls.log");
const state = join(scratch, "state");

// Each stub logs its call, one line per call, and answers from files in $STUB_STATE.
const stubs = {
  yabai: `
    echo "yabai $*" >> "$STUB_LOG"
    case "$*" in
      "-m query --windows --window") cat "$STUB_STATE/focused" 2>/dev/null || exit 1 ;;
      "-m query --windows") cat "$STUB_STATE/windows" ;;
    esac`,
  open: `echo "open $*" >> "$STUB_LOG"`,
};
mkdirSync(bin, { recursive: true });
for (const [name, body] of Object.entries(stubs)) {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(bin, name), 0o755);
}

// Sets the stub desktop: the focused window, and every window as [id, app, extra].
function desktop({ focused, windows = [] }) {
  rmSync(state, { recursive: true, force: true });
  mkdirSync(state);
  writeFileSync(log, "");
  const all = windows.map(([id, app, extra = {}]) => ({ id, app, "is-minimized": false, ...extra }));
  writeFileSync(join(state, "windows"), JSON.stringify(all));
  if (focused !== undefined) writeFileSync(join(state, "focused"), JSON.stringify(all.find((w) => w.id === focused)));
}

// The calls that act: yabai queries are left out.
function run(app) {
  execFileSync("sh", [script, app], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, STUB_LOG: log, STUB_STATE: state },
  });
  return readFileSync(log, "utf8")
    .trim()
    .split("\n")
    .filter((c) => c && !c.startsWith("yabai -m query"))
    .join("\n");
}

test("launches or brings the app forward when another app is frontmost", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty"], [4, "Finder"]] });
  eq(run("Finder"), "open -a Finder", "calls");
});

test("launches the app when nothing has focus", () => {
  desktop({ windows: [] });
  eq(run("Finder"), "open -a Finder", "calls");
});

test("cycles to the app's next window when it's already frontmost", () => {
  desktop({ focused: 3, windows: [[7, "Finder"], [3, "Finder"], [5, "Ghostty"], [9, "Finder"]] });
  eq(run("Finder"), "yabai -m window --focus 7", "calls");
});

test("wraps from the app's last window to its first", () => {
  desktop({ focused: 9, windows: [[7, "Finder"], [3, "Finder"], [9, "Finder"]] });
  eq(run("Finder"), "yabai -m window --focus 3", "calls");
});

test("skips minimized windows when cycling", () => {
  desktop({ focused: 3, windows: [[3, "Finder"], [5, "Finder", { "is-minimized": true }], [8, "Finder"]] });
  eq(run("Finder"), "yabai -m window --focus 8", "calls");
});

test("does nothing when the frontmost app has one window", () => {
  desktop({ focused: 3, windows: [[3, "Finder"]] });
  eq(run("Finder"), "", "calls");
});

test("go.sh is executable", () => {
  accessSync(script, constants.X_OK);
});

rmSync(scratch, { recursive: true, force: true });

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
