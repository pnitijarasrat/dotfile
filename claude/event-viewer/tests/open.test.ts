import { test, expect } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

const mount = ($: Parameters<TestBody>[0], bodyColumns: number, placement: 'dock' | 'inline') =>
  $.ui.mount({
    plugin: 'event-viewer', surface: 'terminal', component: 'Pane', requestId: 'event-viewer',
    props: { bodyColumns, placement, scroll: { offset: 0, bodyRows: 30 } },
  } as never)

test('/event-viewer opens the Event Viewer window', async ($, on) => {
  on('session.id', async () => ({ value: 'one' }) as never)
  const opened: string[] = []
  on('ui.open', async ($, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } } as never
  })
  await $.command.run({ command: 'event-viewer', args: '' } as never)
  expect(opened).toEqual(['event-viewer'])

  for (const [bodyColumns, placement] of [[60, 'inline'], [120, 'dock']] as const) {
    const ui = await mount($, bodyColumns, placement)
    expect(await ui.find({ type: 'Text', text: /Event Viewer - Claude Session/ } as never)).toBeDefined()
    await ui.unmount()
  }
})

test('the title bar × closes the window', async ($, on) => {
  on('session.id', async () => ({ value: 'one' }) as never)
  const closed: string[] = []
  on('ui.close', async ($, e) => {
    closed.push(e.id)
    return { value: undefined } as never
  })
  const ui = await mount($, 80, 'inline')
  await ui.press({ key: 'close' } as never)
  expect(closed).toEqual(['event-viewer'])
  await ui.unmount()
})
