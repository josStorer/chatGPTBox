import './styles.scss'
import { unmountComponentAtNode } from 'react-dom'
import { render } from 'preact'
import DecisionCard from '../components/DecisionCard'
import { config as siteConfig } from './site-adapters'
import { config as toolsConfig } from './selection-tools'
import { clearOldAccessToken, getUserConfig, setAccessToken } from '../config/index.mjs'
import {
  createElementAtPosition,
  getPossibleElementByQuerySelector,
  initSession,
  isSafari,
} from '../utils'
import FloatingToolbar from '../components/FloatingToolbar'
import Browser from 'webextension-polyfill'
import { getPreferredLanguage } from '../config/language.mjs'

/**
 * @param {SiteConfig} siteConfig
 * @param {UserConfig} userConfig
 */
async function mountComponent(siteConfig, userConfig) {
  const retry = 10
  for (let i = 1; i <= retry; i++) {
    const e =
      (siteConfig &&
        (getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery) ||
          getPossibleElementByQuerySelector(siteConfig.appendContainerQuery) ||
          getPossibleElementByQuerySelector(siteConfig.resultsContainerQuery))) ||
      getPossibleElementByQuerySelector([userConfig.prependQuery]) ||
      getPossibleElementByQuerySelector([userConfig.appendQuery])
    if (e) {
      console.log(`SiteAdapters Retry ${i}/${retry}: found`)
      console.log(e)
      break
    } else {
      console.log(`SiteAdapters Retry ${i}/${retry}: not found`)
      if (i === retry) return
      else await new Promise((r) => setTimeout(r, 500))
    }
  }
  document.querySelectorAll('.chatgptbox-container').forEach((e) => {
    unmountComponentAtNode(e)
    e.remove()
  })

  let question
  if (userConfig.inputQuery) question = await getInput([userConfig.inputQuery])
  if (!question && siteConfig) question = await getInput(siteConfig.inputQuery)

  document.querySelectorAll('.chatgptbox-container').forEach((e) => {
    unmountComponentAtNode(e)
    e.remove()
  })
  const container = document.createElement('div')
  container.className = 'chatgptbox-container'
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
  if (searchInput) {
    if (searchInput.value) return searchInput.value
    else if (searchInput.textContent) return searchInput.textContent
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
        toolbarContainer.className = 'chatgptbox-toolbar-container'
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

    document.querySelectorAll('.chatgptbox-toolbar-container').forEach((e) => e.remove())
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

async function prepareForSelectionToolsTouch() {
  document.addEventListener('touchend', (e) => {
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
        const position = {
          x: e.changedTouches[0].clientX + 15,
          y: e.changedTouches[0].clientY - 15,
        }
        toolbarContainer = createElementAtPosition(position.x, position.y)
        toolbarContainer.className = 'chatgptbox-toolbar-container'
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
  document.addEventListener('touchstart', (e) => {
    if (toolbarContainer && toolbarContainer.contains(e.target)) return

    document.querySelectorAll('.chatgptbox-toolbar-container').forEach((e) => e.remove())
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
        container.className = 'chatgptbox-toolbar-container-not-queryable'
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
        container.className = 'chatgptbox-toolbar-container-not-queryable'
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
  prepareForSelectionToolsTouch()
  prepareForStaticCard()
  prepareForRightClickMenu()
}

run()
