// Checks for the Marigold theme's own SketchyBar (#156, #170), as the SketchyBar row
// of docs/theme-spec-marigold.md describes it. Runs sketchybarrc and the
// plugins in a scratch $HOME (scratch.mjs) after a Switch to Marigold.
// Run: node sketchybar/tests/marigold_test.mjs
import { readFileSync } from "node:fs";
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

const marigoldBar = () => {
  let all;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    all = items(calls(scratch));
  });
  return all;
};

// yabai's window gap, which the bar sits at from the screen edges.
const gap = readFileSync(join(root, "yabai/yabairc"), "utf8").match(/^yabai -m config window_gap (\d+)$/m)[1];

test("the bar floats at the top, 28 high, a window gap from the top and sides", () => {
  const { props } = marigoldBar().get("bar");
  eq(props.position, "top", "position");
  eq(props.height, "28", "height");
  eq(props.y_offset, gap, "y_offset");
  eq(props.margin, gap, "margin");
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
  const items = [...marigoldBar().values()].filter((item) => item.position === "left");
  eq(items.map((item) => item.name).join(" "), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sid) => `space.${sid}`).join(" ") + " front_app", "left items");
  eq(items.slice(0, 10).map((item) => item.props.icon).join(""), "1234567890", "space numbers");
  for (const space of items.slice(0, 10)) {
    eq(space.props["icon.color"], role("frame_gray_text"), `${space.name} icon.color`);
    // Drawn only on the active space, by plugins/marigold/space.sh.
    eq(space.props["background.color"], role("frame_selection"), `${space.name} background.color`);
  }
});

// Each status item's own Frame data color, as the Theme spec gives them.
const dataColors = { clock: "frame_data_yellow", battery: "frame_data_green", wifi: "frame_data_blue", volume: "frame_data_magenta" };
const labelFont = `${marigold.fonts.work.family[0]}:Regular:13.0`;

test("clock, battery, Wi-Fi and volume are on the right, with SF Symbols at 13 in their Frame data colors", () => {
  const items = [...marigoldBar().values()].filter((item) => item.position === "right");
  eq(items.map((item) => item.name).join(" "), "clock battery wifi volume", "right items, right to left");
  for (const item of items) {
    eq(item.props["icon.color"], role(dataColors[item.name]), `${item.name} icon.color`);
    eq(item.props["icon.font"], "SF Pro:Regular:13.0", `${item.name} icon.font`);
    symbol(item.props.icon, `${item.name}'s icon`);
  }
});

test("clock, battery, Wi-Fi and volume show their labels in the Work surface's Nerd Font at 13", () => {
  for (const item of [...marigoldBar().values()].filter((item) => item.position === "right")) {
    eq(item.props["label.font"], labelFont, `${item.name} label.font`);
    if (item.props["label.drawing"] === "off") throw new Error(`${item.name} hides its label`);
  }
});

// The props a Marigold plugin sets on its item, run as SketchyBar runs it.
function plugin(name, env, setup = () => {}) {
  let props;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    setup(scratch);
    props = items(calls(scratch, join(scratch.config, "plugins/marigold", name), { NAME: "item", ...env })).get("item")?.props;
  });
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
    if (item.name === "bar") continue;
    for (const event of ["mouse.entered", "mouse.exited"]) {
      if (!item.events.includes(event)) throw new Error(`${item.name} isn't subscribed to ${event}`);
    }
  }
  for (const name of ["clock.sh", "battery.sh", "wifi.sh", "volume.sh", "front_app.sh", "space.sh"]) {
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

test("clicking a space focuses it", () => {
  const bar = marigoldBar();
  for (const sid of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    eq(bar.get(`space.${sid}`).props.click_script, `yabai -m space --focus ${sid}`, `space.${sid} click_script`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
