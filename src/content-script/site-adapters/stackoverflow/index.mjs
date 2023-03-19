import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('#question-header .question-hyperlink')?.textContent
      if (title) {
        const description = document.querySelector('.postcell .s-prose')?.textContent
        let answer = ''
        const answers = document.querySelectorAll('.answercell .s-prose')
        if (answers.length > 0)
          for (let i = 1; i <= answers.length && i <= 2; i++) {
            answer += `answer${i}: ${answers[i - 1].textContent}|`
          }

        return cropText(
          `Below is the content from a developer Q&A platform. Analyze answers and provide a brief solution that can solve the question first,` +
            `then give an overview of all answers. The question is: "${title}", and the further description of the question is: "${description}".` +
            `The answers are as follows:\n${answer}`,
        )
      }
    } catch (e) {
      console.log(e)
    }
  },
}
