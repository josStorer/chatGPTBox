import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'
import { isMobile } from '../utils/is-mobile.mjs'
import {
  isInApiModeGroup,
  isUsingModelName,
  modelNameToDesc,
} from '../utils/model-name-convert.mjs'
import { t } from 'i18next'

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

export const ModelMode = {
  balanced: 'Balanced',
  creative: 'Creative',
  precise: 'Precise',
  fast: 'Fast',
}

export const chatgptWebModelKeys = [
  'chatgptFree35',
  'chatgptFree4o',
  'chatgptFree4oMini',
  'chatgptPlus4',
  'chatgptFree35Mobile',
  'chatgptPlus4Browsing',
  'chatgptPlus4Mobile',
]
export const bingWebModelKeys = ['bingFree4', 'bingFreeSydney']
export const bardWebModelKeys = ['bardWebFree']
export const claudeWebModelKeys = ['claude2WebFree']
export const youWebModelKeys = [
  'create',
  'openai_o1',
  'openai_o1_preview',
  'openai_o1_mini',
  'gpt_4o_mini',
  'gpt_4o',
  'gpt_4_turbo',
  'gpt_4',
  'grok_2',
  'claude_3_5_sonnet',
  'claude_3_opus',
  'claude_3_sonnet',
  'claude_3_5_haiku',
  'llama3_3_70b',
  'llama3_2_90b',
  'llama3_1_405b',
  'mistral_large_2',
  'gemini_1_5_flash',
  'gemini_1_5_pro',
  'databricks_dbrx_instruct',
  'qwen2p5_72b',
  'qwen2p5_coder_32b',
  'command_r_plus',
  'solar_1_mini',
  'dolphin_2_5',
]
export const moonshotWebModelKeys = ['moonshotWebFree']
export const gptApiModelKeys = ['gptApiInstruct', 'gptApiDavinci']
export const chatgptApiModelKeys = [
  'chatgptApi35',
  'chatgptApi35_16k',
  'chatgptApi35_1106',
  'chatgptApi35_0125',
  'chatgptApi4o_128k',
  'chatgptApi4oLatest',
  'chatgptApi4oMini',
  'chatgptApi4_8k',
  'chatgptApi4_8k_0613',
  'chatgptApi4_32k',
  'chatgptApi4_32k_0613',
  'chatgptApi4_128k',
  'chatgptApi4_128k_preview',
  'chatgptApi4_128k_1106_preview',
  'chatgptApi4_128k_0125_preview',
]
export const customApiModelKeys = ['customModel']
export const ollamaApiModelKeys = ['ollamaModel']
export const azureOpenAiApiModelKeys = ['azureOpenAi']
export const claudeApiModelKeys = [
  'claude12Api',
  'claude2Api',
  'claude21Api',
  'claude3HaikuApi',
  'claude3SonnetApi',
  'claude3OpusApi',
  'claude35SonnetApi',
]
export const chatglmApiModelKeys = ['chatglmTurbo', 'chatglm4', 'chatglmEmohaa', 'chatglmCharGLM3']
export const githubThirdPartyApiModelKeys = ['waylaidwandererApi']
export const poeWebModelKeys = [
  'poeAiWebSage', //poe.com/Assistant
  'poeAiWebGPT4',
  'poeAiWebGPT4_32k',
  'poeAiWebClaudePlus',
  'poeAiWebClaude',
  'poeAiWebClaude100k',
  'poeAiWebCustom',
  'poeAiWebChatGpt',
  'poeAiWebChatGpt_16k',
  'poeAiWebGooglePaLM',
  'poeAiWeb_Llama_2_7b',
  'poeAiWeb_Llama_2_13b',
  'poeAiWeb_Llama_2_70b',
]
export const moonshotApiModelKeys = ['moonshot_v1_8k', 'moonshot_v1_32k', 'moonshot_v1_128k']

