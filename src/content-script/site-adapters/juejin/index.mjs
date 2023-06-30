import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector(
        '#juejin > div.view-container > main > div > div.main-area.article-area > article > h1',
      )?.textContent
      const description = document.querySelector(
        '#juejin > div.view-container > main > div > div.main-area.article-area > article > div.article-content',
      )?.textContent
      if (title && description) {
        const author = document.querySelector(
          '#juejin > div.view-container > main > div > div.main-area.article-area > article > div.author-info-block > div > div.author-name > a > span.name',
        )?.textContent
        const comments = document.querySelectorAll(
          'div.content-box > div.comment-main > div.content',
        )
        let comment = ''
        for (let i = 1; i <= comments.length && i <= 4; i++) {
          comment += `answer${i}: ${comment[i - 1].textContent}|`
        }
        return await cropText(
          `以下是一篇文章,标题是:"${title}",作者是:"${author}",内容是:\n"${description}".各个评论如下:\n${comment}.请以如下格式输出你的回答：
          {文章摘要和文章作者}
          ======
          {文章总结和对文章的看法}
          ======
          {对评论的总结}
          `,
        )
      }
    } catch (e) {
      console.log(e)
    }
  },
}
