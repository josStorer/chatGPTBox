// https://stackoverflow.com/questions/64304365/stop-request-after-x-amount-is-fetched

export async function limitedFetch(url, maxBytes) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.onprogress = (ev) => {
        if (ev.loaded < maxBytes) return
        resolve(ev.target.responseText.substring(0, maxBytes))
        xhr.abort()
      }
      xhr.onload = (ev) => {
        resolve(ev.target.responseText.substring(0, maxBytes))
      }
      xhr.onerror = (ev) => {
        reject(new Error(ev.target.status))
      }

      xhr.open('GET', url)
      xhr.send()
    } catch (err) {
      reject(err)
    }
  })
}
