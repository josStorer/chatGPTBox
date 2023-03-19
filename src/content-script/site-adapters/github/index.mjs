import { cropText, limitedFetch } from '../../../utils'
import { config } from '../index.mjs'

const getPatchUrl = async () => {
  const patchUrl = location.origin + location.pathname + '.patch'
  const response = await fetch(patchUrl, { method: 'HEAD' })
  if (response.ok) return patchUrl
  return ''
}

const getPatchData = async (patchUrl) => {
  if (!patchUrl) return

  let patchData = await limitedFetch(patchUrl, 1024 * 40)
  patchData = patchData.substring(patchData.indexOf('---'))
  return patchData
}

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      let oldUrl = location.href
      const checkUrlChange = async () => {
        if (location.href !== oldUrl) {
          oldUrl = location.href
          const patchUrl = await getPatchUrl()
          if (patchUrl) {
            mountComponent(config.github, userConfig)
          }
        }
      }
      window.setInterval(checkUrlChange, 500)
    } catch (e) {
      /* empty */
    }
  },
  inputQuery: async () => {
    try {
      const patchUrl = await getPatchUrl()
      const patchData = await getPatchData(patchUrl)
      if (!patchData) return

      return cropText(
        `Analyze the contents of a git commit,provide a suitable commit message,and summarize the contents of the commit.` +
          `The patch contents of this commit are as follows:\n${patchData}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