export const AlwaysCustomGroups = [
  'ollamaApiModelKeys',
  'customApiModelKeys',
  'azureOpenAiApiModelKeys',
]
export const CustomUrlGroups = ['customApiModelKeys']
export const CustomApiKeyGroups = ['customApiModelKeys']
export const ModelGroups = {
  chatgptWebModelKeys: {
    value: chatgptWebModelKeys,
    desc: 'ChatGPT (Web)',
  },
   claudeWebModelKeys: {
    value: claudeWebModelKeys,
    desc: 'Claude.ai (Web)',
  },
  youWebModelKeys: {
    value: youWebModelKeys,
    desc: 'You.com (Web)',
  },
  moonshotWebModelKeys: {
    value: moonshotWebModelKeys,
    desc: 'Kimi.Moonshot (Web)',
  },
  bingWebModelKeys: {
    value: bingWebModelKeys,
    desc: 'Bing (Web)',
  },
  bardWebModelKeys: {
    value: bardWebModelKeys,
    desc: 'Gemini (Web)',
  },

  chatgptApiModelKeys: {
    value: chatgptApiModelKeys,
    desc: 'ChatGPT (API)',
  },
  claudeApiModelKeys: {
    value: claudeApiModelKeys,
    desc: 'Claude.ai (API)',
  },
  moonshotApiModelKeys: {
    value: moonshotApiModelKeys,
    desc: 'Kimi.Moonshot (API)',
  },
  chatglmApiModelKeys: {
    value: chatglmApiModelKeys,
    desc: 'ChatGLM (API)',
  },
  ollamaApiModelKeys: {
    value: ollamaApiModelKeys,
    desc: 'Ollama (API)',
  },
  azureOpenAiApiModelKeys: {
    value: azureOpenAiApiModelKeys,
    desc: 'ChatGPT (Azure API)',
  },
  gptApiModelKeys: {
    value: gptApiModelKeys,
    desc: 'GPT Completion (API)',
  },
  githubThirdPartyApiModelKeys: {
    value: githubThirdPartyApiModelKeys,
    desc: 'Github Third Party Waylaidwanderer (API)',
  },
  customApiModelKeys: {
    value: customApiModelKeys,
    desc: 'Custom Model',
  },
}

/**
 * @typedef {object} Model
 * @property {string} value
 * @property {string} desc
 */
/**
 * @type {Object.<string,Model>}
 */
