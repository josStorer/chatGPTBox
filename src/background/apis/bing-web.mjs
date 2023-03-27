import BingAIClient from '../clients/BingAIClient'

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
  const controller = new AbortController()
  const stopListener = (msg) => {
    if (msg.stop) {
      console.debug('stop generating')
      port.postMessage({ done: true })
      controller.abort()
      port.onMessage.removeListener(stopListener)
    }
  }
  port.onMessage.addListener(stopListener)
  port.onDisconnect.addListener(() => {
    console.debug('port disconnected')
    controller.abort()
  })

  const bingAIClient = new BingAIClient({ userToken: accessToken })

  let answer = ''
  const response = await bingAIClient
    .sendMessage(question, {
      ...(session.bingWeb.conversationId
        ? {
            conversationId: session.bingWeb.conversationId,
            conversationSignature: session.bingWeb.conversationSignature,
            clientId: session.bingWeb.clientId,
            invocationId: session.bingWeb.invocationId,
          }
        : {}),
      onProgress: (token) => {
        answer += token
        port.postMessage({ answer: answer, done: false, session: session })
      },
    })
    .catch((err) => {
      port.onMessage.removeListener(stopListener)
      throw err
    })

  session.bingWeb.conversationSignature = response.conversationSignature
  session.bingWeb.conversationId = response.conversationId
  session.bingWeb.clientId = response.clientId
  session.bingWeb.invocationId = response.invocationId

  session.conversationRecords.push({ question: question, answer: answer })
  console.debug('conversation history', { content: session.conversationRecords })
  port.onMessage.removeListener(stopListener)
  port.postMessage({ answer: answer, done: true, session: session })
}
