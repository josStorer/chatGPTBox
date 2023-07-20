import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('main article h1')?.textContent
      const description = document.querySelector('#article-content')?.textContent
      if (title && description) {
        const author = document.querySelector('main article a > span')?.textContent
        return await cropText(
          `以下是一篇文章,标题是:"${title}",作者是:"${author}",内容是:\n"${description}".请以如下格式输出你的回答：
          ======
          {文章摘要}
          `,
        )
      }
    } catch (e) {
      console.log(e)
    }
  },
}
