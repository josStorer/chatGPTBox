import { useState } from 'react'
import { MuteIcon, UnmuteIcon } from '@primer/octicons-react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../hooks/use-config.mjs'

ReadButton.propTypes = {
  contentFn: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  className: PropTypes.string,
}

const synth = window.speechSynthesis

function ReadButton({ className, contentFn, size }) {
  const { t } = useTranslation()
  const [speaking, setSpeaking] = useState(false)
  const config = useConfig()

  const startSpeak = () => {
    synth.cancel()

    const text = contentFn()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = synth.getVoices()

    let voice
    if (config.preferredLanguage.includes('en') && navigator.language.includes('en'))
      voice = voices.find((v) => v.name.toLowerCase().includes('microsoft aria'))
    else if (config.preferredLanguage.includes('zh') || navigator.language.includes('zh'))
      voice = voices.find((v) => v.name.toLowerCase().includes('xiaoyi'))
    else if (config.preferredLanguage.includes('ja') || navigator.language.includes('ja'))
      voice = voices.find((v) => v.name.toLowerCase().includes('nanami'))
    if (!voice) voice = voices.find((v) => v.lang.substring(0, 2) === config.preferredLanguage)
    if (!voice) voice = voices.find((v) => v.lang === navigator.language)

    Object.assign(utterance, {
      rate: 1,
      volume: 1,
      onend: () => setSpeaking(false),
      onerror: () => setSpeaking(false),
      voice: voice,
    })

    synth.speak(utterance)
    setSpeaking(true)
  }

  const stopSpeak = () => {
    synth.cancel()
    setSpeaking(false)
  }

  return (
    <span
      title={t('Read Aloud')}
      className={`gpt-util-icon ${className ? className : ''}`}
      onClick={speaking ? stopSpeak : startSpeak}
    >
      {speaking ? <MuteIcon size={size} /> : <UnmuteIcon size={size} />}
    </span>
  )
}

export default ReadButton
