import { waitForElementToExistAndSelect } from '../../../utils'
import { config } from '../index.mjs'

export default {
  init: async (hostname, userConfig) => {
    const selector = userConfig.insertAtTop
      ? config.brave.resultsContainerQuery[0]
      : config.brave.sidebarContainerQuery[0]
    await waitForElementToExistAndSelect(selector, 5)
    return true
  },
}
