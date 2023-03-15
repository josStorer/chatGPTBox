import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('.QuestionHeader-title')?.textContent
      if (title) {
        const description = document.querySelector('.QuestionRichText')?.textContent
        const answer = document.querySelector('.AnswerItem .RichText')?.textContent

        return cropText(
          `以下是一个问答平台的提问与回答内容,给出相应的摘要,以及你对此的看法.问题是:"${title}",问题的进一步描述是:"${description}".` +
            `其中一个回答如下:\n${answer}`,
        )
      } else {
        const title = document.querySelector('.Post-Title')?.textContent
        const description = document.querySelector('.Post-RichText')?.textContent

        if (title) {
          return cropText(
            `以下是一篇文章,给出相应的摘要,以及你对此的看法.标题是:"${title}",内容是:\n"${description}"`,
          )
        }
      }
    } catch (e) {
      console.log(e)
    }
  },
}
