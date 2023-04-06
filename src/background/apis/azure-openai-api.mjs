import { Configuration, OpenAIApi } from 'azure-openai'
import { getUserConfig, maxResponseTokenLength } from '../../config/index.mjs'
import { getChatSystemPromptBase, pushRecord, setAbortController } from './shared.mjs'
import { getConversationPairs } from '../../utils/get-conversation-pairs'
import fetchAdapter from '@vespaiach/axios-fetch-adapter'

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

  const openAiApi = new OpenAIApi(
    new Configuration({
      apiKey: config.azureApiKey,
      azure: {
        apiKey: config.azureApiKey,
        endpoint: config.azureEndpoint,
        deploymentName: config.azureDeploymentName,
      },
    }),
  )

  const response = await openAiApi
    .createChatCompletion(
      {
        messages: prompt,
        stream: true,
        max_tokens: maxResponseTokenLength,
      },
      {
        signal: controller.signal,
        responseType: 'stream',
        adapter: fetchAdapter,
      },
    )
    .catch((err) => {
      port.onMessage.removeListener(messageListener)
      throw err
    })

  let chunkData = ''
  const step = 1500
  let length = 0
  for await (const chunk of response.data) {
    chunkData += chunk
    length += 1
    if (length % step !== 0 && !chunkData.endsWith('[DONE]')) continue

    const lines = chunkData
      .toString('utf8')
      .split('\n')
      .filter((line) => line.trim().startsWith('data: '))

    let answer = ''
    let message = ''
    let data
    for (const line of lines) {
      message = line.replace(/^data: /, '')
      try {
        data = JSON.parse(message)
      } catch (error) {
        continue
      }
      if ('content' in data.choices[0].delta) answer += data.choices[0].delta.content
    }
    if (data) {
      console.debug('sse message', data)
      port.postMessage({ answer: answer, done: false, session: null })
    }
    if (message === '[DONE]') {
      console.debug('sse message', '[DONE]')
      pushRecord(session, question, answer)
      console.debug('conversation history', { content: session.conversationRecords })
      port.postMessage({ answer: null, done: true, session: session })
      break
    }
  }

  port.onMessage.removeListener(messageListener)
}
