/**
 * @typedef {object} Session
 * @property {string|null} question
 * @property {string|null} conversationId - chatGPT web mode
 * @property {string|null} messageId - chatGPT web mode
 * @property {string|null} parentMessageId - chatGPT web mode
 * @property {Object[]|null} conversationRecords
 * @property {bool|null} useApiKey
 */
/**
 * @param {Session} session
 * @returns {Session}
 */
export function initSession({
  question = null,
  conversationId = null,
  messageId = null,
  parentMessageId = null,
  conversationRecords = [],
  useApiKey = null,
} = {}) {
  return {
    question,
    conversationId,
    messageId,
    parentMessageId,
    conversationRecords,
    useApiKey,
  }
}
