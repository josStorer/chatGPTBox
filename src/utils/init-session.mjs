import { Models } from '../config/index.mjs'

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
 * @property {string|null} bingWeb_conversationSignature
 * @property {string|null} bingWeb_conversationId
 * @property {string|null} bingWeb_clientId
 * @property {string|null} bingWeb_invocationId
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
    bingWeb_conversationSignature: null,
    bingWeb_conversationId: null,
    bingWeb_clientId: null,
    bingWeb_invocationId: null,
  }
}
