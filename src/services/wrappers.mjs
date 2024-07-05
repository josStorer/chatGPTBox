import {
  bingWebModelKeys,
  claudeWebModelKeys,
  clearOldAccessToken,
  getUserConfig,
  Models,
  setAccessToken,
} from '../config/index.mjs'
import Browser from 'webextension-polyfill'
import { t } from 'i18next'

export async function getChatGptAccessToken() {
  await clearOldAccessToken()
  const userConfig = await getUserConfig()
  if (userConfig.accessToken) {
    return userConfig.accessToken
  } else {
    const cookie = (await Browser.cookies.getAll({ url: 'https://chatgpt.com/' }))
      .map((cookie) => {
        return `${cookie.name}=${cookie.value}`
      })
      .join('; ')
    const resp = await fetch('https://chatgpt.com/api/auth/session', {
      headers: {
        Cookie: cookie,
      },
    })
    if (resp.status === 403) {
      throw new Error('CLOUDFLARE')
    }
    const data = await resp.json().catch(() => ({}))
    if (!data.accessToken) {
      throw new Error('UNAUTHORIZED')
    }
    await setAccessToken(data.accessToken)
    return data.accessToken
  }
}

export async function getBingAccessToken() {
  return (await Browser.cookies.get({ url: 'https://bing.com/', name: '_U' }))?.value
}

export async function getBardCookies() {
  const token = (await Browser.cookies.get({ url: 'https://google.com/', name: '__Secure-1PSID' }))
    ?.value
  return '__Secure-1PSID=' + token
}

export async function getClaudeSessionKey() {
  return (await Browser.cookies.get({ url: 'https://claude.ai/', name: 'sessionKey' }))?.value
}

export function handlePortError(session, port, err) {
  console.error(err)
  if (err.message) {
    if (!err.message.includes('aborted')) {
      if (
        ['message you submitted was too long', 'maximum context length'].some((m) =>
          err.message.includes(m),
        )
      )
        port.postMessage({ error: t('Exceeded maximum context length') + '\n\n' + err.message })
      else if (['CaptchaChallenge', 'CAPTCHA'].some((m) => err.message.includes(m)))
        port.postMessage({ error: t('Bing CaptchaChallenge') + '\n\n' + err.message })
      else if (['exceeded your current quota'].some((m) => err.message.includes(m)))
        port.postMessage({ error: t('Exceeded quota') + '\n\n' + err.message })
      else if (['Rate limit reached'].some((m) => err.message.includes(m)))
        port.postMessage({ error: t('Rate limit') + '\n\n' + err.message })
      else if (['authentication token has expired'].some((m) => err.message.includes(m)))
        port.postMessage({ error: 'UNAUTHORIZED' })
      else if (
        claudeWebModelKeys.includes(session.modelName) &&
        ['Invalid authorization', 'Session key required'].some((m) => err.message.includes(m))
      )
        port.postMessage({ error: t('Please login at https://claude.ai first') })
      else if (
        // `.some` for multi mode models. e.g. bingFree4-balanced
        bingWebModelKeys.some((n) => session.modelName.includes(n)) &&
        ['/turing/conversation/create: failed to parse response body.'].some((m) =>
          err.message.includes(m),
        )
      )
        port.postMessage({ error: t('Please login at https://bing.com first') })
      else port.postMessage({ error: err.message })
    }
  } else {
    const errMsg = JSON.stringify(err)
    if (bingWebModelKeys.some((n) => session.modelName.includes(n)) && errMsg.includes('isTrusted'))
      port.postMessage({ error: t('Please login at https://bing.com first') })
    else port.postMessage({ error: errMsg ?? 'unknown error' })
  }
}

export function registerPortListener(executor) {
  Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected')
    const onMessage = async (msg) => {
      console.debug('received msg', msg)
      const session = msg.session
      if (!session) return
      const config = await getUserConfig()
      if (!session.modelName) session.modelName = config.modelName
      if (!session.aiName) session.aiName = Models[session.modelName].desc
      port.postMessage({ session })
      try {
        await executor(session, port, config)
      } catch (err) {
        handlePortError(session, port, err)
      }
    }

    const onDisconnect = () => {
      console.debug('port disconnected, remove listener')
      port.onMessage.removeListener(onMessage)
      port.onDisconnect.removeListener(onDisconnect)
    }

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(onDisconnect)
  })
}
