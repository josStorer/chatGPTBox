import Browser from 'webextension-polyfill'
import ExpiryMap from 'expiry-map'
import { generateAnswersWithChatgptWebApi, sendMessageFeedback } from './apis/chatgpt-web'
import { generateAnswersWithBingWebApi } from './apis/bing-web.mjs'
import {
  generateAnswersWithChatgptApi,
  generateAnswersWithGptCompletionApi,
} from './apis/openai-api'
import { generateAnswersWithCustomApi } from './apis/custom-api.mjs'
import {
  bingWebModelKeys,
  chatgptApiModelKeys,
  chatgptWebModelKeys,
  customApiModelKeys,
  defaultConfig,
  getUserConfig,
  gptApiModelKeys,
  Models,
} from '../config/index.mjs'
import { isSafari } from '../utils/is-safari'
import { config as menuConfig } from '../content-script/menu-tools'

const KEY_ACCESS_TOKEN = 'accessToken'
const cache = new ExpiryMap(10 * 1000)

async function getChatGptAccessToken() {
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

async function getBingAccessToken() {
  return (await Browser.cookies.get({ url: 'https://bing.com/', name: '_U' }))?.value
}

Browser.runtime.onConnect.addListener((port) => {
  console.debug('connected')
  port.onMessage.addListener(async (msg) => {
    console.debug('received msg', msg)
    const session = msg.session
    if (!session) return
    const config = await getUserConfig()
    if (!session.modelName) session.modelName = config.modelName
    if (!session.aiName) session.aiName = Models[session.modelName].desc
    port.postMessage({ session })

    try {
      if (chatgptWebModelKeys.includes(session.modelName)) {
        const accessToken = await getChatGptAccessToken()
        session.messageId = crypto.randomUUID()
        if (session.parentMessageId == null) {
          session.parentMessageId = crypto.randomUUID()
        }
        await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
      } else if (bingWebModelKeys.includes(session.modelName)) {
        const accessToken = await getBingAccessToken()
        await generateAnswersWithBingWebApi(
          port,
          session.question,
          session,
          accessToken,
          session.modelName,
        )
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
        await generateAnswersWithCustomApi(
          port,
          session.question,
          session,
          config.apiKey,
          session.modelName,
        )
      }
    } catch (err) {
      console.error(err)
      if (!err.message.includes('aborted')) {
        port.postMessage({ error: err.message })
        cache.delete(KEY_ACCESS_TOKEN)
      }
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getChatGptAccessToken()
    await sendMessageFeedback(token, message.data)
  }
})

function refreshMenu() {
  Browser.contextMenus.removeAll().then(() => {
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
        title: v.label,
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
        title: desc,
        contexts: ['selection'],
      })
    }

    Browser.contextMenus.onClicked.addListener((info, tab) => {
      const message = {
        itemId: info.menuItemId.replace(menuId, ''),
        selectionText: info.selectionText,
      }
      console.debug('menu clicked', message)
      Browser.tabs.sendMessage(tab.id, {
        type: 'CREATE_MENU',
        data: message,
      })
    })
  })
}

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'REFRESH_MENU') {
    refreshMenu()
  }
})

refreshMenu()
