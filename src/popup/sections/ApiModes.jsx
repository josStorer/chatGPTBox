import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { ModelMode, Models } from '../../config/index.mjs'

ApiModes.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function ApiModes({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      {config.apiModes.map((modelName) => {
        let desc
        if (modelName.includes('-')) {
          const splits = modelName.split('-')
          if (splits[0] in Models)
            desc = `${t(Models[splits[0]].desc)} (${t(ModelMode[splits[1]])})`
        } else {
          if (modelName in Models) desc = t(Models[modelName].desc)
        }
        if (desc)
          return (
            <label key={modelName}>
              <input
                type="checkbox"
                checked={config.activeApiModes.includes(modelName)}
                onChange={(e) => {
                  const checked = e.target.checked
                  const activeApiModes = config.activeApiModes.filter((i) => i !== modelName)
                  if (checked) activeApiModes.push(modelName)
                  updateConfig({ activeApiModes })
                }}
              />
              {desc}
            </label>
          )
      })}
    </>
  )
}
