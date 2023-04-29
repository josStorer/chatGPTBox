import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { openUrl } from '../../utils/index.mjs'
import {
  isUsingApiKey,
  isUsingAzureOpenAi,
  isUsingCustomModel,
  isUsingCustomNameOnlyModel,
  isUsingGithubThirdPartyApi,
  isUsingMultiModeModel,
  ModelMode,
  Models,
  ThemeMode,
  TriggerMode,
} from '../../config/index.mjs'
import Browser from 'webextension-polyfill'
import { languageList } from '../../config/language.mjs'
import PropTypes from 'prop-types'

GeneralPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
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
    else openUrl('https://platform.openai.com/account/usage')
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
              isUsingApiKey(config) ||
              isUsingMultiModeModel(config) ||
              isUsingCustomModel(config) ||
              isUsingAzureOpenAi(config) ||
              isUsingCustomNameOnlyModel(config)
                ? 'width: 50%;'
                : undefined
            }
            required
            onChange={(e) => {
              const modelName = e.target.value
              updateConfig({ modelName: modelName })
            }}
          >
            {config.activeApiModes.map((key) => {
              const model = Models[key]
              return (
                <option value={key} key={key} selected={key === config.modelName}>
                  {t(model.desc)}
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
          {isUsingApiKey(config) && (
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
          checked={config.alwaysPinWindow}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ alwaysPinWindow: checked })
          }}
        />
        {t('Always pin the floating window')}
      </label>
      <br />
    </>
  )
}