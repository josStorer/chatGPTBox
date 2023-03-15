// api version

import { maxResponseTokenLength, Models, getUserConfig } from '../../config'
import { fetchSSE } from '../../utils/fetch-sse'
import { getConversationPairs } from '../../utils/get-conversation-pairs'
import { isEmpty } from 'lodash-es'

const getChatgptPromptBase = async () => {
  return `You are a helpful, creative, clever, and very friendly assistant. You are familiar with various languages in the world.`
}

const getGptPromptBase = async () => {
  return (
    `The following is a conversation with an AI assistant.` +
    `The assistant is helpful, creative, clever, and very friendly. The assistant is familiar with various languages in the world.\n\n` +
    `Human: Hello, who are you?\n` +
    `AI: I am an AI created by OpenAI. How can I help you today?\n` +
    `Human: 谢谢\n` +
    `AI: 不客气\n`
  )
}

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
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    console.debug('port disconnected')
    controller.abort()
  })

  const prompt =
    (await getGptPromptBase()) +
    getConversationPairs(session.conversationRecords, false) +
    `Human:${question}\nAI:`
  const apiUrl = (await getUserConfig()).customOpenAiApiUrl

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
      max_tokens: maxResponseTokenLength,
    }),
    onMessage(message) {
      console.debug('sse message', message)
      if (message === '[DONE]') {
        session.conversationRecords.push({ question: question, answer: answer })
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
    async onEnd() {},
    async onError(resp) {
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
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    console.debug('port disconnected')
    controller.abort()
  })

  const prompt = getConversationPairs(session.conversationRecords, true)
  prompt.unshift({ role: 'system', content: await getChatgptPromptBase() })
  prompt.push({ role: 'user', content: question })
  const apiUrl = (await getUserConfig()).customOpenAiApiUrl

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
      max_tokens: maxResponseTokenLength,
    }),
    onMessage(message) {
      console.debug('sse message', message)
      if (message === '[DONE]') {
        session.conversationRecords.push({ question: question, answer: answer })
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
      if ('content' in data.choices[0].delta) answer += data.choices[0].delta.content
      port.postMessage({ answer: answer, done: false, session: null })
    },
    async onStart() {},
    async onEnd() {},
    async onError(resp) {
      if (resp.status === 403) {
        throw new Error('CLOUDFLARE')
      }
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
