import { getCoreContentText } from '../../utils/get-core-content-text'
import { openUrl } from '../../utils/open-url'
import Browser from 'webextension-polyfill'
import { getUserConfig } from '../../config/index.mjs'

export const config = {
  newChat: {
    label: 'New Chat',
    genPrompt: async () => {
      return ''
    },
  },
  summarizePage: {
    label: 'Summarize Page',
    genPrompt: async () => {
      return `The following is the text content of a web page, analyze the core content and summarize:\n${getCoreContentText()}`
    },
  },
  openConversationPage: {
    label: 'Open Conversation Page',
    action: async () => {
      openUrl(Browser.runtime.getURL('IndependentPanel.html'))
    },
  },
  openConversationWindow: {
    label: 'Open Conversation Window',
    action: async () => {
      const config = await getUserConfig()
      const url = Browser.runtime.getURL('IndependentPanel.html')
      const tabs = await Browser.tabs.query({ url: url, windowType: 'popup' })
      if (!config.alwaysCreateNewConversationWindow && tabs.length > 0)
        await Browser.windows.update(tabs[0].windowId, { focused: true })
      else
        await Browser.windows.create({
          url: url,
          type: 'popup',
          width: 500,
          height: 650,
        })
    },
  },
  closeAllChats: {
    label: 'Close All Chats In This Page',
    action: async () => {
      Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        Browser.tabs.sendMessage(tabs[0].id, {
          type: 'CLOSE_CHATS',
          data: {},
        })
      })
    },
  },
}
