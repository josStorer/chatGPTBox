import '@picocss/pico'
import { useEffect, useState } from 'react'
import {
  setUserConfig,
  getUserConfig,
  TriggerMode,
  ThemeMode,
  defaultConfig,
  Models,
  isUsingApiKey,
  languageList,
} from '../config'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import './styles.scss'
import { MarkGithubIcon } from '@primer/octicons-react'
import Browser from 'webextension-polyfill'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../content-script/selection-tools'
import wechatpay from './donation/wechatpay.jpg'

function GeneralPart({ config, updateConfig }) {
  const [balance, setBalance] = useState(null)

  const getBalance = async () => {
    const response = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    })
    if (response.ok) setBalance((await response.json()).total_available.toFixed(2))
  }

  return (
    <>
      <label>
        <legend>Trigger Mode</legend>
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
                {desc}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>Theme Mode</legend>
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
                {desc}
              </option>
            )
          })}
        </select>
      </label>
      <label>
        <legend>API Mode</legend>
        <span style="display: flex; gap: 15px;">
          <select
            style={isUsingApiKey(config) ? 'width: 50%;' : undefined}
            required
            onChange={(e) => {
              const modelName = e.target.value
              updateConfig({ modelName: modelName })
            }}
          >
            {Object.entries(Models).map(([key, model]) => {
              return (
                <option value={key} key={key} selected={key === config.modelName}>
                  {model.desc}
                </option>
              )
            })}
          </select>
          {isUsingApiKey(config) && (
            <span style="width: 50%; display: flex; gap: 5px;">
              <input
                type="password"
                value={config.apiKey}
                placeholder="API Key"
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
                  <button type="button">Get</button>
                </a>
              ) : balance ? (
                <button type="button" onClick={getBalance}>
                  {balance}
                </button>
              ) : (
                <button type="button" onClick={getBalance}>
                  Balance
                </button>
              )}
            </span>
          )}
        </span>
      </label>
      <label>
        <legend>Preferred Language</legend>
        <span style="display: flex; gap: 15px;">
          <select
            required
            onChange={(e) => {
              const preferredLanguageKey = e.target.value
              updateConfig({ preferredLanguage: preferredLanguageKey })
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
        </span>
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
        Insert chatGPT at the top of search results
      </label>
    </>
  )
}

GeneralPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function AdvancedPart({ config, updateConfig }) {
  return (
    <>
      <label>
        Custom ChatGPT Web API Url
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
        Custom ChatGPT Web API Path
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
        Custom OpenAI API Url
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
        Custom Site Regex:
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
          checked={config.userSiteRegexOnly}
          onChange={(e) => {
            const checked = e.target.checked
            updateConfig({ userSiteRegexOnly: checked })
          }}
        />
        Only use Custom Site Regex for website matching, ignore built-in rules
      </label>
      <br />
      <label>
        Input Query:
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
        Append Query:
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
        Prepend Query:
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
          {toolsConfig[key].label}
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
  return (
    <div style="display:flex;flex-direction:column;align-items:center;">
      <a
        href="https://www.buymeacoffee.com/josStorer"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        <img
          align="center"
          alt="buymeacoffee"
          src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-1.svg"
        />
      </a>
      <hr />
      <>
        Wechat Pay
        <img alt="wechatpay" src={wechatpay} />
      </>
    </div>
  )
}

// eslint-disable-next-line react/prop-types
function Footer({ currentVersion, latestVersion }) {
  return (
    <div className="footer">
      <div>
        Current Version: {currentVersion}{' '}
        {currentVersion === latestVersion ? (
          '(Latest)'
        ) : (
          <>
            (Latest:{' '}
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
          <span>Help | Changelog </span>
          <MarkGithubIcon />
        </a>
      </div>
    </div>
  )
}

function Popup() {
  const [config, setConfig] = useState(defaultConfig)
  const [currentVersion, setCurrentVersion] = useState('')
  const [latestVersion, setLatestVersion] = useState('')

  const updateConfig = (value) => {
    setConfig({ ...config, ...value })
    setUserConfig(value)
  }

  useEffect(() => {
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
    document.documentElement.dataset.theme = config.themeMode
  }, [config.themeMode])

  return (
    <div className="container">
      <form>
        <Tabs selectedTabClassName="popup-tab--selected">
          <TabList>
            <Tab className="popup-tab">General</Tab>
            <Tab className="popup-tab">SelectionTools</Tab>
            <Tab className="popup-tab">SiteAdapters</Tab>
            <Tab className="popup-tab">Advanced</Tab>
            <Tab className="popup-tab">Donation</Tab>
          </TabList>

          <TabPanel>
            <GeneralPart config={config} updateConfig={updateConfig} />
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
          <TabPanel>
            <Donation />
          </TabPanel>
        </Tabs>
      </form>
      <hr />
      <Footer currentVersion={currentVersion} latestVersion={latestVersion} />
    </div>
  )
}

export default Popup
