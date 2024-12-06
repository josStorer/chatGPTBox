// reference: https://github.com/muharamdani/poe

import { connectWs, disconnectWs, listenWs } from './websocket.js'
import chatViewQuery from './graphql/ChatViewQuery.graphql'
import addMessageBreakMutation from './graphql/AddMessageBreakMutation.graphql'
import addHumanMessageMutation from './graphql/AddHumanMessageMutation.graphql'
import Browser from 'webextension-polyfill'
import md5 from 'md5'

const queries = {
  chatViewQuery: chatViewQuery.loc.source.body,
  addMessageBreakMutation: addMessageBreakMutation.loc.source.body,
  addHumanMessageMutation: addHumanMessageMutation.loc.source.body,
}

export default class PoeAiClient {
  constructor(chatId = null) {
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://poe.com',
    }
    this.settings = null
    this.ws = null
    this.chatId = chatId
    this.bot = null
  }

  async ask(message, model, onMessage, onComplete) {
    if (!this.settings) {
      await this.getCredentials()
    }
    if (!this.bot) {
      await this.initBot(model || 'Assistant')
    }
    if (!this.chatId) {
      await this.getChatId(this.bot)
    }
    if (!this.ws) {
      this.ws = await connectWs(this.settings)
      await this.subscribe()
      listenWs(this.ws, onMessage, onComplete)
    }
    await this.sendMsg(message)
  }

  async close() {
    if (this.ws) {
      await disconnectWs(this.ws)
      this.ws = null
    }
  }

  async getFormkey() {
    const encoded = (await (await fetch('https://poe.com')).text()).match(
      /<script>if\(.+\)throw new Error;(.+)<\/script>/,
    )[1]
    const codebook = encoded.match(/var .="([0-9a-f]+)"/)[1]
    const dict = Array.from(encoded.matchAll(/\[(\d+)\]=.\[(\d+)\]/g))
    let result = new Array(dict.length)
    dict.forEach(([, k, v]) => {
      result[k] = codebook[v]
    })
    return result.join('')
  }

  async getCredentials() {
    this.headers['Cookie'] = (await Browser.cookies.getAll({ url: 'https://poe.com/' }))
      .map((cookie) => {
        return `${cookie.name}=${cookie.value}`
      })
      .join('; ')
    this.settings = await (
      await fetch('https://poe.com/api/settings', { headers: this.headers })
    ).json()
    console.debug('poe settings', this.settings)
    if (this.settings.tchannelData.channel)
      this.headers['poe-tchannel'] = this.settings.tchannelData.channel

    this.headers['poe-formkey'] = await this.getFormkey()
    console.debug('poe formkey', this.headers['poe-formkey'])
  }

  async subscribe() {
    const query = {
      queryName: 'subscriptionsMutation',
      variables: {
        subscriptions: [
          {
            subscriptionName: 'messageAdded',
            query:
              'subscription subscriptions_messageAdded_Subscription(\n  $chatId: BigInt!\n) {\n  messageAdded(chatId: $chatId) {\n    id\n    messageId\n    creationTime\n    state\n    ...ChatMessage_message\n    ...chatHelpers_isBotMessage\n  }\n}\n\nfragment ChatMessageDownvotedButton_message on Message {\n  ...MessageFeedbackReasonModal_message\n  ...MessageFeedbackOtherModal_message\n}\n\nfragment ChatMessageDropdownMenu_message on Message {\n  id\n  messageId\n  vote\n  text\n  ...chatHelpers_isBotMessage\n}\n\nfragment ChatMessageFeedbackButtons_message on Message {\n  id\n  messageId\n  vote\n  voteReason\n  ...ChatMessageDownvotedButton_message\n}\n\nfragment ChatMessageOverflowButton_message on Message {\n  text\n  ...ChatMessageDropdownMenu_message\n  ...chatHelpers_isBotMessage\n}\n\nfragment ChatMessageSuggestedReplies_SuggestedReplyButton_message on Message {\n  messageId\n}\n\nfragment ChatMessageSuggestedReplies_message on Message {\n  suggestedReplies\n  ...ChatMessageSuggestedReplies_SuggestedReplyButton_message\n}\n\nfragment ChatMessage_message on Message {\n  id\n  messageId\n  text\n  author\n  linkifiedText\n  state\n  ...ChatMessageSuggestedReplies_message\n  ...ChatMessageFeedbackButtons_message\n  ...ChatMessageOverflowButton_message\n  ...chatHelpers_isHumanMessage\n  ...chatHelpers_isBotMessage\n  ...chatHelpers_isChatBreak\n  ...chatHelpers_useTimeoutLevel\n  ...MarkdownLinkInner_message\n}\n\nfragment MarkdownLinkInner_message on Message {\n  messageId\n}\n\nfragment MessageFeedbackOtherModal_message on Message {\n  id\n  messageId\n}\n\nfragment MessageFeedbackReasonModal_message on Message {\n  id\n  messageId\n}\n\nfragment chatHelpers_isBotMessage on Message {\n  ...chatHelpers_isHumanMessage\n  ...chatHelpers_isChatBreak\n}\n\nfragment chatHelpers_isChatBreak on Message {\n  author\n}\n\nfragment chatHelpers_isHumanMessage on Message {\n  author\n}\n\nfragment chatHelpers_useTimeoutLevel on Message {\n  id\n  state\n  text\n  messageId\n}\n',
          },
          {
            subscriptionName: 'viewerStateUpdated',
            query:
              'subscription subscriptions_viewerStateUpdated_Subscription {\n  viewerStateUpdated {\n    id\n    ...ChatPageBotSwitcher_viewer\n  }\n}\n\nfragment BotHeader_bot on Bot {\n  displayName\n  ...BotImage_bot\n}\n\nfragment BotImage_bot on Bot {\n  profilePicture\n  displayName\n}\n\nfragment BotLink_bot on Bot {\n  displayName\n}\n\nfragment ChatPageBotSwitcher_viewer on Viewer {\n  availableBots {\n    id\n    ...BotLink_bot\n    ...BotHeader_bot\n  }\n}\n',
          },
        ],
      },
      query:
        'mutation subscriptionsMutation(\n  $subscriptions: [AutoSubscriptionQuery!]!\n) {\n  autoSubscribe(subscriptions: $subscriptions) {\n    viewer {\n      id\n    }\n  }\n}\n',
    }
    await this.makeRequest(query)
  }

  async makeRequest(request) {
    request = JSON.stringify(request)
    this.headers['poe-tag-id'] = md5(request + this.headers['poe-formkey'] + 'WpuLMiXEKKE98j56k')
    const response = await fetch('https://poe.com/api/gql_POST', {
      method: 'POST',
      headers: this.headers,
      body: request,
    })
    return await response.json()
  }

  async getChatId(bot) {
    const {
      data: {
        chatOfBot: { chatId },
      },
    } = await this.makeRequest({
      query: queries.chatViewQuery,
      variables: {
        bot,
      },
    })
    this.chatId = chatId
    return chatId
  }

  async initBot(bot) {
    if (bot === 'Assistant') {
      bot = 'capybara'
    } else if (bot === 'gpt-4') {
      bot = 'beaver'
    } else if (bot === 'gpt-4-32k') {
      bot = 'vizcacha'
    } else if (bot === 'claude-instant-100k') {
      bot = 'a2_100k'
    } else if (bot === 'claude-2-100k') {
      bot = 'a2_2'
    } else if (bot === 'claude-instant') {
      bot = 'a2'
    } else if (bot === 'chatgpt') {
      bot = 'chinchilla'
    } else if (bot === 'chatgpt-16k') {
      bot = 'agouti'
    } else if (bot === 'Google-PaLM') {
      bot = 'acouchy'
    } else if (bot === 'Llama-2-7b') {
      bot = 'llama_2_7b_chat'
    } else if (bot === 'Llama-2-13b') {
      bot = 'llama_2_13b_chat'
    } else if (bot === 'Llama-2-70b') {
      bot = 'llama_2_70b_chat'
    }

    this.bot = bot
  }

  async breakMsg() {
    await this.makeRequest({
      query: queries.addMessageBreakMutation,
      variables: { chatId: this.chatId },
    })
  }

  async sendMsg(query) {
    await this.makeRequest({
      query: queries.addHumanMessageMutation,
      variables: {
        bot: this.bot,
        chatId: this.chatId,
        query: query,
        source: null,
        withChatBreak: false,
      },
    })
  }
}
