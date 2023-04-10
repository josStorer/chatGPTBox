import { memo, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Browser from 'webextension-polyfill'
import InputBox from '../InputBox'
import ConversationItem from '../ConversationItem'
import { createElementAtPosition, initSession, isSafari } from '../../utils'
import { DownloadIcon, LinkExternalIcon, ArchiveIcon } from '@primer/octicons-react'
import { WindowDesktop, XLg, Pin } from 'react-bootstrap-icons'
import FileSaver from 'file-saver'
import { render } from 'preact'
import FloatingToolbar from '../FloatingToolbar'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { Models } from '../../config/index.mjs'
import { useTranslation } from 'react-i18next'
import DeleteButton from '../DeleteButton'
import { useConfig } from '../../hooks/use-config.mjs'
import { createSession } from '../../config/localSession.mjs'

const logo = Browser.runtime.getURL('logo.png')

class ConversationItemData extends Object {
  /**
   * @param {'question'|'answer'|'error'} type
   * @param {string} content
   * @param {bool} done
   */
  constructor(type, content, done = false) {
    super()
    this.type = type
    this.content = content
    this.done = done
  }
}

function ConversationCard(props) {
  const { t } = useTranslation()
  const [isReady, setIsReady] = useState(!props.question)
  const [port, setPort] = useState(() => Browser.runtime.connect())
  const [session, setSession] = useState(props.session)
  const windowSize = useClampWindowSize([750, 1500], [250, 1100])
  const bodyRef = useRef(null)
  /**
   * @type {[ConversationItemData[], (conversationItemData: ConversationItemData[]) => void]}
   */
  const [conversationItemData, setConversationItemData] = useState(
    (() => {
      if (session.conversationRecords.length === 0)
        if (props.question)
          return [
            new ConversationItemData(
              'answer',
              `<p class="gpt-loading">${t(`Waiting for response...`)}</p>`,
            ),
          ]
        else return []
      else {
        const ret = []
        for (const record of session.conversationRecords) {
          ret.push(new ConversationItemData('question', record.question + '\n<hr/>', true))
          ret.push(new ConversationItemData('answer', record.answer + '\n<hr/>', true))
        }
        return ret
      }
    })(),
  )
  const config = useConfig()

  useEffect(() => {
    if (props.onUpdate) props.onUpdate(port, session, conversationItemData)
  }, [session, conversationItemData])

  useEffect(() => {
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [session])

  useEffect(() => {
    if (config.lockWhenAnswer) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [conversationItemData])

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
  const updateAnswer = (value, appended, newType, done = false) => {
    setConversationItemData((old) => {
      const copy = [...old]
      const index = copy.findLastIndex((v) => v.type === 'answer' || v.type === 'error')
      if (index === -1) return copy
      copy[index] = new ConversationItemData(
        newType,
        appended ? copy[index].content + value : value,
      )
      copy[index].done = done
      return copy
    })
  }

  useEffect(() => {
    const listener = () => {
      setPort(Browser.runtime.connect())
      setIsReady(true)
    }
    port.onDisconnect.addListener(listener)
    return () => {
      port.onDisconnect.removeListener(listener)
    }
  }, [port])
  useEffect(() => {
    const listener = (msg) => {
      if (msg.answer) {
        updateAnswer(msg.answer, false, 'answer')
      }
      if (msg.session) {
        if (msg.done) msg.session = { ...msg.session, isRetry: false }
        setSession(msg.session)
      }
      if (msg.done) {
        updateAnswer('\n<hr/>', true, 'answer', true)
        setIsReady(true)
      }
      if (msg.error) {
        switch (msg.error) {
          case 'UNAUTHORIZED':
            updateAnswer(
              `${t('UNAUTHORIZED')}<br>${t('Please login at https://chat.openai.com first')}${
                isSafari() ? `<br>${t('Then open https://chat.openai.com/api/auth/session')}` : ''
              }<br>${t('And refresh this page or type you question again')}` +
                `<br><br>${t(
                  'Consider creating an api key at https://platform.openai.com/account/api-keys',
                )}\n<hr/>`,
              false,
              'error',
            )
            break
          case 'CLOUDFLARE':
            updateAnswer(
              `${t('OpenAI Security Check Required')}<br>${
                isSafari()
                  ? t('Please open https://chat.openai.com/api/auth/session')
                  : t('Please open https://chat.openai.com')
              }<br>${t('And refresh this page or type you question again')}` +
                `<br><br>${t(
                  'Consider creating an api key at https://platform.openai.com/account/api-keys',
                )}\n<hr/>`,
              false,
              'error',
            )
            break
          default:
            if (
              conversationItemData[conversationItemData.length - 1].content.includes('gpt-loading')
            )
              updateAnswer(msg.error + '\n<hr/>', false, 'error')
            else
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

  const getRetryFn = (session) => () => {
    updateAnswer(`<p class="gpt-loading">${t('Waiting for response...')}</p>`, false, 'answer')
    setIsReady(false)

    const newSession = { ...session, isRetry: true }
    setSession(newSession)
    try {
      port.postMessage({ stop: true })
      port.postMessage({ session: newSession })
    } catch (e) {
      updateAnswer(e, false, 'error')
    }
  }

  return (
    <div className="gpt-inner">
      <div className="gpt-header" style="margin: 15px;">
        <span className="gpt-util-group">
          {props.closeable ? (
            <XLg
              className="gpt-util-icon"
              title={t('Close the Window')}
              size={16}
              onClick={() => {
                port.disconnect()
                if (props.onClose) props.onClose()
              }}
            />
          ) : props.dockable ? (
            <Pin
              className="gpt-util-icon"
              title={t('Pin the Window')}
              size={16}
              onClick={() => {
                if (props.onDock) props.onDock()
              }}
            />
          ) : (
            <img src={logo} style="user-select:none;width:20px;height:20px;" />
          )}
          <select
            style={props.notClampSize ? {} : { width: windowSize[0] * 0.05 + 'px' }}
            className="normal-button"
            required
            onChange={(e) => {
              const modelName = e.target.value
              const newSession = { ...session, modelName, aiName: Models[modelName].desc }
              if (config.autoRegenAfterSwitchModel) getRetryFn(newSession)()
              else setSession(newSession)
            }}
          >
            {Object.entries(Models).map(([key, model]) => {
              return (
                <option value={key} key={key} selected={key === session.modelName}>
                  {t(model.desc)}
                </option>
              )
            })}
          </select>
        </span>
        {props.draggable ? (
          <div className="dragbar" />
        ) : (
          <WindowDesktop
            className="gpt-util-icon"
            title={t('Float the Window')}
            size={16}
            onClick={() => {
              const position = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 }
              const toolbarContainer = createElementAtPosition(position.x, position.y)
              toolbarContainer.className = 'chatgptbox-toolbar-container-not-queryable'
              render(
                <FloatingToolbar
                  session={session}
                  selection=""
                  container={toolbarContainer}
                  closeable={true}
                  triggered={true}
                />,
                toolbarContainer,
              )
            }}
          />
        )}
        <span className="gpt-util-group">
          {session && session.conversationId && (
            <a
              title={t('Continue on official website')}
              href={'https://chat.openai.com/chat/' + session.conversationId}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="gpt-util-icon"
              style="color: inherit;"
            >
              <LinkExternalIcon size={16} />
            </a>
          )}
          <DeleteButton
            size={16}
            text={t('Clear Conversation')}
            onConfirm={() => {
              port.postMessage({ stop: true })
              Browser.runtime.sendMessage({
                type: 'DELETE_CONVERSATION',
                data: {
                  conversationId: session.conversationId,
                },
              })
              setConversationItemData([])
              const newSession = initSession({
                ...session,
                question: null,
                conversationRecords: [],
              })
              newSession.sessionId = session.sessionId
              setSession(newSession)
            }}
          />
          {!props.pageMode && (
            <span
              title={t('Store to Independent Conversation Page')}
              className="gpt-util-icon"
              onClick={() => {
                const newSession = {
                  ...session,
                  sessionName: new Date().toLocaleString(),
                  autoClean: false,
                  sessionId: crypto.randomUUID(),
                }
                setSession(newSession)
                createSession(newSession).then(() =>
                  Browser.runtime.sendMessage({
                    type: 'OPEN_URL',
                    data: {
                      url: Browser.runtime.getURL('IndependentPanel.html'),
                    },
                  }),
                )
              }}
            >
              <ArchiveIcon size={16} />
            </span>
          )}
          <span
            title={t('Save Conversation')}
            className="gpt-util-icon"
            onClick={() => {
              let output = ''
              session.conversationRecords.forEach((data) => {
                output += `${t('Question')}:\n\n${data.question}\n\n${t('Answer')}:\n\n${
                  data.answer
                }\n\n<hr/>\n\n`
              })
              const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
              FileSaver.saveAs(blob, 'conversation.md')
            }}
          >
            <DownloadIcon size={16} />
          </span>
        </span>
      </div>
      <hr />
      <div
        ref={bodyRef}
        className="markdown-body"
        style={
          props.notClampSize
            ? { flexGrow: 1 }
            : { maxHeight: windowSize[1] * 0.55 + 'px', resize: 'vertical' }
        }
      >
        {conversationItemData.map((data, idx) => (
          <ConversationItem
            content={data.content}
            key={idx}
            type={data.type}
            session={session}
            done={data.done}
            port={port}
            onRetry={idx === conversationItemData.length - 1 ? getRetryFn(session) : null}
          />
        ))}
      </div>
      <InputBox
        enabled={isReady}
        onSubmit={(question) => {
          const newQuestion = new ConversationItemData('question', question + '\n<hr/>')
          const newAnswer = new ConversationItemData(
            'answer',
            `<p class="gpt-loading">${t('Waiting for response...')}</p>`,
          )
          setConversationItemData([...conversationItemData, newQuestion, newAnswer])
          setIsReady(false)

          const newSession = { ...session, question, isRetry: false }
          setSession(newSession)
          try {
            port.postMessage({ session: newSession })
          } catch (e) {
            updateAnswer(e, false, 'error')
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
  dockable: PropTypes.bool,
  onDock: PropTypes.func,
  notClampSize: PropTypes.bool,
  pageMode: PropTypes.bool,
}

export default memo(ConversationCard)
