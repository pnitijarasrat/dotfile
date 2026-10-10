import { test, expect } from 'claude-code/testing'

// Smoke only: each variant's tree validates on the terminal, and rows press.
test('every variant draws', async ($, on) => {
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('command.run', async () => ({ text: '' }))
  for (const v of ['a', 'b', 'c']) {
    for (const bodyColumns of [80, 120]) {
      await $.command.run({ command: 'activity-prototype', args: v })
      const ui = await $.ui.mount({ plugin: 'win95-activity-prototype', surface: 'terminal', component: 'Pane', requestId: 'activity-prototype', props: { bodyColumns } } as never)
      expect(await ui.find({ key: `${v}-8` } as never)).toBeDefined()
      await ui.press({ key: `${v}-8` } as never)
      expect(await ui.find({ type: 'Text', text: /Denied: the user/ } as never)).toBeDefined()
      await ui.unmount()
    }
  }
})
