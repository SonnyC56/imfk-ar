import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'double-tap-switch',
  schema: {
    faceSpace: ecs.string,
    arSpace: ecs.string,
    modeLabel: ecs.eid,
  },
  data: {
    lastTapTime: ecs.f64,
    isFaceMode: ecs.boolean,
  },
  add: (world, component) => {
    const {faceSpace, arSpace, modeLabel} = component.schema
    let lastTapTime = 0
    let isFaceMode = true
    const DOUBLE_TAP_THRESHOLD = 400  // ms

    const onTouchStart = () => {
      const now = Date.now()
      if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
        // Double-tap detected — toggle space
        isFaceMode = !isFaceMode
        const targetSpace = isFaceMode ? faceSpace : arSpace
        const labelText = isFaceMode
          ? 'Face Mode  \u2022  Double-tap to switch'
          : 'Camera Mode  \u2022  Double-tap to switch'

        world.spaces.loadSpace(targetSpace)
        ecs.Ui.set(world, modeLabel, {text: labelText})

        // Reset to prevent triple-tap
        lastTapTime = 0
      } else {
        lastTapTime = now
      }
    }

    document.addEventListener('touchstart', onTouchStart, {passive: true})
    // Fallback for desktop testing
    document.addEventListener('mousedown', onTouchStart)
  },
})
