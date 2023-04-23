import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { updateRefHeight } from '../../utils'
import { useTranslation } from 'react-i18next'

export function InputBox({ onSubmit, enabled, port }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    updateRefHeight(inputRef)
  })

  useEffect(() => {
    if (enabled) inputRef.current.focus()
  }, [enabled])

  const handleKeyDownOrClick = (e) => {
    e.stopPropagation()
    if (e.type === 'click' || (e.keyCode === 13 && e.shiftKey === false)) {
      if (enabled) {
        e.preventDefault()
        if (!value) return
        onSubmit(value)
        setValue('')
      } else {
        e.preventDefault()
        port.postMessage({ stop: true })
      }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        dir="auto"
        ref={inputRef}
        disabled={false}
        className="interact-input"
        placeholder={
          enabled
            ? t('Type your question here\nEnter to send\nShift + enter to break line')
            : t('Type your question here\nEnter to stop generating\nShift + enter to break line')
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDownOrClick}
      />
      <button
        className="submit-button"
        style={{
          backgroundColor: enabled ? '#30a14e' : '#cf222e',
        }}
        onClick={handleKeyDownOrClick}
      >
        {enabled ? t('Send') : t('Stop')}
      </button>
    </div>
  )
}

InputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  port: PropTypes.func.isRequired,
}

export default InputBox
