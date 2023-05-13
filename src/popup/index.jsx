import { render } from 'preact'
import Popup from './Popup'
import '../_locales/i18n-react'
import { getUserConfig } from '../config/index.mjs'
import { config as menuConfig } from '../content-script/menu-tools/index.mjs'
import Browser from 'webextension-polyfill'

getUserConfig().then(async (config) => {
  if (config.clickIconAction === 'popup' || (window.innerWidth > 100 && window.innerHeight > 100)) {
    render(<Popup />, document.getElementById('app'))
  } else {
    const message = {
      itemId: config.clickIconAction,
      selectionText: '',
      useMenuPosition: false,
    }
    console.debug('custom icon action triggered', message)

    if (config.clickIconAction in menuConfig) {
      if (menuConfig[config.clickIconAction].action) {
        menuConfig[config.clickIconAction].action(false)
      }

      if (menuConfig[config.clickIconAction].genPrompt) {
        const currentTab = (await Browser.tabs.query({ active: true, currentWindow: true }))[0]
        Browser.tabs.sendMessage(currentTab.id, {
          type: 'CREATE_CHAT',
          data: message,
        })
      }
    }
    window.close()
  }
})
