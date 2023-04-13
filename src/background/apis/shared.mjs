export const getChatSystemPromptBase = async () => {
  return `You are a helpful, creative, clever, and very friendly assistant. You are familiar with various languages in the world.`
}

export const getCompletionPromptBase = async () => {
  return (
    `The following is a conversation with an AI assistant.` +
    `The assistant is helpful, creative, clever, and very friendly. The assistant is familiar with various languages in the world.\n\n` +
    `Human: Hello, who are you?\n` +
    `AI: I am an AI assistant. How can I help you today?\n`
  )
}

export const getCustomApiPromptBase = async () => {
  return `I am a helpful, creative, clever, and very friendly assistant. I am familiar with various languages in the world.`
}

export function setAbortController(port, onStop, onDisconnect) {
  const controller = new AbortController()
  const messageListener = (msg) => {
    if (msg.stop) {
      port.onMessage.removeListener(messageListener)
      console.debug('stop generating')
      port.postMessage({ done: true })
      controller.abort()
      if (onStop) onStop()
    }
  }
  port.onMessage.addListener(messageListener)

  const disconnectListener = () => {
    port.onDisconnect.removeListener(disconnectListener)
    console.debug('port disconnected')
    controller.abort()
    if (onDisconnect) onDisconnect()
  }
  port.onDisconnect.addListener(disconnectListener)

  return { controller, messageListener }
}

export function pushRecord(session, question, answer) {
  const recordLength = session.conversationRecords.length
  let lastRecord
  if (recordLength > 0) lastRecord = session.conversationRecords[recordLength - 1]

  if (session.isRetry && lastRecord && lastRecord.question === question) lastRecord.answer = answer
  else session.conversationRecords.push({ question: question, answer: answer })
}
