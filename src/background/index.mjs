import Browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
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
  githubThirdPartyApiModelKeys,
  gptApiModelKeys,
  Models,
  poeWebModelKeys,
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
    const accessToken = await getChatGptAccessToken()
    session.messageId = uuidv4()
    if (session.parentMessageId == null) {
      session.parentMessageId = uuidv4()
    }
    await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
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
  } else if (message.type === 'REFRESH_MENU') {
    refreshMenu()
  }
})

registerPortListener(async (session, port, config) => await executeApi(session, port, config))
registerCommands()
refreshMenu()
