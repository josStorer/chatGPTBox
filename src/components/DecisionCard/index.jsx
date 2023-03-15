import { LightBulbIcon, SearchIcon } from '@primer/octicons-react'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import ConversationCard from '../ConversationCard'
import { defaultConfig, getUserConfig } from '../../config'
import Browser from 'webextension-polyfill'
import { getPossibleElementByQuerySelector, endsWithQuestionMark } from '../../utils'

function DecisionCard(props) {
  const [triggered, setTriggered] = useState(false)
  const [config, setConfig] = useState(defaultConfig)
  const [render, setRender] = useState(false)

  const question = props.question

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

  const updatePosition = () => {
    if (!render) return

    const container = props.container
    const siteConfig = props.siteConfig
    container.classList.remove('sidebar-free')

    if (config.appendQuery) {
      const appendContainer = getPossibleElementByQuerySelector([config.appendQuery])
      if (appendContainer) {
        appendContainer.appendChild(container)
        return
      }
    }

    if (config.prependQuery) {
      const prependContainer = getPossibleElementByQuerySelector([config.prependQuery])
      if (prependContainer) {
        prependContainer.prepend(container)
        return
      }
    }

    if (!siteConfig) return

    if (config.insertAtTop) {
      const resultsContainerQuery = getPossibleElementByQuerySelector(
        siteConfig.resultsContainerQuery,
      )
      if (resultsContainerQuery) resultsContainerQuery.prepend(container)
    } else {
      const sidebarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
      if (sidebarContainer) {
        sidebarContainer.prepend(container)
      } else {
        const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
        if (appendContainer) {
          container.classList.add('sidebar-free')
          appendContainer.appendChild(container)
        } else {
          const resultsContainerQuery = getPossibleElementByQuerySelector(
            siteConfig.resultsContainerQuery,
          )
          if (resultsContainerQuery) resultsContainerQuery.prepend(container)
        }
      }
    }
  }

  useEffect(() => updatePosition(), [config])

  return (
    render && (
      <div data-theme={config.themeMode}>
        {(() => {
          if (question)
            switch (config.triggerMode) {
              case 'always':
                return <ConversationCard session={props.session} question={question} />
              case 'manually':
                if (triggered) {
                  return <ConversationCard session={props.session} question={question} />
                }
                return (
                  <p
                    className="gpt-inner manual-btn icon-and-text"
                    onClick={() => setTriggered(true)}
                  >
                    <SearchIcon size="small" /> Ask ChatGPT
                  </p>
                )
              case 'questionMark':
                if (endsWithQuestionMark(question.trim())) {
                  return <ConversationCard session={props.session} question={question} />
                }
                if (triggered) {
                  return <ConversationCard session={props.session} question={question} />
                }
                return (
                  <p
                    className="gpt-inner manual-btn icon-and-text"
                    onClick={() => setTriggered(true)}
                  >
                    <SearchIcon size="small" /> Ask ChatGPT
                  </p>
                )
            }
          else
            return (
              <p className="gpt-inner icon-and-text">
                <LightBulbIcon size="small" /> No Input Found
              </p>
            )
        })()}
      </div>
    )
  )
}

DecisionCard.propTypes = {
  session: PropTypes.object.isRequired,
  question: PropTypes.string.isRequired,
  siteConfig: PropTypes.object.isRequired,
  container: PropTypes.object.isRequired,
}

export default DecisionCard
