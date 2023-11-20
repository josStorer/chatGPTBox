import { Models, getUserConfig } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'
import { isEmpty } from 'lodash-es'
import { getToken } from '../../utils/jwt-token-generator.mjs'
import { createParser } from '../../utils/eventsource-parser.mjs'

async function fetchSSE(resource, options) {
  const { onMessage, onStart, onEnd, onError, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions).catch(async (err) => {
    await onError(err)
  })
  if (!resp) return
  if (!resp.ok) {
    await onError(resp)
    return
  }

  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event)
    }
  })

  let hasStarted = false
  const reader = resp.body.getReader()
  let result
  while (!(result = await reader.read()).done) {
    const chunk = result.value
    if (!hasStarted) {
      hasStarted = true
      await onStart(new TextDecoder().decode(chunk))
    }
    parser.feed(chunk)
  }
  await onEnd()
}

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} modelName
 */
export async function generateAnswersWithChatGLMApi(port, question, session, modelName) {
  const { controller, messageListener, disconnectListener } = setAbortController(port)
  const config = await getUserConfig()

  const prompt = []
  for (const record of session.conversationRecords.slice(-config.maxConversationContextLength)) {
    prompt.push({ role: 'user', content: record.question })
    prompt.push({ role: 'assistant', content: record.answer })
  }
  prompt.push({ role: 'user', content: question })

  let answer = ''
  await fetchSSE(
    `https://open.bigmodel.cn/api/paas/v3/model-api/${Models[modelName].value}/sse-invoke`,
    {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'text/event-stream',
        Authorization: getToken(config.chatglmApiKey),
      },
      body: JSON.stringify({
        prompt: prompt,
        // temperature: config.temperature,
        // top_t: 0.7,
        // request_id: string
        // incremental: true,
        // return_type: "json_string",
        // ref: {"enable": "true", "search_query": "history"},
      }),
      onMessage(event) {
        console.debug('sse event', event)

        // Handle different types of events
        switch (event.event) {
          case 'add':
            // In the case of an "add" event, append the completion to the answer
            if (event.data) {
              answer += event.data
              port.postMessage({ answer: answer, done: false, session: null })
            }
            break
          case 'error':
          case 'interrupted':
          case 'finish':
            pushRecord(session, question, answer)
            console.debug('conversation history', { content: session.conversationRecords })
            port.postMessage({ answer: null, done: true, session: session })
            break
          default:
            break
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
        throw new Error(
          !isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`,
        )
      },
    },
  )
}
