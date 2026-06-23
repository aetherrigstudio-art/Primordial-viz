import { useEffect, useMemo, useRef, useState } from 'react'

// One composited splat layer: render the placeholder immediately, swap in the real splat when it
// loads, dispose GPU buffers on swap/unmount, and fall back to the placeholder when the asset is
// absent. Shared by every layer (drapery, rainforest) so the swap logic lives in one place.
// `loadFn` and `placeholderFn` MUST be stable references (module-level functions).
// `onMesh` is an OPTIONAL callback invoked with the live SplatMesh whenever the active mesh changes
// (placeholder on mount, the real splat after swap, and null on dispose/unmount). Existing callers
// that omit it are unaffected.
export function useSplatLayer(loadFn, placeholderFn, label = 'splat', onMesh) {
  const placeholder = useMemo(() => placeholderFn(), [placeholderFn])
  const [mesh, setMesh] = useState(placeholder)

  // Keep the latest callback in a ref so changing `onMesh` doesn't re-run the load effect.
  const onMeshRef = useRef(onMesh)
  onMeshRef.current = onMesh

  useEffect(() => {
    let cancelled = false
    let real = null
    onMeshRef.current?.(placeholder) // placeholder is the active mesh on mount
    loadFn()
      .then((m) => {
        if (cancelled) { m.dispose?.(); return }
        real = m
        setMesh(m)
        onMeshRef.current?.(m) // real splat is now active
        // DEFER the placeholder dispose one frame: let React commit the mesh swap and the reactive
        // hook's cleanup (which detaches worldModifier + calls updateGenerator) run FIRST, so we
        // don't free the placeholder's GPU buffers while the modifier still references it (UAF).
        requestAnimationFrame(() => placeholder.dispose?.())
      })
      .catch(() => {
        console.info(`[immersive] ${label} not found — using placeholder`)
      })
    return () => {
      cancelled = true
      real?.dispose?.()
      if (!real) placeholder.dispose?.() // unmounted before the swap → dispose what's active
      onMeshRef.current?.(null) // no active mesh after dispose
    }
  }, [loadFn, placeholder, label])

  return mesh
}
