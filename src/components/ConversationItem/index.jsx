import { useState } from 'react'
import FeedbackForChatGPTWeb from '../FeedbackForChatGPTWeb'
import { ChevronDownIcon, LinkExternalIcon, XCircleIcon } from '@primer/octicons-react'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import MarkdownRender from '../MarkdownRender/markdown.jsx'
import { useTranslation } from 'react-i18next'

export function ConversationItem({ type, content, session, done, port }) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  switch (type) {
    case 'question':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>{t('You')}:</p>
            <div className="gpt-util-group">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
    case 'answer':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p style="white-space: nowrap;">
              {session && session.aiName ? `${t(session.aiName)}:` : t('Loading...')}
            </p>
            <div className="gpt-util-group">
              {!done && (
                <button
                  type="button"
                  className="normal-button"
                  onClick={() => {
                    port.postMessage({ stop: true })
                  }}
                >
                  {t('Stop')}
                </button>
              )}
              {done && session && session.conversationId && (
                <FeedbackForChatGPTWeb
                  messageId={session.messageId}
                  conversationId={session.conversationId}
                />
              )}
              {session && session.conversationId && (
                <a
                  title={t('Continue on official website')}
                  href={'https://chat.openai.com/chat/' + session.conversationId}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="gpt-util-icon"
                  style="color: inherit;"
                >
                  <LinkExternalIcon size={14} />
                </a>
              )}
              {session && <CopyButton contentFn={() => content} size={14} />}
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
    case 'error':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>{t('Error')}:</p>
            <div className="gpt-util-group">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
  }
}

ConversationItem.propTypes = {
  type: PropTypes.oneOf(['question', 'answer', 'error']).isRequired,
  content: PropTypes.string.isRequired,
  session: PropTypes.object.isRequired,
  done: PropTypes.bool.isRequired,
  port: PropTypes.object.isRequired,
}

export default ConversationItem
