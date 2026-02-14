import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'open-link',
  schema: {
    url: ecs.string,
  },
  add: (world, component) => {
    const {url} = component.schema
    const eid = component.eid

    // Use direct DOM touch/click to preserve user gesture chain for Safari
    const handler = () => {
      // For Safari compatibility, navigate via an anchor element click
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => a.remove(), 100)
      }
    }

    // Listen for ECS UI_CLICK on this entity via world events
    world.events.addListener(eid, ecs.input.UI_CLICK, handler)
  },
})
