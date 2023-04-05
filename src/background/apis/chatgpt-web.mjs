// web version

import { fetchSSE } from '../../utils/fetch-sse'
import { isEmpty } from 'lodash-es'
import { chatgptWebModelKeys, getUserConfig, Models } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'
import Browser from 'webextension-polyfill'

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
  const { controller, messageListener } = setAbortController(port, null, () => {
    if (session.autoClean) deleteConversation(accessToken, session.conversationId)
  })

  const models = await getModels(accessToken).catch(() => {
    port.onMessage.removeListener(messageListener)
  })
  console.debug('models', models)
  const config = await getUserConfig()
  const selectedModel = Models[config.modelName].value
  const usedModel =
    models && models.includes(selectedModel) ? selectedModel : Models[chatgptWebModelKeys[0]].value
  console.debug('usedModel', usedModel)

  const cookie = (await Browser.cookies.getAll({ url: 'https://chat.openai.com/' }))
    .map((cookie) => {
      return `${cookie.name}=${cookie.value}`
    })
    .join('; ')

  let answer = ''
  await fetchSSE(`${config.customChatGptWebApiUrl}${config.customChatGptWebApiPath}`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Cookie: cookie,
    },
    body: JSON.stringify({
      action: 'next',
      conversation_id: session.conversationId,
      messages: [
        {
          id: session.messageId,
          role: 'user',
          content: {
            content_type: 'text',
            parts: [question],
          },
        },
      ],
      model: usedModel,
      parent_message_id: session.parentMessageId,
    }),
    onMessage(message) {
      console.debug('sse message', message)
      if (message === '[DONE]') {
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
      port.onMessage.removeListener(messageListener)
    },
    async onError(resp) {
      port.onMessage.removeListener(messageListener)
      if (resp instanceof Error) throw resp
      if (resp.status === 403) {
        throw new Error('CLOUDFLARE')
      }
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
