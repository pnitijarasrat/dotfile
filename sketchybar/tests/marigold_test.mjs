// Checks for the Marigold theme's own SketchyBar (#156, #170), as the SketchyBar row
// of docs/theme-spec-marigold.md describes it. Runs sketchybarrc and the
// plugins in a scratch $HOME (scratch.mjs) after a Switch to Marigold.
// Run: node sketchybar/tests/marigold_test.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calls, root, stub, switchTo, withScratch } from "./scratch.mjs";

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

const marigold = JSON.parse(readFileSync(join(root, "themes/marigold.json"), "utf8"));
// A Frame role's color as SketchyBar takes it, opaque.
const role = (name) => `0xff${marigold.palettes.frame[name] ?? marigold.palettes.frame_data[name]}`.replace("#", "").toLowerCase();

// The bar, the defaults and each item, in the order the calls add them, as
// { name, position, props, events }. Items take the defaults' props unless
// they set their own.
function items(log) {
  const args = log.split("\n").filter((arg) => arg !== "--");
  const all = new Map();
  const defaults = {};
  let current;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--bar" || arg === "--default") {
      current = arg === "--bar" ? (all.get("bar") ?? all.set("bar", { name: "bar", props: {} }).get("bar")).props : defaults;
    } else if (arg === "--add") {
      const [type, name, position] = args.slice(i + 1, i + 4);
      // An event, maybe with the macOS notification that triggers it.
      if (type === "event") {
        i += position && !position.startsWith("--") ? 3 : 2;
        current = undefined;
        continue;
      }
      all.set(name, { name, type, position, props: { ...defaults }, events: [] });
      current = undefined;
      i += 3;
    } else if (arg === "--subscribe") {
      const item = all.get(args[++i]);
      for (; args[i + 1] && !args[i + 1].startsWith("--") && !args[i + 1].includes("="); i++) item.events.push(args[i + 1]);
      current = undefined;
    } else if (arg === "--set") {
      // A plugin sets an item its script never added.
      const name = args[++i];
      if (!all.has(name)) all.set(name, { name, props: {} });
      current = all.get(name).props;
    } else if (arg.startsWith("--")) {
      current = undefined;
    } else if (current && arg.includes("=")) {
      const at = arg.indexOf("=");
      current[arg.slice(0, at)] = arg.slice(at + 1);
    }
  }
  return all;
}

// Fails unless icon is one SF Symbols character, from SF Pro's Private Use Area.
const symbol = (icon, what) => {
  if (!/^[\u{100000}-\u{10fffd}]$/u.test(icon ?? "")) throw new Error(`${what} ${JSON.stringify(icon)} isn't an SF Symbols character`);
};

// yabai's window gap, which the bar sits at from the screen edges.
const gap = readFileSync(join(root, "yabai/yabairc"), "utf8").match(/^yabai -m config window_gap (\d+)$/m)[1];

// yabai's spaces, as `yabai -m query --spaces` gives them, for spaces as
// [index, display] or [index, display, "fullscreen"]. The stub still records
// each call and answers yabairc's window gap, as scratch.mjs's does.
const yabaiSpaces = (...spaces) => (scratch) => {
  const json = spaces.map(([index, display, full]) => ({ index, display, "is-native-fullscreen": full === "fullscreen" }));
  stub(scratch, "yabai", `printf "%s\\n" "$@" -- >> "$HOME/yabai.log"
case "$*" in
"-m config window_gap") echo ${gap} ;;
"-m query --spaces") echo '${JSON.stringify(json)}' ;;
esac
exit 0`);
};
// Ten spaces, all on one display.
const oneDisplay = yabaiSpaces(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sid) => [sid, 1]));

const marigoldBar = (setup = oneDisplay) => {
  let all;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    setup(scratch);
    all = items(calls(scratch));
  });
  return all;
};


test("the bar floats at the top, 28 high, a window gap from the top and sides", () => {
  const { props } = marigoldBar().get("bar");
  eq(props.position, "top", "position");
  eq(props.height, "28", "height");
  eq(props.y_offset, gap, "y_offset");
  eq(props.margin, gap, "margin");
});

test("the bar hides on a display whose front window is full screen", () => {
  // SketchyBar hides a display's bar while its space is a native full-screen
  // one, and shows it again when it isn't, unless show_in_fullscreen is on.
  eq(marigoldBar().get("bar").props.show_in_fullscreen, "off", "show_in_fullscreen");
});

test("the macOS menu bar slides down over the bar", () => {
  // topmost=window is the floating window level, below the menu bar's;
  // topmost=on would sit above it.
  eq(marigoldBar().get("bar").props.topmost, "window", "topmost");
});

test("items have no gap between them, but the front app is a window gap from the spaces", () => {
  for (const item of marigoldBar().values()) {
    if (item.name === "bar") continue;
    eq(item.props.padding_left, item.name === "front_app" ? gap : "0", `${item.name} padding_left`);
    eq(item.props.padding_right, "0", `${item.name} padding_right`);
  }
});

test("the bar is frame_face at its own opacity and blur, rounded by the Theme rules, with a 1px frame_highlight border", () => {
  const { props } = marigoldBar().get("bar");
  const alpha = Math.round(marigold.bar.opacity * 255).toString(16);
  eq(props.color, role("frame_face").replace(/^0xff/, `0x${alpha}`), "color");
  eq(props.blur_radius, String(marigold.bar.blur), "blur_radius");
  eq(props.corner_radius, String(marigold.rules.radius), "corner_radius");
  eq(props.border_color, role("frame_highlight"), "border_color");
  eq(props.border_width, "1", "border_width");
});

