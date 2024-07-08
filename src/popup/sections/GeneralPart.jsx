import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { openUrl } from '../../utils/index.mjs'
import {
  isUsingOpenAiApiKey,
  isUsingAzureOpenAi,
  isUsingChatGLMApi,
  isUsingClaudeApi,
  isUsingCustomModel,
  isUsingCustomNameOnlyModel,
  isUsingGithubThirdPartyApi,
  isUsingMultiModeModel,
  ModelMode,
  Models,
  ThemeMode,
  TriggerMode,
  DisplayMode,
  isUsingMoonshotApi,
} from '../../config/index.mjs'
import Browser from 'webextension-polyfill'
import { languageList } from '../../config/language.mjs'
import PropTypes from 'prop-types'
import { config as menuConfig } from '../../content-script/menu-tools'

GeneralPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function checkBilling(apiKey, apiUrl) {
  const now = new Date()
  let startDate = new Date(now - 90 * 24 * 60 * 60 * 1000)
  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const subDate = new Date(now)
  subDate.setDate(1)

  const urlSubscription = `${apiUrl}/v1/dashboard/billing/subscription`
  let urlUsage = `${apiUrl}/v1/dashboard/billing/usage?start_date=${formatDate(
    startDate,
  )}&end_date=${formatDate(endDate)}`
  const headers = {
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  }

  try {
    let response = await fetch(urlSubscription, { headers })
    if (!response.ok) {
      console.log('Your account has been suspended. Please log in to OpenAI to check.')
      return [null, null, null]
    }
    const subscriptionData = await response.json()
    const totalAmount = subscriptionData.hard_limit_usd

    if (totalAmount > 20) {
      startDate = subDate
    }

    urlUsage = `${apiUrl}/v1/dashboard/billing/usage?start_date=${formatDate(
      startDate,
    )}&end_date=${formatDate(endDate)}`

    response = await fetch(urlUsage, { headers })
    const usageData = await response.json()
    const totalUsage = usageData.total_usage / 100
    const remaining = totalAmount - totalUsage

    return [totalAmount, totalUsage, remaining]
  } catch (error) {
    console.error(error)
    return [null, null, null]
  }
}

