import { useState } from 'react'
import { UnmuteIcon, MuteIcon } from '@primer/octicons-react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

ReadButton.propTypes = {
  contentFn: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  className: PropTypes.string,
}

function ReadButton({ className, contentFn, size }) {
  const { t } = useTranslation()
  const [speaking, setSpeaking] = useState(false)

  const startSpeak = () => {
    speechSynthesis.cancel()

    let text = contentFn()

    const utterance = new SpeechSynthesisUtterance(text)
    Object.assign(utterance, {
      // lang: 'zh-CN',
      rate: 0.9,
      volume: 1,
      onend: () => setSpeaking(false),
      onerror: () => setSpeaking(false),
    })

    let supportedVoices = speechSynthesis.getVoices()
    for (let i = 0; i < supportedVoices.length; i++) {
      if (supportedVoices[i].lang.indexOf(text[0]) >= 0) {
        utterance.voice = supportedVoices[i]
        break
      }
    }

    speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  const stopSpeak = () => {
    speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <span
      title={t('Read')}
      className={`gpt-util-icon ${className ? className : ''}`}
      onClick={speaking ? stopSpeak : startSpeak}
    >
      {speaking ? <MuteIcon size={size} /> : <UnmuteIcon size={size} />}
    </span>
  )
}

export default ReadButton
