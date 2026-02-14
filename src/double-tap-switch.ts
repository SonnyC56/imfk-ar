import * as ecs from '@8thwall/ecs'

declare global {
  interface Window {
    __dtState?: {
      isFaceMode: boolean
      lastTapTime: number
      switchedAt: number
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

    if (!window.__dtState) {
      window.__dtState = {
        isFaceMode: false,
        lastTapTime: 0,
        switchedAt: 0,
        listenerAttached: false,
      }
    }

    const state = window.__dtState
    const DOUBLE_TAP_THRESHOLD = 400
    const SWITCH_COOLDOWN = 1500

    const labelText = state.isFaceMode
      ? 'Double-tap to enter Sauce Story'
      : 'Double-tap for Face Filter'
    ecs.Ui.set(world, modeLabel, {text: labelText})

    if (state.listenerAttached) return
    state.listenerAttached = true

    const hasTouchSupport = 'ontouchstart' in window

    const switchSpace = (targetSpace: string, toFaceMode: boolean) => {
      console.log('Switching to:', targetSpace, 'faceMode:', toFaceMode)
      world.spaces.loadSpace(targetSpace)

      // Reinitialize camera after space loads
      setTimeout(() => {
        try {
          const camEid = world.camera.getActiveEid()
          console.log('Active camera EID:', camEid)
          if (toFaceMode) {
            ecs.Camera.mutate(world, camEid, (c: any) => {
              c.xrCameraType = 'face'
            })
          } else {
            ecs.Camera.mutate(world, camEid, (c: any) => {
              c.xrCameraType = 'world'
              c.disableWorldTracking = false
            })
          }
        } catch (err) {
          console.warn('Camera reinit error:', err)
        }
      }, 200)
    }

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
        switchSpace(targetSpace, state.isFaceMode)
      } else {
        state.lastTapTime = now
      }
    }

    document.addEventListener('touchstart', onTap, {passive: true})
    document.addEventListener('mousedown', onTap)
  },
})
