import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { Models } from '../../config/index.mjs'

ApiModes.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function ApiModes({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      {config.apiModes.map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={config.activeApiModes.includes(key)}
            onChange={(e) => {
              const checked = e.target.checked
              const activeApiModes = config.activeApiModes.filter((i) => i !== key)
              if (checked) activeApiModes.push(key)
              updateConfig({ activeApiModes })
            }}
          />
          {t(Models[key].desc)}
        </label>
      ))}
    </>
  )
}
