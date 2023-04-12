import '@picocss/pico'
import { useEffect, useState } from 'react'
import {
  defaultConfig,
  getPreferredLanguageKey,
  getUserConfig,
  isUsingApiKey,
  isUsingAzureOpenAi,
  isUsingCustomModel,
  isUsingGithubThirdPartyApi,
  isUsingMultiModeModel,
  ModelMode,
  Models,
  setUserConfig,
  ThemeMode,
  TriggerMode,
} from '../config/index.mjs'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import './styles.scss'
import { MarkGithubIcon } from '@primer/octicons-react'
import Browser from 'webextension-polyfill'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../content-script/selection-tools'
import wechatpay from './donation/wechatpay.jpg'
import bugmeacoffee from './donation/bugmeacoffee.png'
import { useWindowTheme } from '../hooks/use-window-theme.mjs'
import { languageList } from '../config/language.mjs'
import { isEdge, isFirefox, isMobile, isSafari, openUrl } from '../utils/index.mjs'
import { useTranslation } from 'react-i18next'

function GeneralPart({ config, updateConfig }) {
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
              isUsingAzureOpenAi(config)
                ? 'width: 50%;'
                : undefined
            }
            required
            onChange={(e) => {
              const modelName = e.target.value
              updateConfig({ modelName: modelName })
            }}
          >
            {Object.entries(Models).map(([key, model]) => {
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
                  .catch(() => ({}))
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

GeneralPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function FeaturePages() {
  const { t } = useTranslation()
  const [backgroundPermission, setBackgroundPermission] = useState(false)

  if (!isMobile() && !isFirefox() && !isSafari())
    Browser.permissions.contains({ permissions: ['background'] }).then((result) => {
      setBackgroundPermission(result)
    })

  return (
    <div style="display:flex;flex-direction:column;align-items:left;">
      {!isMobile() && !isFirefox() && !isSafari() && (
        <button
          type="button"
          onClick={() => {
            if (isEdge()) openUrl('edge://extensions/shortcuts')
            else openUrl('chrome://extensions/shortcuts')
          }}
        >
          {t('Keyboard Shortcuts')}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          openUrl(Browser.runtime.getURL('IndependentPanel.html'))
        }}
      >
        {t('Open Conversation Page')}
      </button>
      <button
        type="button"
        onClick={() => {
          Browser.windows.create({
            url: Browser.runtime.getURL('IndependentPanel.html'),
            type: 'popup',
            width: 500,
            height: 650,
          })
        }}
      >
        {t('Open Conversation Window')}
      </button>
      {!isMobile() && !isFirefox() && !isSafari() && (
        <label>
          <input
            type="checkbox"
            checked={backgroundPermission}
            onChange={(e) => {
              const checked = e.target.checked
              if (checked)
                Browser.permissions.request({ permissions: ['background'] }).then((result) => {
                  setBackgroundPermission(result)
                })
              else
                Browser.permissions.remove({ permissions: ['background'] }).then((result) => {
                  setBackgroundPermission(result)
                })
            }}
          />
          {t('Keep Conversation Window in Background')}
        </label>
      )}
    </div>
  )
}

function AdvancedPart({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      <label>
        {t('Max Response Token Length')}
        <input
          type="number"
          min="100"
          max="40000"
          step="100"
          value={config.maxResponseTokenLength}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            updateConfig({ maxResponseTokenLength: value })
          }}
        />
      </label>
      <label>
        {t('Custom ChatGPT Web API Url')}
        <input
          type="text"
          value={config.customChatGptWebApiUrl}
          onChange={(e) => {
            const value = e.target.value
            updateConfig({ customChatGptWebApiUrl: value })
          }}
        />
      </label>
      <label>
        {t('Custom ChatGPT Web API Path')}
        <input
          type="text"
          value={config.customChatGptWebApiPath}
          onChange={(e) => {
            const value = e.target.value
            updateConfig({ customChatGptWebApiPath: value })
          }}
        />
      </label>
      <label>
        {t('Custom OpenAI API Url')}
        <input
          type="text"
          value={config.customOpenAiApiUrl}
          onChange={(e) => {
            const value = e.target.value
            updateConfig({ customOpenAiApiUrl: value })
          }}
        />
      </label>
      <label>
        {t('Custom Site Regex')}
        <input
          type="text"
          value={config.siteRegex}
          onChange={(e) => {
            const regex = e.target.value
            updateConfig({ siteRegex: regex })
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={config.useSiteRegexOnly}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ useSiteRegexOnly: checked })
          }}
        />
        {t('Exclusively use Custom Site Regex for website matching, ignoring built-in rules')}
      </label>
      <br />
      <label>
        {t('Input Query')}
        <input
          type="text"
          value={config.inputQuery}
          onChange={(e) => {
            const query = e.target.value
            updateConfig({ inputQuery: query })
          }}
        />
      </label>
      <label>
        {t('Append Query')}
        <input
          type="text"
          value={config.appendQuery}
          onChange={(e) => {
            const query = e.target.value
            updateConfig({ appendQuery: query })
          }}
        />
      </label>
      <label>
        {t('Prepend Query')}
        <input
          type="text"
          value={config.prependQuery}
          onChange={(e) => {
            const query = e.target.value
            updateConfig({ prependQuery: query })
          }}
        />
      </label>
    </>
  )
}

AdvancedPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function SelectionTools({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      {config.selectionTools.map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={config.activeSelectionTools.includes(key)}
            onChange={(e) => {
              const checked = e.target.checked
              const activeSelectionTools = config.activeSelectionTools.filter((i) => i !== key)
              if (checked) activeSelectionTools.push(key)
              updateConfig({ activeSelectionTools })
            }}
          />
          {t(toolsConfig[key].label)}
        </label>
      ))}
    </>
  )
}

SelectionTools.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function SiteAdapters({ config, updateConfig }) {
  return (
    <>
      {config.siteAdapters.map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={config.activeSiteAdapters.includes(key)}
            onChange={(e) => {
              const checked = e.target.checked
              const activeSiteAdapters = config.activeSiteAdapters.filter((i) => i !== key)
              if (checked) activeSiteAdapters.push(key)
              updateConfig({ activeSiteAdapters })
            }}
          />
          {key}
        </label>
      ))}
    </>
  )
}

SiteAdapters.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function Donation() {
  const { t } = useTranslation()

  return (
    <div style="display:flex;flex-direction:column;align-items:center;">
      <a
        href="https://www.buymeacoffee.com/josStorer"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        <img alt="buymeacoffee" src={bugmeacoffee} />
      </a>
      <br />
      <>
        {t('Wechat Pay')}
        <img alt="wechatpay" src={wechatpay} />
      </>
    </div>
  )
}

// eslint-disable-next-line react/prop-types
function Footer({ currentVersion, latestVersion }) {
  const { t } = useTranslation()

  return (
    <div className="footer">
      <div>
        {`${t('Current Version')}: ${currentVersion} `}
        {currentVersion === latestVersion ? (
          `(${t('Latest')})`
        ) : (
          <>
            ({`${t('Latest')}: `}
            <a
              href={'https://github.com/josStorer/chatGPTBox/releases/tag/v' + latestVersion}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              {latestVersion}
            </a>
            )
          </>
        )}
      </div>
      <div>
        <a
          href="https://github.com/josStorer/chatGPTBox"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          <span>{t('Help | Changelog ')}</span>
          <MarkGithubIcon />
        </a>
      </div>
    </div>
  )
}

function Popup() {
  const { t, i18n } = useTranslation()
  const [config, setConfig] = useState(defaultConfig)
  const [currentVersion, setCurrentVersion] = useState('')
  const [latestVersion, setLatestVersion] = useState('')
  const theme = useWindowTheme()

  const updateConfig = (value) => {
    setConfig({ ...config, ...value })
    setUserConfig(value)
  }

  useEffect(() => {
    getPreferredLanguageKey().then((lang) => {
      i18n.changeLanguage(lang)
    })
    getUserConfig().then((config) => {
      setConfig(config)
      setCurrentVersion(Browser.runtime.getManifest().version.replace('v', ''))
      fetch('https://api.github.com/repos/josstorer/chatGPTBox/releases/latest').then((response) =>
        response.json().then((data) => {
          setLatestVersion(data.tag_name.replace('v', ''))
        }),
      )
    })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = config.themeMode === 'auto' ? theme : config.themeMode
  }, [config.themeMode, theme])

  const search = new URLSearchParams(window.location.search)
  const popup = !isMobile() && search.get('popup') // manifest v2

  return (
    <div className={popup === 'true' ? 'container-popup-mode' : 'container-page-mode'}>
      <form style="width:100%;">
        <Tabs selectedTabClassName="popup-tab--selected">
          <TabList>
            <Tab className="popup-tab">{t('General')}</Tab>
            <Tab className="popup-tab">{t('Feature Pages')}</Tab>
            <Tab className="popup-tab">{t('Selection Tools')}</Tab>
            <Tab className="popup-tab">{t('Sites')}</Tab>
            <Tab className="popup-tab">{t('Advanced')}</Tab>
            {isSafari() ? null : <Tab className="popup-tab">{t('Donate')}</Tab>}
          </TabList>

          <TabPanel>
            <GeneralPart config={config} updateConfig={updateConfig} />
          </TabPanel>
          <TabPanel>
            <FeaturePages />
          </TabPanel>
          <TabPanel>
            <SelectionTools config={config} updateConfig={updateConfig} />
          </TabPanel>
          <TabPanel>
            <SiteAdapters config={config} updateConfig={updateConfig} />
          </TabPanel>
          <TabPanel>
            <AdvancedPart config={config} updateConfig={updateConfig} />
          </TabPanel>
          {isSafari() ? null : (
            <TabPanel>
              <Donation />
            </TabPanel>
          )}
        </Tabs>
      </form>
      <br />
      <Footer currentVersion={currentVersion} latestVersion={latestVersion} />
    </div>
  )
}

export default Popup
