import { useState } from 'react'
import FeedbackForChatGPTWeb from '../FeedbackForChatGPTWeb'
import { ChevronDownIcon, LinkExternalIcon, XCircleIcon } from '@primer/octicons-react'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import MarkdownRender from '../MarkdownRender/markdown.jsx'

export function ConversationItem({ type, content, session, done }) {
  const [collapsed, setCollapsed] = useState(false)

  switch (type) {
    case 'question':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>You:</p>
            <div style="display: flex; gap: 15px;">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <span title="Collapse" className="gpt-util-icon" onClick={() => setCollapsed(true)}>
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span title="Expand" className="gpt-util-icon" onClick={() => setCollapsed(false)}>
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
            <p>{session ? 'ChatGPT:' : 'Loading...'}</p>
            <div style="display: flex; gap: 15px;">
              {done && session && session.conversationId && (
                <FeedbackForChatGPTWeb
                  messageId={session.messageId}
                  conversationId={session.conversationId}
                />
              )}
              {session && session.conversationId && (
                <a
                  title="Continue on official website"
                  href={'https://chat.openai.com/chat/' + session.conversationId}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  style="color: inherit;"
                >
                  <LinkExternalIcon size={14} />
                </a>
              )}
              {session && <CopyButton contentFn={() => content} size={14} />}
              {!collapsed ? (
                <span title="Collapse" className="gpt-util-icon" onClick={() => setCollapsed(true)}>
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span title="Expand" className="gpt-util-icon" onClick={() => setCollapsed(false)}>
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
            <p>Error:</p>
            <div style="display: flex; gap: 15px;">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <span title="Collapse" className="gpt-util-icon" onClick={() => setCollapsed(true)}>
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span title="Expand" className="gpt-util-icon" onClick={() => setCollapsed(false)}>
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
}

export default ConversationItem
