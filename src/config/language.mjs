import { languages } from 'countries-list'
import { defaultConfig, getUserConfig } from './index.mjs'

export const languageList = { auto: { name: 'Auto', native: 'Auto' }, ...languages }
languageList.zh.name = 'Chinese (Simplified)'
languageList.zh.native = '简体中文'
languageList.zhHant = { ...languageList.zh }
languageList.zhHant.name = 'Chinese (Traditional)'
languageList.zhHant.native = '正體中文'
languageList.in = {}
languageList.in.name = 'Indonesia'
languageList.in.native = 'Indonesia'

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