export const Models = {
  chatgptFree35: { value: 'text-davinci-002-render-sha', desc: 'ChatGPT (Web)' },

  chatgptFree4o: { value: 'gpt-4o', desc: 'ChatGPT (Web, GPT-4o)' },
  chatgptFree4oMini: { value: 'gpt-4o-mini', desc: 'ChatGPT (Web, GPT-4o mini)' },

  chatgptPlus4: { value: 'gpt-4', desc: 'ChatGPT (Web, GPT-4)' },
  chatgptPlus4Browsing: { value: 'gpt-4', desc: 'ChatGPT (Web, GPT-4)' }, // for compatibility

  chatgptApi35: { value: 'gpt-3.5-turbo', desc: 'ChatGPT (GPT-3.5-turbo)' },
  chatgptApi35_16k: { value: 'gpt-3.5-turbo-16k', desc: 'ChatGPT (GPT-3.5-turbo-16k)' },

  chatgptApi4o_128k: { value: 'gpt-4o', desc: 'ChatGPT (GPT-4o, 128k)' },
  chatgptApi4oMini: { value: 'gpt-4o-mini', desc: 'ChatGPT (GPT-4o mini)' },
  chatgptApi4_8k: { value: 'gpt-4', desc: 'ChatGPT (GPT-4-8k)' },
  chatgptApi4_32k: { value: 'gpt-4-32k', desc: 'ChatGPT (GPT-4-32k)' },
  chatgptApi4_128k: {
    value: 'gpt-4-turbo',
    desc: 'ChatGPT (GPT-4-Turbo 128k)',
  },
  chatgptApi4_128k_preview: {
    value: 'gpt-4-turbo-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k Preview)',
  },
  chatgptApi4_128k_1106_preview: {
    value: 'gpt-4-1106-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k 1106 Preview)',
  },
  chatgptApi4_128k_0125_preview: {
    value: 'gpt-4-0125-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k 0125 Preview)',
  },
  chatgptApi4oLatest: { value: 'chatgpt-4o-latest', desc: 'ChatGPT (ChatGPT-4o latest)' },

  claude2WebFree: { value: '', desc: 'Claude.ai (Web)' },
  claude12Api: { value: 'claude-instant-1.2', desc: 'Claude.ai (API, Claude Instant 1.2)' },
  claude2Api: { value: 'claude-2.0', desc: 'Claude.ai (API, Claude 2)' },
  claude21Api: { value: 'claude-2.1', desc: 'Claude.ai (API, Claude 2.1)' },
  claude3HaikuApi: {
    value: 'claude-3-haiku-20240307',
    desc: 'Claude.ai (API, Claude 3 Haiku)',
  },
  claude3SonnetApi: { value: 'claude-3-sonnet-20240229', desc: 'Claude.ai (API, Claude 3 Sonnet)' },
  claude3OpusApi: { value: 'claude-3-opus-20240229', desc: 'Claude.ai (API, Claude 3 Opus)' },
  claude35SonnetApi: {
    value: 'claude-3-5-sonnet-20240620',
    desc: 'Claude.ai (API, Claude 3.5 Sonnet)',
  },

  bingFree4: { value: '', desc: 'Bing (Web, GPT-4)' },
  bingFreeSydney: { value: '', desc: 'Bing (Web, GPT-4, Sydney)' },

  moonshotWebFree: { value: '', desc: 'Kimi.Moonshot (Web, 100k)' },

  bardWebFree: { value: '', desc: 'Gemini (Web)' },
    youWebFree: { value: "", desc: "You.com (Web)" }, // Added You.com model
    create: { value: "create", desc: "You.com (Web, Create Mode)" }, // Added You.com create model

  chatglmTurbo: { value: 'GLM-4-Air', desc: 'ChatGLM (GLM-4-Air, 128k)' },
  chatglm4: { value: 'GLM-4-0520', desc: 'ChatGLM (GLM-4-0520, 128k)' },
  chatglmEmohaa: { value: 'Emohaa', desc: 'ChatGLM (Emohaa)' },
  chatglmCharGLM3: { value: 'CharGLM-3', desc: 'ChatGLM (CharGLM-3)' },

  chatgptFree35Mobile: { value: 'text-davinci-002-render-sha-mobile', desc: 'ChatGPT (Mobile)' },
  chatgptPlus4Mobile: { value: 'gpt-4-mobile', desc: 'ChatGPT (Mobile, GPT-4)' },

  chatgptApi35_1106: { value: 'gpt-3.5-turbo-1106', desc: 'ChatGPT (GPT-3.5-turbo 1106)' },
  chatgptApi35_0125: { value: 'gpt-3.5-turbo-0125', desc: 'ChatGPT (GPT-3.5-turbo 0125)' },
  chatgptApi4_8k_0613: { value: 'gpt-4', desc: 'ChatGPT (GPT-4-8k 0613)' },
  chatgptApi4_32k_0613: { value: 'gpt-4-32k', desc: 'ChatGPT (GPT-4-32k 0613)' },

  gptApiInstruct: { value: 'gpt-3.5-turbo-instruct', desc: 'GPT-3.5-turbo Instruct' },
  gptApiDavinci: { value: 'text-davinci-003', desc: 'GPT-3.5' },
  
  create: { value: 'create', desc: 'YouWeb create' },
  openai_o1: { value: 'openai_o1', desc: 'YouWeb openai_o1' },
  openai_o1_preview: { value: 'openai_o1_preview', desc: 'YouWeb openai_o1_preview' },
  openai_o1_mini: { value: 'openai_o1_mini', desc: 'YouWeb openai_o1_mini' },
  gpt_4o_mini: { value: 'gpt_4o_mini', desc: 'YouWeb gpt_4o_mini' },
  gpt_4o: { value: 'gpt_4o', desc: 'YouWeb gpt_4o' },
  gpt_4_turbo: { value: 'gpt_4_turbo', desc: 'YouWeb gpt_4_turbo' },
  gpt_4: { value: 'gpt_4', desc: 'YouWeb gpt_4' },
  grok_2: { value: 'grok_2', desc: 'YouWeb grok_2' },
  claude_3_5_sonnet: { value: 'claude_3_5_sonnet', desc: 'YouWeb claude_3_5_sonnet' },
  claude_3_opus: { value: 'claude_3_opus', desc: 'YouWeb claude_3_opus' },
  claude_3_sonnet: { value: 'claude_3_sonnet', desc: 'YouWeb claude_3_sonnet' },
  claude_3_5_haiku: { value: 'claude_3_5_haiku', desc: 'YouWeb claude_3_5_haiku' },
  llama3_3_70b: { value: 'llama3_3_70b', desc: 'YouWeb llama3_3_70b' },
  llama3_2_90b: { value: 'llama3_2_90b', desc: 'YouWeb llama3_2_90b' },
  llama3_1_405b: { value: 'llama3_1_405b', desc: 'YouWeb llama3_1_405b' },
  mistral_large_2: { value: 'mistral_large_2', desc: 'YouWeb mistral_large_2' },
  gemini_1_5_flash: { value: 'gemini_1_5_flash', desc: 'YouWeb gemini_1_5_flash' },
  gemini_1_5_pro: { value: 'gemini_1_5_pro', desc: 'YouWeb gemini_1_5_pro' },
  databricks_dbrx_instruct: { value: 'databricks_dbrx_instruct', desc: 'YouWeb databricks_dbrx_instruct' },
  qwen2p5_72b: { value: 'qwen2p5_72b', desc: 'YouWeb qwen2p5_72b' },
  qwen2p5_coder_32b: { value: 'qwen2p5_coder_32b', desc: 'YouWeb qwen2p5_coder_32b' },
  command_r_plus: { value: 'command_r_plus', desc: 'YouWeb command_r_plus' },
  solar_1_mini: { value: 'solar_1_mini', desc: 'YouWeb solar_1_mini' },
  dolphin_2_5: { value: 'dolphin_2_5', desc: 'YouWeb dolphin_2_5' },


  customModel: { value: '', desc: 'Custom Model' },
  ollamaModel: { value: '', desc: 'Ollama API' },
  azureOpenAi: { value: '', desc: 'ChatGPT (Azure)' },
  waylaidwandererApi: { value: '', desc: 'Waylaidwanderer API (Github)' },

  poeAiWebSage: { value: 'Assistant', desc: 'Poe AI (Web, Assistant)' },
  poeAiWebGPT4: { value: 'gpt-4', desc: 'Poe AI (Web, GPT-4)' },
  poeAiWebGPT4_32k: { value: 'gpt-4-32k', desc: 'Poe AI (Web, GPT-4-32k)' },
  poeAiWebClaudePlus: { value: 'claude-2-100k', desc: 'Poe AI (Web, Claude 2 100k)' },
  poeAiWebClaude: { value: 'claude-instant', desc: 'Poe AI (Web, Claude instant)' },
  poeAiWebClaude100k: { value: 'claude-instant-100k', desc: 'Poe AI (Web, Claude instant 100k)' },
  poeAiWebGooglePaLM: { value: 'Google-PaLM', desc: 'Poe AI (Web, Google-PaLM)' },
  poeAiWeb_Llama_2_7b: { value: 'Llama-2-7b', desc: 'Poe AI (Web, Llama-2-7b)' },
  poeAiWeb_Llama_2_13b: { value: 'Llama-2-13b', desc: 'Poe AI (Web, Llama-2-13b)' },
  poeAiWeb_Llama_2_70b: { value: 'Llama-2-70b', desc: 'Poe AI (Web, Llama-2-70b)' },
  poeAiWebChatGpt: { value: 'chatgpt', desc: 'Poe AI (Web, ChatGPT)' },
  poeAiWebChatGpt_16k: { value: 'chatgpt-16k', desc: 'Poe AI (Web, ChatGPT-16k)' },
  poeAiWebCustom: { value: '', desc: 'Poe AI (Web, Custom)' },

  moonshot_v1_8k: {
    value: 'moonshot-v1-8k',
    desc: 'Kimi.Moonshot (8k)',
  },
  moonshot_v1_32k: {
    value: 'moonshot-v1-32k',
    desc: 'Kimi.Moonshot (32k)',
  },
  moonshot_v1_128k: {
    value: 'moonshot-v1-128k',
    desc: 'Kimi.Moonshot (128k)',
  },
}

