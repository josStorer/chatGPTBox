import { useTranslation } from 'react-i18next'
import { config as toolsConfig } from '../../content-script/selection-tools/index.mjs'
import PropTypes from 'prop-types'

SelectionTools.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function SelectionTools({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      {config.selectionTools.map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={config.activeSelectionTools.includes(key)}
            onChange={(e) => {
              const checked = e.target.checked
              const activeSelectionTools = config.activeSelectionTools.filter((i) => i !== key)
              if (checked) activeSelectionTools.push(key)
              updateConfig({ activeSelectionTools })
            }}
          />
          {t(toolsConfig[key].label)}
        </label>
      ))}
    </>
  )
}
