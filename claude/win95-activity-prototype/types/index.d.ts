export type Placeholder = never

declare module 'claude-code' {
  interface PluginState {
    'win95-activity-prototype': {
      variant: string
      selected: string
      tab: string
      tick: number
    }
  }
}