test("spaces are numbered items on the left, then the front app", () => {
  const items = [...marigoldBar().values()].filter((item) => item.position === "left" && item.props.drawing !== "off");
  eq(items.map((item) => item.name).join(" "), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sid) => `space.${sid}`).join(" ") + " front_app", "left items");
  eq(items.slice(0, 10).map((item) => item.props.icon).join(""), "1234567890", "space numbers");
  for (const space of items.slice(0, 10)) {
    eq(space.props["icon.color"], role("frame_gray_text"), `${space.name} icon.color`);
    // Drawn only on the active space, by plugins/marigold/space.sh.
    eq(space.props["background.color"], role("frame_selection"), `${space.name} background.color`);
  }
});

// Each status item's own Frame data color, as the Theme spec gives them.
const dataColors = {
  media: "frame_data_magenta",
  cpu: "frame_data_cyan",
  memory: "frame_data_orange",
  weather: "frame_data_yellow",
  language: "frame_data_cyan",
  volume: "frame_data_magenta",
  wifi: "frame_data_blue",
  battery: "frame_data_green",
  clock: "frame_data_yellow",
};
const statusItems = Object.keys(dataColors);
const labelFont = `${marigold.fonts.work.family[0]}:Regular:13.0`;
// The status items on the bar itself, not in a popup or hidden.
const status = (bar) => [...bar.values()].filter((item) => statusItems.includes(item.name));

test("now playing is in the center", () => {
  const items = [...marigoldBar().values()].filter((item) => item.position === "center");
  eq(items.map((item) => item.name).join(" "), "media", "center items");
});

test("CPU, memory, weather, language, volume, Wi-Fi, battery and clock are on the right, in that order", () => {
  const items = [...marigoldBar().values()].filter((item) => item.position === "right" && item.props.drawing !== "off");
  // SketchyBar adds right items from the right edge in.
  eq(items.map((item) => item.name).reverse().join(" "), "cpu memory weather language volume wifi battery clock", "right items, left to right");
});

test("status items show SF Symbols at 13 in their Frame data colors", () => {
  for (const item of status(marigoldBar())) {
    eq(item.props["icon.color"], role(dataColors[item.name]), `${item.name} icon.color`);
    eq(item.props["icon.font"], "SF Pro:Regular:13.0", `${item.name} icon.font`);
    symbol(item.props.icon, `${item.name}'s icon`);
  }
});

test("status items show their labels in the Work surface's Nerd Font at 13", () => {
  for (const item of status(marigoldBar())) {
    eq(item.props["label.font"], labelFont, `${item.name} label.font`);
    if (item.props["label.drawing"] === "off") throw new Error(`${item.name} hides its label`);
  }
});

// Every item a Marigold plugin adds or sets, run as SketchyBar runs it, for
// the item NAME (or "item").
function run(name, env, setup = () => {}) {
  let all;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    setup(scratch);
    all = items(calls(scratch, join(scratch.config, "plugins/marigold", name), { NAME: "item", ...env }));
  });
  return all;
}

// The props a Marigold plugin sets on its item.
function plugin(name, env, setup = () => {}) {
  const props = run(name, env, setup).get(env.NAME ?? "item")?.props;
  if (!props) throw new Error(`${name} set nothing on its item`);
  return props;
}

// pmset's battery report at a charge, on battery power or charging.
const battery = (percent, source = "Battery Power") => (scratch) =>
  stub(scratch, "pmset", `printf "Now drawing from '${source}'\\n -InternalBattery-0 (id=1)\\t${percent}%%; discharging; 3:00 remaining present: true\\n"`);

test("the active space is marigold with frame_selection_text", () => {
  const props = plugin("space.sh", { SELECTED: "true" });
  eq(props["background.drawing"], "on", "background.drawing");
  eq(props["icon.color"], role("frame_selection_text"), "icon.color");
});

test("the other spaces are frame_gray_text", () => {
  const props = plugin("space.sh", { SELECTED: "false" });
  eq(props["background.drawing"], "off", "background.drawing");
  eq(props["icon.color"], role("frame_gray_text"), "icon.color");
});

test("the battery shows its charge with its icon in frame_data_green", () => {
  const props = plugin("battery.sh", {}, battery(80));
  eq(props.label, "80%", "label");
  eq(props["icon.color"], role("frame_data_green"), "icon.color");
  symbol(props.icon, "icon");
});

test("a low battery turns frame_data_red", () => {
  eq(plugin("battery.sh", {}, battery(15))["icon.color"], role("frame_data_red"), "icon.color");
});

test("a low battery that's charging stays frame_data_green", () => {
  eq(plugin("battery.sh", {}, battery(15, "AC Power"))["icon.color"], role("frame_data_green"), "icon.color");
});

test("muted and unmuted volume show different SF Symbols, and the volume or muted", () => {
  const muted = plugin("volume.sh", { SENDER: "volume_change", INFO: "50" }, (scratch) => stub(scratch, "osascript", "echo true"));
  symbol(muted.icon, "muted icon");
  eq(muted.label, "muted", "muted label");
  const loud = plugin("volume.sh", { SENDER: "volume_change", INFO: "50" }, (scratch) => stub(scratch, "osascript", "echo false"));
  symbol(loud.icon, "volume icon");
  eq(loud.label, "50%", "volume label");
  if (muted.icon === loud.icon) throw new Error("muted and loud volume show the same icon");
});

