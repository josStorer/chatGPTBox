import { Configuration, OpenAIApi } from 'azure-openai'
import { getUserConfig, maxResponseTokenLength } from '../../config/index.mjs'
import { getChatSystemPromptBase, pushRecord, setAbortController } from './shared.mjs'
import { getConversationPairs } from '../../utils/get-conversation-pairs'

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

  let answer = ''
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
      },
    )
    .catch((err) => {
      port.onMessage.removeListener(messageListener)
      throw err
    })
  for await (const chunk of response.data) {
    const lines = chunk
      .toString('utf8')
      .split('\n')
      .filter((line) => line.trim().startsWith('data: '))

    for (const line of lines) {
      const message = line.replace(/^data: /, '')
      console.debug('sse message', message)
      if (message === '[DONE]') {
        pushRecord(session, question, answer)
        console.debug('conversation history', { content: session.conversationRecords })
        port.postMessage({ answer: null, done: true, session: session })
        break
      }
      let data
      try {
        data = JSON.parse(message)
      } catch (error) {
        console.debug('json error', error)
        continue
      }
      answer += data.choices[0].text
      port.postMessage({ answer: answer, done: false, session: null })
    }
  }

  port.onMessage.removeListener(messageListener)
}
