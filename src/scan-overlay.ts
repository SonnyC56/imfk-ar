import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'scan-overlay',
  schema: {
    imageTargetName: ecs.string,
    audioSrc: ecs.string,
  },
  add: (world, component) => {
    const {imageTargetName, audioSrc} = component.schema

    // Persist state across space reloads via window
    const w = window as any
    if (!w.__scanOverlayState) {
      w.__scanOverlayState = {found: false, playing: false, audio: null}
    }
    const state = w.__scanOverlayState

    // Remove old overlay DOM if space reloaded (prevent duplicates)
    const existing = document.getElementById('scan-overlay')
    if (existing) existing.remove()

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

    // "Tap for sound" pill (hidden initially)
    const tapPrompt = document.createElement('div')
    tapPrompt.style.cssText = [
      'text-align:center;margin:12px auto 0;width:fit-content;',
      'padding:10px 24px;border-radius:24px;',
      'background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);',
      'color:#fff;font:600 15px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
      'pointer-events:auto;cursor:pointer;',
      'opacity:0;transition:opacity 0.4s ease;',
      'animation:tapPulse 1.5s ease-in-out infinite;',
    ].join('')
    tapPrompt.textContent = 'Tap for sound'
    overlay.appendChild(tapPrompt)

    // Progress bar (hidden initially)
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

    // Only add style once
    if (!document.getElementById('scan-overlay-style')) {
      const style = document.createElement('style')
      style.id = 'scan-overlay-style'
      style.textContent = [
        '@keyframes barShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}',
        '@keyframes tapPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}',
      ].join('')
      document.head.appendChild(style)
    }

    // If already found/playing from a previous space load, hide prompts immediately
    if (state.found) {
      prompt.style.display = 'none'
      tapPrompt.style.opacity = '0'
      tapPrompt.style.pointerEvents = 'none'
    }

    // Reuse existing audio element if it exists (preserves playback across space switch)
    if (!state.audio) {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = audioSrc
      audio.setAttribute('playsinline', '')
      state.audio = audio
    }
    const audio: HTMLAudioElement = state.audio

    let rafId: number | null = null

    // If audio is currently playing, resume the progress bar display
    if (state.playing && !audio.paused && !audio.ended) {
      barWrap.style.opacity = '1'
      const updateBar = () => {
        if (audio.duration > 0) {
          const progress = audio.currentTime / audio.duration
          bar.style.transform = 'scaleX(' + Math.max(0, 1 - progress).toFixed(4) + ')'
        }
        if (!audio.paused && !audio.ended) {
          rafId = requestAnimationFrame(updateBar)
        }
      }
      rafId = requestAnimationFrame(updateBar)
    }

    const runProgressBar = () => {
      barWrap.style.opacity = '1'
      const updateBar = () => {
        if (audio.duration > 0) {
          const progress = audio.currentTime / audio.duration
          bar.style.transform = 'scaleX(' + Math.max(0, 1 - progress).toFixed(4) + ')'
        }
        if (!audio.paused && !audio.ended) {
          rafId = requestAnimationFrame(updateBar)
        }
      }
      rafId = requestAnimationFrame(updateBar)

      audio.addEventListener('ended', () => {
        state.playing = false
        bar.style.transform = 'scaleX(0)'
        setTimeout(() => { barWrap.style.opacity = '0' }, 500)
        if (rafId) cancelAnimationFrame(rafId)
      }, {once: true})
    }

    const startAudio = () => {
      if (state.playing) return
      state.playing = true
      console.log('[scan-overlay] startAudio called')

      tapPrompt.style.opacity = '0'
      tapPrompt.style.pointerEvents = 'none'

      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AC) {
          const ctx = new AC()
          ctx.resume()
        }
      } catch (e) { /* ignore */ }

      audio.currentTime = 0
      audio.load()
      audio.play().then(() => {
        console.log('[scan-overlay] Audio playing, duration:', audio.duration.toFixed(1) + 's')
        runProgressBar()
      }).catch((err) => {
        console.warn('[scan-overlay] Audio failed:', err)
        const audio2 = new Audio(audioSrc)
        state.audio = audio2
        audio2.play().then(() => {
          console.log('[scan-overlay] Fallback audio playing')
          runProgressBar()
        }).catch((err2) => {
          console.error('[scan-overlay] All audio attempts failed:', err2)
          state.playing = false
        })
      })
    }

    // Listen for image found — skip if already found+playing
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e: any) => {
      const {name} = e.data as any
      if (name !== imageTargetName) return
      if (state.found && state.playing) return  // already handled, audio still going
      if (state.found && !state.playing) {
        // Was found before, audio finished — allow replay
        state.playing = false
      }
      state.found = true
      console.log('[scan-overlay] Image found!')

      prompt.style.opacity = '0'
      setTimeout(() => { prompt.style.display = 'none' }, 500)

      if (state.playing) return  // audio still going from before

      // Try autoplay
      audio.currentTime = 0
      audio.play().then(() => {
        if (state.playing) return
        state.playing = true
        console.log('[scan-overlay] Autoplay succeeded, duration:', audio.duration.toFixed(1) + 's')
        runProgressBar()
      }).catch(() => {
        console.log('[scan-overlay] Autoplay blocked, showing tap prompt')
        tapPrompt.style.opacity = '1'
        tapPrompt.addEventListener('click', startAudio, {once: true})
        tapPrompt.addEventListener('touchstart', (ev) => {
          ev.stopPropagation()
          startAudio()
        }, {passive: true, once: true})
      })
    })
  },
})
