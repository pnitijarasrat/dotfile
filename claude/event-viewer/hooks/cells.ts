// Terminal cells: a wide character (CJK, Hangul, most emoji) takes two, a
// joiner, variation selector or combining mark none, the rest one. Rows are
// laid out in cells, so text is measured, cut and wrapped by them.

const WIDE: [number, number][] = [
  [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff],
  [0xa000, 0xa4cf], [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe30, 0xfe4f], [0xff00, 0xff60],
  [0xffe0, 0xffe6], [0x1f300, 0x1f64f], [0x1f900, 0x1f9ff], [0x1fa70, 0x1faff], [0x20000, 0x3fffd],
]

const ZERO = /[̀-ͯ​-‏︀-️]/

export function cellsOf(ch: string) {
  if (ZERO.test(ch)) return 0
  const c = ch.codePointAt(0) ?? 0
  return WIDE.some(([lo, hi]) => c >= lo && c <= hi) ? 2 : 1
}

export const cells = (t: string) => [...t].reduce((n, ch) => n + cellsOf(ch), 0)

// Exactly n cells of t: padded with spaces, or cut to end in … when longer.
export function cut(t: string, n: number) {
  const have = cells(t)
  if (have <= n) return t + ' '.repeat(n - have)
  let out = ''
  let used = 0
  for (const ch of t) {
    const w = cellsOf(ch)
    if (used + w > n - 1) break
    out += ch
    used += w
  }
  return n <= 0 ? '' : out + '…' + ' '.repeat(n - 1 - used)
}
