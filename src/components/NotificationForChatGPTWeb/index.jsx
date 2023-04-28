import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'
import { useConfig } from '../../hooks/use-config.mjs'

const NotificationForChatGPTWeb = (props) => {
  const { t } = useTranslation()
  const config = useConfig()
  const buttonStyle = {
    padding: '0 8px',
    border: '1px solid',
    borderRadius: '4px',
    cursor: 'pointer',
  }

  return (
    <div className="chatgptbox-notification">
      <div>{t('Please keep this tab open. You can now use the web mode of ChatGPTBox')}</div>
      <button
        style={buttonStyle}
        onClick={() => {
          Browser.runtime.sendMessage({
            type: 'ACTIVATE_URL',
            data: {
              tabId: config.chatgptJumpBackTabId,
            },
          })
        }}
      >
        {t('Go Back')}
      </button>
      <button
        style={buttonStyle}
        onClick={() => {
          props.container.remove()
        }}
      >
        X
      </button>
    </div>
  )
}

NotificationForChatGPTWeb.propTypes = {
  container: PropTypes.object.isRequired,
}

export default NotificationForChatGPTWeb
