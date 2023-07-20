import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const author = document.querySelector('main article a > span')?.textContent
      const description =
        document.querySelector('#article-content')?.textContent ||
        document.querySelector('#thead-gallery')?.textContent
      if (author && description) {
        const title = document.querySelector('main article h1')?.textContent
        if (title) {
          return await cropText(
            `以下是一篇文章,请给出文章的结论和3到5个要点.标题是:"${title}",作者是:"${author}",内容是:\n"${description}".
          `,
          )
        } else {
          return await cropText(
            `以下是一篇长推文,请给出文章的结论和3到5个要点.作者是:"${author}",内容是:\n"${description}".
          `,
          )
        }
      }
    } catch (e) {
      console.log(e)
    }
  },
}
