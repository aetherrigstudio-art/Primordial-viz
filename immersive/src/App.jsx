import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { SparkScene } from './splat/SparkScene.jsx'
import { CameraRig } from './camera/CameraRig.jsx'
import { useViewpoint } from './viewpoint/useViewpoint.js'
import { clampDpr, prefersReducedMotion, pauseOnHidden } from './perf/mobileBudget.js'
import { AudioProvider, useAudio } from './audio/useAudio.jsx'
import { createStore } from './control/store.js'
import { useControls } from './control/useControls.js'
import { createTravelDriver } from './mode/travelDriver.js'
import { useInstrumentMode } from './mode/useInstrumentMode.js'
import { useInstrumentCamera } from './mode/instrumentCamera.js'

// Proving-ground route. A start gate is mandatory: iOS gyro AND audio both need a user gesture,
// so the gate's tap calls enableGyro() AND audio.start() (idempotent). Reduced-motion users get a
// calm, static frame instead of the moving journey (PLAN §4 reduced-motion tier).
//
// Two foundations are wired in here:
//  - AudioProvider wraps the tree; a pump inside the Canvas calls the audio update() once per frame
//    (skipped while the tab is hidden — pauseOnHidden).
//  - A control store + useControls(keyboard) feed the reactive splat's params; a travel driver +
//    useInstrumentMode latch gate audio-reactivity 'active' on (mode === 'instrument').
export function App() {
  return (
    <AudioProvider>
      <Experience />
    </AudioProvider>
  )
}

