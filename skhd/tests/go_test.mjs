// Checks for the launch/focus/cycle script behind ⌘1–0 and Hyper+D, and the
// life-tracker wrapper behind ⌘0 (#126). Runs them against stub yabai, skhd,
// open and nc on PATH, so nothing on the real desktop moves.
// Run: node skhd/tests/go_test.mjs
import { execFileSync } from "node:child_process";
import { accessSync, chmodSync, constants, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const scripts = join(root, "skhd/scripts");

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
      "-m query --windows") cat "$STUB_STATE/windows" 2>/dev/null || echo "[]" ;;
      "-m query --spaces --space") printf '{"index": %s}\\n' "$(cat "$STUB_STATE/space")" ;;
    esac`,
  // Switches the stub space at once: "ctrl + alt + shift - 0" is space 10.
  skhd: `
    echo "skhd $*" >> "$STUB_LOG"
    key=\${2##* }
    echo $(( key == 0 ? 10 : key )) > "$STUB_STATE/space"`,
  open: `echo "open $*" >> "$STUB_LOG"`,
  // Answering once the server stub has run, or if the test says it already is.
  nc: `[ -e "$STUB_STATE/server-up" ]`,
  sleep: ``,
  "life-tracker": `
    echo "life-tracker LIFE_TRACKER_NO_OPEN=$LIFE_TRACKER_NO_OPEN $*" >> "$STUB_LOG"
    touch "$STUB_STATE/server-up"`,
};
mkdirSync(bin, { recursive: true });
for (const [name, body] of Object.entries(stubs)) {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(bin, name), 0o755);
}

// Sets the stub desktop: the visible space, the focused window, and every
// window as [id, app, space, extra].
function desktop({ space = 1, focused, windows = [] }) {
  rmSync(state, { recursive: true, force: true });
  mkdirSync(state);
  writeFileSync(log, "");
  writeFileSync(join(state, "space"), String(space));
  const all = windows.map(([id, app, space, extra = {}]) => ({ id, app, space, "is-minimized": false, ...extra }));
  writeFileSync(join(state, "windows"), JSON.stringify(all));
  if (focused !== undefined) writeFileSync(join(state, "focused"), JSON.stringify(all.find((w) => w.id === focused)));
}

function run(script, args, extraEnv = {}) {
  execFileSync("sh", [join(scripts, script), ...args], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      STUB_LOG: log,
      STUB_STATE: state,
      LIFE_TRACKER_BIN: join(bin, "life-tracker"),
      ...extraEnv,
    },
  });
  return readFileSync(log, "utf8").trim().split("\n").filter(Boolean);
}

// Only the calls that act: yabai queries are left out.
const acts = (calls) => calls.filter((c) => !c.startsWith("yabai -m query"));

test("go.sh -s N sends the hidden Desktop N chord and nothing else", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1]] });
  eq(acts(run("go.sh", ["-s", "5"])).join("\n"), "skhd -k ctrl + alt + shift - 5", "calls");
});

test("go.sh -s 10 sends the Desktop 10 chord on the 0 key", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1]] });
  eq(acts(run("go.sh", ["-s", "10"])).join("\n"), "skhd -k ctrl + alt + shift - 0", "calls");
});

test("go.sh waits for the space switch before focusing", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1], [2, "Google Chrome", 2]] });
  const calls = run("go.sh", ["-s", "2", "Google Chrome"]);
  const chord = calls.indexOf("skhd -k ctrl + alt + shift - 2");
  const check = calls.indexOf("yabai -m query --spaces --space", chord);
  const focus = calls.indexOf("yabai -m window --focus 2");
  if (chord < 0 || check < chord || focus < check) throw new Error(`out of order: ${calls.join(" | ")}`);
});

test("go.sh focuses the app's window on space N when another app is frontmost", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1], [4, "Google Chrome", 2], [2, "Google Chrome", 2]] });
  eq(
    acts(run("go.sh", ["-s", "2", "Google Chrome"])).join("\n"),
    "skhd -k ctrl + alt + shift - 2\nyabai -m window --focus 2",
    "calls",
  );
});

test("go.sh launches the app when it has no window on space N", () => {
  desktop({ windows: [] });
  eq(acts(run("go.sh", ["-s", "4", "LINE"])).join("\n"), "skhd -k ctrl + alt + shift - 4\nopen -a LINE", "calls");
  desktop({ windows: [[6, "LINE", 7]] });
  eq(acts(run("go.sh", ["-s", "4", "LINE"])).at(-1), "open -a LINE", "only on another space");
});

test("go.sh cycles to the app's next window on space N when it's already frontmost", () => {
  desktop({
    focused: 3,
    windows: [[7, "Ghostty", 1], [3, "Ghostty", 1], [5, "Google Chrome", 2], [9, "Ghostty", 1], [4, "Ghostty", 6]],
  });
  eq(
    acts(run("go.sh", ["-s", "1", "Ghostty"])).join("\n"),
    "skhd -k ctrl + alt + shift - 1\nyabai -m window --focus 7",
    "calls",
  );
});

test("go.sh wraps from the app's last window to its first", () => {
  desktop({ focused: 9, windows: [[7, "Ghostty", 1], [3, "Ghostty", 1], [9, "Ghostty", 1]] });
  eq(acts(run("go.sh", ["-s", "1", "Ghostty"])).at(-1), "yabai -m window --focus 3", "last call");
});

test("go.sh skips minimized windows when cycling", () => {
  desktop({ focused: 3, windows: [[3, "Ghostty", 1], [5, "Ghostty", 1, { "is-minimized": true }], [8, "Ghostty", 1]] });
  eq(acts(run("go.sh", ["-s", "1", "Ghostty"])).at(-1), "yabai -m window --focus 8", "last call");
});

test("go.sh does nothing more when the frontmost app has one window on space N", () => {
  desktop({ focused: 3, windows: [[3, "Ghostty", 1]] });
  eq(acts(run("go.sh", ["-s", "1", "Ghostty"])).join("\n"), "skhd -k ctrl + alt + shift - 1", "calls");
});

test("go.sh doesn't cycle when the app is frontmost on another space", () => {
  desktop({ space: 5, focused: 8, windows: [[8, "Google Chrome", 5], [2, "Google Chrome", 2]] });
  eq(acts(run("go.sh", ["-s", "2", "Google Chrome"])).at(-1), "yabai -m window --focus 2", "last call");
});

test("go.sh without -s (Finder) never switches space", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1], [4, "Finder", 3]] });
  eq(acts(run("go.sh", ["Finder"])).join("\n"), "open -a Finder", "focus");
  desktop({ focused: 4, windows: [[4, "Finder", 1], [6, "Finder", 3]] });
  eq(acts(run("go.sh", ["Finder"])).join("\n"), "yabai -m window --focus 6", "cycle");
});

test("life-tracker.sh starts the server when it's down, then goes to space 10", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1]] });
  eq(
    acts(run("life-tracker.sh", [])).join("\n"),
    [
      "life-tracker LIFE_TRACKER_NO_OPEN=1 ",
      "skhd -k ctrl + alt + shift - 0",
      "open -a life-tracker",
    ].join("\n"),
    "calls",
  );
});

test("life-tracker.sh leaves a running server alone", () => {
  desktop({ focused: 1, windows: [[1, "Ghostty", 1]] });
  writeFileSync(join(state, "server-up"), "");
  eq(
    acts(run("life-tracker.sh", [])).join("\n"),
    "skhd -k ctrl + alt + shift - 0\nopen -a life-tracker",
    "calls",
  );
});

test("the scripts are executable", () => {
  for (const name of ["go.sh", "life-tracker.sh"]) {
    accessSync(join(scripts, name), constants.X_OK);
  }
});

rmSync(scratch, { recursive: true, force: true });

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
