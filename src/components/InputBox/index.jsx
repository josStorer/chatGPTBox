import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { updateRefHeight } from '../../utils'

export function InputBox({ onSubmit, enabled }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    updateRefHeight(inputRef)
  })

  const onKeyDown = (e) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault()
      if (!value) return
      onSubmit(value)
      setValue('')
    }
  }

  return (
    <textarea
      ref={inputRef}
      disabled={!enabled}
      className="interact-input"
      placeholder={
        enabled
          ? 'Type your question here\nEnter to send, shift + enter to break line'
          : 'Wait for the answer to finish and then continue here'
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
