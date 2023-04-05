import BingAIClient from '../clients/BingAIClient'
import { getUserConfig } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} accessToken
 * @param {string} modelName
 */
export async function generateAnswersWithBingWebApi(
  port,
  question,
  session,
  accessToken,
  // eslint-disable-next-line
  modelName,
) {
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
      ...(session.bingWeb.conversationId
        ? {
            conversationId: session.bingWeb.conversationId,
            conversationSignature: session.bingWeb.conversationSignature,
            clientId: session.bingWeb.clientId,
            invocationId: session.bingWeb.invocationId,
          }
        : {}),
    })
    .catch((err) => {
      port.onMessage.removeListener(messageListener)
      throw err
    })

  session.bingWeb.conversationSignature = response.conversationSignature
  session.bingWeb.conversationId = response.conversationId
  session.bingWeb.clientId = response.clientId
  session.bingWeb.invocationId = response.invocationId

  pushRecord(session, question, answer)
  console.debug('conversation history', { content: session.conversationRecords })
  port.onMessage.removeListener(messageListener)
  port.postMessage({ answer: answer, done: true, session: session })
}
