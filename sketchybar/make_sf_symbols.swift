// SF Symbols characters for the Marigold theme's bar (#168), written to
// sf_symbols.sh. Nothing maps a symbol's name to its character, so each symbol
// AppKit draws by name is matched against every character SF Pro has in
// U+100000–U+10FFFD, both drawn into the same small grid. A match must be close
// and clearly closer than the next best, or nothing is written.
// Add a line to `symbols`, then: swift -O sketchybar/make_sf_symbols.swift
import AppKit

// The variable each symbol is exported as (sf_<name>), and its SF Symbol.
let symbols: [(String, String)] = [
  ("clock", "clock"),
  ("battery_100", "battery.100percent"),
  ("battery_75", "battery.75percent"),
  ("battery_50", "battery.50percent"),
  ("battery_25", "battery.25percent"),
  ("battery_0", "battery.0percent"),
  ("battery_charging", "battery.100percent.bolt"),
  ("wifi", "wifi"),
  ("wifi_off", "wifi.slash"),
  ("lock", "lock.fill"),
  ("check", "checkmark"),
  ("volume", "speaker.wave.3.fill"),
  ("volume_low", "speaker.wave.1.fill"),
  ("volume_off", "speaker.slash.fill"),
  ("cpu", "cpu"),
  ("memory", "memorychip"),
  ("music", "music.note"),
  ("play", "play.fill"),
  ("pause", "pause.fill"),
  ("next", "forward.fill"),
  ("previous", "backward.fill"),
  ("sun", "sun.max.fill"),
  ("partly_cloudy", "cloud.sun.fill"),
  ("cloud", "cloud.fill"),
  ("fog", "cloud.fog.fill"),
  ("rain", "cloud.rain.fill"),
  ("snow", "cloud.snow.fill"),
  ("storm", "cloud.bolt.rain.fill"),
  ("globe", "globe"),
  ("keyboard", "keyboard"),
]

// The most a match may differ from the symbol (the ink they don't share, as a
// share of all their ink), and how many times closer it must be than the next
// best. AppKit's symbols and SF Pro's characters aren't drawn quite alike, so
// even right matches differ (up to 0.22, battery.0percent, on SF Pro 19.2 and
// macOS 14.1) and the next best is never under 1.6 times as far. Characters
// drawn exactly alike (one symbol under two names) count as one.
let maxDistance: Float = 0.25
let minMargin: Float = 1.5
let sameShape: Float = 0.001

let size = 256       // the canvas each shape is drawn on, in pixels
let grid = 48        // the square it's compared on
let pointSize: CGFloat = 80

// Ink coverage of whatever draw() paints in black, 0 to 1 per pixel.
func render(_ draw: (CGContext) -> Void) -> [Float] {
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size,
                      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)!
  ctx.setFillColor(gray: 1, alpha: 1)
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  draw(ctx)
  let pixels = ctx.data!.bindMemory(to: UInt8.self, capacity: size * size)
  return (0..<size * size).map { 1 - Float(pixels[$0]) / 255 }
}

// A drawing's ink cropped to its bounds and averaged down, keeping its
// proportions, into the middle of a grid × grid square. AppKit draws a symbol
// larger than SF Pro draws its character at the same size, so only the shape
// counts, not where or how big it was drawn.
struct Shape {
  let aspect: Float, ink: [Float]

  init?(_ canvas: [Float]) {
    var (x0, y0, x1, y1) = (size, size, -1, -1)
    for y in 0..<size { for x in 0..<size where canvas[y * size + x] > 0.1 {
      x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
    } }
    guard x1 >= 0 else { return nil }
    let (w, h) = (Float(x1 - x0 + 1), Float(y1 - y0 + 1))
    let scale = Float(grid) / max(w, h)
    let (ox, oy) = ((Float(grid) - w * scale) / 2, (Float(grid) - h * scale) / 2)
    var (sums, counts) = ([Float](repeating: 0, count: grid * grid), [Float](repeating: 0, count: grid * grid))
    for y in y0...y1 { for x in x0...x1 {
      let gx = min(grid - 1, Int(Float(x - x0) * scale + ox))
      let gy = min(grid - 1, Int(Float(y - y0) * scale + oy))
      sums[gy * grid + gx] += canvas[y * size + x]
      counts[gy * grid + gx] += 1
    } }
    (aspect, ink) = (w / h, zip(sums, counts).map { $1 == 0 ? 0 : $0 / $1 })
  }
}