test("Wi-Fi shows an SF Symbol and its network, or off", () => {
  const offline = (scratch) => ["ipconfig", "scutil"].forEach((name) => stub(scratch, name, "true"));
  const online = (scratch) => {
    stub(scratch, "ipconfig", 'echo "  SSID : home"');
    stub(scratch, "scutil", "true");
  };
  const [off, on] = [plugin("wifi.sh", {}, offline), plugin("wifi.sh", {}, online)];
  symbol(off.icon, "offline icon");
  symbol(on.icon, "online icon");
  if (off.icon === on.icon) throw new Error("Wi-Fi shows the same icon connected and not");
  eq(off.label, "off", "offline label");
  eq(on.label, "home", "online label");
});

// ps's processes, as `ps -Aceo pcpu=,comm=` gives them by CPU and
// `ps -Aceo rss=,comm=` by memory (in KB), and an 8-core Mac with 16 GB.
const processes = (scratch) => {
  stub(scratch, "ps", `case "$*" in
*pcpu*) printf ' 60.0 Code Helper (Renderer)\\n 20.0 claude\\n  6.0 Ghostty\\n' ;;
*rss*) printf '2202010 Google Chrome\\n1468006 Code\\n 943718 Slack\\n' ;;
esac`);
  stub(scratch, "sysctl", `case "$*" in *ncpu*) echo 8 ;; *memsize*) echo 17179869184 ;; esac`);
};

test("CPU shows its total use across every core", () => {
  eq(plugin("cpu.sh", {}, processes).label, "11%", "label");
});

// vm_stat's report with 8 of 16 GB used, as Activity Monitor counts it: app
// memory (anonymous pages less purgeable), wired and compressed.
const vmStat = (scratch) =>
  stub(scratch, "vm_stat", `cat <<'END'
Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                2613.
Pages active:                            105950.
Pages wired down:                        100000.
Pages purgeable:                           1000.
Anonymous pages:                         301000.
Pages occupied by compressor:            124288.
END`);

test("memory shows the share in use", () => {
  eq(plugin("memory.sh", {}, (scratch) => (processes(scratch), vmStat(scratch))).label, "50%", "label");
});

// The active input source, as HIToolbox's preferences record it.
const inputSource = (id) => (scratch) => stub(scratch, "defaults", `echo ${id}`);

test("language shows the active input source, as Vintage's taskbar does", () => {
  eq(plugin("language.sh", {}, inputSource("com.apple.keylayout.Thai")).label, "TH", "Thai label");
  eq(plugin("language.sh", {}, inputSource("com.apple.keylayout.ABC")).label, "EN", "ABC label");
});

// What's playing, as SketchyBar's media_change passes it.
const playing = (state) => ({ SENDER: "media_change", INFO: JSON.stringify({ state, title: "Golden Hour", artist: "The Fake Band", app: "Spotify" }) });

test("now playing shows the track and artist", () => {
  const props = plugin("media.sh", playing("playing"));
  eq(props.label, "Golden Hour · The Fake Band", "label");
  eq(props.drawing, "on", "drawing");
  symbol(props.icon, "icon");
});

test("paused, now playing shows a different SF Symbol", () => {
  if (plugin("media.sh", playing("paused")).icon === plugin("media.sh", playing("playing")).icon) {
    throw new Error("paused and playing show the same icon");
  }
});

test("with nothing playing, now playing hides", () => {
  eq(plugin("media.sh", playing("stopped")).drawing, "off", "drawing");
});

test("on load, now playing asks nowplaying-cli", () => {
  const props = plugin("media.sh", {}, (scratch) => stub(scratch, "nowplaying-cli", 'printf "Golden Hour\\nThe Fake Band\\n1\\n"'));
  eq(props.label, "Golden Hour · The Fake Band", "label");
  eq(plugin("media.sh", {}, (scratch) => stub(scratch, "nowplaying-cli", 'printf "null\\nnull\\nnull\\n"')).drawing, "off", "drawing with nothing playing");
});

// wttr.in's report for Bangkok, which ipinfo.io places this Mac in: 31° and
// partly cloudy now, every three hours today, and tomorrow.
const hourly = (temps, desc) => temps.map((tempC, i) => ({ time: String(i * 300), tempC: String(tempC), weatherDesc: [{ value: desc[i] ?? "Sunny" }] }));
const report = {
  current_condition: [{ temp_C: "31", weatherDesc: [{ value: "Partly cloudy" }] }],
  weather: [
    { maxtempC: "33", mintempC: "26", hourly: hourly([27, 26, 28, 31, 33, 32, 28, 27], { 6: "Light rain shower" }) },
    { maxtempC: "34", mintempC: "27", hourly: hourly([27, 27, 29, 32, 34, 33, 30, 28], {}) },
  ],
};
const bangkok = (scratch) =>
  stub(scratch, "curl", `case "$*" in
*ipinfo.io/ip*) echo 203.0.113.7 ;;
*ipinfo.io/*) echo '{"city":"Bangkok","region":"Bangkok"}' ;;
*wttr.in/Bangkok+Bangkok*) echo '${JSON.stringify(report)}' ;;
esac`);
const offline = (scratch) => stub(scratch, "curl", "exit 6");

test("weather shows the temperature, its icon the condition's SF Symbol", () => {
  const props = plugin("weather.sh", {}, bangkok);
  eq(props.label, "31°", "label");
  symbol(props.icon, "icon");
  const rain = plugin("weather.sh", {}, (scratch) => {
    report.current_condition[0].weatherDesc[0].value = "Light rain";
    bangkok(scratch);
    report.current_condition[0].weatherDesc[0].value = "Partly cloudy";
  });
  if (rain.icon === props.icon) throw new Error("rain and partly cloudy show the same icon");
});

