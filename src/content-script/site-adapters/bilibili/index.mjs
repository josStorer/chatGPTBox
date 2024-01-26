import { cropText, waitForElementToExistAndSelect } from '../../../utils'
import { config } from '../index.mjs'

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      // B站页面是SSR的，如果插入过早，页面 js 检测到实际 Dom 和期望 Dom 不一致，会导致重新渲染
      await waitForElementToExistAndSelect('img.bili-avatar-img')
      let oldPath = location.pathname
      const checkPathChange = async () => {
        if (location.pathname !== oldPath) {
          oldPath = location.pathname
          mountComponent(config.bilibili, userConfig)
        }
      }
      window.setInterval(checkPathChange, 500)
    } catch (e) {
      /* empty */
    }
    return true
  },
  inputQuery: async () => {
    try {
      const bvid = location.pathname.replace('video', '').replaceAll('/', '')
      const p = Number(new URLSearchParams(location.search).get('p') || 1) - 1

      const pagelistResponse = await fetch(
        `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`,
      )
      const pagelistData = await pagelistResponse.json()
      const videoList = pagelistData.data
      const cid = videoList[p].cid
      const title = videoList[p].part

      const infoResponse = await fetch(
        `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`,
        {
          credentials: 'include',
        },
      )
      const infoData = await infoResponse.json()
      const subtitleUrl = infoData.data.subtitle.subtitles[0].subtitle_url

      const subtitleResponse = await fetch(subtitleUrl)
      const subtitleData = await subtitleResponse.json()
      const subtitles = subtitleData.body

      let subtitleContent = ''
      for (let i = 0; i < subtitles.length; i++) {
        if (i === subtitles.length - 1) subtitleContent += subtitles[i].content
        else subtitleContent += subtitles[i].content + ','
      }

      return await cropText(
        `用尽量简练的语言,联系视频标题,对视频进行内容摘要,同时仍要保留重要细节和标题信息,如果可能的话,使用markdown语法将视频内容总结为结构化信息,视频标题为:"${title}",字幕内容为:\n${subtitleContent}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