export function GeneralPart({ config, updateConfig }) {
  const { t, i18n } = useTranslation()
  const [balance, setBalance] = useState(null)

  const getBalance = async () => {
    const response = await fetch(`${config.customOpenAiApiUrl}/dashboard/billing/credit_grants`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    })
    if (response.ok) setBalance((await response.json()).total_available.toFixed(2))
    else {
      const billing = await checkBilling(config.apiKey, config.customOpenAiApiUrl)
      if (billing && billing.length > 2 && billing[2]) setBalance(`${billing[2].toFixed(2)}`)
      else openUrl('https://platform.openai.com/account/usage')
    }
  }

  return (
    <>
      <label>
        <legend>{t('Triggers')}</legend>
        <select
          required
          onChange={(e) => {
            const mode = e.target.value
            updateConfig({ triggerMode: mode })
          }}
        >
          {Object.entries(TriggerMode).map(([key, desc]) => {
            return (
              <option value={key} key={key} selected={key === config.triggerMode}>
                {t(desc)}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>{t('DisplayMode')}</legend>
        <select
          required
          onChange={(e) => {
            const mode = e.target.value
            updateConfig({ displayMode: mode })
          }}
        >
          {Object.entries(DisplayMode).map(([key, desc]) => {
            return (
              <option value={key} key={key} selected={key === config.displayMode}>
                {t(desc)}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>{t('Theme')}</legend>
        <select
          required
          onChange={(e) => {
            const mode = e.target.value
            updateConfig({ themeMode: mode })
          }}
        >
          {Object.entries(ThemeMode).map(([key, desc]) => {
            return (
              <option value={key} key={key} selected={key === config.themeMode}>
                {t(desc)}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>{t('API Mode')}</legend>
        <span style="display: flex; gap: 15px;">
          <select
            style={
              isUsingOpenAiApiKey(config) ||
              isUsingMultiModeModel(config) ||
              isUsingCustomModel(config) ||
              isUsingAzureOpenAi(config) ||
              isUsingClaudeApi(config) ||
              isUsingCustomNameOnlyModel(config) ||
              isUsingMoonshotApi(config)
                ? 'width: 50%;'
                : undefined
            }
            required
            onChange={(e) => {
              const modelName = e.target.value
              updateConfig({ modelName: modelName })
            }}
          >
            {config.activeApiModes.map((modelName) => {
              let desc
              if (modelName.includes('-')) {
                const splits = modelName.split('-')
                if (splits[0] in Models)
                  desc = `${t(Models[splits[0]].desc)} (${t(ModelMode[splits[1]])})`
              } else {
                if (modelName in Models) desc = t(Models[modelName].desc)
              }
              if (desc)
                return (
                  <option
                    value={modelName}
                    key={modelName}
                    selected={modelName === config.modelName}
                  >
                    {desc}
                  </option>
                )
            })}
          </select>
          {isUsingMultiModeModel(config) && (
            <select
              style="width: 50%;"
              required
              onChange={(e) => {
                const modelMode = e.target.value
                updateConfig({ modelMode: modelMode })
              }}
            >
              {Object.entries(ModelMode).map(([key, desc]) => {
                return (
                  <option value={key} key={key} selected={key === config.modelMode}>
                    {t(desc)}
                  </option>
                )
              })}
            </select>
          )}
          {isUsingOpenAiApiKey(config) && (
            <span style="width: 50%; display: flex; gap: 5px;">
              <input
                type="password"
                value={config.apiKey}
                placeholder={t('API Key')}
                onChange={(e) => {
                  const apiKey = e.target.value
                  updateConfig({ apiKey: apiKey })
                }}
              />
              {config.apiKey.length === 0 ? (
                <a
                  href="https://platform.openai.com/account/api-keys"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  <button style="white-space: nowrap;" type="button">
                    {t('Get')}
                  </button>
                </a>
              ) : balance ? (
                <button type="button" onClick={getBalance}>
                  {balance}
                </button>
              ) : (
                <button type="button" onClick={getBalance}>
                  {t('Balance')}
                </button>
              )}
            </span>
          )}
          {isUsingCustomModel(config) && (
            <input
              style="width: 50%;"
              type="text"
              value={config.customModelName}
              placeholder={t('Model Name')}
              onChange={(e) => {
                const customModelName = e.target.value
                updateConfig({ customModelName: customModelName })
              }}
            />
          )}
          {isUsingCustomNameOnlyModel(config) && (
            <input
              style="width: 50%;"
              type="text"
              value={config.poeCustomBotName}
              placeholder={t('Bot Name')}
              onChange={(e) => {
                const customName = e.target.value
                updateConfig({ poeCustomBotName: customName })
              }}
            />
          )}
          {isUsingAzureOpenAi(config) && (
            <input
              type="password"
              style="width: 50%;"
              value={config.azureApiKey}
              placeholder={t('Azure API Key')}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ azureApiKey: apiKey })
              }}
            />
          )}
          {isUsingClaudeApi(config) && (
            <input
              type="password"
              style="width: 50%;"
              value={config.claudeApiKey}
              placeholder={t('Claude API Key')}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ claudeApiKey: apiKey })
              }}
            />
          )}
          {isUsingChatGLMApi(config) && (
            <input
              type="password"
              style="width: 50%;"
              value={config.chatglmApiKey}
              placeholder={t('ChatGLM API Key')}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ chatglmApiKey: apiKey })
              }}
            />
          )}
          {isUsingMoonshotApi(config) && (
            <span style="width: 50%; display: flex; gap: 5px;">
              <input
                type="password"
                value={config.moonshotApiKey}
                placeholder={t('Moonshot API Key')}
                onChange={(e) => {
                  const apiKey = e.target.value
                  updateConfig({ moonshotApiKey: apiKey })
                }}
              />
              {config.moonshotApiKey.length === 0 && (
                <a
                  href="https://platform.moonshot.cn/console/api-keys"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  <button style="white-space: nowrap;" type="button">
                    {t('Get')}
                  </button>
                </a>
              )}
            </span>
          )}
        </span>
        {isUsingCustomModel(config) && (
          <input
            type="text"
            value={config.customModelApiUrl}
            placeholder={t('Custom Model API Url')}
            onChange={(e) => {
              const value = e.target.value
              updateConfig({ customModelApiUrl: value })
            }}
          />
        )}
        {isUsingCustomModel(config) && (
          <input
            type="password"
            value={config.customApiKey}
            placeholder={t('API Key')}
            onChange={(e) => {
              const apiKey = e.target.value
              updateConfig({ customApiKey: apiKey })
            }}
          />
        )}
        {isUsingAzureOpenAi(config) && (
          <input
            type="password"
            value={config.azureEndpoint}
            placeholder={t('Azure Endpoint')}
            onChange={(e) => {
              const endpoint = e.target.value
              updateConfig({ azureEndpoint: endpoint })
            }}
          />
        )}
        {isUsingAzureOpenAi(config) && (
          <input
            type="text"
            value={config.azureDeploymentName}
            placeholder={t('Azure Deployment Name')}
            onChange={(e) => {
              const deploymentName = e.target.value
              updateConfig({ azureDeploymentName: deploymentName })
            }}
          />
        )}
        {isUsingGithubThirdPartyApi(config) && (
          <input
            type="text"
            value={config.githubThirdPartyUrl}
            placeholder={t('API Url')}
            onChange={(e) => {
              const url = e.target.value
              updateConfig({ githubThirdPartyUrl: url })
            }}
          />
        )}
      </label>
      <label>
        <legend>{t('Preferred Language')}</legend>
        <select
          required
          onChange={(e) => {
            const preferredLanguageKey = e.target.value
            updateConfig({ preferredLanguage: preferredLanguageKey })

            let lang
            if (preferredLanguageKey === 'auto') lang = config.userLanguage
            else lang = preferredLanguageKey
            i18n.changeLanguage(lang)

            Browser.tabs.query({}).then((tabs) => {
              tabs.forEach((tab) => {
                Browser.tabs
                  .sendMessage(tab.id, {
                    type: 'CHANGE_LANG',
                    data: {
                      lang,
                    },
                  })
                  .catch(() => {})
              })
            })
          }}
        >
          {Object.entries(languageList).map(([k, v]) => {
            return (
              <option value={k} key={k} selected={k === config.preferredLanguage}>
                {v.native}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>{t('When Icon Clicked')}</legend>
        <select
          required
          onChange={(e) => {
            const mode = e.target.value
            updateConfig({ clickIconAction: mode })
          }}
        >
          <option value="popup" key="popup" selected={config.clickIconAction === 'popup'}>
            {t('Open Settings')}
          </option>
          {Object.entries(menuConfig).map(([k, v]) => {
            return (
              <option value={k} key={k} selected={k === config.clickIconAction}>
                {t(v.label)}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.insertAtTop}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ insertAtTop: checked })
          }}
        />
        {t('Insert ChatGPT at the top of search results')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.lockWhenAnswer}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ lockWhenAnswer: checked })
          }}
        />
        {t('Lock scrollbar while answering')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.autoRegenAfterSwitchModel}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ autoRegenAfterSwitchModel: checked })
          }}
        />
        {t('Regenerate the answer after switching model')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.selectionToolsNextToInputBox}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ selectionToolsNextToInputBox: checked })
          }}
        />
        {t('Display selection tools next to input box to avoid blocking')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.alwaysPinWindow}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ alwaysPinWindow: checked })
          }}
        />
        {t('Always pin the floating window')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.focusAfterAnswer}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ focusAfterAnswer: checked })
          }}
        />
        {t('Focus to input box after answering')}
      </label>
      <br />
    </>
  )
}
