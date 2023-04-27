import Browser from 'webextension-polyfill'
import {
  deleteConversation,
  generateAnswersWithChatgptWebApi,
  sendMessageFeedback,
} from '../services/apis/chatgpt-web'
import { generateAnswersWithBingWebApi } from '../services/apis/bing-web.mjs'
import {
  generateAnswersWithChatgptApi,
  generateAnswersWithGptCompletionApi,
} from '../services/apis/openai-api'
import { generateAnswersWithCustomApi } from '../services/apis/custom-api.mjs'
import { generateAnswersWithAzureOpenaiApi } from '../services/apis/azure-openai-api.mjs'
import { generateAnswersWithWaylaidwandererApi } from '../services/apis/waylaidwanderer-api.mjs'
import { generateAnswersWithPoeWebApi } from '../services/apis/poe-web.mjs'
import {
  azureOpenAiApiModelKeys,
  bingWebModelKeys,
  chatgptApiModelKeys,
  chatgptWebModelKeys,
  customApiModelKeys,
  defaultConfig,
  githubThirdPartyApiModelKeys,
  gptApiModelKeys,
  Models,
  poeWebModelKeys,
  setUserConfig,
} from '../config/index.mjs'
import '../_locales/i18n'
import { openUrl } from '../utils/open-url'
import {
  getBingAccessToken,
  getChatGptAccessToken,
  registerPortListener,
} from '../services/wrappers.mjs'
import { refreshMenu } from './menus.mjs'
import { registerCommands } from './commands.mjs'

async function executeApi(session, port, config) {
  if (chatgptWebModelKeys.includes(session.modelName)) {
    let tabId
    if (
      config.chatgptTabId &&
      config.customChatGptWebApiUrl === defaultConfig.customChatGptWebApiUrl
    ) {
      const tab = await Browser.tabs.get(config.chatgptTabId).catch(() => {})
      if (tab) tabId = tab.id
    }
    if (tabId) {
      const proxyPort = Browser.tabs.connect(tabId)
      proxyPort.onMessage.addListener((msg) => {
        port.postMessage(msg)
      })
      port.onMessage.addListener((msg) => {
        proxyPort.postMessage(msg)
      })
      proxyPort.postMessage({ session })
    } else {
      const accessToken = await getChatGptAccessToken()
      await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
    }
  } else if (bingWebModelKeys.includes(session.modelName)) {
    const accessToken = await getBingAccessToken()
    if (session.modelName === 'bingFreeSydney')
      await generateAnswersWithBingWebApi(port, session.question, session, accessToken, true)
    else await generateAnswersWithBingWebApi(port, session.question, session, accessToken)
  } else if (gptApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithGptCompletionApi(
      port,
      session.question,
      session,
      config.apiKey,
      session.modelName,
    )
  } else if (chatgptApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithChatgptApi(
      port,
      session.question,
      session,
      config.apiKey,
      session.modelName,
    )
  } else if (customApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithCustomApi(port, session.question, session, '', config.customModelName)
  } else if (azureOpenAiApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithAzureOpenaiApi(port, session.question, session)
  } else if (githubThirdPartyApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithWaylaidwandererApi(port, session.question, session)
  } else if (poeWebModelKeys.includes(session.modelName)) {
    if (session.modelName === 'poeAiWebCustom')
      await generateAnswersWithPoeWebApi(port, session.question, session, config.poeCustomBotName)
    else
      await generateAnswersWithPoeWebApi(
        port,
        session.question,
        session,
        Models[session.modelName].value,
      )
  }
}

Browser.runtime.onMessage.addListener(async (message) => {
  switch (message.type) {
    case 'FEEDBACK': {
      const token = await getChatGptAccessToken()
      await sendMessageFeedback(token, message.data)
      break
    }
    case 'DELETE_CONVERSATION': {
      const token = await getChatGptAccessToken()
      await deleteConversation(token, message.data.conversationId)
      break
    }
    case 'OPEN_URL':
      openUrl(message.data.url)
      break
    case 'REFRESH_MENU':
      refreshMenu()
      break
    case 'PIN_TAB': {
      let tabId
      if (message.data.tabId) tabId = message.data.tabId
      else {
        const currentTab = (await Browser.tabs.query({ active: true, currentWindow: true }))[0]
        if (message.data.saveAsChatgptConfig) {
          if (currentTab.url.includes('chat.openai.com')) tabId = currentTab.id
        } else {
          tabId = currentTab.id
        }
      }
      if (tabId) {
        await Browser.tabs.update(tabId, { pinned: true })
        if (message.data.saveAsChatgptConfig) await setUserConfig({ chatgptTabId: tabId })
      }
      break
    }
  }
})

registerPortListener(async (session, port, config) => await executeApi(session, port, config))
registerCommands()
refreshMenu()
