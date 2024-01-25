// web version

import { fetchSSE } from '../../utils/fetch-sse.mjs'
import { isEmpty } from 'lodash-es'
import { chatgptWebModelKeys, getUserConfig, Models } from '../../config/index.mjs'
import { pushRecord, setAbortController } from './shared.mjs'
import Browser from 'webextension-polyfill'
import { v4 as uuidv4 } from 'uuid'
import { t } from 'i18next'

async function request(token, method, path, data) {
  const apiUrl = (await getUserConfig()).customChatGptWebApiUrl
  const response = await fetch(`${apiUrl}/backend-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  const responseText = await response.text()
  console.debug(`request: ${path}`, responseText)
  return { response, responseText }
}

export async function sendMessageFeedback(token, data) {
  await request(token, 'POST', '/conversation/message_feedback', data)
}

export async function setConversationProperty(token, conversationId, propertyObject) {
  await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
}

export async function deleteConversation(token, conversationId) {
  if (conversationId) await setConversationProperty(token, conversationId, { is_visible: false })
}

export async function sendModerations(token, question, conversationId, messageId) {
  await request(token, 'POST', `/moderations`, {
    conversation_id: conversationId,
    input: question,
    message_id: messageId,
    model: 'text-moderation-playground',
  })
}

export async function getModels(token) {
  const response = JSON.parse((await request(token, 'GET', '/models')).responseText)
  if (response.models) return response.models.map((m) => m.slug)
}

/**
 * @param {Runtime.Port} port
 * @param {string} question
 * @param {Session} session
 * @param {string} accessToken
 */
export async function generateAnswersWithChatgptWebApi(port, question, session, accessToken) {
  session.messageId = uuidv4()
  if (session.parentMessageId == null) {
    session.parentMessageId = uuidv4()
  }

  const { controller, messageListener, disconnectListener } = setAbortController(port, null, () => {
    if (session.autoClean) deleteConversation(accessToken, session.conversationId)
  })

  const models = await getModels(accessToken).catch(() => {
    port.onMessage.removeListener(messageListener)
    port.onDisconnect.removeListener(disconnectListener)
  })
  console.debug('models', models)
  const config = await getUserConfig()
  const selectedModel = Models[session.modelName].value
  const usedModel =
    models && models.includes(selectedModel) ? selectedModel : Models[chatgptWebModelKeys[0]].value
  console.debug('usedModel', usedModel)

  let cookie
  if (Browser.cookies && Browser.cookies.getAll)
    cookie = (await Browser.cookies.getAll({ url: 'https://chat.openai.com/' }))
      .map((cookie) => {
        return `${cookie.name}=${cookie.value}`
      })
      .join('; ')

  const needArkoseToken = !usedModel.includes(Models[chatgptWebModelKeys[0]].value)
  if (needArkoseToken && !config.chatgptArkoseReqUrl)
    throw new Error(
      t('Please login at https://chat.openai.com first') +
        '\n\n' +
        t(
          "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again.",
        ),
    )
  const arkoseToken = config.chatgptArkoseReqUrl
    ? await fetch(config.chatgptArkoseReqUrl + '?' + config.chatgptArkoseReqParams, {
        method: 'POST',
        body: config.chatgptArkoseReqForm,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
      })
        .then((resp) => resp.json())
        .then((resp) => resp.token)
        .catch(() => null)
    : null
  if (needArkoseToken && !arkoseToken)
    throw new Error(
      t('Failed to get arkose token.') +
        '\n\n' +
        t(
          "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again.",
        ),
    )
  let answer = ''
  let generationPrefixAnswer = ''
  let generatedImageUrl = ''
  await fetchSSE(`${config.customChatGptWebApiUrl}${config.customChatGptWebApiPath}`, {
    method: 'POST',
    signal: controller.signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(cookie && { Cookie: cookie }),
    },
    body: JSON.stringify({
      action: 'next',
      conversation_id: session.conversationId || undefined,
      messages: [
        {
          id: session.messageId,
          author: {
            role: 'user',
          },
          content: {
            content_type: 'text',
            parts: [question],
          },
        },
      ],
      conversation_mode: {
        kind: 'primary_assistant',
      },
      force_paragen: false,
      force_rate_limit: false,
      suggestions: [],
      model: usedModel,
      parent_message_id: session.parentMessageId,
      timezone_offset_min: new Date().getTimezoneOffset(),
      history_and_training_disabled: config.disableWebModeHistory,
      arkose_token: arkoseToken,
    }),
    onMessage(message) {
      console.debug('sse message', message)
      if (message.trim() === '[DONE]') {
        pushRecord(session, question, answer)
        console.debug('conversation history', { content: session.conversationRecords })
        port.postMessage({ answer: null, done: true, session: session })
        return
      }
      let data
      try {
        data = JSON.parse(message)
      } catch (error) {
        console.debug('json error', error)
        return
      }
      if (data.error) {
        if (data.error.includes('unusual activity'))
          throw new Error(
            "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again.",
          )
        else throw new Error(data.error)
      }

      if (data.conversation_id) session.conversationId = data.conversation_id
      if (data.message?.id) session.parentMessageId = data.message.id

      const respAns = data.message?.content?.parts?.[0]
      const contentType = data.message?.content?.content_type
      if (contentType === 'text' && respAns) {
        answer =
          generationPrefixAnswer +
          (generatedImageUrl && `\n\n![](${generatedImageUrl})\n\n`) +
          respAns
      } else if (contentType === 'code' && data.message?.status === 'in_progress') {
        const generationText = '\n\n' + t('Generating...')
        if (answer && !answer.endsWith(generationText)) generationPrefixAnswer = answer
        answer = generationPrefixAnswer + generationText
      } else if (
        contentType === 'multimodal_text' &&
        respAns?.content_type === 'image_asset_pointer'
      ) {
        const imageAsset = respAns?.asset_pointer || ''
        if (imageAsset) {
          fetch(
            `${config.customChatGptWebApiUrl}/backend-api/files/${imageAsset.replace(
              'file-service://',
              '',
            )}/download`,
            {
              credentials: 'include',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                ...(cookie && { Cookie: cookie }),
              },
            },
          ).then((r) => r.json().then((json) => (generatedImageUrl = json?.download_url)))
        }
      }

      if (answer) {
        port.postMessage({ answer: answer, done: false, session: null })
      }
    },
    async onStart() {
      // sendModerations(accessToken, question, session.conversationId, session.messageId)
    },
    async onEnd() {
      port.postMessage({ done: true })
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
    },
    async onError(resp) {
      port.onMessage.removeListener(messageListener)
      port.onDisconnect.removeListener(disconnectListener)
      if (resp instanceof Error) throw resp
      if (resp.status === 403) {
        throw new Error('CLOUDFLARE')
      }
      const error = await resp.json().catch(() => ({}))
      throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`)
    },
  })
}
