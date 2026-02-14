import * as ecs from '@8thwall/ecs'

declare global {
  interface Window {
    __dtState?: {
      isFaceMode: boolean
      lastTapTime: number
      switchedAt: number
      listenerAttached: boolean
      needsInitialSwap: boolean
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

    if (!window.__dtState) {
      window.__dtState = {
        isFaceMode: false,
        lastTapTime: 0,
        switchedAt: 0,
        listenerAttached: false,
        needsInitialSwap: true,
      }
    }

    const state = window.__dtState
    const DOUBLE_TAP_THRESHOLD = 400
    const SWITCH_COOLDOWN = 1500

    // Entry space is AR Camera (so XR engine initializes world tracking
    // + image targets). On first add(), immediately swap to Face Filter.
    // The loading overlay covers the brief rear-camera flash.
    if (state.needsInitialSwap) {
      state.needsInitialSwap = false
      state.isFaceMode = true
      state.switchedAt = Date.now()
      console.log('Initial swap: AR Camera -> Face Filter')
      world.spaces.loadSpace(faceSpace)
      return
    }

    // Update label
    const labelText = state.isFaceMode
      ? 'Double-tap to enter Sauce Story'
      : 'Double-tap for Face Filter'
    ecs.Ui.set(world, modeLabel, {text: labelText})

    // Attach DOM listeners once
    if (state.listenerAttached) return
    state.listenerAttached = true

    const hasTouchSupport = 'ontouchstart' in window

    const onTap = (e: Event) => {
      if (hasTouchSupport && e.type === 'mousedown') return
      if (!hasTouchSupport && e.type === 'touchstart') return

      const now = Date.now()
      if (now - state.switchedAt < SWITCH_COOLDOWN) {
        state.lastTapTime = 0
        return
      }

      if (now - state.lastTapTime < DOUBLE_TAP_THRESHOLD) {
        state.isFaceMode = !state.isFaceMode
        const targetSpace = state.isFaceMode ? faceSpace : arSpace
        state.lastTapTime = 0
        state.switchedAt = now
        console.log('Double-tap switch to:', targetSpace)
        world.spaces.loadSpace(targetSpace)
      } else {
        state.lastTapTime = now
      }
    }

    document.addEventListener('touchstart', onTap, {passive: true})
    document.addEventListener('mousedown', onTap)
  },
})
