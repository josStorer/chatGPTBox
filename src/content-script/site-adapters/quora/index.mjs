import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      if (location.pathname === '/') return

      const texts = document.querySelectorAll('.q-box.qu-userSelect--text')
      let title
      if (texts.length > 0) title = texts[0].textContent
      let answers = ''
      if (texts.length > 1)
        for (let i = 1; i < texts.length; i++) {
          answers += `answer${i}:${texts[i].textContent}|`
        }

      return cropText(
        `Below is the content from a question and answer platform,giving the corresponding summary and your opinion on it.` +
          `The question is:'${title}',` +
          `Some answers are as follows:\n${answers}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
