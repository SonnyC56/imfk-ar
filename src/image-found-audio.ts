import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'image-found-audio',
  schema: {
    imageTargetName: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    let playing = false
    const {imageTargetName} = schemaAttribute.get(eid)
    console.log('[image-found-audio] Component init, listening for target:', imageTargetName)

    // Log ALL reality events for debugging
    const realityEvents = [
      'reality.imagefound', 'reality.imageupdated', 'reality.imagelost',
      'reality.imageloading', 'reality.imagescanning',
    ]
    realityEvents.forEach((eventName) => {
      try {
        ecs.defineState('_listen_' + eventName.replace('.', '_'))
          .listen(world.events.globalId, eventName, (e) => {
            console.log('[XR EVENT]', eventName, JSON.stringify(e.data))
          })
      } catch (err) {
        // ignore if state name conflicts
      }
    })

    ecs.defineState('waiting')
      .initial()
      .listen(world.events.globalId, 'reality.imagefound', (e) => {
        const {name} = e.data as any
        console.log('[image-found-audio] imagefound event, name:', name, 'expecting:', imageTargetName)

        if (name === imageTargetName && !playing) {
          playing = true
          console.log('[image-found-audio] MATCH! Playing audio')
          ecs.Audio.mutate(world, eid, (c) => {
            c.paused = false
          })
        }
      })
  },
})
