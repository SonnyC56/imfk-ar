import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'image-found-handler',
  schema: {
    imageTargetName: ecs.string,
    tapOverlay: ecs.eid,
  },
  add: (world, component) => {
    const {imageTargetName, tapOverlay} = component.schema
    const eid = component.eid
    let hasInteracted = false

    // Show overlay when image target is found
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e: any) => {
      const {name} = e.data
      if (name === imageTargetName && !hasInteracted) {
        ecs.Hidden.remove(world, tapOverlay)
      }
    })

    // Hide overlay when image target is lost
    world.events.addListener(world.events.globalId, 'reality.imagelost', (e: any) => {
      const {name} = e.data
      if (name === imageTargetName) {
        ecs.Hidden.set(world, tapOverlay)
      }
    })

    // On tap, dismiss the overlay and enable audio
    const onTap = () => {
      if (!hasInteracted) {
        hasInteracted = true
        ecs.Hidden.set(world, tapOverlay)
      }
    }

    document.addEventListener('touchstart', onTap, {once: true})
    document.addEventListener('mousedown', onTap, {once: true})
  },
})
