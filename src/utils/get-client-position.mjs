export function getClientPosition(e) {
  const rect = e.getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}
