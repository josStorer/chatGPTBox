import Browser from 'webextension-polyfill'
import { cloneElement, useEffect, useState } from 'react'
import ConversationCard from '../ConversationCard'
import PropTypes from 'prop-types'
import { defaultConfig, getUserConfig } from '../../config.mjs'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { setElementPositionInViewport } from '../../utils'
import Draggable from 'react-draggable'

const logo = Browser.runtime.getURL('logo.png')

function FloatingToolbar(props) {
  const [prompt, setPrompt] = useState(props.prompt)
  const [triggered, setTriggered] = useState(props.triggered)
  const [config, setConfig] = useState(defaultConfig)
  const [render, setRender] = useState(false)
  const [position, setPosition] = useState(props.position)
  const [virtualPosition, setVirtualPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    getUserConfig()
      .then(setConfig)
      .then(() => setRender(true))
  }, [])

  useEffect(() => {
    const listener = (changes) => {
      const changedItems = Object.keys(changes)
      let newConfig = {}
      for (const key of changedItems) {
        newConfig[key] = changes[key].newValue
      }
      setConfig({ ...config, ...newConfig })
    }
    Browser.storage.local.onChanged.addListener(listener)
    return () => {
      Browser.storage.local.onChanged.removeListener(listener)
    }
  }, [config])

  if (!render) return <div />

  if (triggered) {
    const updatePosition = () => {
      const newPosition = setElementPositionInViewport(props.container, position.x, position.y)
      if (position.x !== newPosition.x || position.y !== newPosition.y) setPosition(newPosition) // clear extra virtual position offset
    }

    const dragEvent = {
      onDrag: (e, ui) => {
        setVirtualPosition({ x: virtualPosition.x + ui.deltaX, y: virtualPosition.y + ui.deltaY })
      },
      onStop: () => {
        setPosition({ x: position.x + virtualPosition.x, y: position.y + virtualPosition.y })
        setVirtualPosition({ x: 0, y: 0 })
      },
    }

    if (virtualPosition.x === 0 && virtualPosition.y === 0) {
      updatePosition() // avoid jitter
    }

    return (
      <div data-theme={config.themeMode}>
        <Draggable
          handle=".dragbar"
          onDrag={dragEvent.onDrag}
          onStop={dragEvent.onStop}
          position={virtualPosition}
        >
          <div className="gpt-selection-window">
            <div className="chat-gpt-container">
              <ConversationCard
                session={props.session}
                question={prompt}
                draggable={true}
                closeable={props.closeable}
                onClose={props.onClose}
                onUpdate={() => {
                  updatePosition()
                }}
              />
            </div>
          </div>
        </Draggable>
      </div>
    )
  } else {
    if (config.activeSelectionTools.length === 0) return <div />

    const tools = []

    for (const key in toolsConfig) {
      if (config.activeSelectionTools.includes(key)) {
        const toolConfig = toolsConfig[key]
        tools.push(
          cloneElement(toolConfig.icon, {
            size: 20,
            className: 'gpt-selection-toolbar-button',
            title: toolConfig.label,
            onClick: async () => {
              setPrompt(await toolConfig.genPrompt(props.selection))
              setTriggered(true)
            },
          }),
        )
      }
    }

    return (
      <div data-theme={config.themeMode}>
        <div className="gpt-selection-toolbar">
          <img src={logo} width="24" height="24" style="user-select:none;" />
          {tools}
        </div>
      </div>
    )
  }
}

FloatingToolbar.propTypes = {
  session: PropTypes.object.isRequired,
  selection: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
  container: PropTypes.object.isRequired,
  triggered: PropTypes.bool,
  closeable: PropTypes.bool,
  onClose: PropTypes.func,
  prompt: PropTypes.string,
}

export default FloatingToolbar
