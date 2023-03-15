export function setElementPositionInViewport(element, x = 0, y = 0) {
  const retX = Math.min(window.innerWidth - element.offsetWidth, Math.max(0, x))
  const retY = Math.min(window.innerHeight - element.offsetHeight, Math.max(0, y))
  element.style.left = retX + 'px'
  element.style.top = retY + 'px'
  return { x: retX, y: retY }
}
