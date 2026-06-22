import { useEffect, useMemo, useState } from 'react'

// One composited splat layer: render the placeholder immediately, swap in the real splat when it
// loads, dispose GPU buffers on swap/unmount, and fall back to the placeholder when the asset is
// absent. Shared by every layer (drapery, rainforest) so the swap logic lives in one place.
// `loadFn` and `placeholderFn` MUST be stable references (module-level functions).
export function useSplatLayer(loadFn, placeholderFn, label = 'splat') {
  const placeholder = useMemo(() => placeholderFn(), [placeholderFn])
  const [mesh, setMesh] = useState(placeholder)

  useEffect(() => {
    let cancelled = false
    let real = null
    loadFn()
      .then((m) => {
        if (cancelled) { m.dispose?.(); return }
        real = m
        setMesh(m)
        placeholder.dispose?.() // free the placeholder's buffers once the real splat is in
      })
      .catch(() => {
        console.info(`[immersive] ${label} not found — using placeholder`)
      })
    return () => {
      cancelled = true
      real?.dispose?.()
      if (!real) placeholder.dispose?.() // unmounted before the swap → dispose what's active
    }
  }, [loadFn, placeholder, label])

  return mesh
}
