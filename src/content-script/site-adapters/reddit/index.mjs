import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('.main shreddit-post div:nth-child(4)').textContent
      const description = document.querySelector(
        '.main shreddit-post div:nth-child(6) div',
      ).textContent
      const texts = document.querySelectorAll('shreddit-comment div:nth-child(2)')
      let answers = ''
      for (let i = 0; i < texts.length; i++) {
        answers += `answer${i}:${texts[i].textContent}|`
      }

      return await cropText(
        `Below is the content from a social forum,giving the corresponding summary and your opinion on it.` +
          `The title is:'${title}',and the further description of the title is:'${description}'.` +
          `Some answers are as follows:\n${answers}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
