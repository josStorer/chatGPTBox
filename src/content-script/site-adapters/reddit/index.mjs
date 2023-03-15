import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('.entry .title').textContent
      const texts = document.querySelectorAll('.entry .usertext-body')
      let description
      if (texts.length > 0) description = texts[0].textContent
      let answers = ''
      if (texts.length > 1)
        for (let i = 1; i < texts.length; i++) {
          answers += `answer${i}:${texts[i].textContent}|`
        }

      return cropText(
        `Below is the content from a social forum,giving the corresponding summary and your opinion on it.` +
          `The title is:'${title}',and the further description of the title is:'${description}'.` +
          `Some answers are as follows:\n${answers}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