test("offline, weather shows no temperature", () => {
  eq(plugin("weather.sh", {}, offline).label, "--°", "label");
});

// yabai's windows on a space, as `yabai -m query --windows --space` gives
// them, for apps by name.
const windows = (...apps) => (scratch) =>
  stub(scratch, "yabai", `[ "$*" = "-m query --windows --space 1" ] && echo '${JSON.stringify(apps.map((app) => ({ app })))}'\nexit 0`);

test("spaces show their windows' apps in sketchybar-app-font", () => {
  for (const space of [...marigoldBar().values()].filter((item) => item.type === "space")) {
    eq(space.props["label.font"], "sketchybar-app-font:Regular:13.0", `${space.name} label.font`);
  }
});

test("a space shows each of its windows' apps once, Ghostty as the terminal", () => {
  const props = plugin("space.sh", { SID: "1", SELECTED: "false" }, windows("Code", "Ghostty", "Code"));
  eq(props.label, ":code: :terminal:", "label");
  eq(props["label.drawing"], "on", "label.drawing");
});

test("a space with no windows shows only its number", () => {
  eq(plugin("space.sh", { SID: "1", SELECTED: "false" }, windows())["label.drawing"], "off", "label.drawing");
});

test("the front app shows its icon in sketchybar-app-font and its name", () => {
  const { props } = marigoldBar().get("front_app");
  if (!props["icon.font"]?.startsWith("sketchybar-app-font:")) throw new Error(`icon.font ${props["icon.font"]} isn't sketchybar-app-font`);
  if (props["icon.drawing"] === "off") throw new Error("front_app hides its icon");
  const app = plugin("front_app.sh", { SENDER: "front_app_switched", INFO: "Ghostty" });
  eq(app.icon, ":terminal:", "icon");
  eq(app.label, "Ghostty", "label");
});

test("clicking the front app does nothing", () => {
  eq(marigoldBar().get("front_app").props.click_script, undefined, "click_script");
});

test("every item highlights frame_light under the mouse", () => {
  for (const item of marigoldBar().values()) {
    if (item.name === "bar" || item.props.drawing === "off") continue;
    for (const event of ["mouse.entered", "mouse.exited"]) {
      if (!item.events.includes(event)) throw new Error(`${item.name} isn't subscribed to ${event}`);
    }
  }
  for (const name of ["clock.sh", "battery.sh", "wifi.sh", "volume.sh", "front_app.sh", "space.sh", "media.sh", "cpu.sh", "memory.sh", "weather.sh", "language.sh"]) {
    const env = { SID: "1", SELECTED: "false" };
    const on = plugin(name, { ...env, SENDER: "mouse.entered" }, battery(80));
    eq(on["background.drawing"], "on", `${name} on mouse.entered background.drawing`);
    eq(on["background.color"], role("frame_light"), `${name} on mouse.entered background.color`);
    eq(plugin(name, { ...env, SENDER: "mouse.exited" }, battery(80))["background.drawing"], "off", `${name} on mouse.exited background.drawing`);
  }
});

test("the active space stays marigold under the mouse", () => {
  for (const SENDER of ["mouse.entered", "mouse.exited"]) {
    const props = plugin("space.sh", { SID: "1", SELECTED: "true", SENDER });
    eq(props["background.drawing"], "on", `${SENDER} background.drawing`);
    eq(props["background.color"], role("frame_selection"), `${SENDER} background.color`);
  }
});

test("each display has its own bar, showing its own spaces and not full-screen ones", () => {
  const bar = marigoldBar(yabaiSpaces([1, 1], [2, 1], [3, 1, "fullscreen"], [4, 2], [5, 2]));
  eq(bar.get("bar").props.display, "all", "bar display");
  const spaces = [...bar.values()].filter((item) => item.type === "space");
  eq(spaces.map((space) => `${space.name}@${space.props.display}`).join(" "), "space.1@1 space.2@1 space.4@2 space.5@2", "spaces on displays");
  eq(spaces.map((space) => space.props.icon).join(" "), "1 2 4 5", "space numbers");
});

// A stub sketchybar that records each call and answers `--query bar` with
// the items on the bar.
const showing = (...names) => (scratch) =>
  stub(scratch, "sketchybar", `printf "%s\\n" "$@" -- >> "$HOME/sketchybar.log"
[ "$*" = "--query bar" ] && echo '${JSON.stringify({ items: ["spaces", ...names, "front_app"] })}'
exit 0`);

test("moving a space to another display moves its item to that display's bar", () => {
  const moved = (scratch) => (showing("space.1", "space.2", "space.3")(scratch), yabaiSpaces([1, 1], [2, 1], [3, 2])(scratch));
  const bar = run("spaces.sh", { NAME: "spaces", SENDER: "spaces_change" }, moved);
  eq(["space.1", "space.2", "space.3"].map((name) => bar.get(name)?.props.display).join(" "), "1 1 2", "displays");
});

test("a space that's gone loses its item, and a new one gains one before the front app", () => {
  let log;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    showing("space.1", "space.2")(scratch);
    yabaiSpaces([1, 1], [3, 2])(scratch);
    log = calls(scratch, join(scratch.config, "plugins/marigold/spaces.sh"), { NAME: "spaces", SENDER: "spaces_change" }).split("\n");
  });
  const after = (flag, ...rest) => log.some((arg, i) => arg === flag && rest.every((want, j) => log[i + 1 + j] === want));
  if (!after("--remove", "space.2")) throw new Error("space.2 isn't removed");
  if (after("--remove", "space.1")) throw new Error("space.1 is removed");
  if (!after("--add", "space", "space.3", "left")) throw new Error("space.3 isn't added");
  if (!after("--move", "space.3", "before", "spaces")) throw new Error("space.3 isn't moved ahead of the front app");
  // Its windows are another space's now.
  if (!after("--trigger", "space_windows_change")) throw new Error("the spaces' apps aren't refreshed");
});

