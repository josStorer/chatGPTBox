import { generateAnswersWithChatgptApiCompat } from './openai-api.mjs'

/**
 * @param {Browser.Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} apiKey
 * @param {string} modelName
 */
export async function generateAnswersWithMoonshotCompletionApi(
  port,
  question,
  session,
  apiKey,
  modelName,
) {
  const baseUrl = 'https://api.moonshot.cn'
  return generateAnswersWithChatgptApiCompat(baseUrl, port, question, session, apiKey, modelName)
}
