import { getUserConfig } from '../../config/index.mjs'
import { generateAnswersWithChatgptApiCompat } from './openai-api.mjs'

/**
 * @param {Browser.Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 */
export async function generateAnswersWithOllamaApi(port, question, session) {
  const config = await getUserConfig()
  return generateAnswersWithChatgptApiCompat(
    config.ollamaEndpoint + '/v1',
    port,
    question,
    session,
    config.ollamaApiKey,
  ).then(() =>
    fetch(config.ollamaEndpoint + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ollamaApiKey}`,
      },
      body: JSON.stringify({
        model: config.ollamaModelName,
        prompt: 't',
        options: {
          num_predict: 1,
        },
        keep_alive: config.ollamaKeepAliveTime === '-1' ? -1 : config.ollamaKeepAliveTime,
      }),
    }),
  )
}