test("yabai tells the bar when its spaces or displays change", () => {
  let log;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    oneDisplay(scratch);
    calls(scratch);
    log = readFileSync(join(scratch.home, "yabai.log"), "utf8").split("\n--\n").map((call) => call.split("\n"));
  });
  for (const event of ["space_created", "space_destroyed", "display_added", "display_removed", "display_moved", "mission_control_exit"]) {
    const signal = log.find((call) => call[2] === "--add" && call.includes(`event=${event}`));
    if (!signal) throw new Error(`no yabai signal on ${event}`);
    eq(signal.find((arg) => arg.startsWith("action=")), "action=sketchybar --trigger spaces_change", `${event} action`);
  }
  const { events } = marigoldBar().get("spaces");
  for (const event of ["spaces_change", "display_change"]) {
    if (!events.includes(event)) throw new Error(`spaces isn't subscribed to ${event}`);
  }
});

test("without yabai, the bar shows spaces 1 to 10, wherever SketchyBar finds them", () => {
  const bar = marigoldBar((scratch) => stub(scratch, "yabai", 'echo "yabai-msg: failed to connect to socket.." >&2\nexit 1'));
  const spaces = [...bar.values()].filter((item) => item.type === "space");
  eq(spaces.map((space) => space.props.icon).join(""), "1234567890", "space numbers");
  for (const space of spaces) eq(space.props.display, undefined, `${space.name} display`);
});

test("a space that comes back takes its place among the others", () => {
  let log;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    showing("space.1", "space.3")(scratch);
    yabaiSpaces([1, 1], [2, 1], [3, 1])(scratch);
    log = calls(scratch, join(scratch.config, "plugins/marigold/spaces.sh"), { NAME: "spaces", SENDER: "spaces_change" }).split("\n");
  });
  // Each --move puts its space last before the hidden spaces item.
  const moved = log.flatMap((arg, i) => (arg === "--move" && log[i + 3] === "spaces" ? [log[i + 1]] : []));
  eq(moved.join(" "), "space.1 space.2 space.3", "spaces moved, in order");
});

test("when yabai stops, the spaces stay", () => {
  const stopped = (scratch) => (showing("space.1", "space.2")(scratch), stub(scratch, "yabai", "exit 1"));
  let log;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    stopped(scratch);
    log = calls(scratch, join(scratch.config, "plugins/marigold/spaces.sh"), { NAME: "spaces", SENDER: "space_change" });
  });
  if (log.includes("--remove")) throw new Error("spaces are removed");
});

test("the status items show on every display", () => {
  const bar = marigoldBar(yabaiSpaces([1, 1], [2, 2]));
  for (const item of status(bar)) eq(item.props.display, undefined, `${item.name} display`);
});

test("clicking a space focuses it", () => {
  const bar = marigoldBar();
  for (const sid of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    eq(bar.get(`space.${sid}`).props.click_script, `yabai -m space --focus ${sid}`, `space.${sid} click_script`);
  }
});

// A stub sketchybar that also answers `--query <item>` with the item's popup
// open or closed.
const popupOpen = (open) => (scratch) =>
  stub(scratch, "sketchybar", `printf "%s\\n" "$@" -- >> "$HOME/sketchybar.log"
[ "$1" = "--query" ] && echo '{"popup":{"drawing":"${open ? "on" : "off"}"}}'
exit 0`);

test("every status item has a Frame popup under it, rounded by the Theme rules", () => {
  for (const item of status(marigoldBar())) {
    eq(item.props["popup.background.color"], role("frame_face"), `${item.name} popup.background.color`);
    eq(item.props["popup.background.border_color"], role("frame_highlight"), `${item.name} popup.background.border_color`);
    eq(item.props["popup.background.border_width"], "1", `${item.name} popup.background.border_width`);
    eq(item.props["popup.background.corner_radius"], String(marigold.rules.radius), `${item.name} popup.background.corner_radius`);
    if (!item.props.click_script?.endsWith("/plugins/marigold/popup.sh")) throw new Error(`${item.name} doesn't open its popup on click`);
  }
});

test("clicking a status item opens its popup and closes every other", () => {
  for (const NAME of statusItems) {
    const bar = run("popup.sh", { NAME, SENDER: "mouse.clicked" }, popupOpen(false));
    eq(bar.get(NAME).props["popup.drawing"], "on", `${NAME} popup.drawing`);
    for (const other of statusItems.filter((name) => name !== NAME)) {
      eq(bar.get(other)?.props["popup.drawing"], "off", `${other} popup.drawing after clicking ${NAME}`);
    }
  }
});

test("clicking a status item with its popup open closes it", () => {
  eq(plugin("popup.sh", { NAME: "cpu", SENDER: "mouse.clicked" }, popupOpen(true))["popup.drawing"], "off", "popup.drawing");
});

test("leaving a status item and its popup closes the popup", () => {
  for (const item of status(marigoldBar())) {
    if (!item.events.includes("mouse.exited.global")) throw new Error(`${item.name} isn't subscribed to mouse.exited.global`);
  }
  for (const name of ["clock.sh", "battery.sh", "wifi.sh", "volume.sh", "media.sh", "cpu.sh", "memory.sh", "weather.sh", "language.sh"]) {
    eq(plugin(name, { SENDER: "mouse.exited.global" })["popup.drawing"], "off", `${name} popup.drawing`);
  }
});

