// web version

import { fetchSSE } from '../../utils/fetch-sse.mjs'
import { isEmpty } from 'lodash-es'
import { chatgptWebModelKeys, getUserConfig, Models } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'
import Browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'

async function request(token, method, path, data) {
  const apiUrl = (await getUserConfig()).customChatGptWebApiUrl
  const response = await fetch(`${apiUrl}/backend-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  const responseText = await response.text()
  console.debug(`request: ${path}`, responseText)
  return { response, responseText }
}

export async function sendMessageFeedback(token, data) {
  await request(token, 'POST', '/conversation/message_feedback', data)
}

export async function setConversationProperty(token, conversationId, propertyObject) {
  await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
}

export async function deleteConversation(token, conversationId) {
  if (conversationId) await setConversationProperty(token, conversationId, { is_visible: false })
}

export async function sendModerations(token, question, conversationId, messageId) {
  await request(token, 'POST', `/moderations`, {
    conversation_id: conversationId,
    input: question,
    message_id: messageId,
    model: 'text-moderation-playground',
  })
}

export async function getModels(token) {
  const response = JSON.parse((await request(token, 'GET', '/models')).responseText)
  if (response.models) return response.models.map((m) => m.slug)
}

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} accessToken
 */
export async function generateAnswersWithChatgptWebApi(port, question, session, accessToken) {
  session.messageId = uuidv4()
  if (session.parentMessageId == null) {
    session.parentMessageId = uuidv4()
  }

  const { controller, messageListener, disconnectListener } = setAbortController(port, null, () => {
    if (session.autoClean) deleteConversation(accessToken, session.conversationId)
  })

  const models = await getModels(accessToken).catch(() => {
    port.onMessage.removeListener(messageListener)
    port.onDisconnect.removeListener(disconnectListener)
  })
  console.debug('models', models)
  const config = await getUserConfig()
  const selectedModel = Models[session.modelName].value
  const usedModel =
    models && models.includes(selectedModel) ? selectedModel : Models[chatgptWebModelKeys[0]].value
  console.debug('usedModel', usedModel)

  let cookie
  if (Browser.cookies && Browser.cookies.getAll)
    cookie = (await Browser.cookies.getAll({ url: 'https://chat.openai.com/' }))
      .map((cookie) => {
        return `${cookie.name}=${cookie.value}`
      })
      .join('; ')

  let answer = ''
  await fetchSSE(`${config.customChatGptWebApiUrl}${config.customChatGptWebApiPath}`, {
    method: 'POST',
    signal: controller.signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(cookie && { Cookie: cookie }),
    },
    body: JSON.stringify({
      action: 'next',
      conversation_id: session.conversationId,
      messages: [
        {
          id: session.messageId,
          author: {
            role: 'user',
          },
          content: {
            content_type: 'text',
            parts: [question],
          },
        },
      ],
      model: usedModel,
      parent_message_id: session.parentMessageId,
      timezone_offset_min: new Date().getTimezoneOffset(),
      variant_purpose: 'none',
      history_and_training_disabled: config.disableWebModeHistory,
      arkose_token: usedModel.startsWith('gpt-4')
        ? `${Array.from({ length: 17 }, () => Math.floor(Math.random() * 16).toString(16)).join(
            '',
          )}|r=ap-southeast-1|meta=3|meta_width=300|metabgclr=transparent|metaiconclr=%23555555|guitextcolor=%23000000|pk=35536E1E-65B4-4D96-9D97-6ADB7EFF8147|at=40|sup=1|rid=${
            Math.floor(Math.random() * 99) + 1
          }|ag=101|cdn_url=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Ftcr9i.chat.openai.com|smurl=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager`
        : undefined,
    }),
    onMessage(message) {
      console.debug('sse message', message)
      if (message.trim() === '[DONE]') {
        pushRecord(session, question, answer)
        console.debug('conversation history', { content: session.conversationRecords })
        port.postMessage({ answer: null, done: true, session: session })
        return
      }
      let data
      try {
        data = JSON.parse(message)
      } catch (error) {
        console.debug('json error', error)
        return
      }
      if (data.conversation_id) session.conversationId = data.conversation_id
      if (data.message?.id) session.parentMessageId = data.message.id

      answer = data.message?.content?.parts?.[0]
      if (answer) {
        port.postMessage({ answer: answer, done: false, session: null })
      }
    },
    async onStart() {
      // sendModerations(accessToken, question, session.conversationId, session.messageId)
    },
    async onEnd() {
      port.postMessage({ done: true })
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
    },
    async onError(resp) {
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
      if (resp instanceof Error) throw resp
      if (resp.status === 403) {
        throw new Error('CLOUDFLARE')
      }
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
