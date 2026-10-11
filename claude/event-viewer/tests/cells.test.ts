import { test, expect } from 'claude-code/testing'

import { cells, cut } from '../hooks/cells.ts'
import { wrap } from '../hooks/inspect.ts'

test('wide characters take two cells', () => {
  expect(cells('abc')).toBe(3)
  expect(cells('日本語')).toBe(6)
  expect(cells('ok 🎉')).toBe(5)
  expect(cells('한글')).toBe(4)
})

test('cutting pads or ends in … within the cells it is given', () => {
  expect(cut('abc', 5)).toBe('abc  ')
  expect(cut('abcdef', 4)).toBe('abc…')
  expect(cut('日本語', 4)).toBe('日… ')
  expect(cells(cut('日本語です', 5))).toBe(5)
  expect(cut('日本', 3)).toBe('日…')
})

test('wrapping breaks lines by cells, so wide text is never cut', () => {
  expect(wrap('日本語です', 4)).toEqual(['日本', '語で', 'す'])
  expect(wrap('a日本', 4)).toEqual(['a日', '本'])
  for (const line of wrap('🎉'.repeat(9) + 'x', 5)) expect(cells(line)).toBeLessThanOrEqual(5)
})
