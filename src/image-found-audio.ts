import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'image-found-audio',
  schema: {
    imageTargetName: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    let playing = false

    ecs.defineState('waiting')
      .initial()
      .listen(world.events.globalId, 'reality.imagefound', (e) => {
        const {name} = e.data as any
        const {imageTargetName} = schemaAttribute.get(eid)

        if (name === imageTargetName && !playing) {
          playing = true
          ecs.Audio.mutate(world, eid, (c) => {
            c.paused = false
          })
        }
      })
  },
})
