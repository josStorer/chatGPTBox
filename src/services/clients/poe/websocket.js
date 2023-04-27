import * as diff from 'diff'

const getSocketUrl = async (settings) => {
  settings = settings.tchannelData
  const tchRand = Math.floor(100000 + Math.random() * 900000) // They're surely using 6 digit random number for ws url.
  const socketUrl = `wss://tch${tchRand}.tch.quora.com`
  const boxName = settings.boxName
  const minSeq = settings.minSeq
  const channel = settings.channel
  const hash = settings.channelHash
  return `${socketUrl}/up/${boxName}/updates?min_seq=${minSeq}&channel=${channel}&hash=${hash}`
}
export const connectWs = async (settings) => {
  const url = await getSocketUrl(settings)
  const ws = new WebSocket(url)
  return new Promise((resolve) => {
    ws.onopen = () => {
      console.log('Connected to websocket')
      return resolve(ws)
    }
  })
}
export const disconnectWs = async (ws) => {
  return new Promise((resolve) => {
    ws.onclose = () => {
      return resolve(true)
    }
    ws.close()
  })
}
export const listenWs = async (ws, onMessage, onComplete) => {
  let previousText = ''
  return new Promise((resolve) => {
    let complete = false
    ws.onmessage = (e) => {
      let jsonData = JSON.parse(e.data)
      console.log(jsonData)
      if (jsonData.messages && jsonData.messages.length > 0) {
        const messages = JSON.parse(jsonData.messages[0])
        const dataPayload = messages.payload.data
        const text = dataPayload.messageAdded.text
        const state = dataPayload.messageAdded.state
        if (state !== 'complete') {
          const differences = diff.diffChars(previousText, text)
          let result = ''
          differences.forEach((part) => {
            if (part.added) {
              result += part.value
            }
          })
          previousText = text
          if (onMessage) onMessage(result)
        } else if (dataPayload.messageAdded.author !== 'human') {
          if (!complete) {
            complete = true
            if (onComplete) onComplete(text)
            return resolve(text)
          }
        }
      }
    }
  })
}