// The ink two shapes don't share, as a share of all their ink: 0 for the same
// drawing. Shapes of clearly different proportions aren't compared.
func distance(_ a: Shape, _ b: Shape) -> Float {
  if abs(a.aspect / b.aspect - 1) > 0.08 { return .infinity }
  var (apart, ink): (Float, Float) = (0, 0)
  for (p, q) in zip(a.ink, b.ink) { apart += abs(p - q); ink += max(p, q) }
  return ink == 0 ? 0 : apart / ink
}

func fail(_ message: String) -> Never {
  FileHandle.standardError.write("make_sf_symbols: \(message)\n".data(using: .utf8)!)
  exit(1)
}

// Every SF Pro character in U+100000–U+10FFFD, drawn.
let font = CTFontCreateWithName("SFPro-Regular" as CFString, pointSize, nil)
let charset = CTFontCopyCharacterSet(font) as CharacterSet
var characters: [(UInt32, Shape)] = []
for value in UInt32(0x100000)...0x10FFFD {
  guard let scalar = Unicode.Scalar(value), charset.contains(scalar) else { continue }
  var units = Array(String(scalar).utf16)
  var glyphs = [CGGlyph](repeating: 0, count: units.count)
  guard CTFontGetGlyphsForCharacters(font, &units, &glyphs, units.count) else { continue }
  let ink = render { ctx in
    ctx.setFillColor(gray: 0, alpha: 1)
    let bounds = CTFontGetBoundingRectsForGlyphs(font, .default, glyphs, nil, 1)
    var position = CGPoint(x: (CGFloat(size) - bounds.width) / 2 - bounds.minX,
                           y: (CGFloat(size) - bounds.height) / 2 - bounds.minY)
    CTFontDrawGlyphs(font, glyphs, &position, 1, ctx)
  }
  if let shape = Shape(ink) { characters.append((value, shape)) }
}
if characters.isEmpty { fail("SF Pro has no characters in U+100000–U+10FFFD; is it installed?") }

// Each symbol's closest character, if it's close and clearly the closest.
let config = NSImage.SymbolConfiguration(pointSize: pointSize, weight: .regular)
var lines: [String] = []
var problems: [String] = []
for (name, symbol) in symbols {
  guard let image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)?.withSymbolConfiguration(config) else {
    problems.append("\(symbol): AppKit has no such symbol"); continue
  }
  let ink = render { ctx in
    // At the size AppKit draws it, in the middle, so its shape isn't stretched.
    let (w, h) = (image.size.width, image.size.height)
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
    image.draw(in: CGRect(x: (CGFloat(size) - w) / 2, y: (CGFloat(size) - h) / 2, width: w, height: h))
    NSGraphicsContext.current = nil
  }
  guard let shape = Shape(ink) else { problems.append("\(symbol): AppKit drew nothing"); continue }
  let ranked = characters.map { ($0.0, $0.1, distance(shape, $0.1)) }.sorted { $0.2 < $1.2 }
  let first = ranked[0]
  let next = ranked.dropFirst().first { distance(first.1, $0.1) > sameShape } ?? ranked[1]
  let (best, second) = ((first.0, first.2), (next.0, next.2))
  let report = String(format: "%@: U+%X at %.4f, next U+%X at %.4f", symbol, best.0, best.1, second.0, second.1)
  if ProcessInfo.processInfo.environment["VERBOSE"] != nil { print(report) }
  if best.1 > maxDistance {
    problems.append("\(report): no character is close enough")
  } else if second.1 < best.1 * minMargin {
    problems.append("\(report): the next best is too close to tell apart")
  } else {
    // As UTF-8 bytes: macOS's /bin/bash is 3.2, which has no \U escape.
    let bytes = String(Unicode.Scalar(best.0)!).utf8.map { String(format: "\\x%02x", $0) }.joined()
    lines.append(String(format: "export sf_%@=$'%@' # %@, U+%X", name, bytes, symbol, best.0))
  }
}
if !problems.isEmpty { fail("no file written\n" + problems.joined(separator: "\n")) }

let header = """
#!/bin/bash

# SF Symbols characters for the Marigold theme's bar (#168), for SF Pro. Generated
# by make_sf_symbols.swift; don't edit. To add one, add it to the generator's
# list, then: swift -O sketchybar/make_sf_symbols.swift


"""
let out = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("sf_symbols.sh")
try! (header + lines.joined(separator: "\n") + "\n").write(to: out, atomically: true, encoding: .utf8)
print("wrote \(out.path), \(lines.count) symbols")
