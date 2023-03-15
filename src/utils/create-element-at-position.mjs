export function createElementAtPosition(x = 0, y = 0, zIndex = 2147483647) {
  const element = document.createElement('div')
  element.style.position = 'fixed'
  element.style.zIndex = zIndex
  element.style.left = x + 'px'
  element.style.top = y + 'px'
  document.documentElement.appendChild(element)
  return element
}
