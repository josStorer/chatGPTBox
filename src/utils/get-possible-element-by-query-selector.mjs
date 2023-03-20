export function getPossibleElementByQuerySelector(queryArray) {
  if (!queryArray) return
  for (const query of queryArray) {
    if (query) {
      try {
        const element = document.querySelector(query)
        if (element) {
          return element
        }
      } catch (e) {
        /* empty */
      }
    }
  }
}
