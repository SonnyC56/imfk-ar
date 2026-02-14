import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'open-link',
  schema: {
    url: ecs.string,
  },
  add: (world, component) => {
    const {url} = component.schema
    const eid = component.eid

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    world.events.addListener(eid, ecs.input.UI_CLICK, () => {
      if (!url) return

      if (isSafari) {
        // Safari blocks window.open and anchor clicks from async handlers.
        // Direct navigation is the only reliable path on iOS.
        window.location.href = url
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    })
  },
})
