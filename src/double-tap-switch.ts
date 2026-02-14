import * as ecs from '@8thwall/ecs'

// Persist state across space reloads (add() re-runs on each loadSpace)
declare global {
  interface Window {
    __dtState?: {
      isFaceMode: boolean
      lastTapTime: number
      switchedAt: number
      listenerAttached: boolean
      initialized: boolean
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
        isFaceMode: false,  // starts in AR (entry space) then immediately switches
        lastTapTime: 0,
        switchedAt: 0,
        listenerAttached: false,
        initialized: false,
      }
    }

    const state = window.__dtState
    const DOUBLE_TAP_THRESHOLD = 400
    const SWITCH_COOLDOWN = 1500

    // On very first load, immediately switch to Face Filter.
    // Entry space is AR Camera so the XR engine initializes image tracking,
    // then we switch to face mode for the user's starting experience.
    if (!state.initialized) {
      state.initialized = true
      state.isFaceMode = true
      state.switchedAt = Date.now()
      world.spaces.loadSpace(faceSpace)
      return
    }

    // Update label to reflect current state
    const labelText = state.isFaceMode
      ? 'Face Mode  \u2022  Double-tap to switch'
      : 'Camera Mode  \u2022  Double-tap to switch'
    ecs.Ui.set(world, modeLabel, {text: labelText})

    // Only attach DOM listeners once
    if (state.listenerAttached) return
    state.listenerAttached = true

    const hasTouchSupport = 'ontouchstart' in window

    const onTap = (e: Event) => {
      // On touch devices, ignore mousedown (touchstart already fires).
      if (hasTouchSupport && e.type === 'mousedown') return
      if (!hasTouchSupport && e.type === 'touchstart') return

      const now = Date.now()

      // Ignore taps during cooldown after a space switch
      if (now - state.switchedAt < SWITCH_COOLDOWN) {
        state.lastTapTime = 0
        return
      }

      if (now - state.lastTapTime < DOUBLE_TAP_THRESHOLD) {
        state.isFaceMode = !state.isFaceMode
        const targetSpace = state.isFaceMode ? faceSpace : arSpace

        state.lastTapTime = 0
        state.switchedAt = now
        world.spaces.loadSpace(targetSpace)
      } else {
        state.lastTapTime = now
      }
    }

    document.addEventListener('touchstart', onTap, {passive: true})
    document.addEventListener('mousedown', onTap)
  },
})
