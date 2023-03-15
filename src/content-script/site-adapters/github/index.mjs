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
      const targetNode = document.querySelector('body')
      const observer = new MutationObserver(async (records) => {
        if (
          records.some(
            (record) =>
              record.type === 'childList' &&
              [...record.addedNodes].some((node) => node.classList.contains('page-responsive')),
          )
        ) {
          const patchUrl = await getPatchUrl()
          if (patchUrl) {
            mountComponent(config.github, userConfig)
          }
        }
      })
      observer.observe(targetNode, { childList: true })
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
