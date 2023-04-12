import Browser from 'webextension-polyfill'
import ExpiryMap from 'expiry-map'
import {
  deleteConversation,
  generateAnswersWithChatgptWebApi,
  sendMessageFeedback,
} from './apis/chatgpt-web'
import { generateAnswersWithBingWebApi } from './apis/bing-web.mjs'
import {
  generateAnswersWithChatgptApi,
  generateAnswersWithGptCompletionApi,
} from './apis/openai-api'
import { generateAnswersWithCustomApi } from './apis/custom-api.mjs'
import { generateAnswersWithAzureOpenaiApi } from './apis/azure-openai-api.mjs'
import { generateAnswersWithWaylaidwandererApi } from './apis/waylaidwanderer-api.mjs'
import {
  azureOpenAiApiModelKeys,
  bingWebModelKeys,
  chatgptApiModelKeys,
  chatgptWebModelKeys,
  customApiModelKeys,
  defaultConfig,
  getPreferredLanguageKey,
  getUserConfig,
  githubThirdPartyApiModelKeys,
  gptApiModelKeys,
  Models,
} from '../config/index.mjs'
import { isSafari } from '../utils/is-safari'
import { config as menuConfig } from '../content-script/menu-tools'
import { t, changeLanguage } from 'i18next'
import '../_locales/i18n'
import { openUrl } from '../utils/open-url'

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
  const onMessage = async (msg) => {
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
        await generateAnswersWithBingWebApi(port, session.question, session, accessToken)
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
          '',
          config.customModelName,
        )
      } else if (azureOpenAiApiModelKeys.includes(session.modelName)) {
        await generateAnswersWithAzureOpenaiApi(port, session.question, session)
      } else if (githubThirdPartyApiModelKeys.includes(session.modelName)) {
        await generateAnswersWithWaylaidwandererApi(port, session.question, session)
      }
    } catch (err) {
      console.error(err)
      if (!err.message.includes('aborted')) {
        cache.delete(KEY_ACCESS_TOKEN)

        if (
          ['message you submitted was too long', 'maximum context length'].some((m) =>
            err.message.includes(m),
          )
        )
          port.postMessage({ error: t('Exceeded maximum context length') })
        else port.postMessage({ error: err.message })
      }
    }
  }

  const onDisconnect = () => {
    console.debug('port disconnected, remove listener')
    port.onMessage.removeListener(onMessage)
    port.onDisconnect.removeListener(onDisconnect)
  }

  port.onMessage.addListener(onMessage)
  port.onDisconnect.addListener(onDisconnect)
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getChatGptAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'DELETE_CONVERSATION') {
    const token = await getChatGptAccessToken()
    const data = message.data
    await deleteConversation(token, data.conversationId)
  } else if (message.type === 'OPEN_URL') {
    const data = message.data
    openUrl(data.url)
  }
})

Browser.commands.onCommand.addListener(async (command) => {
  const message = {
    itemId: command,
    selectionText: '',
    useMenuPosition: false,
  }
  console.debug('command triggered', message)

  if (command in menuConfig) {
    if (menuConfig[command].action) {
      menuConfig[command].action()
    }

    if (menuConfig[command].genPrompt) {
      const currentTab = (await Browser.tabs.query({ active: true, currentWindow: true }))[0]
      Browser.tabs.sendMessage(currentTab.id, {
        type: 'CREATE_CHAT',
        data: message,
      })
    }
  }
})

function refreshMenu() {
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
            menuConfig[message.itemId].action()
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

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'REFRESH_MENU') {
    refreshMenu()
  }
})

refreshMenu()
