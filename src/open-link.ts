import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'open-link',
  schema: {
    url: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('idle')
      .initial()
      .onEvent(ecs.input.UI_CLICK, 'opening', {target: eid})

    ecs.defineState('opening')
      .onEnter(() => {
        const {url} = schemaAttribute.get(eid)
        if (url) {
          window.open(url, '_blank')
        }
      })
      .onEvent(ecs.input.UI_CLICK, 'opening', {target: eid})
  },
})
