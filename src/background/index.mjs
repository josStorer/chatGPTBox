import { v4 as uuidv4 } from 'uuid'
import Browser from 'webextension-polyfill'
import ExpiryMap from 'expiry-map'
import { generateAnswersWithChatgptWebApi, sendMessageFeedback } from './apis/chatgpt-web'
import {
  generateAnswersWithChatgptApi,
  generateAnswersWithGptCompletionApi,
} from './apis/openai-api'
import {
  chatgptApiModelKeys,
  chatgptWebModelKeys,
  getUserConfig,
  gptApiModelKeys,
  isUsingApiKey,
} from '../config'
import { isSafari } from '../utils/is-safari'
import { config as toolsConfig } from '../content-script/selection-tools'

const KEY_ACCESS_TOKEN = 'accessToken'
const cache = new ExpiryMap(10 * 1000)

/**
 * @returns {Promise<string>}
 */
async function getAccessToken() {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN)
  }
  if (isSafari()) {
    const userConfig = await getUserConfig()
    if (userConfig.accessToken) {
      cache.set(KEY_ACCESS_TOKEN, userConfig.accessToken)
    } else {
      throw new Error('UNAUTHORIZED')
    }
  } else {
    const resp = await fetch('https://chat.openai.com/api/auth/session')
    if (resp.status === 403) {
      throw new Error('CLOUDFLARE')
    }
    const data = await resp.json().catch(() => ({}))
    if (!data.accessToken) {
      throw new Error('UNAUTHORIZED')
    }
    cache.set(KEY_ACCESS_TOKEN, data.accessToken)
  }
  return cache.get(KEY_ACCESS_TOKEN)
}

Browser.runtime.onConnect.addListener((port) => {
  console.debug('connected')
  port.onMessage.addListener(async (msg) => {
    console.debug('received msg', msg)
    const config = await getUserConfig()
    const session = msg.session
    if (session.useApiKey == null) {
      session.useApiKey = isUsingApiKey(config)
    }

    try {
      if (chatgptWebModelKeys.includes(config.modelName)) {
        const accessToken = await getAccessToken()
        session.messageId = uuidv4()
        if (session.parentMessageId == null) {
          session.parentMessageId = uuidv4()
        }
        await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
      } else if (gptApiModelKeys.includes(config.modelName)) {
        await generateAnswersWithGptCompletionApi(
          port,
          session.question,
          session,
          config.apiKey,
          config.modelName,
        )
      } else if (chatgptApiModelKeys.includes(config.modelName)) {
        await generateAnswersWithChatgptApi(
          port,
          session.question,
          session,
          config.apiKey,
          config.modelName,
        )
      }
    } catch (err) {
      console.error(err)
      port.postMessage({ error: err.message })
      cache.delete(KEY_ACCESS_TOKEN)
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getAccessToken()
    await sendMessageFeedback(token, message.data)
  }
})

Browser.contextMenus.removeAll().then(() => {
  const menuId = 'ChatGPTBox-Menu'
  Browser.contextMenus.create({
    id: menuId,
    title: 'ChatGPTBox',
    contexts: ['all'],
  })

  Browser.contextMenus.create({
    id: menuId + 'new',
    parentId: menuId,
    title: 'New Chat',
    contexts: ['selection'],
  })
  for (const key in toolsConfig) {
    const toolConfig = toolsConfig[key]
    Browser.contextMenus.create({
      id: menuId + key,
      parentId: menuId,
      title: toolConfig.label,
      contexts: ['selection'],
    })
  }

  Browser.contextMenus.onClicked.addListener((info, tab) => {
    const itemId = info.menuItemId === menuId ? 'new' : info.menuItemId.replace(menuId, '')
    const message = {
      itemId: itemId,
      selectionText: info.selectionText,
    }
    console.debug('menu clicked', message)
    Browser.tabs.sendMessage(tab.id, {
      type: 'MENU',
      data: message,
    })
  })
})
