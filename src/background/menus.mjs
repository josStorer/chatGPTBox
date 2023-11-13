import Browser from 'webextension-polyfill'
import { defaultConfig, getPreferredLanguageKey } from '../config/index.mjs'
import { changeLanguage, t } from 'i18next'
import { config as menuConfig } from '../content-script/menu-tools/index.mjs'

export function refreshMenu() {
  Browser.contextMenus.removeAll().then(async () => {
    await getPreferredLanguageKey().then((lang) => {
      changeLanguage(lang)
    })
    const menuId = 'ChatGPTBox-Menu'
    Browser.contextMenus.create({
      id: menuId,
      title: 'ChatGPTBox',
      contexts: ['all'],
    })

    for (const [k, v] of Object.entries(menuConfig)) {
      Browser.contextMenus.create({
        id: menuId + k,
        parentId: menuId,
        title: t(v.label),
        contexts: ['all'],
      })
    }
    Browser.contextMenus.create({
      id: menuId + 'separator1',
      parentId: menuId,
      contexts: ['selection'],
      type: 'separator',
    })
    for (const index in defaultConfig.selectionTools) {
      const key = defaultConfig.selectionTools[index]
      const desc = defaultConfig.selectionToolsDesc[index]
      Browser.contextMenus.create({
        id: menuId + key,
        parentId: menuId,
        title: t(desc),
        contexts: ['selection'],
      })
    }

    Browser.contextMenus.onClicked.addListener((info, tab) => {
      Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const currentTab = tabs[0]
        const message = {
          itemId: info.menuItemId.replace(menuId, ''),
          selectionText: info.selectionText,
          useMenuPosition: tab.id === currentTab.id,
        }
        console.debug('menu clicked', message)

        if (defaultConfig.selectionTools.includes(message.itemId)) {
          Browser.tabs.sendMessage(currentTab.id, {
            type: 'CREATE_CHAT',
            data: message,
          })
        } else if (message.itemId in menuConfig) {
          if (menuConfig[message.itemId].action) {
            menuConfig[message.itemId].action(true, tab)
          }

          if (menuConfig[message.itemId].genPrompt) {
            Browser.tabs.sendMessage(currentTab.id, {
              type: 'CREATE_CHAT',
              data: message,
            })
          }
        }
      })
    })
  })
}
