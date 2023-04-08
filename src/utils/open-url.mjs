import Browser from 'webextension-polyfill'

export function openUrl(url) {
  Browser.tabs.query({ url, currentWindow: true }).then((tabs) => {
    if (tabs.length > 0) {
      Browser.tabs.update(tabs[0].id, { active: true })
    } else {
      Browser.tabs.create({ url })
    }
  })
}
