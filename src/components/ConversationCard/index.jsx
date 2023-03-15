import { memo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'
import InputBox from '../InputBox'
import ConversationItem from '../ConversationItem'
import { createElementAtPosition, initSession, isSafari } from '../../utils'
import { DownloadIcon } from '@primer/octicons-react'
import { WindowDesktop, XLg } from 'react-bootstrap-icons'
import FileSaver from 'file-saver'
import { render } from 'preact'
import FloatingToolbar from '../FloatingToolbar'

const logo = Browser.runtime.getURL('logo.png')

class ConversationItemData extends Object {
  /**
   * @param {'question'|'answer'|'error'} type
   * @param {string} content
   * @param {object} session
   * @param {bool} done
   */
  constructor(type, content, session = null, done = false) {
    super()
    this.type = type
    this.content = content
    this.session = session
    this.done = done
  }
}

function ConversationCard(props) {
  const [isReady, setIsReady] = useState(!props.question)
  const [port, setPort] = useState(() => Browser.runtime.connect())
  const [session, setSession] = useState(props.session)
  /**
   * @type {[ConversationItemData[], (conversationItemData: ConversationItemData[]) => void]}
   */
  const [conversationItemData, setConversationItemData] = useState(
    (() => {
      if (props.session.conversationRecords.length === 0)
        if (props.question)
          return [
            new ConversationItemData(
              'answer',
              '<p class="gpt-loading">Waiting for response...</p>',
            ),
          ]
        else return []
      else {
        const ret = []
        for (const record of props.session.conversationRecords) {
          ret.push(
            new ConversationItemData('question', record.question + '\n<hr/>', props.session, true),
          )
          ret.push(
            new ConversationItemData('answer', record.answer + '\n<hr/>', props.session, true),
          )
        }
        return ret
      }
    })(),
  )

  useEffect(() => {
    if (props.onUpdate) props.onUpdate()
  })

  useEffect(() => {
    // when the page is responsive, session may accumulate redundant data and needs to be cleared after remounting and before making a new request
    if (props.question) {
      const newSession = initSession({ question: props.question })
      setSession(newSession)
      port.postMessage({ session: newSession })
    }
  }, [props.question]) // usually only triggered once

  /**
   * @param {string} value
   * @param {boolean} appended
   * @param {'question'|'answer'|'error'} newType
   * @param {boolean} done
   */
  const UpdateAnswer = (value, appended, newType, done = false) => {
    setConversationItemData((old) => {
      const copy = [...old]
      const index = copy.findLastIndex((v) => v.type === 'answer')
      if (index === -1) return copy
      copy[index] = new ConversationItemData(
        newType,
        appended ? copy[index].content + value : value,
      )
      copy[index].session = { ...session }
      copy[index].done = done
      return copy
    })
  }

  useEffect(() => {
    const listener = () => {
      setPort(Browser.runtime.connect())
    }
    port.onDisconnect.addListener(listener)
    return () => {
      port.onDisconnect.removeListener(listener)
    }
  }, [port])
  useEffect(() => {
    const listener = (msg) => {
      if (msg.answer) {
        UpdateAnswer(msg.answer, false, 'answer')
      }
      if (msg.session) {
        setSession(msg.session)
      }
      if (msg.done) {
        UpdateAnswer('\n<hr/>', true, 'answer', true)
        setIsReady(true)
      }
      if (msg.error) {
        switch (msg.error) {
          case 'UNAUTHORIZED':
            UpdateAnswer(
              `UNAUTHORIZED<br>Please login at https://chat.openai.com first${
                isSafari() ? '<br>Then open https://chat.openai.com/api/auth/session' : ''
              }<br>And refresh this page or type you question again` +
                `<br><br>Consider creating an api key at https://platform.openai.com/account/api-keys<hr>`,
              false,
              'error',
            )
            break
          case 'CLOUDFLARE':
            UpdateAnswer(
              `OpenAI Security Check Required<br>Please open ${
                isSafari() ? 'https://chat.openai.com/api/auth/session' : 'https://chat.openai.com'
              }<br>And refresh this page or type you question again` +
                `<br><br>Consider creating an api key at https://platform.openai.com/account/api-keys<hr>`,
              false,
              'error',
            )
            break
          default:
            setConversationItemData([
              ...conversationItemData,
              new ConversationItemData('error', msg.error + '\n<hr/>'),
            ])
            break
        }
        setIsReady(true)
      }
    }
    port.onMessage.addListener(listener)
    return () => {
      port.onMessage.removeListener(listener)
    }
  }, [conversationItemData])

  return (
    <div className="gpt-inner">
      <div className="gpt-header">
        {!props.closeable ? (
          <img src={logo} width="20" height="20" style="margin:5px 15px 0px;user-select:none;" />
        ) : (
          <XLg
            className="gpt-util-icon"
            style="margin:5px 15px 0px;"
            title="Close the Window"
            size={16}
            onClick={() => {
              if (props.onClose) props.onClose()
            }}
          />
        )}
        {props.draggable ? (
          <div className="dragbar" />
        ) : (
          <WindowDesktop
            className="gpt-util-icon"
            title="Float the Window"
            size={16}
            onClick={() => {
              const position = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 }
              const toolbarContainer = createElementAtPosition(position.x, position.y)
              toolbarContainer.className = 'toolbar-container-not-queryable'
              render(
                <FloatingToolbar
                  session={session}
                  selection=""
                  position={position}
                  container={toolbarContainer}
                  closeable={true}
                  triggered={true}
                  onClose={() => toolbarContainer.remove()}
                />,
                toolbarContainer,
              )
            }}
          />
        )}
        <span
          title="Save Conversation"
          className="gpt-util-icon"
          style="margin:15px 15px 10px;"
          onClick={() => {
            let output = ''
            session.conversationRecords.forEach((data) => {
              output += `Question:\n\n${data.question}\n\nAnswer:\n\n${data.answer}\n\n<hr/>\n\n`
            })
            const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
            FileSaver.saveAs(blob, 'conversation.md')
          }}
        >
          <DownloadIcon size={16} />
        </span>
      </div>
      <hr />
      <div className="markdown-body">
        {conversationItemData.map((data, idx) => (
          <ConversationItem
            content={data.content}
            key={idx}
            type={data.type}
            session={data.session}
            done={data.done}
          />
        ))}
      </div>
      <InputBox
        enabled={isReady}
        onSubmit={(question) => {
          const newQuestion = new ConversationItemData('question', question + '\n<hr/>')
          const newAnswer = new ConversationItemData(
            'answer',
            '<p class="gpt-loading">Waiting for response...</p>',
          )
          setConversationItemData([...conversationItemData, newQuestion, newAnswer])
          setIsReady(false)

          const newSession = { ...session, question }
          setSession(newSession)
          try {
            port.postMessage({ session: newSession })
          } catch (e) {
            UpdateAnswer(e, false, 'error')
          }
        }}
      />
    </div>
  )
}

ConversationCard.propTypes = {
  session: PropTypes.object.isRequired,
  question: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
  draggable: PropTypes.bool,
  closeable: PropTypes.bool,
  onClose: PropTypes.func,
}

export default memo(ConversationCard)
