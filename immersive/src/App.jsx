import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SparkScene } from './splat/SparkScene.jsx'
import { CameraRig } from './camera/CameraRig.jsx'
import { useViewpoint } from './viewpoint/useViewpoint.js'
import { clampDpr, prefersReducedMotion } from './perf/mobileBudget.js'

// Proving-ground route. A start gate is mandatory: iOS gyro AND (later) audio both need a
// user gesture. The gate's tap calls enableGyro(). Reduced-motion users get a calm, static
// frame instead of the moving journey (PLAN §4 reduced-motion tier).
export function App() {
  const viewpoint = useViewpoint()
  const [started, setStarted] = useState(false)
  const reduced = prefersReducedMotion()

  const start = async () => {
    await viewpoint.enableGyro()
    setStarted(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={clampDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        camera={{ fov: 55, near: 0.1, far: 100, position: [0, 0, 4] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0B1F18']} />
        <SparkScene />
        {started && !reduced && <CameraRig viewpoint={viewpoint} />}
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
    </div>
  )
}
