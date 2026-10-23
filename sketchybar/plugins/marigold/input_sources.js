// The keyboard input sources, one per line as "<id>\t<name>". Given an id,
// switches to that source as well. Run: osascript -l JavaScript input_sources.js [id]
ObjC.import("Carbon");

function run(argv) {
  const filter = $.NSDictionary.dictionaryWithObjectForKey($("TISTypeKeyboardLayout"), $("TISPropertyInputSourceType"));
  const sources = ObjC.castRefToObject($.TISCreateInputSourceList(filter, false));
  const lines = [];
  for (let i = 0; i < sources.count; i++) {
    const source = sources.objectAtIndex(i);
    const id = ObjC.castRefToObject($.TISGetInputSourceProperty(source, $.kTISPropertyInputSourceID)).js;
    const name = ObjC.castRefToObject($.TISGetInputSourceProperty(source, $.kTISPropertyLocalizedName)).js;
    lines.push(`${id}\t${name}`);
    if (id === argv[0]) $.TISSelectInputSource(source);
  }
  return lines.join("\n");
}
