import { getCoreContentText } from '../../utils/get-core-content-text'
import Browser from 'webextension-polyfill'

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
      Browser.runtime.sendMessage({
        type: 'OPEN_URL',
        data: {
          url: Browser.runtime.getURL('IndependentPanel.html'),
        },
      })
    },
  },
  openConversationWindow: {
    label: 'Open Conversation Window',
    action: async () => {
      Browser.runtime.sendMessage({
        type: 'OPEN_CHAT_WINDOW',
        data: {},
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
