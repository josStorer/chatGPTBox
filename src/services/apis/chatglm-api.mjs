import { getUserConfig } from '../../config/index.mjs'
import { getToken } from '../../utils/jwt-token-generator.mjs'
import { generateAnswersWithChatgptApiCompat } from './openai-api.mjs'

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 */
export async function generateAnswersWithChatGLMApi(port, question, session) {
  const baseUrl = 'https://open.bigmodel.cn/api/paas/v4'
  const config = await getUserConfig()
  return generateAnswersWithChatgptApiCompat(
    baseUrl,
    port,
    question,
    session,
    getToken(config.chatglmApiKey),
  )
}
