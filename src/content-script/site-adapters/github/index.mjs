import { cropText, limitedFetch } from '../../../utils'
import { config } from '../index.mjs'

const getPatchUrl = async () => {
  const patchUrl = location.origin + location.pathname + '.patch'
  const response = await fetch(patchUrl, { method: 'HEAD' }).catch(() => ({}))
  if (response.ok) return patchUrl
  return ''
}

const getPatchData = async (patchUrl) => {
  if (!patchUrl) return

  let patchData = await limitedFetch(patchUrl, 1024 * 40)
  patchData = patchData.substring(patchData.indexOf('---'))
  return patchData
}

const isPull = () => {
  return location.href.match(/\/pull\/\d+$/)
}

const isIssue = () => {
  return location.href.match(/\/issues\/\d+$/)
}

function parseGitHubIssueData() {
  // Function to parse a single comment
  function parseComment(commentElement) {
    // Parse the date
    const dateElement = commentElement.querySelector('relative-time')
    const date = dateElement.getAttribute('datetime')

    // Parse the author
    const authorElement =
      commentElement.querySelector('.author') || commentElement.querySelector('.author-name')
    const author = authorElement.textContent.trim()

    // Parse the body
    const bodyElement = commentElement.querySelector('.comment-body')
    const body = bodyElement.textContent.trim()

    return { date, author, body }
  }

  // Function to parse all messages on the page
  function parseAllMessages() {
    // Find all comment containers
    const commentElements = document.querySelectorAll('.timeline-comment-group')
    const messages = Array.from(commentElements).map(parseComment)

    // The initial post is not a ".timeline-comment-group", so we need to handle it separately
    const initialPostElement = document.querySelector('.js-comment-container')
    const initialPost = parseComment(initialPostElement)

    // Combine the initial post with the rest of the comments
    return [initialPost, ...messages]
  }

  // Function to get the content of the comment input box
  function getCommentInputContent() {
    const commentInput = document.querySelector('.js-new-comment-form textarea')
    return commentInput ? commentInput.value : ''
  }

  // Get the issue title
  const title = document.querySelector('.js-issue-title').textContent.trim()

  // Get all messages
  const messages = parseAllMessages()

  // Get the content of the new comment box
  const commentBoxContent = getCommentInputContent()

  // Return an object with both results
  return {
    title: title,
    messages: messages,
    commentBoxContent: commentBoxContent,
  }
}

function createChatGPtSummaryPrompt(issueData, isIssue = true) {
  // Destructure the issueData object into messages and commentBoxContent
  const { title, messages, commentBoxContent } = issueData

  // Start crafting the prompt
  let prompt = ''

  if (isIssue) {
    prompt =
      'Please summarize the following GitHub issue thread.\nWhat is the main issue and key points discussed in this thread?\n\n'
  } else {
    prompt =
      'Please summarize the following GitHub pull request thread.\nWhat is the main issue this pull request is trying to solve?\n\n'
  }

  prompt += '---\n\n'

  prompt += `Title:\n${title}\n\n`

  // Add each message to the prompt
  messages.forEach((message, index) => {
    prompt += `Message ${index + 1} by ${message.author} on ${message.date}:\n${message.body}\n\n`
  })

  // If there's content in the comment box, add it as a draft message
  if (commentBoxContent) {
    prompt += '---\n\n'
    prompt += `Draft message in comment box:\n${commentBoxContent}\n\n`
  }

  // Add a request for summary at the end of the prompt
  // prompt += 'What is the main issue and key points discussed in this thread?'

  return prompt
}

export default {
  init: async (hostname, userConfig, getInput, mountComponent) => {
    try {
      let oldUrl = location.href
      const checkUrlChange = async () => {
        if (location.href !== oldUrl) {
          oldUrl = location.href
          if (isPull() || isIssue()) {
            mountComponent(config.github, userConfig)
            return
          }

          const patchUrl = await getPatchUrl()
          if (patchUrl) {
            mountComponent(config.github, userConfig)
          }
        }
      }
      window.setInterval(checkUrlChange, 500)
    } catch (e) {
      /* empty */
    }
    return (await getPatchUrl()) || isPull() || isIssue()
  },
  inputQuery: async () => {
    try {
      if (isPull() || isIssue()) {
        const issueData = parseGitHubIssueData()
        const summaryPrompt = createChatGPtSummaryPrompt(issueData, isIssue())

        return await cropText(summaryPrompt)
      }
      const patchUrl = await getPatchUrl()
      const patchData = await getPatchData(patchUrl)
      if (!patchData) return

      return await cropText(
        `Analyze the contents of a git commit,provide a suitable commit message,and summarize the contents of the commit.` +
          `The patch contents of this commit are as follows:\n${patchData}`,
      )
    } catch (e) {
      console.log(e)
    }
  },
}
