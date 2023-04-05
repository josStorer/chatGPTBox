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
