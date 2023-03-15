import './styles.scss'
import { render } from 'preact'
import DecisionCard from '../components/DecisionCard'
import { config as siteConfig } from './site-adapters'
import { config as toolsConfig } from './selection-tools'
import { clearOldAccessToken, getUserConfig, setAccessToken, getPreferredLanguage } from '../config'
import {
  createElementAtPosition,
  getPossibleElementByQuerySelector,
  initSession,
  isSafari,
} from '../utils'
import FloatingToolbar from '../components/FloatingToolbar'
import Browser from 'webextension-polyfill'

/**
 * @param {SiteConfig} siteConfig
 * @param {UserConfig} userConfig
 */
async function mountComponent(siteConfig, userConfig) {
  if (
    !getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery) &&
    !getPossibleElementByQuerySelector(siteConfig.appendContainerQuery) &&
    !getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery) &&
    !getPossibleElementByQuerySelector([userConfig.prependQuery]) &&
    !getPossibleElementByQuerySelector([userConfig.appendQuery])
  )
    return

  document.querySelectorAll('.chat-gpt-container').forEach((e) => e.remove())

  let question
  if (userConfig.inputQuery) question = await getInput([userConfig.inputQuery])
  if (!question && siteConfig) question = await getInput(siteConfig.inputQuery)

  document.querySelectorAll('.chat-gpt-container').forEach((e) => e.remove())
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'
  render(
    <DecisionCard
      session={initSession()}
      question={question}
      siteConfig={siteConfig}
      container={container}
    />,
    container,
  )
}

/**
 * @param {string[]|function} inputQuery
 * @returns {Promise<string>}
 */
async function getInput(inputQuery) {
  if (typeof inputQuery === 'function') {
    const input = await inputQuery()
    if (input) return `Reply in ${await getPreferredLanguage()}.\n` + input
    return input
  }
  const searchInput = getPossibleElementByQuerySelector(inputQuery)
  if (searchInput && searchInput.value) {
    return searchInput.value
  }
}

async function prepareForSafari() {
  await clearOldAccessToken()

  if (location.hostname !== 'chat.openai.com' || location.pathname !== '/api/auth/session') return

  const response = document.querySelector('pre').textContent

  let data
  try {
    data = JSON.parse(response)
  } catch (error) {
    console.error('json error', error)
    return
  }
  if (data.accessToken) {
    await setAccessToken(data.accessToken)
  }
}

let toolbarContainer

async function prepareForSelectionTools() {
  document.addEventListener('mouseup', (e) => {
    if (toolbarContainer && toolbarContainer.contains(e.target)) return
    if (
      toolbarContainer &&
      window.getSelection()?.rangeCount > 0 &&
      toolbarContainer.contains(window.getSelection()?.getRangeAt(0).endContainer.parentElement)
    )
      return

    if (toolbarContainer) toolbarContainer.remove()
    setTimeout(() => {
      const selection = window.getSelection()?.toString()
      if (selection) {
        const position = { x: e.clientX + 15, y: e.clientY - 15 }
        toolbarContainer = createElementAtPosition(position.x, position.y)
        toolbarContainer.className = 'toolbar-container'
        render(
          <FloatingToolbar
            session={initSession()}
            selection={selection}
            position={position}
            container={toolbarContainer}
          />,
          toolbarContainer,
        )
      }
    })
  })
  document.addEventListener('mousedown', (e) => {
    if (toolbarContainer && toolbarContainer.contains(e.target)) return

    document.querySelectorAll('.toolbar-container').forEach((e) => e.remove())
  })
  document.addEventListener('keydown', (e) => {
    if (
      toolbarContainer &&
      !toolbarContainer.contains(e.target) &&
      (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA')
    ) {
      setTimeout(() => {
        if (!window.getSelection()?.toString()) toolbarContainer.remove()
      })
    }
  })
}

let menuX, menuY

async function prepareForRightClickMenu() {
  document.addEventListener('contextmenu', (e) => {
    menuX = e.clientX
    menuY = e.clientY
  })

  Browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'MENU') {
      const data = message.data
      if (data.itemId === 'new') {
        const position = { x: menuX, y: menuY }
        const container = createElementAtPosition(position.x, position.y)
        container.className = 'toolbar-container-not-queryable'
        render(
          <FloatingToolbar
            session={initSession()}
            selection=""
            position={position}
            container={container}
            triggered={true}
            closeable={true}
            onClose={() => container.remove()}
          />,
          container,
        )
      } else {
        const position = { x: menuX, y: menuY }
        const container = createElementAtPosition(position.x, position.y)
        container.className = 'toolbar-container-not-queryable'
        render(
          <FloatingToolbar
            session={initSession()}
            selection={data.selectionText}
            position={position}
            container={container}
            triggered={true}
            closeable={true}
            onClose={() => container.remove()}
            prompt={await toolsConfig[data.itemId].genPrompt(data.selectionText)}
          />,
          container,
        )
      }
    }
  })
}

async function prepareForStaticCard() {
  let siteRegex
  if (userConfig.userSiteRegexOnly) siteRegex = userConfig.siteRegex
  else
    siteRegex = new RegExp(
      (userConfig.siteRegex && userConfig.siteRegex + '|') + Object.keys(siteConfig).join('|'),
    )

  const matches = location.hostname.match(siteRegex)
  if (matches) {
    const siteName = matches[0]
    if (siteName in siteConfig) {
      const siteAction = siteConfig[siteName].action
      if (siteAction && siteAction.init) {
        await siteAction.init(location.hostname, userConfig, getInput, mountComponent)
      }
    }
    if (
      userConfig.siteAdapters.includes(siteName) &&
      !userConfig.activeSiteAdapters.includes(siteName)
    )
      return

    mountComponent(siteConfig[siteName], userConfig)
  }
}

let userConfig

async function run() {
  userConfig = await getUserConfig()
  if (isSafari()) await prepareForSafari()
  prepareForSelectionTools()
  prepareForStaticCard()
  prepareForRightClickMenu()
}

run()
