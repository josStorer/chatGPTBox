import { pushRecord } from './shared.mjs'
import Claude from 'claude-ai'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} sessionKey
 */
export async function generateAnswersWithClaudeWebApi(port, question, session, sessionKey) {
  const bot = new Claude({ sessionKey })
  await bot.init()

  let answer = ''
  const progressFunc = ({ completion }) => {
    answer = completion
    port.postMessage({ answer: answer, done: false, session: null })
  }

  const doneFunc = () => {
    pushRecord(session, question, answer)
    console.debug('conversation history', { content: session.conversationRecords })
    port.postMessage({ answer: answer, done: true, session: session })
  }

  if (!session.claude_conversation)
    await bot
      .startConversation(question, {
        progress: progressFunc,
        done: doneFunc,
      })
      .then((conversation) => {
        session.claude_conversation = conversation
        port.postMessage({ answer: answer, done: true, session: session })
      })
  else
    await bot.sendMessage(question, {
      conversation: session.claude_conversation,
      progress: progressFunc,
      done: doneFunc,
    })
}
