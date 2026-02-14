import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'double-tap-switch',
  schema: {
    faceSpace: ecs.string,
    arSpace: ecs.string,
    modeLabel: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {faceSpace, arSpace, modeLabel} = schemaAttribute.get(eid)

    const DOUBLE_TAP_THRESHOLD = 400
    const SWITCH_COOLDOWN = 1500
    let lastTapTime = 0
    let switchedAt = 0
    let listenerAttached = false

    const attachDoubleTapListener = () => {
      if (listenerAttached) return
      listenerAttached = true

      const hasTouchSupport = 'ontouchstart' in window

      const onTap = (e: Event) => {
        if (hasTouchSupport && e.type === 'mousedown') return
        if (!hasTouchSupport && e.type === 'touchstart') return

        const now = Date.now()
        if (now - switchedAt < SWITCH_COOLDOWN) {
          lastTapTime = 0
          return
        }

        if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
          lastTapTime = 0
          switchedAt = now
          world.events.dispatch(eid, 'double-tap', {})
        } else {
          lastTapTime = now
        }
      }

      document.addEventListener('touchstart', onTap, {passive: true})
      document.addEventListener('mousedown', onTap)
    }

    ecs.defineState('face')
      .initial()
      .onEnter(() => {
        world.spaces.loadSpace(faceSpace)
        ecs.Ui.set(world, modeLabel, {text: 'Double-tap to enter Sauce Story'})
        attachDoubleTapListener()
      })
      .listen(eid, 'double-tap', () => 'ar')

    ecs.defineState('ar')
      .onEnter(() => {
        world.spaces.loadSpace(arSpace)
        ecs.Ui.set(world, modeLabel, {text: 'Double-tap for Face Filter'})
      })
      .listen(eid, 'double-tap', () => 'face')
  },
})