for (const modelName in Models) {
  if (isUsingMultiModeModel({ modelName }))
    for (const mode in ModelMode) {
      const key = `${modelName}-${mode}`
      Models[key] = {
        value: mode,
        desc: modelNameToDesc(key, t),
      }
    }
}

/**
 * @typedef {typeof defaultConfig} UserConfig
 */
export const defaultConfig = {
  // general

  /** @type {keyof TriggerMode}*/
  triggerMode: 'manually',
  /** @type {keyof ThemeMode}*/
  themeMode: 'auto',
  /** @type {keyof Models}*/
  modelName: getNavigatorLanguage() === 'zh' ? 'moonshotWebFree' : 'claude2WebFree',
  apiMode: null,

  preferredLanguage: getNavigatorLanguage(),
  clickIconAction: 'popup',
  insertAtTop: isMobile(),
  alwaysFloatingSidebar: false,
  allowEscToCloseAll: false,
  lockWhenAnswer: true,
  answerScrollMargin: 200,
  autoRegenAfterSwitchModel: false,
  selectionToolsNextToInputBox: false,
  alwaysPinWindow: false,
  focusAfterAnswer: true,

  apiKey: '', // openai ApiKey

  azureApiKey: '',
  azureEndpoint: '',
  azureDeploymentName: '',

  poeCustomBotName: '',

  claudeApiKey: '',
  chatglmApiKey: '',
  moonshotApiKey: '',

  customApiKey: '',

  /** @type {keyof ModelMode}*/
  modelMode: 'balanced',

  customModelApiUrl: 'http://localhost:8000/v1/chat/completions',
  customModelName: 'gpt-3.5-turbo',
  githubThirdPartyUrl: 'http://127.0.0.1:3000/conversation',

  ollamaEndpoint: 'http://127.0.0.1:11434',
  ollamaModelName: 'llama3.1',
  ollamaApiKey: '',
  ollamaKeepAliveTime: '5m',

  // advanced

  maxResponseTokenLength: 1000,
  maxConversationContextLength: 9,
  temperature: 1,
  customChatGptWebApiUrl: 'https://chatgpt.com',
  customChatGptWebApiPath: '/backend-api/conversation',
  customOpenAiApiUrl: 'https://api.openai.com',
  customClaudeApiUrl: 'https://api.anthropic.com',
  disableWebModeHistory: true,
  hideContextMenu: false,
  siteRegex: 'match nothing',
  useSiteRegexOnly: false,
  inputQuery: '',
  appendQuery: '',
  prependQuery: '',

  // others

  alwaysCreateNewConversationWindow: false,
  // The handling of activeApiModes and customApiModes is somewhat complex.
  // It does not directly convert activeApiModes into customApiModes, which is for compatibility considerations.
  // It allows the content of activeApiModes to change with version updates when the user has not customized ApiModes.
  // If it were directly written into customApiModes, the value would become fixed, even if the user has not made any customizations.
  activeApiModes: [
    'create',
    'openai_o1',
    'openai_o1_preview',
    'openai_o1_mini',
    'gpt_4o_mini',
    'gpt_4o',
    'gpt_4_turbo',
    'gpt_4',
    'grok_2',
    'claude_3_5_sonnet',
    'claude_3_opus',
    'claude_3_sonnet',
    'claude_3_5_haiku',
    'llama3_3_70b',
    'llama3_2_90b',
    'llama3_1_405b',
    'mistral_large_2',
    'gemini_1_5_flash',
    'gemini_1_5_pro',
    'databricks_dbrx_instruct',
    'qwen2p5_72b',
    'qwen2p5_coder_32b',
    'command_r_plus',
    'solar_1_mini',
    'dolphin_2_5',
  ],
  customApiModes: [
    {
      groupName: '',
      itemName: '',
      isCustom: false,
      customName: '',
      customUrl: '',
      apiKey: '',
      active: false,
    },
  ],
  activeSelectionTools: ['translate', 'summary', 'polish', 'code', 'ask'],
  customSelectionTools: [
    {
      name: '',
      iconKey: 'explain',
      prompt: 'sample prompt: {{selection}}',
      active: false,
    },
  ],
  activeSiteAdapters: [
    'bilibili',
    'github',
    'gitlab',
    'quora',
    'reddit',
    'youtube',
    'zhihu',
    'stackoverflow',
    'juejin',
    'mp.weixin.qq',
    'followin',
    'arxiv',
  ],
  accessToken: '',
  tokenSavedOn: 0,
  bingAccessToken: '',
  notificationJumpBackTabId: 0,
  chatgptTabId: 0,
  chatgptArkoseReqUrl: '',
  chatgptArkoseReqForm: '',
  kimiMoonShotRefreshToken: '',
  kimiMoonShotAccessToken: '',

  // unchangeable

  userLanguage: getNavigatorLanguage(),
  apiModes: Object.keys(Models),
  chatgptArkoseReqParams: 'cgb=vhwi',
  selectionTools: [
    'explain',
    'translate',
    'translateToEn',
    'summary',
    'polish',
    'sentiment',
    'divide',
    'code',
    'ask',
  ],
  selectionToolsDesc: [
    'Explain',
    'Translate',
    'Translate (To English)',
    'Summary',
    'Polish',
    'Sentiment Analysis',
    'Divide Paragraphs',
    'Code Explain',
    'Ask',
  ],
  // importing configuration will result in gpt-3-encoder being packaged into the output file
  siteAdapters: [
    'bilibili',
    'github',
    'gitlab',
    'quora',
    'reddit',
    'youtube',
    'zhihu',
    'stackoverflow',
    'juejin',
    'mp.weixin.qq',
    'followin',
    'arxiv',
  ],
}

