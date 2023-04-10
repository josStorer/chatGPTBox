import { getCoreContentText } from '../../utils/get-core-content-text'
import { openUrl } from '../../utils/open-url'
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
      openUrl(Browser.runtime.getURL('IndependentPanel.html'))
    },
  },
  openConversationWindow: {
    label: 'Open Conversation Window',
    action: async () => {
      Browser.windows.create({
        url: Browser.runtime.getURL('IndependentPanel.html'),
        type: 'popup',
        width: 500,
        height: 650,
      })
    },
  },
}
