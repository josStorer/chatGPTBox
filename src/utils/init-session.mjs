import { Models } from '../config/index.mjs'

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
 * @property {string|null} sessionName
 * @property {string|null} sessionId
 * @property {string|null} aiName
 * @property {string|null} modelName
 * @property {boolean|null} autoClean
 * @property {boolean} isRetry
 * @property {string|null} conversationId - chatGPT web mode
 * @property {string|null} messageId - chatGPT web mode
 * @property {string|null} parentMessageId - chatGPT web mode
 * @property {BingWeb} bingWeb
 */
/**
 * @param {string|null} question
 * @param {Object[]|null} conversationRecords
 * @param {string|null} sessionName
 * @param {string|null} modelName
 * @param {boolean|null} autoClean
 * @returns {Session}
 */
export function initSession({
  question = null,
  conversationRecords = [],
  sessionName = null,
  modelName = null,
  autoClean = true,
} = {}) {
  return {
    // common
    question,
    conversationRecords,

    sessionName,
    sessionId: crypto.randomUUID(),

    aiName: modelName ? Models[modelName].desc : null,
    modelName,

    autoClean,
    isRetry: false,

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