export function getNavigatorLanguage() {
  const l = navigator.language.toLowerCase()
  if (['zh-hk', 'zh-mo', 'zh-tw', 'zh-cht', 'zh-hant'].includes(l)) return 'zhHant'
  return navigator.language.substring(0, 2)
}

export function isUsingChatgptWebModel(configOrSession) {
  return isInApiModeGroup(chatgptWebModelKeys, configOrSession)
}

export function isUsingClaudeWebModel(configOrSession) {
  return isInApiModeGroup(claudeWebModelKeys, configOrSession)
}

export function isUsingYouWebModel(configOrSession) {
  return isInApiModeGroup(youWebModelKeys, configOrSession)
}

export function isUsingMoonshotWebModel(configOrSession) {
  return isInApiModeGroup(moonshotWebModelKeys, configOrSession)
}

export function isUsingBingWebModel(configOrSession) {
  return isInApiModeGroup(bingWebModelKeys, configOrSession)
}

export function isUsingMultiModeModel(configOrSession) {
  return isInApiModeGroup(bingWebModelKeys, configOrSession)
}

export function isUsingGeminiWebModel(configOrSession) {
  return isInApiModeGroup(bardWebModelKeys, configOrSession)
}

export function isUsingChatgptApiModel(configOrSession) {
  return isInApiModeGroup(chatgptApiModelKeys, configOrSession)
}

