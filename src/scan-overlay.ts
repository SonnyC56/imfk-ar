import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'scan-overlay',
  schema: {
    imageTargetName: ecs.string,
    audioEntity: ecs.eid,
  },
  add: (world, component) => {
    const {imageTargetName, audioEntity} = component.schema

    // Create overlay container
    const overlay = document.createElement('div')
    overlay.id = 'scan-overlay'
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;pointer-events:none;'
    document.body.appendChild(overlay)

    // "Scan the Sauce" prompt
    const prompt = document.createElement('div')
    prompt.style.cssText = [
      'text-align:center;padding:16px 20px;',
      'background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0) 100%);',
      'color:#fff;font:600 18px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
      'letter-spacing:0.5px;',
      'transition:opacity 0.5s ease;',
    ].join('')
    prompt.textContent = 'Scan the Sauce to begin'
    overlay.appendChild(prompt)

    // Progress bar container (hidden initially)
    const barWrap = document.createElement('div')
    barWrap.style.cssText = [
      'position:absolute;top:0;left:0;right:0;height:4px;',
      'background:rgba(255,255,255,0.15);',
      'opacity:0;transition:opacity 0.4s ease;',
    ].join('')
    overlay.appendChild(barWrap)

    const bar = document.createElement('div')
    bar.style.cssText = [
      'height:100%;width:100%;',
      'background:linear-gradient(90deg,#ff6b6b,#ffa502,#ff6b6b);',
      'background-size:200% 100%;',
      'animation:barShimmer 2s linear infinite;',
      'transform-origin:left;',
      'transition:transform 0.3s linear;',
    ].join('')
    barWrap.appendChild(bar)

    // Add shimmer animation
    const style = document.createElement('style')
    style.textContent = '@keyframes barShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'
    document.head.appendChild(style)

    let found = false
    let rafId: number | null = null

    // Listen for image found
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e: any) => {
      const {name} = e.data as any
      if (name !== imageTargetName || found) return
      found = true

      // Hide prompt, show progress bar
      prompt.style.opacity = '0'
      setTimeout(() => { prompt.style.display = 'none' }, 500)
      barWrap.style.opacity = '1'

      // Start tracking audio progress
      const startTime = Date.now()

      // Try to get audio duration from the DOM audio element
      const checkProgress = () => {
        try {
          // Find the audio element the ECS runtime created
          const audios = document.querySelectorAll('audio')
          let activeAudio: HTMLAudioElement | null = null
          audios.forEach((a) => {
            if (!a.paused && a.duration > 0) activeAudio = a
          })

          if (activeAudio) {
            const progress = activeAudio.currentTime / activeAudio.duration
            bar.style.transform = 'scaleX(' + (1 - progress) + ')'

            if (progress >= 0.99) {
              // Audio finished
              barWrap.style.opacity = '0'
              return
            }
          }
        } catch (err) {
          // ignore
        }
        rafId = requestAnimationFrame(checkProgress)
      }

      // Small delay for audio to start
      setTimeout(() => {
        rafId = requestAnimationFrame(checkProgress)
      }, 300)
    })

    // Cleanup on remove
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      overlay.remove()
      style.remove()
    }
  },
})
