import { getUserConfig } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'
import { fetchSSE } from '../../utils/fetch-sse.mjs'
import { isEmpty } from 'lodash-es'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 */
export async function generateAnswersWithClaudeApi(port, question, session) {
  const { controller, messageListener, disconnectListener } = setAbortController(port)
  const config = await getUserConfig()

  let prompt = ''
  for (const record of session.conversationRecords.slice(-config.maxConversationContextLength)) {
    prompt += '\n\nHuman: ' + record.question + '\n\nAssistant: ' + record.answer
  }
  prompt += `\n\nHuman: ${question}\n\nAssistant:`

  let answer = ''
  await fetchSSE(`https://api.anthropic.com/v1/complete`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': config.claudeApiKey,
    },
    body: JSON.stringify({
      model: 'claude-2',
      prompt: prompt,
      stream: true,
      max_tokens_to_sample: config.maxResponseTokenLength,
      temperature: config.temperature,
    }),
    onMessage(message) {
      console.debug('sse message', message)

      let data
      try {
        data = JSON.parse(message)
      } catch (error) {
        console.debug('json error', error)
        return
      }

      // The Claude v2 API may send metadata fields, handle them here
      if (data.conversationId) session.conversationId = data.conversationId
      if (data.parentMessageId) session.parentMessageId = data.parentMessageId

      // In Claude's case, the "completion" key holds the text
      if (data.completion) {
        answer += data.completion
        port.postMessage({ answer: answer, done: false, session: null })
      }

      // Check if the message indicates that Claude is done
      if (data.stop_reason === 'stop_sequence') {
        pushRecord(session, question, answer)
        console.debug('conversation history', { content: session.conversationRecords })
        port.postMessage({ answer: null, done: true, session: session })
      }
    },
    async onStart() {},
    async onEnd() {
      port.postMessage({ done: true })
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
    },
    async onError(resp) {
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
      if (resp instanceof Error) throw resp
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
