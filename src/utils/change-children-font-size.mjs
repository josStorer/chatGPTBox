export function changeChildrenFontSize(element, size) {
  try {
    element.style.fontSize = size
  } catch {
    /* empty */
  }
  for (let i = 0; i < element.childNodes.length; i++) {
    changeChildrenFontSize(element.childNodes[i], size)
  }
}
