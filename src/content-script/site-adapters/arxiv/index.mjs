import { cropText } from '../../../utils'

export default {
  inputQuery: async () => {
    try {
      const title = document.querySelector('.title')?.textContent.trim()
      const authors = document.querySelector('.authors')?.textContent
      const abstract = document.querySelector('blockquote.abstract')?.textContent.trim()

      return await cropText(
        `Below is the paper abstract from a preprint site, summarize the key findings, methodology, and conclusions, especially highlight the contributions.` +
          `\n${title}\n${authors}\n${abstract}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
