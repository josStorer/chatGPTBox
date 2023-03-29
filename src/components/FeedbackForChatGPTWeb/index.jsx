import PropTypes from 'prop-types'
import { memo, useCallback, useState } from 'react'
import { ThumbsupIcon, ThumbsdownIcon } from '@primer/octicons-react'
import Browser from 'webextension-polyfill'
import { useTranslation } from 'react-i18next'

const FeedbackForChatGPTWeb = (props) => {
  const { t } = useTranslation()
  const [action, setAction] = useState(null)

  const clickThumbsUp = useCallback(async () => {
    if (action) {
      return
    }
    setAction('thumbsUp')
    await Browser.runtime.sendMessage({
      type: 'FEEDBACK',
      data: {
        conversation_id: props.conversationId,
        message_id: props.messageId,
        rating: 'thumbsUp',
      },
    })
  }, [props, action])

  const clickThumbsDown = useCallback(async () => {
    if (action) {
      return
    }
    setAction('thumbsDown')
    await Browser.runtime.sendMessage({
      type: 'FEEDBACK',
      data: {
        conversation_id: props.conversationId,
        message_id: props.messageId,
        rating: 'thumbsDown',
        text: '',
        tags: [],
      },
    })
  }, [props, action])

  return (
    <div title={t('Feedback')} className="gpt-feedback">
      <span
        onClick={clickThumbsUp}
        className={action === 'thumbsUp' ? 'gpt-feedback-selected gpt-util-icon' : 'gpt-util-icon'}
      >
        <ThumbsupIcon size={14} />
      </span>
      <span
        onClick={clickThumbsDown}
        className={
          action === 'thumbsDown' ? 'gpt-feedback-selected gpt-util-icon' : 'gpt-util-icon'
        }
      >
        <ThumbsdownIcon size={14} />
      </span>
    </div>
  )
}

FeedbackForChatGPTWeb.propTypes = {
  messageId: PropTypes.string.isRequired,
  conversationId: PropTypes.string.isRequired,
}

export default memo(FeedbackForChatGPTWeb)