export function isUsingGptCompletionApiModel(configOrSession) {
  return isInApiModeGroup(gptApiModelKeys, configOrSession)
}

export function isUsingOpenAiApiModel(configOrSession) {
  return isUsingChatgptApiModel(configOrSession) || isUsingGptCompletionApiModel(configOrSession)
}

export function isUsingClaudeApiModel(configOrSession) {
  return isInApiModeGroup(claudeApiModelKeys, configOrSession)
}

export function isUsingMoonshotApiModel(configOrSession) {
  return isInApiModeGroup(moonshotApiModelKeys, configOrSession)
}

export function isUsingChatGLMApiModel(configOrSession) {
  return isInApiModeGroup(chatglmApiModelKeys, configOrSession)
}

export function isUsingOllamaApiModel(configOrSession) {
  return isInApiModeGroup(ollamaApiModelKeys, configOrSession)
}

export function isUsingAzureOpenAiApiModel(configOrSession) {
  return isInApiModeGroup(azureOpenAiApiModelKeys, configOrSession)
}

export function isUsingGithubThirdPartyApiModel(configOrSession) {
  return isInApiModeGroup(githubThirdPartyApiModelKeys, configOrSession)
}

export function isUsingCustomModel(configOrSession) {
  return isInApiModeGroup(customApiModelKeys, configOrSession)
}

/**
 * @deprecated
 */
export function isUsingCustomNameOnlyModel(configOrSession) {
  return isUsingModelName('poeAiWebCustom', configOrSession)
}

export async function getPreferredLanguageKey() {
  const config = await getUserConfig()
  if (config.preferredLanguage === 'auto') return config.userLanguage
  return config.preferredLanguage
}

/**
 * get user config from local storage
 * @returns {Promise<UserConfig>}
 */
export async function getUserConfig() {
  const options = await Browser.storage.local.get(Object.keys(defaultConfig))
  if (options.customChatGptWebApiUrl === 'https://chat.openai.com')
    options.customChatGptWebApiUrl = 'https://chatgpt.com'
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
