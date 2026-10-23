// Checks for the Marigold theme's own SketchyBar (#156), as the SketchyBar row
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
// { name, position, props }. Items take the defaults' props unless they set
// their own.
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
      all.set(name, { name, type, position, props: { ...defaults } });
      current = undefined;
      i += 3;
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

// Fails unless icon is one Nerd Font glyph, from the Private Use Areas.
const glyph = (icon, what) => {
  if (!/^[-\u{f0000}-\u{fffff}]$/u.test(icon ?? "")) throw new Error(`${what} ${JSON.stringify(icon)} isn't a Nerd Font glyph`);
};

const marigoldBar = () => {
  let all;
  withScratch((scratch) => {
    switchTo(scratch, "marigold");
    all = items(calls(scratch));
  });
  return all;
};

test("the bar floats at the top, inset from the screen edges", () => {
  const { props } = marigoldBar().get("bar");
  eq(props.position, "top", "position");
  for (const key of ["margin", "y_offset"]) {
    if (!(Number(props[key]) > 0)) throw new Error(`${key} ${props[key]} doesn't inset the bar`);
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

test("clock, battery, Wi-Fi and volume are on the right, with Nerd Font icons in frame_selection", () => {
  const items = [...marigoldBar().values()].filter((item) => item.position === "right");
  eq(items.map((item) => item.name).join(" "), "clock battery wifi volume", "right items, right to left");
  for (const item of items) {
    eq(item.props["icon.color"], role("frame_selection"), `${item.name} icon.color`);
    if (!item.props["icon.font"]?.includes("Nerd Font")) throw new Error(`${item.name}'s icon font ${item.props["icon.font"]} isn't a Nerd Font`);
    glyph(item.props.icon, `${item.name}'s icon`);
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

test("the battery shows its charge with its icon in frame_selection", () => {
  const props = plugin("battery.sh", {}, battery(80));
  eq(props.label, "80%", "label");
  eq(props["icon.color"], role("frame_selection"), "icon.color");
});

test("a low battery turns frame_data_red", () => {
  eq(plugin("battery.sh", {}, battery(15))["icon.color"], role("frame_data_red"), "icon.color");
});

test("a low battery that's charging stays frame_selection", () => {
  eq(plugin("battery.sh", {}, battery(15, "AC Power"))["icon.color"], role("frame_selection"), "icon.color");
});

test("muted and unmuted volume show different Nerd Font icons", () => {
  const props = plugin("volume.sh", { SENDER: "volume_change", INFO: "50" }, (scratch) => stub(scratch, "osascript", "echo true"));
  glyph(props.icon, "muted icon");
  const loud = plugin("volume.sh", { SENDER: "volume_change", INFO: "50" }, (scratch) => stub(scratch, "osascript", "echo false"));
  glyph(loud.icon, "volume icon");
  if (props.icon === loud.icon) throw new Error("muted and loud volume show the same icon");
});

test("Wi-Fi shows a Nerd Font icon, connected or not", () => {
  const offline = (scratch) => ["ipconfig", "scutil"].forEach((name) => stub(scratch, name, "true"));
  const online = (scratch) => {
    stub(scratch, "ipconfig", 'echo "  SSID : home"');
    stub(scratch, "scutil", "true");
  };
  const [off, on] = [plugin("wifi.sh", {}, offline).icon, plugin("wifi.sh", {}, online).icon];
  glyph(off, "offline icon");
  glyph(on, "online icon");
  if (off === on) throw new Error("Wi-Fi shows the same icon connected and not");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
