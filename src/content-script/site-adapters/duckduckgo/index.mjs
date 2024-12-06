import { waitForElementToExistAndSelect } from '../../../utils/index.mjs'
import { config } from '../index'

export default {
  init: async (hostname, userConfig) => {
    if (userConfig.insertAtTop) {
      return !!(await waitForElementToExistAndSelect(config.duckduckgo.resultsContainerQuery[0], 5))
    }
    return true
  },
}
