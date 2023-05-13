import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { isEdge, isFirefox, isMobile, isSafari, openUrl } from '../../utils/index.mjs'
import Browser from 'webextension-polyfill'
import PropTypes from 'prop-types'

FeaturePages.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function FeaturePages({ config, updateConfig }) {
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
          Browser.runtime.sendMessage({
            type: 'OPEN_URL',
            data: {
              url: Browser.runtime.getURL('IndependentPanel.html'),
            },
          })
        }}
      >
        {t('Open Conversation Page')}
      </button>
      {!isMobile() && (
        <button
          type="button"
          onClick={() => {
            Browser.runtime.sendMessage({
              type: 'OPEN_CHAT_WINDOW',
              data: {},
            })
          }}
        >
          {t('Open Conversation Window')}
        </button>
      )}
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
      {!isMobile() && (
        <label>
          <input
            type="checkbox"
            checked={config.alwaysCreateNewConversationWindow}
            onChange={(e) => {
              const checked = e.target.checked
              updateConfig({ alwaysCreateNewConversationWindow: checked })
            }}
          />
          {t('Always Create New Conversation Window')}
        </label>
      )}
    </div>
  )
}
