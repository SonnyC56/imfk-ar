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
      'position:absolute;top:0;left:0;right:0;height:5px;',
      'background:rgba(255,255,255,0.2);',
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
    ].join('')
    barWrap.appendChild(bar)

    // Add shimmer animation
    const style = document.createElement('style')
    style.textContent = '@keyframes barShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'
    document.head.appendChild(style)

    let found = false
    let rafId: number | null = null
    let audioPollingId: ReturnType<typeof setInterval> | null = null

    // Listen for image found
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e: any) => {
      const {name} = e.data as any
      if (name !== imageTargetName || found) return
      found = true
      console.log('[scan-overlay] Image found! Starting progress bar')

      // Hide prompt, show progress bar
      prompt.style.opacity = '0'
      setTimeout(() => { prompt.style.display = 'none' }, 500)
      barWrap.style.opacity = '1'

      // Poll for an active audio element — the ECS runtime creates <audio> tags
      // but there may be a delay before it starts playing
      let trackedAudio: HTMLAudioElement | null = null
      let audioStartTime = Date.now()

      const updateBar = () => {
        // Try to find the playing audio if we haven't yet
        if (!trackedAudio) {
          const audios = document.querySelectorAll('audio, video')
          for (let i = 0; i < audios.length; i++) {
            const a = audios[i] as HTMLAudioElement
            if (!a.paused && a.duration > 0) {
              trackedAudio = a
              console.log('[scan-overlay] Found playing audio, duration:', a.duration.toFixed(1) + 's')
              break
            }
          }
        }

        if (trackedAudio && trackedAudio.duration > 0) {
          const progress = trackedAudio.currentTime / trackedAudio.duration
          bar.style.transform = 'scaleX(' + Math.max(0, 1 - progress).toFixed(4) + ')'

          if (progress >= 0.99 || trackedAudio.paused) {
            bar.style.transform = 'scaleX(0)'
            setTimeout(() => { barWrap.style.opacity = '0' }, 300)
            if (audioPollingId) clearInterval(audioPollingId)
            return
          }
        }

        rafId = requestAnimationFrame(updateBar)
      }

      // Start polling immediately and also via rAF
      rafId = requestAnimationFrame(updateBar)

      // Also add ended listener once we find the audio
      audioPollingId = setInterval(() => {
        if (trackedAudio) {
          clearInterval(audioPollingId!)
          trackedAudio.addEventListener('ended', () => {
            bar.style.transform = 'scaleX(0)'
            setTimeout(() => { barWrap.style.opacity = '0' }, 300)
            if (rafId) cancelAnimationFrame(rafId)
          })
          return
        }
        // Keep looking for audio elements
        const audios = document.querySelectorAll('audio, video')
        for (let i = 0; i < audios.length; i++) {
          const a = audios[i] as HTMLAudioElement
          if (a.src && a.src.indexOf('Music-VO') !== -1) {
            trackedAudio = a
            console.log('[scan-overlay] Found Music-VO audio element, paused:', a.paused)
            break
          }
        }
      }, 200)
    })
  },
})
