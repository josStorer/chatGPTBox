import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import { SelectionTools } from './SelectionTools'
import { SiteAdapters } from './SiteAdapters'

ModulesPart.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function ModulesPart({ config, updateConfig }) {
  const { t } = useTranslation()

  return (
    <>
      <Tabs selectedTabClassName="popup-tab--selected">
        <TabList>
          <Tab className="popup-tab">{t('Selection Tools')}</Tab>
          <Tab className="popup-tab">{t('Sites')}</Tab>
        </TabList>

        <TabPanel>
          <SelectionTools config={config} updateConfig={updateConfig} />
        </TabPanel>
        <TabPanel>
          <SiteAdapters config={config} updateConfig={updateConfig} />
        </TabPanel>
      </Tabs>
    </>
  )
}
