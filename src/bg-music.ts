import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'bg-music',
  schema: {},
  add: (world, component) => {
    const eid = component.eid

    // Auto-play background music on first user interaction
    // (browsers require a user gesture before playing audio)
    const startMusic = () => {
      ecs.Audio.mutate(world, eid, (c) => {
        c.paused = false
      })
    }

    // Try to play immediately (works if user already tapped for permissions)
    try {
      startMusic()
    } catch (_) {
      // If blocked, wait for first touch
    }

    // Also start on first user tap (covers permission-dialog flow)
    const onInteraction = () => {
      try {
        startMusic()
      } catch (_) {}
      document.removeEventListener('touchstart', onInteraction)
      document.removeEventListener('mousedown', onInteraction)
    }
    document.addEventListener('touchstart', onInteraction, {passive: true})
    document.addEventListener('mousedown', onInteraction)
  },
})
