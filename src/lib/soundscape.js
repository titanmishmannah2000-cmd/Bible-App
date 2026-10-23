// Ambient soundscapes, synthesized live with the Web Audio API so the app
// needs no audio files. Each book's theme names one of these (see BOOK_THEMES).

let ctx = null
let master = null
let current = null // { name, gain, stop }
let noiseBuffers = null

function makeNoise(type) {
  const length = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      if (type === 'brown') {
        last = (last + 0.02 * white) / 1.02
        data[i] = last * 3.5
      } else {
        data[i] = white
      }
    }
  }
  return buffer
}

function noiseSource(type) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffers[type]
  src.loop = true
  src.loopStart = Math.random()
  src.start(0, Math.random() * 3)
  return src
}

function lfo(rate, depth, target, offset) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.frequency.value = rate
  amp.gain.value = depth
  osc.connect(amp).connect(target)
  if (offset !== undefined) target.value = offset
  osc.start()
  return osc
}

// Each builder connects its nodes to `out` and returns the nodes to stop.
const SCENES = {
  wind(out, { level = 1, centre = 520 } = {}) {
    const src = noiseSource('brown')
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 0.8
    const swell = ctx.createGain()
    swell.gain.value = 0.55 * level
    src.connect(band).connect(swell).connect(out)
    const a = lfo(0.07, centre * 0.6, band.frequency, centre)
    const b = lfo(0.11, 0.3 * level, swell.gain)
    return [src, a, b]
  },

  desert(out) {
    const nodes = SCENES.wind(out, { level: 0.7, centre: 900 })
    const src = noiseSource('white')
    const hiss = ctx.createBiquadFilter()
    hiss.type = 'highpass'
    hiss.frequency.value = 5000
    const g = ctx.createGain()
    g.gain.value = 0.015
    src.connect(hiss).connect(g).connect(out)
    return [...nodes, src]
  },

  rain(out, { level = 1 } = {}) {
    const src = noiseSource('white')
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 7000
    const g = ctx.createGain()
    g.gain.value = 0.12 * level
    src.connect(hp).connect(lp).connect(g).connect(out)
    const body = noiseSource('brown')
    const bg = ctx.createGain()
    bg.gain.value = 0.25 * level
    body.connect(bg).connect(out)
    return [src, body]
  },

  storm(out) {
    const nodes = [...SCENES.rain(out, { level: 1.2 }), ...SCENES.wind(out, { level: 0.8, centre: 300 })]
    let timer
    const thunder = () => {
      const src = noiseSource('brown')
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 180
      const g = ctx.createGain()
      const t = ctx.currentTime
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(1.6, t + 0.15)
      g.gain.exponentialRampToValueAtTime(0.001, t + 4.5)
      src.connect(lp).connect(g).connect(out)
      src.stop(t + 5)
      timer = setTimeout(thunder, 9000 + Math.random() * 14000)
    }
    timer = setTimeout(thunder, 2500)
    return [...nodes, { stop: () => clearTimeout(timer) }]
  },

  ambient(out) {
    // A slow, consonant drone: A, E, A, C#, with gently drifting voices.
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.connect(out)
    const nodes = []
    ;[110, 164.81, 220, 277.18].forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = i % 2 ? 'triangle' : 'sine'
      osc.frequency.value = f
      osc.detune.value = (i - 1.5) * 4
      const g = ctx.createGain()
      g.gain.value = 0
      osc.connect(g).connect(filter)
      osc.start()
      nodes.push(osc, lfo(0.03 + i * 0.017, 0.045, g.gain, 0.06))
    })
    nodes.push(...SCENES.wind(out, { level: 0.25, centre: 400 }))
    return nodes
  },
}

export const SCENE_NAMES = Object.keys(SCENES)

function ensureContext() {
  if (ctx) return
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) throw new Error('Web Audio is not supported')
  ctx = new AudioCtx()
  master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)
  noiseBuffers = { white: makeNoise('white'), brown: makeNoise('brown') }
}

// Cross-fades to the named scene. Must first be called from a user gesture.
export function playScene(name) {
  ensureContext()
  if (ctx.state === 'suspended') ctx.resume()
  const sceneName = SCENES[name] ? name : 'ambient'
  if (current?.name === sceneName) return
  fadeOutCurrent()
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5)
  gain.connect(master)
  const nodes = SCENES[sceneName](gain)
  current = {
    name: sceneName,
    gain,
    stop: () => nodes.forEach(n => { try { n.stop() } catch { /* already stopped */ } }),
  }
}

function fadeOutCurrent() {
  if (!current) return
  const { gain, stop } = current
  const t = ctx.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(gain.gain.value, t)
  gain.gain.linearRampToValueAtTime(0, t + 2)
  setTimeout(() => { stop(); gain.disconnect() }, 2200)
  current = null
}

export function stopSound() {
  if (ctx) fadeOutCurrent()
}
