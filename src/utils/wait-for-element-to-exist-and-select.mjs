export function waitForElementToExistAndSelect(selector, timeout = 0) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    })

    if (timeout)
      setTimeout(() => {
        observer.disconnect()
        resolve(null)
      }, timeout)
  })
}
