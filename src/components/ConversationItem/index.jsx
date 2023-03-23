import { useState } from 'react'
import FeedbackForChatGPTWeb from '../FeedbackForChatGPTWeb'
import { ChevronDownIcon, ChevronUpIcon, LinkExternalIcon } from '@primer/octicons-react'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import MarkdownRender from '../MarkdownRender/markdown.jsx'

export function ConversationItem({ type, content, session, done, port }) {
  const [collapsed, setCollapsed] = useState(false)

  switch (type) {
    case 'question':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>You:</p>
            <div className="gpt-header-icons">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <ChevronUpIcon
                  title="Collapse"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                  size={14}
                />
              ) : (
                <ChevronDownIcon
                  title="Expand"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                  size={14}
                />
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
            <div className="gpt-header-items">
              {!done && (
                <button
                  type="button"
                  className="normal-button"
                  onClick={() => {
                    port.postMessage({ stop: true })
                  }}
                >
                  Stop
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
                <ChevronUpIcon
                  title="Collapse"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                  size={14}
                />
              ) : (
                <ChevronDownIcon
                  title="Expand"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                  size={14}
                />
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
            <div className="gpt-header-items">
              <CopyButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <ChevronUpIcon
                  title="Collapse"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                  size={14}
                />
              ) : (
                <ChevronDownIcon
                  title="Expand"
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                  size={14}
                />
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
