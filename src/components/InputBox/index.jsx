import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { updateRefHeight } from '../../utils'
import { useTranslation } from 'react-i18next'

export function InputBox({ onSubmit, enabled }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    updateRefHeight(inputRef)
  })

  const onKeyDown = (e) => {
    e.stopPropagation()
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault()
      if (!value) return
      onSubmit(value)
      setValue('')
    }
  }

  return (
    <textarea
      dir="auto"
      ref={inputRef}
      disabled={!enabled}
      className="interact-input"
      placeholder={
        enabled
          ? t('Type your question here\nEnter to send, shift + enter to break line')
          : t('Wait for the answer to finish and then continue here')
      }
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
    />
  )
}

InputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
}

export default InputBox
