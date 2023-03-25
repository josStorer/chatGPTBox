import { getCoreContentText } from '../../utils/get-core-content-text'

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
}
