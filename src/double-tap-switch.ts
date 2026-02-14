import * as ecs from '@8thwall/ecs'

// Persist state across space reloads (add() re-runs on each loadSpace)
declare global {
  interface Window {
    __dtState?: {
      isFaceMode: boolean
      lastTapTime: number
      listenerAttached: boolean
    }
  }
}

ecs.registerComponent({
  name: 'double-tap-switch',
  schema: {
    faceSpace: ecs.string,
    arSpace: ecs.string,
    modeLabel: ecs.eid,
  },
  add: (world, component) => {
    const {faceSpace, arSpace, modeLabel} = component.schema

    // Initialize global state once
    if (!window.__dtState) {
      window.__dtState = {
        isFaceMode: true,
        lastTapTime: 0,
        listenerAttached: false,
      }
    }

    const state = window.__dtState
    const DOUBLE_TAP_THRESHOLD = 400

    // Update label to reflect current state
    const labelText = state.isFaceMode
      ? 'Face Mode  \u2022  Double-tap to switch'
      : 'Camera Mode  \u2022  Double-tap to switch'
    ecs.Ui.set(world, modeLabel, {text: labelText})

    // Only attach DOM listeners once
    if (state.listenerAttached) return
    state.listenerAttached = true

    const onTap = () => {
      const now = Date.now()
      if (now - state.lastTapTime < DOUBLE_TAP_THRESHOLD) {
        state.isFaceMode = !state.isFaceMode
        const targetSpace = state.isFaceMode ? faceSpace : arSpace

        // Small delay so the label updates after space loads
        state.lastTapTime = 0
        world.spaces.loadSpace(targetSpace)
      } else {
        state.lastTapTime = now
      }
    }

    document.addEventListener('touchstart', onTap, {passive: true})
    document.addEventListener('mousedown', onTap)
  },
})