// The rows clicking a status item opens in its popup, in order, with the
// setup's stubs.
function opened(NAME, setup = () => {}) {
  const all = run("popup.sh", { NAME, SENDER: "mouse.clicked" }, (scratch) => (popupOpen(false)(scratch), setup(scratch)));
  return [...all.values()].filter((item) => item.position === `popup.${NAME}`);
}
// Each row's text and value, as "text | value".
const lines = (rows) => rows.map((row) => [row.props.icon ?? row.props.label, row.props["label.drawing"] === "on" ? row.props.label : undefined].filter((part) => part !== undefined).join(" | "));
const without = (rows, type) => rows.filter((row) => row.type !== type);

test("the CPU popup shows the total use and the top processes by CPU, each a share of the whole machine", () => {
  eq(lines(opened("cpu", processes)).join("\n"), ["CPU · 11%", "Code Helper (Renderer) | 7.5%", "claude | 2.5%", "Ghostty | 0.8%"].join("\n"), "rows");
});

test("the memory popup shows the memory used of the total and the top processes by memory", () => {
  const rows = opened("memory", (scratch) => (processes(scratch), vmStat(scratch)));
  eq(lines(without(rows, "slider")).join("\n"), ["Memory · 8.0 of 16 GB", "Google Chrome | 2.1 GB", "Code | 1.4 GB", "Slack | 0.9 GB"].join("\n"), "rows");
  const meter = rows.find((row) => row.type === "slider");
  eq(meter?.props["slider.percentage"], "50", "meter");
  eq(meter.props["slider.highlight_color"], role("frame_data_orange"), "meter color");
});

test("popup rows are Frame: frame_text, headers frame_gray_text, frame_light under the mouse", () => {
  const [header, ...rows] = opened("cpu", processes);
  eq(header.props["label.color"], role("frame_gray_text"), "header label.color");
  for (const row of rows) {
    eq(row.props["icon.color"], role("frame_text"), `${row.name} icon.color`);
    eq(row.props["background.color"], role("frame_light"), `${row.name} background.color`);
    if (!row.props.script?.endsWith("/plugins/marigold/hover.sh")) throw new Error(`${row.name} isn't highlighted under the mouse`);
    for (const event of ["mouse.entered", "mouse.exited"]) if (!row.events.includes(event)) throw new Error(`${row.name} isn't subscribed to ${event}`);
  }
});

// The clock at 13:30 on Friday 23 October 2026; every other date call is the
// real date's.
const at1330 = (scratch) =>
  stub(scratch, "date", `case "$*" in
+%H%M) echo 1330 ;;
+%Y-%m-%d) echo 2026-10-23 ;;
*) exec /bin/date "$@" ;;
esac`);

test("the weather popup shows now, then the next hours and tomorrow, from the last report", () => {
  const rows = opened("weather", (scratch) => {
    at1330(scratch);
    writeFileSync(join(scratch.home, "sketchybar_weather.json"), JSON.stringify({ ...report, location: "Bangkok" }));
  });
  eq(lines(rows).join("\n"), [
    "31° Partly cloudy",
    "Bangkok · H 33° L 26°",
    "15:00 Sunny | 32°",
    "18:00 Light rain shower | 28°",
    "21:00 Sunny | 27°",
    "Tomorrow Sunny | 34° 27°",
  ].join("\n"), "rows");
});

test("late in the day, the weather popup's next hours run into tomorrow", () => {
  const rows = opened("weather", (scratch) => {
    stub(scratch, "date", `case "$*" in +%H%M) echo 2230 ;; *) exec /bin/date "$@" ;; esac`);
    writeFileSync(join(scratch.home, "sketchybar_weather.json"), JSON.stringify({ ...report, location: "Bangkok" }));
  });
  eq(lines(rows).slice(2).join("\n"), ["00:00 Sunny | 27°", "03:00 Sunny | 27°", "06:00 Sunny | 29°", "Tomorrow Sunny | 34° 27°"].join("\n"), "rows");
});

test("before any report, the weather popup says so", () => {
  eq(lines(opened("weather", at1330)).join("\n"), "No weather yet", "rows");
});

// Runs a popup row's click_script as SketchyBar does, with the setup's stubs.
// Returns what it set on the bar and the arguments each recording stub got.
function click(row, setup = () => {}, env = {}) {
  let result;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    setup(scratch);
    const path = join(scratch.home, "click.sh");
    // A slider's own script handles its clicks. The row was drawn in another
    // scratch $HOME, so its paths point into this one instead.
    const script = row.type === "slider" ? `exec "${row.props.script}"` : row.props.click_script;
    writeFileSync(path, script.replace(/\/\S*?\/\.config\/sketchybar/g, scratch.config));
    const bar = items(calls(scratch, path, { NAME: row.name, SENDER: "mouse.clicked", ...env }));
    const logs = Object.fromEntries(
      readdirSync(scratch.home).filter((file) => file.endsWith(".log")).map((file) => [file.slice(0, -4), readFileSync(join(scratch.home, file), "utf8").trim()]),
    );
    result = { bar, log: (name) => logs[name] ?? "" };
  });
  return result;
}
// A stub that records its arguments, one call per line, in <name>.log, then
// runs body.
const recording = (name, body = "") => (scratch) => stub(scratch, name, `echo "$*" >> "$HOME/${name}.log"\n${body}`);

