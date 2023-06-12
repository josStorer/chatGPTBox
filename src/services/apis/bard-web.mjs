import { pushRecord } from './shared.mjs'
import Bard from '../clients/bard'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} cookies
 */
export async function generateAnswersWithBardWebApi(port, question, session, cookies) {
  // const { controller, messageListener, disconnectListener } = setAbortController(port)
  const bot = new Bard(cookies)

  // eslint-disable-next-line
  try {
    const { answer, conversationObj } = await bot.ask(question, session.bard_conversationObj || {})
    session.bard_conversationObj = conversationObj
    pushRecord(session, question, answer)
    console.debug('conversation history', { content: session.conversationRecords })
    // port.onMessage.removeListener(messageListener)
    // port.onDisconnect.removeListener(disconnectListener)
    port.postMessage({ answer: answer, done: true, session: session })
  } catch (err) {
    // port.onMessage.removeListener(messageListener)
    // port.onDisconnect.removeListener(disconnectListener)
    throw err
  }
}
