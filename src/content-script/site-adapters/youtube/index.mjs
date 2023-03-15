import { cropText } from '../../../utils'
import { config } from '../index.mjs'

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      let oldUrl = location.href
      const checkUrlChange = async () => {
        if (location.href !== oldUrl) {
          oldUrl = location.href
          mountComponent(config.youtube, userConfig)
        }
      }
      window.setInterval(checkUrlChange, 500)
    } catch (e) {
      /* empty */
    }
  },
  inputQuery: async () => {
    try {
      const docText = await (
        await fetch(location.href, {
          credentials: 'include',
        })
      ).text()

      let subtitleUrl = docText.substring(docText.indexOf('https://www.youtube.com/api/timedtext'))
      subtitleUrl = subtitleUrl.substring(0, subtitleUrl.indexOf('"'))
      subtitleUrl = subtitleUrl.replaceAll('\\u0026', '&')

      let title = docText.substring(docText.indexOf('"title":"') + '"title":"'.length)
      title = title.substring(0, title.indexOf('","'))

      const subtitleResponse = await fetch(subtitleUrl)
      let subtitleData = await subtitleResponse.text()

      let subtitleContent = ''
      while (subtitleData.indexOf('">') !== -1) {
        subtitleData = subtitleData.substring(subtitleData.indexOf('">') + 2)
        subtitleContent += subtitleData.substring(0, subtitleData.indexOf('<')) + ','
      }

      await new Promise((r) => setTimeout(r, 1000))

      return cropText(
        `Provide a brief summary of the video using concise language and incorporating the video title.` +
          `The video title is:"${title}".The subtitle content is as follows:\n${subtitleContent}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
