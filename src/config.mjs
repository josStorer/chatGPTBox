import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'
import { isMobile } from './utils/is-mobile'
import { config as toolsConfig } from './content-script/selection-tools'
import { languages } from 'countries-list'

/**
 * @typedef {object} Model
 * @property {string} value
 * @property {string} desc
 */
/**
 * @type {Object.<string,Model>}
 */
export const Models = {
  chatgptFree: { value: 'text-davinci-002-render-sha', desc: 'ChatGPT (Web)' },
  chatgptApi: { value: 'gpt-3.5-turbo', desc: 'ChatGPT (GPT-3.5)' },
  gptDavinci: { value: 'text-davinci-003', desc: 'GPT3' },
}

export const chatgptWebModelKeys = ['chatgptFree']
export const gptApiModelKeys = ['gptDavinci']
export const chatgptApiModelKeys = ['chatgptApi']

export const TriggerMode = {
  always: 'Always',
  questionMark: 'When query ends with question mark (?)',
  manually: 'Manually',
}

export const ThemeMode = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
}

export const languageList = { auto: { name: 'Auto', native: 'Auto' }, ...languages }

export const maxResponseTokenLength = 1000

/**
 * @typedef {typeof defaultConfig} UserConfig
 */
export const defaultConfig = {
  /** @type {keyof TriggerMode}*/
  triggerMode: 'manually',
  /** @type {keyof ThemeMode}*/
  themeMode: 'auto',
  /** @type {keyof Models}*/
  modelName: 'chatgptFree',
  apiKey: '',
  insertAtTop: isMobile(),
  siteRegex: 'match nothing',
  userSiteRegexOnly: false,
  inputQuery: '',
  appendQuery: '',
  prependQuery: '',
  accessToken: '',
  tokenSavedOn: 0,
  preferredLanguage: navigator.language.substring(0, 2),
  userLanguage: navigator.language.substring(0, 2), // unchangeable
  customChatGptWebApiUrl: 'https://chat.openai.com',
  customChatGptWebApiPath: '/backend-api/conversation',
  customOpenAiApiUrl: 'https://api.openai.com',
  selectionTools: Object.keys(toolsConfig),
  activeSelectionTools: Object.keys(toolsConfig),
  // importing configuration will result in gpt-3-encoder being packaged into the output file
  siteAdapters: ['bilibili', 'github', 'gitlab', 'quora', 'reddit', 'youtube', 'zhihu'],
  activeSiteAdapters: ['bilibili', 'github', 'gitlab', 'quora', 'reddit', 'youtube', 'zhihu'],
}

export async function getUserLanguage() {
  return languageList[defaultConfig.userLanguage].name
}

export async function getUserLanguageNative() {
  return languageList[defaultConfig.userLanguage].native
}

export async function getPreferredLanguage() {
  const config = await getUserConfig()
  if (config.preferredLanguage === 'auto') return await getUserLanguage()
  return languageList[config.preferredLanguage].name
}

export async function getPreferredLanguageNative() {
  const config = await getUserConfig()
  if (config.preferredLanguage === 'auto') return await getUserLanguageNative()
  return languageList[config.preferredLanguage].native
}

export function isUsingApiKey(config) {
  return (
    gptApiModelKeys.includes(config.modelName) || chatgptApiModelKeys.includes(config.modelName)
  )
}

/**
 * get user config from local storage
 * @returns {Promise<UserConfig>}
 */
export async function getUserConfig() {
  const options = await Browser.storage.local.get(Object.keys(defaultConfig))
  return defaults(options, defaultConfig)
}

/**
 * set user config to local storage
 * @param {Partial<UserConfig>} value
 */
export async function setUserConfig(value) {
  await Browser.storage.local.set(value)
}

export async function setAccessToken(accessToken) {
  await setUserConfig({ accessToken, tokenSavedOn: Date.now() })
}

const TOKEN_DURATION = 30 * 24 * 3600 * 1000

export async function clearOldAccessToken() {
  const duration = Date.now() - (await getUserConfig()).tokenSavedOn
  if (duration > TOKEN_DURATION) {
    await setAccessToken('')
  }
}
