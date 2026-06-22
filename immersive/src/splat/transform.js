// Apply a { position, quaternion, scale } config to a SplatMesh — shared by every splat layer
// (real + placeholder) so the orientation/placement logic lives in one place.
export function applyTransform(mesh, t) {
  mesh.position.set(t.position[0], t.position[1], t.position[2])
  mesh.quaternion.set(t.quaternion[0], t.quaternion[1], t.quaternion[2], t.quaternion[3])
  mesh.scale.setScalar(t.scale)
  return mesh
}
