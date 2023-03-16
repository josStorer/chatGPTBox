export function setElementPositionInViewport(element, x = 0, y = 0) {
  const retX = Math.min(Math.max(0, window.innerWidth - element.offsetWidth), Math.max(0, x))
  const retY = Math.min(Math.max(0, window.innerHeight - element.offsetHeight), Math.max(0, y))
  element.style.left = retX + 'px'
  element.style.top = retY + 'px'
  return { x: retX, y: retY }
}