function Experience() {
  const viewpoint = useViewpoint()
  const audio = useAudio()
  const [started, setStarted] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const reduced = prefersReducedMotion()

  // Control core: one store for the lifetime of the app; keyboard source wired (MIDI/OSC opt-in,
  // off until hardware/a bridge exists). A paramsRef mirrors the store so the per-frame splat
  // writer reads params without re-rendering React each change.
  const store = useMemo(() => createStore(), [])
  useControls(store, { keyboard: true, midi: false, osc: false })
  const paramsRef = useRef(store.getParams())
  useEffect(() => {
    paramsRef.current = store.getParams()
    return store.subscribe((p) => { paramsRef.current = p })
  }, [store])

  // Travel driver owns the single 0..1 `travel` scalar. TODO(arrow-camera PR): repoint setSource at
  // the real arrow-nav forward travel. For the proving ground we feed viewpoint.scroll as a temporary
  // stub so the journey advances and the instrument latch can be reached.
  const driver = useMemo(() => createTravelDriver(), [])
  useEffect(() => {
    driver.setSource(() => viewpoint.smoothed.current.scroll)
  }, [driver, viewpoint])

  const { mode, requestSkip } = useInstrumentMode(driver)
  const active = mode === 'instrument'

  // a11y: when the journey latches into the live instrument, move focus to the instrument region
  // and announce it via an aria-live node.
  const instrumentRef = useRef(null)
  const [announce, setAnnounce] = useState('')
  useEffect(() => {
    if (mode === 'instrument') {
      setAnnounce('Live visualizer ready. Audio-reactive controls are active.')
      instrumentRef.current?.focus()
    }
  }, [mode])

  // The start gate's tap: enable gyro AND start audio (both need this user gesture). On deny, audio
  // sets status='visuals-only' and we surface a role=alert message.
  const start = async () => {
    await viewpoint.enableGyro()
    const res = await audio.start()
    if (!res.ok) setAudioMessage(res.message)
    setStarted(true)
  }

  // The "Skip to visualize" tap doubles as the audio gesture: it ramps travel -> 1 AND starts audio.
  const skip = async () => {
    requestSkip()
    const res = await audio.start()
    if (!res.ok) setAudioMessage(res.message)
    if (!started) setStarted(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={clampDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        camera={{ fov: 55, near: 0.1, far: 100, position: [0, 0, 4] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0B1F18']} />
        <SparkScene
          featuresRef={audio.featuresRef}
          paramsRef={paramsRef}
          audioTexture={audio.audioTexture}
          active={active}
        />
        {/* Per-frame pumps live inside the Canvas so they share the R3F frame loop. */}
        <AudioPump updateRef={audio.updateRef} />
        <TravelPump driver={driver} />
        {/* The journey CameraRig owns the camera UNTIL the instrument latch flips; then the
            beat-synced InstrumentCameraRig takes over (mounted only while active). */}
        {started && !reduced && !active && <CameraRig viewpoint={viewpoint} />}
        {started && !reduced && active && (
          <InstrumentCameraRig beatRef={audio.beatRef} active={active} store={store} />
        )}
      </Canvas>

      {!started && (
        <button
          onClick={start}
          aria-label="Enter the immersive scene"
          style={{
            position: 'fixed', inset: 0, margin: 'auto', width: 220, height: 56,
            background: '#E6D7B8', color: '#0B1F18', border: 'none', borderRadius: 28,
            font: '600 16px/1 system-ui, sans-serif', letterSpacing: '0.04em', cursor: 'pointer',
          }}
        >
          Enter
        </button>
      )}

      {started && mode === 'journey' && (
        <button
          onClick={skip}
          aria-label="Skip to the live visualizer"
          style={{
            position: 'fixed', right: 16, bottom: 16, height: 44, padding: '0 18px',
            background: 'rgba(11,31,24,0.7)', color: '#E6D7B8', border: '1px solid #E6D7B8',
            borderRadius: 22, font: '600 14px/1 system-ui, sans-serif', cursor: 'pointer',
          }}
        >
          Skip to visualize
        </button>
      )}

      {/* Instrument focus target — receives focus when the latch flips so keyboard control + screen
          readers land on the live visualizer. */}
      <div
        ref={instrumentRef}
        tabIndex={-1}
        role="region"
        aria-label="Live audio-reactive visualizer"
        style={{ position: 'fixed', inset: 0, outline: 'none', pointerEvents: 'none' }}
      />

      {/* aria-live announcements (instrument latch + audio status). */}
      <div aria-live="polite" style={srOnly}>{announce}</div>
      {audioMessage && (
        <div role="alert" style={srOnly}>{audioMessage}</div>
      )}
    </div>
  )
}

// Drives the audio subsystem's single per-frame update() from inside the Canvas frame loop, and
// skips it while the tab is hidden (pauseOnHidden) so getUserMedia keeps running but the texture/
// bands hold their last values.
function AudioPump({ updateRef }) {
  const visibleRef = useRef(true)
  useEffect(() => pauseOnHidden((v) => { visibleRef.current = v }), [])
  useFrame(() => {
    if (!visibleRef.current) return
    updateRef.current?.()
  })
  return null
}

// Advances the travel driver's skip ramp each frame. getTravel() is read elsewhere (latch/camera);
// tick(dt) is a no-op unless a skip is in flight.
function TravelPump({ driver }) {
  useFrame((_, dt) => { driver.tick(dt) })
  return null
}

// The beat-synced instrument camera, mounted ONLY while active (mode === 'instrument') so it takes
// over the camera after the journey latch. Manual camera input (pointer drag / wheel / keys / touch)
// calls notifyManualInput() to suspend the autonomous beat path for a few seconds, then it resumes.
// The control store is threaded as paramsStore so each waypoint's animation biases nudge the params.
function InstrumentCameraRig({ beatRef, active, store }) {
  const { notifyManualInput } = useInstrumentCamera({ active, beatRef, paramsStore: store })
  useEffect(() => {
    const onInput = () => notifyManualInput()
    window.addEventListener('pointermove', onInput, { passive: true })
    window.addEventListener('wheel', onInput, { passive: true })
    window.addEventListener('touchmove', onInput, { passive: true })
    window.addEventListener('keydown', onInput)
    return () => {
      window.removeEventListener('pointermove', onInput)
      window.removeEventListener('wheel', onInput)
      window.removeEventListener('touchmove', onInput)
      window.removeEventListener('keydown', onInput)
    }
  }, [notifyManualInput])
  return null
}

const srOnly = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}
