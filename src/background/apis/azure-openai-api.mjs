import { getUserConfig } from '../../config/index.mjs'
import { getChatSystemPromptBase, pushRecord, setAbortController } from './shared.mjs'
import { getConversationPairs } from '../../utils/get-conversation-pairs'
import { fetchSSE } from '../../utils/fetch-sse'
import { isEmpty } from 'lodash-es'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 */
export async function generateAnswersWithAzureOpenaiApi(port, question, session) {
  const { controller, messageListener } = setAbortController(port)
  const config = await getUserConfig()

  const prompt = getConversationPairs(session.conversationRecords, false)
  prompt.unshift({ role: 'system', content: await getChatSystemPromptBase() })
  prompt.push({ role: 'user', content: question })

  let answer = ''
  await fetchSSE(
    `${config.azureEndpoint.replace(/\/$/, '')}/openai/deployments/${
      config.azureDeploymentName
    }/chat/completions?api-version=2023-03-15-preview`,
    {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.azureApiKey,
      },
      body: JSON.stringify({
        messages: prompt,
        stream: true,
        max_tokens: config.maxResponseTokenLength,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        let data
        try {
          data = JSON.parse(message)
        } catch (error) {
          console.debug('json error', error)
          return
        }
        if ('content' in data.choices[0].delta) {
          answer += data.choices[0].delta.content
          port.postMessage({ answer: answer, done: false, session: null })
        }
        if (data.choices[0].finish_reason === 'stop') {
          pushRecord(session, question, answer)
          console.debug('conversation history', { content: session.conversationRecords })
          port.postMessage({ answer: null, done: true, session: session })
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
        throw new Error(
          !isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`,
        )
      },
    },
  )
}
