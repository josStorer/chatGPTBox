import BingAIClient from '../clients/BingAIClient'
import { getUserConfig } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} accessToken
 */
export async function generateAnswersWithBingWebApi(port, question, session, accessToken) {
  const { controller, messageListener } = setAbortController(port)

  const bingAIClient = new BingAIClient({ userToken: accessToken })

  let answer = ''
  const response = await bingAIClient
    .sendMessage(question, {
      abortController: controller,
      toneStyle: (await getUserConfig()).modelMode,
      onProgress: (token) => {
        answer += token
        // remove reference markers [^number^]
        answer = answer.replaceAll(/\[\^\d+\^\]/g, '')
        port.postMessage({ answer: answer, done: false, session: null })
      },
      ...(session.bingWeb_conversationId
        ? {
            conversationId: session.bingWeb_conversationId,
            conversationSignature: session.bingWeb_conversationSignature,
            clientId: session.bingWeb_clientId,
            invocationId: session.bingWeb_invocationId,
          }
        : {}),
    })
    .catch((err) => {
      port.onMessage.removeListener(messageListener)
      throw err
    })

  session.bingWeb_conversationSignature = response.conversationSignature
  session.bingWeb_conversationId = response.conversationId
  session.bingWeb_clientId = response.clientId
  session.bingWeb_invocationId = response.invocationId

  pushRecord(session, question, answer)
  console.debug('conversation history', { content: session.conversationRecords })
  port.onMessage.removeListener(messageListener)
  port.postMessage({ answer: answer, done: true, session: session })
}
