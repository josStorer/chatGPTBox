import { cropText } from '../../../utils'
import { config } from '../index.mjs'

// This function was written by ChatGPT and modified by iamsirsammy
function replaceHtmlEntities(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString.replaceAll('&amp;', '&'), 'text/html')
  return doc.documentElement.innerText
}

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      let oldUrl = location.href
      const checkUrlChange = async () => {
        if (location.href !== oldUrl) {
          oldUrl = location.href
          mountComponent(config.youtube, userConfig)
        }
      }
      window.setInterval(checkUrlChange, 500)
    } catch (e) {
      /* empty */
    }
  },
  inputQuery: async () => {
    try {
      const docText = await (
        await fetch(location.href, {
          credentials: 'include',
        })
      ).text()

      const subtitleUrlStartAt = docText.indexOf('https://www.youtube.com/api/timedtext')
      if (subtitleUrlStartAt === -1) return

      let subtitleUrl = docText.substring(subtitleUrlStartAt)
      subtitleUrl = subtitleUrl.substring(0, subtitleUrl.indexOf('"'))
      subtitleUrl = subtitleUrl.replaceAll('\\u0026', '&')

      let title = docText.substring(docText.indexOf('"title":"') + '"title":"'.length)
      title = title.substring(0, title.indexOf('","'))

      const subtitleResponse = await fetch(subtitleUrl)
      if (!subtitleResponse.ok) return
      let subtitleData = await subtitleResponse.text()

      let subtitleContent = ''
      while (subtitleData.indexOf('">') !== -1) {
        subtitleData = subtitleData.substring(subtitleData.indexOf('">') + 2)
        subtitleContent += subtitleData.substring(0, subtitleData.indexOf('<')) + ','
      }

      subtitleContent = replaceHtmlEntities(subtitleContent)

      return cropText(
        `Think step by step and provide a clear, concise, yet comprehensive summary of the provided YouTube video. Your task is to distil the video's content into a structured written format, using markdown for readability and organization. 

        In your summary, please ensure to:

        1. **Include the video title**: This will set the context and provide an idea about the video's content.
        2. **Identify and summarize the key points/highlights**: List out the primary points, arguments, discoveries, or themes presented in the video. Consider these as the "need-to-know" points for understanding the video's core message/content.
        3. **Provide detail without losing clarity**: After the key points, provide a more detailed summary. Include significant sub-points, illustrative examples, discussions, and any conclusions or implications. Aim for this detailed section to complement and expand on the key points, but ensure it remains digestible and clear.
        4. **Structure your summary with markdown**: Use headers for different sections (e.g., Key Points, Detailed Summary), bullet points for listing items, bold or italic text for emphasis, and tables where appropriate.
        5. **Capture the video's essence without unnecessary length**: Strive for a balance of detail and brevity. Capture all the necessary information, but avoid overly long sentences and excessive detail.
        
        Remember, the goal is to ensure that someone who reads your summary will gain a complete and accurate understanding of the video's content, even if they haven't watched it themselves.
        If a video includes visual elements crucial to its understanding (like a graph, diagram, or scene description), please describe it briefly within the relevant part of the summary.

        Here's a template to guide your summary:
        # [title]

        ## TLDR
        (Provide a short summary of the video in a maximum of 3 sentences)

        ## Key Points/Highlights
        - Main Point/Highlight 1
        - Main Point/Highlight 2
        - ...

        ## Detailed Summary
        (Expand on the key points with sub-points, examples, discussions, conclusions or implications)

        ## Conclusion
        (Any conclusions made in the video, the final thoughts of the speaker, etc.)` +
        `The video title is "${title}". The subtitle content is as follows:\n${subtitleContent}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
