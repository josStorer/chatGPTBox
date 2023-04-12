import { pushRecord, setAbortController } from './shared.mjs'
import { getUserConfig } from '../../config/index.mjs'
import { fetchSSE } from '../../utils/fetch-sse'
import { isEmpty } from 'lodash-es'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 */
export async function generateAnswersWithWaylaidwandererApi(port, question, session) {
  const { controller, messageListener } = setAbortController(port)

  const config = await getUserConfig()

  let answer = ''
  await fetchSSE(config.githubThirdPartyUrl, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: question,
      stream: true,
      ...(session.bingWeb_conversationId && {
        conversationId: session.bingWeb_conversationId,
        conversationSignature: session.bingWeb_conversationSignature,
        clientId: session.bingWeb_clientId,
        invocationId: session.bingWeb_invocationId,
      }),
      ...(session.conversationId && {
        conversationId: session.conversationId,
        parentMessageId: session.parentMessageId,
      }),
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
      if (data.conversationId) session.conversationId = data.conversationId
      if (data.parentMessageId) session.parentMessageId = data.parentMessageId
      if (data.conversationSignature)
        session.bingWeb_conversationSignature = data.conversationSignature
      if (data.conversationId) session.bingWeb_conversationId = data.conversationId
      if (data.clientId) session.bingWeb_clientId = data.clientId
      if (data.invocationId) session.bingWeb_invocationId = data.invocationId

      if (typeof data === 'string') {
        answer += data
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
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
