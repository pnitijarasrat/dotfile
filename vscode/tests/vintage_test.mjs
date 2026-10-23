// Checks for the Vintage VSCode theme (#19, #20, #33, #46, #79), and each
// Theme's VSCode color theme (#135).
// Run: node vscode/tests/vintage_test.mjs
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "../../themes/generate.mjs";

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
  if (actual !== expected) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// JSONC: drop comments outside strings, then trailing commas.
function parseJsonc(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i) + 1;
    } else {
      out += c;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

// The settings as committed, which are Vintage's: a Switch to another Theme
// rewrites the working tree's copy (ADR 0008).
const settings = parseJsonc(spawnSync("git", ["show", "HEAD:vscode/settings.json"], { cwd: root, encoding: "utf8" }).stdout);
const extension = JSON.parse(read("vscode/vintage-theme/package.json"));

// The Vintage Theme source file, themes/vintage.json, which the settings'
// fonts come from.
const vintage = JSON.parse(read("themes/vintage.json"));

// Keys allowed to be fully transparent: they turn a shadow off.
const noShadow = new Set(["widget.shadow", "scrollbar.shadow"]);

// The registered color IDs live in the installed VSCode: the workbench bundle
// and the built-in extensions' contributed colors (git). Skip if absent.
const app = "/Applications/Visual Studio Code.app/Contents/Resources/app";
const bundle = `${app}/out/vs/workbench/workbench.desktop.main.js`;

for (const { id, theme: source } of themes(root)) {
  const path = `vscode/vintage-theme/themes/${id}-color-theme.json`;
  const theme = parseJsonc(read(path));
  const colors = theme.colors;
  // Every role the Theme defines, with its hex, from its Theme source file.
  const roles = Object.assign({}, ...Object.values(source.palettes));

  const color = (key) => {
    if (!(key in colors)) throw new Error(`${key} is not set`);
    return colors[key];
  };
  const expect = (key, hex) => eq(color(key), hex, key);

  test(`${id}: every color is commented with the spec role it plays`, () => {
    // Only the colors block: tokenColors reuses keys such as "foreground".
    const text = read(path);
    const block = text.slice(text.indexOf('"colors": {'), text.indexOf('"tokenColors"'));
    const commented = new Map([...block.matchAll(/^\s*"([\w.]+)": "(#\w+)",? \/\/ (\w+)/gm)].map((m) => [m[1], m[3]]));
    for (const [key, value] of Object.entries(colors)) {
      if (noShadow.has(key) && value === "#00000000") continue;
      const role = commented.get(key);
      if (!role) throw new Error(`${key} has no role comment`);
      if (roles[role] !== value) throw new Error(`${key} = ${value}, but ${role} is ${roles[role]}`);
    }
  });

  if (existsSync(bundle)) {
    test(`${id}: every color key is one VSCode registers`, () => {
      const js = readFileSync(bundle, "utf8");
      const contributed = new Set(
        readdirSync(`${app}/extensions`)
          .map((dir) => `${app}/extensions/${dir}/package.json`)
          .filter(existsSync)
          .flatMap((path) => JSON.parse(readFileSync(path, "utf8")).contributes?.colors ?? [])
          .map((c) => c.id),
      );
      const unknown = Object.keys(colors).filter(
        (key) => !js.includes(`"${key}",`) && !js.includes(`"${key}":{`) && !contributed.has(key),
      );
      if (unknown.length) throw new Error(`unknown keys: ${unknown.join(", ")}`);
    });
  }

  test(`${id}: shadows are off only if the Theme has none`, () => {
    for (const key of noShadow) eq(colors[key], source.shadows ? undefined : "#00000000", key);
  });

  test(`${id}: activity bar, sidebar, tabs and panel titles are Frame grey with black text`, () => {
    for (const key of [
      "activityBar.background",
      "sideBar.background",
      "sideBarSectionHeader.background",
      "editorGroupHeader.tabsBackground",
      "tab.inactiveBackground",
      "panelSectionHeader.background",
    ]) {
      expect(key, roles.frame_face);
    }
    for (const key of [
      "activityBar.foreground",
      "sideBar.foreground",
      "sideBarTitle.foreground",
      "sideBarSectionHeader.foreground",
      "tab.activeForeground",
      "tab.inactiveForeground",
      "panelSectionHeader.foreground",
    ]) {
      expect(key, roles.frame_text);
    }
  });

  test(`${id}: the active tab is clearly distinguished`, () => {
    // The modern UI ignores tab.activeBackground.
    eq(settings["workbench.experimental.modernUI"], false, "workbench.experimental.modernUI");
    expect("tab.activeBackground", roles.frame_light);
    expect("tab.activeBorderTop", roles.frame_selection);
  });

  test(`${id}: scrollbars use Frame greys`, () => {
    expect("scrollbarSlider.background", roles.frame_shadow);
    expect("scrollbarSlider.hoverBackground", roles.frame_shadow);
  });

  test(`${id}: custom title bar: navy active, grey inactive`, () => {
    eq(settings["window.titleBarStyle"], "custom", "window.titleBarStyle");
    expect("titleBar.activeBackground", roles.frame_title);
    expect("titleBar.activeForeground", roles.frame_title_text);
    expect("titleBar.inactiveBackground", roles.frame_title_inactive);
    expect("titleBar.inactiveForeground", roles.frame_title_inactive_text);
  });

  test(`${id}: status bar is Frame grey with Frame data colors`, () => {
    expect("statusBar.background", roles.frame_face);
    expect("statusBar.foreground", roles.frame_text);
    expect("statusBarItem.errorBackground", roles.frame_face);
    expect("statusBarItem.errorForeground", roles.frame_data_red);
    expect("statusBarItem.warningBackground", roles.frame_face);
    expect("statusBarItem.warningForeground", roles.frame_data_yellow);
  });

  test(`${id}: menus and pickers are Frame: grey, black text, navy selection`, () => {
    eq(settings["window.menuStyle"], "custom", "window.menuStyle");
    const frame = [
      ["quickInput.background", "quickInput.foreground", "quickInputList.focusBackground", "quickInputList.focusForeground"],
      ["menu.background", "menu.foreground", "menu.selectionBackground", "menu.selectionForeground"],
      ["notifications.background", "notifications.foreground", "list.activeSelectionBackground", "list.activeSelectionForeground"],
    ];
    for (const [bg, fg, sel, selText] of frame) {
      expect(bg, roles.frame_face);
      expect(fg, roles.frame_text);
      expect(sel, roles.frame_selection);
      expect(selText, roles.frame_selection_text);
    }
  });

  test(`${id}: inline code popups are Work surface with a work_popup_border`, () => {
    for (const [bg, border] of [
      ["editorSuggestWidget.background", "editorSuggestWidget.border"],
      ["editorHoverWidget.background", "editorHoverWidget.border"],
      ["peekViewEditor.background", "peekView.border"],
      ["peekViewResult.background", "peekView.border"],
      ["editorMarkerNavigation.background", "editorMarkerNavigationError.background"],
    ]) {
      expect(bg, roles.work_bg);
      expect(border, roles.work_popup_border);
    }
    for (const key of ["editorSuggestWidget.foreground", "editorHoverWidget.foreground"]) {
      expect(key, roles.work_fg);
    }
    eq(color("editorSuggestWidget.selectedBackground"), roles.work_selection, "suggest selection");
  });

  test(`${id}: the editor is the light Work surface (#46)`, () => {
    expect("editor.background", roles.work_bg);
    expect("editorGutter.background", roles.work_bg);
    expect("editor.foreground", roles.work_fg);
    expect("editorCursor.foreground", roles.work_cursor);
    expect("editorCursor.background", roles.work_cursor_text);
    expect("editor.lineHighlightBackground", roles.work_cursorline);
    expect("editorLineNumber.foreground", roles.work_line_number);
    expect("editorRuler.foreground", roles.work_grid);
    expect("editorIndentGuide.background1", roles.work_grid);
    expect("editor.inactiveSelectionBackground", roles.frame_light);
  });

  test(`${id}: the selection, peek match highlights and matched completion letters are the roles the Theme chooses (#150, #160)`, () => {
    for (const [choice, keys] of [
      ["selection", ["editor.selectionBackground", "peekViewEditor.matchHighlightBackground"]],
      ["peek_match", ["peekViewResult.matchHighlightBackground"]],
      ["completion_match", ["editorSuggestWidget.focusHighlightForeground"]],
    ]) {
      const hex = roles[source.vscode[choice]];
      if (!hex) throw new Error(`vscode.${choice} ${JSON.stringify(source.vscode[choice])} isn't a role`);
      for (const key of keys) expect(key, hex);
    }
  });

  test(`${id}: the terminal is the light Work surface with Windows VGA ANSI colors (#46)`, () => {
    expect("terminal.background", roles.work_bg);
    expect("terminal.foreground", roles.work_fg);
    expect("terminalCursor.foreground", roles.work_cursor);
    expect("terminalCursor.background", roles.work_cursor_text);
    expect("terminal.selectionBackground", roles.work_selection);
    expect("terminal.selectionForeground", roles.work_selection_text);
    const names = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
    names.forEach((name, i) => {
      expect(`terminal.ansi${name}`, roles[`ansi_${i}`]);
      expect(`terminal.ansiBright${name}`, roles[`ansi_${i + 8}`]);
    });
    expect("panel.background", roles.work_bg);
  });

  test(`${id}: Frame text and icons are frame_text; links are ansi_12 (#46)`, () => {
    expect("foreground", roles.frame_text);
    expect("icon.foreground", roles.frame_text);
    expect("textLink.foreground", roles.ansi_12);
    expect("textLink.activeForeground", roles.ansi_12);
  });

  test(`${id}: token colors use the syntax roles, with no italic or bold (#46)`, () => {
    if (!["light", "dark"].includes(theme.type)) throw new Error(`theme type ${theme.type}`);
    const [base, ...rules] = theme.tokenColors;
    eq(base.scope, undefined, "first rule is the default");
    eq(base.settings.foreground, roles.work_fg, "default token color");
    for (const rule of theme.tokenColors) eq(rule.settings.fontStyle, "", `${rule.name ?? "default"} fontStyle`);
    const named = rules.filter((rule) => rule.name?.startsWith("syntax_"));
    const syntaxRoles = Object.keys(roles).filter((role) => role.startsWith("syntax_"));
    eq(named.map((rule) => rule.name).sort().join(), syntaxRoles.sort().join(), "one rule per syntax role");
    for (const rule of named) eq(rule.settings.foreground, roles[rule.name], rule.name);
    eq(theme.semanticTokenColors["variable.readonly"], roles.work_fg, "variable.readonly");
  });

  test(`${id}: the extension contributes it under the Theme's name`, () => {
    const entry = extension.contributes.themes.find((t) => t.path === `./themes/${id}-color-theme.json`);
    if (!entry) throw new Error(`package.json doesn't contribute ${path}`);
    eq(entry.label, source.name, "label");
    eq(theme.name, source.name, "name");
    eq(entry.uiTheme, theme.type === "light" ? "vs" : "vs-dark", "uiTheme");
  });
}

test("Vintage's color theme is light (#46)", () => {
  eq(parseJsonc(read("vscode/vintage-theme/themes/vintage-color-theme.json")).type, "light", "theme type");
});

// Deviation: selected text keeps its token colors, so the selection is a role
// they read on. Vintage's dark ones vanish on work_selection navy; Marigold's
// light ones vanish on its pale yellow ansi_11 (#150).
test("Vintage's VSCode selection is ansi_11; Marigold's is work_selection (#150)", () => {
  const chosen = Object.fromEntries(themes(root).map(({ id, theme }) => [id, theme.vscode?.selection]));
  eq(chosen.vintage, "ansi_11", "vintage");
  eq(chosen.marigold, "work_selection", "marigold");
});

// Matches on the selected completion row and peek result must stand out from
// work_selection, the selected row. Vintage's ansi_11 reads on navy. Marigold's work_selection would vanish
// into its own selected rows, so its matched letters are frame_selection and
// its peek result match highlights frame_dark_shadow, which token colors and
// work_selection_text read on (#160).
test("Vintage's matches are ansi_11; Marigold's are frame_selection letters and frame_dark_shadow peek result highlights (#160)", () => {
  const chosen = Object.fromEntries(themes(root).map(({ id, theme }) => [id, theme.vscode]));
  eq(chosen.vintage.completion_match, "ansi_11", "vintage completion_match");
  eq(chosen.vintage.peek_match, "ansi_11", "vintage peek_match");
  eq(chosen.marigold.completion_match, "frame_selection", "marigold completion_match");
  eq(chosen.marigold.peek_match, "frame_dark_shadow", "marigold peek_match");
});

test("the editor and terminal use the Work surface font (#79)", () => {
  // Names with spaces are quoted: 'JetBrains Mono NL', Menlo, Thonburi.
  const family = vintage.fonts.work.family.map((name) => (name.includes(" ") ? `'${name}'` : name)).join(", ");
  for (const prefix of ["editor", "terminal.integrated"]) {
    eq(settings[`${prefix}.fontFamily`], family, `${prefix}.fontFamily`);
    eq(settings[`${prefix}.fontSize`], vintage.fonts.work.vscode_size, `${prefix}.fontSize`);
    eq(settings[`${prefix}.fontWeight`], "normal", `${prefix}.fontWeight`);
  }
  // JetBrains Mono NL has a real bold face; bold looks the same as normal text (ADR 0003).
  eq(settings["terminal.integrated.fontWeightBold"], "normal", "terminal.integrated.fontWeightBold");
  eq(settings["window.zoomLevel"], 1, "window.zoomLevel");
  // editor lineHeight 0 is automatic; terminal lineHeight multiplies the font's cell height.
  eq(settings["editor.lineHeight"], 0, "editor.lineHeight");
  eq(settings["terminal.integrated.lineHeight"], 1, "terminal.integrated.lineHeight");
  eq(settings["editor.fontLigatures"], false, "editor.fontLigatures");
  eq(settings["terminal.integrated.fontLigatures.enabled"], false, "terminal.integrated.fontLigatures.enabled");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