// The keyboard input sources, as plugins/marigold/input_sources.js lists them.
const sources = (scratch) =>
  recording("osascript", `case "$*" in *input_sources.js) printf 'com.apple.keylayout.ABC\\tABC\\ncom.apple.keylayout.Thai\\tThai\\n' ;; esac`)(scratch);

test("the language popup lists the input sources, a check on the active one", () => {
  const rows = opened("language", (scratch) => (sources(scratch), inputSource("com.apple.keylayout.Thai")(scratch)));
  eq(rows.map((row) => row.props.icon ?? row.props.label).join(" "), "Input source ABC Thai", "rows");
  eq(rows[1].props["label.drawing"], "off", "ABC checked");
  eq(rows[2].props["label.drawing"], "on", "Thai checked");
  symbol(rows[2].props.label, "check");
});

test("clicking an input source switches to it and closes the popup", () => {
  const [, abc] = opened("language", (scratch) => (sources(scratch), inputSource("com.apple.keylayout.Thai")(scratch)));
  const { bar, log } = click(abc, sources);
  if (!/input_sources\.js com\.apple\.keylayout\.ABC$/.test(log("osascript"))) throw new Error(`osascript got ${log("osascript")}`);
  eq(bar.get("language")?.props["popup.drawing"], "off", "popup.drawing");
});

// macOS at 40% volume, its outputs the speakers, in use, and AirPods.
const outputs = (scratch) => {
  recording("osascript", `case "$*" in *"output volume of"*) echo 40 ;; esac`)(scratch);
  recording("SwitchAudioSource", `case "$*" in
"-a -t output") printf 'MacBook Air Speakers\\nAirPods Pro\\n' ;;
"-c -t output") echo MacBook Air Speakers ;;
esac`)(scratch);
};

test("the volume popup shows the output volume and the output devices, a check on the active one", () => {
  const rows = opened("volume", outputs);
  eq(rows.map((row) => row.props.icon ?? row.props.label ?? row.type).join(" | "), "Output volume | slider | Output | MacBook Air Speakers | AirPods Pro", "rows");
  eq(rows[1].props["slider.percentage"], "40", "volume");
  eq(rows[1].props["slider.highlight_color"], role("frame_data_magenta"), "volume color");
  eq(rows[3].props["label.drawing"], "on", "speakers checked");
  eq(rows[4].props["label.drawing"], "off", "AirPods checked");
});

test("clicking the output volume sets it", () => {
  const [, slider] = opened("volume", outputs);
  const { log } = click(slider, outputs, { PERCENTAGE: "70" });
  if (!log("osascript").includes("set volume output volume 70")) throw new Error(`osascript got ${log("osascript")}`);
});

test("clicking an output device switches to it", () => {
  const rows = opened("volume", outputs);
  const { log } = click(rows[4], outputs);
  eq(log("SwitchAudioSource"), "-t output -s AirPods Pro", "SwitchAudioSource");
});

// pmset's battery report at a charge, in a state with its estimate.
const pmset = (percent, state, estimate, source = state === "discharging" ? "Battery Power" : "AC Power") => (scratch) =>
  stub(scratch, "pmset", `printf "Now drawing from '${source}'\\n -InternalBattery-0 (id=1)\\t${percent}%%; ${state}; ${estimate} present: true\\n"`);

test("the battery popup shows the percent, the time left, and a meter", () => {
  const rows = opened("battery", pmset(85, "discharging", "6:23 remaining"));
  eq(lines(without(rows, "slider")).join("\n"), "85%\nBattery · 6:23 left", "rows");
  const meter = rows.find((row) => row.type === "slider");
  eq(meter?.props["slider.percentage"], "85", "meter");
  eq(meter.props["slider.highlight_color"], role("frame_data_green"), "meter color");
});

test("charging, the battery popup shows the time to full", () => {
  eq(lines(without(opened("battery", pmset(40, "charging", "1:10 remaining")), "slider"))[1], "Charging · full in 1:10", "state");
  eq(lines(without(opened("battery", pmset(100, "charged", "0:00 remaining")), "slider"))[1], "Charged", "charged");
  eq(lines(without(opened("battery", pmset(85, "discharging", "(no estimate)")), "slider"))[1], "Battery", "no estimate");
});

test("a low battery's meter is frame_data_red", () => {
  const meter = opened("battery", pmset(15, "discharging", "0:40 remaining")).find((row) => row.type === "slider");
  eq(meter?.props["slider.highlight_color"], role("frame_data_red"), "meter color");
});

test("the clock popup shows the date and the month, Monday first", () => {
  const rows = opened("clock", at1330);
  eq(rows.map((row) => row.props.icon ?? row.props.label).join("\n"), [
    "Friday 23",
    "October 2026",
    " Mo Tu We Th Fr Sa Su",
    "           1  2  3  4",
    "  5  6  7  8  9 10 11",
    " 12 13 14 15 16 17 18",
    " 19 20 21 22    24 25",
    " 26 27 28 29 30 31",
  ].join("\n"), "rows");
});

test("the clock popup's calendar shows today in frame_selection, in its place in the week", () => {
  const today = opened("clock", at1330)[6];
  eq(today.props.label, "23", "label");
  eq(today.props["label.drawing"], "on", "label.drawing");
  eq(today.props["label.background.color"], role("frame_selection"), "label.background.color");
  eq(today.props["label.color"], role("frame_selection_text"), "label.color");
  // Friday's digits start 13 characters in, each 0.6 em of the 13pt Nerd Font.
  eq(today.props["icon.width"], String(Math.round(13 * 0.6 * 13)), "icon.width");
});

