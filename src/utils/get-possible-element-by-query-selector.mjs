export function getPossibleElementByQuerySelector(queryArray) {
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
