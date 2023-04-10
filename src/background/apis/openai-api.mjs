// api version

import { Models, getUserConfig } from '../../config/index.mjs'
import { fetchSSE } from '../../utils/fetch-sse'
import { getConversationPairs } from '../../utils/get-conversation-pairs'
import { isEmpty } from 'lodash-es'
import {
  getChatSystemPromptBase,
  getCompletionPromptBase,
  pushRecord,
  setAbortController,
} from './shared.mjs'

/**
 * @param {Browser.Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} apiKey
 * @param {string} modelName
 */
export async function generateAnswersWithGptCompletionApi(
  port,
  question,
  session,
  apiKey,
  modelName,
) {
  const { controller, messageListener } = setAbortController(port)

  const prompt =
    (await getCompletionPromptBase()) +
    getConversationPairs(session.conversationRecords, true) +
    `Human: ${question}\nAI: `
  const config = await getUserConfig()
  const apiUrl = config.customOpenAiApiUrl

  let answer = ''
  await fetchSSE(`${apiUrl}/v1/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      model: Models[modelName].value,
      stream: true,
      max_tokens: config.maxResponseTokenLength,
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
      answer += data.choices[0].text
      port.postMessage({ answer: answer, done: false, session: null })
    },
    async onStart() {},
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

/**
 * @param {Browser.Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} apiKey
 * @param {string} modelName
 */
export async function generateAnswersWithChatgptApi(port, question, session, apiKey, modelName) {
  const { controller, messageListener } = setAbortController(port)

  const prompt = getConversationPairs(session.conversationRecords, false)
  prompt.unshift({ role: 'system', content: await getChatSystemPromptBase() })
  prompt.push({ role: 'user', content: question })
  const config = await getUserConfig()
  const apiUrl = config.customOpenAiApiUrl

  let answer = ''
  await fetchSSE(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: prompt,
      model: Models[modelName].value,
      stream: true,
      max_tokens: config.maxResponseTokenLength,
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
      if ('content' in data.choices[0].delta) {
        answer += data.choices[0].delta.content
        port.postMessage({ answer: answer, done: false, session: null })
      }
    },
    async onStart() {},
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