// Spotify playing, as SketchyBar last told now playing.
const spotify = (state) => (scratch) => {
  recording("nowplaying-cli")(scratch);
  calls(scratch, join(scratch.config, "plugins/marigold/media.sh"), { NAME: "media", ...playing(state) });
};
const glyph = (name) => readFileSync(join(root, "sketchybar/sf_symbols.sh"), "utf8").match(new RegExp(`^export ${name}=\\$'(.*?)'`, "m"))[1]
  .replace(/\\x([0-9a-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
const utf8 = (bytes) => Buffer.from(bytes, "latin1").toString("utf8");

test("the now playing popup shows the track, artist and app, then previous, play/pause and next", () => {
  const rows = opened("media", spotify("playing"));
  eq(rows[0].props.icon, "Golden Hour", "track");
  eq(rows[0].props.label, "The Fake Band · Spotify", "artist and app");
  eq(rows.slice(1).map((row) => row.props.icon).join(" "), ["sf_previous", "sf_pause", "sf_next"].map((name) => utf8(glyph(name))).join(" "), "controls while playing");
  eq(opened("media", spotify("paused"))[2].props.icon, utf8(glyph("sf_play")), "play/pause while paused");
});

test("now playing's controls skip back, play or pause, and skip forward", () => {
  const rows = opened("media", spotify("playing"));
  eq(rows.slice(1).map((row) => click(row, recording("nowplaying-cli")).log("nowplaying-cli")).join(" "), "previous togglePlayPause next", "nowplaying-cli");
});

// On "home", which is saved along with Office-5G; in range of both, an open
// café and a phone's hotspot.
const scan = {
  SPAirPortDataType: [{ spairport_airport_interfaces: [{ spairport_airport_other_local_wireless_networks: [
    { _name: "home", spairport_security_mode: "spairport_security_mode_wpa2_personal" },
    { _name: "Office-5G", spairport_security_mode: "spairport_security_mode_wpa2_personal" },
    { _name: "Cafe Amazon", spairport_security_mode: "spairport_security_mode_none" },
    { _name: "Puriwat's iPhone", spairport_security_mode: "spairport_security_mode_wpa2_personal" },
  ] }] }],
};
const networks = (scratch) => {
  recording("networksetup", `case "$*" in
"-getairportnetwork en0") echo "Current Wi-Fi Network: home" ;;
"-getairportpower en0") echo "Wi-Fi Power (en0): On" ;;
"-listpreferredwirelessnetworks en0") printf 'Preferred networks on en0:\\n\\thome\\n\\tOffice-5G\\n' ;;
esac`)(scratch);
  stub(scratch, "system_profiler", `cat <<'END'\n${JSON.stringify(scan)}\nEND`);
  for (const name of ["ipconfig", "scutil", "sleep"]) stub(scratch, name, "true");
};
// The Wi-Fi popup's rows, as the scanner leaves them.
const wifiRows = (setup = networks) => {
  const all = run("wifi_scan.sh", { NAME: "wifi_scanner" }, (scratch) => (popupOpen(false)(scratch), setup(scratch)));
  return [...all.values()].filter((item) => item.position === "popup.wifi");
};

test("the Wi-Fi popup is kept current in the background", () => {
  const scanner = marigoldBar().get("wifi_scanner");
  eq(scanner?.props.drawing, "off", "wifi_scanner drawing");
  if (!scanner.props.script?.endsWith("/plugins/marigold/wifi_scan.sh")) throw new Error(`wifi_scanner runs ${scanner.props.script}`);
  if (!(Number(scanner.props.update_freq) > 0)) throw new Error("wifi_scanner never scans");
});

test("the Wi-Fi popup is the Wi-Fi menu: on/off, the known networks, other networks", () => {
  const rows = wifiRows();
  eq(rows.map((row) => row.props.icon ?? row.props.label).join("\n"), [
    "Wi-Fi",
    "Known networks",
    "home",
    "Office-5G",
    "Other networks",
    "Cafe Amazon",
    "Puriwat's iPhone",
    "Wi-Fi Settings…",
  ].join("\n"), "rows");
  eq(rows[0].props.label, "on", "Wi-Fi");
  eq(rows[2].props.label, utf8(glyph("sf_check")), "home's check");
  eq(rows[3].props.label, utf8(glyph("sf_lock")), "Office-5G's lock");
  eq(rows[5].props["label.drawing"], "off", "Cafe Amazon has no lock");
});

test("the Wi-Fi popup isn't rebuilt while it's open", () => {
  const all = run("wifi_scan.sh", { NAME: "wifi_scanner" }, (scratch) => (networks(scratch), popupOpen(true)(scratch)));
  eq([...all.values()].filter((item) => item.position === "popup.wifi").length, 0, "rows added");
});

test("clicking a network joins it and closes the popup", () => {
  const cafe = wifiRows()[5];
  const { bar, log } = click(cafe, networks);
  if (!log("networksetup").split("\n").includes("-setairportnetwork en0 Cafe Amazon")) throw new Error(`networksetup got ${log("networksetup")}`);
  eq(bar.get("wifi")?.props["popup.drawing"], "off", "popup.drawing");
  // Then the bar's Wi-Fi redraws in Marigold's shape, not Vintage's.
  symbol(bar.get("wifi")?.props.icon, "Wi-Fi icon after joining");
});

test("clicking Wi-Fi turns it off", () => {
  const { log } = click(wifiRows()[0], networks);
  if (!log("networksetup").split("\n").includes("-setairportpower en0 off")) throw new Error(`networksetup got ${log("networksetup")}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
