/**
 * @typedef {object} BingWeb
 * @property {string|null} conversationSignature
 * @property {string|null} conversationId
 * @property {string|null} clientId
 * @property {string|null} invocationId
 */
/**
 * @typedef {object} Session
 * @property {string|null} question
 * @property {Object[]|null} conversationRecords
 * @property {string|null} conversationId - chatGPT web mode
 * @property {string|null} messageId - chatGPT web mode
 * @property {string|null} parentMessageId - chatGPT web mode
 * @property {BingWeb} bingWeb
 */
/**
 * @param {string|null} question
 * @param {Object[]|null} conversationRecords
 * @returns {Session}
 */
export function initSession({ question = null, conversationRecords = [] } = {}) {
  return {
    // common
    question,
    conversationRecords,

    // chatgpt-web
    conversationId: null,
    messageId: null,
    parentMessageId: null,

    // bing
    bingWeb: {
      conversationSignature: null,
      conversationId: null,
      clientId: null,
      invocationId: null,
    },
  }
}
