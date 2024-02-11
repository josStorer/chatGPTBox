// https://github.com/PawanOsman/GoogleBard

export default class Bard {
  cookies = ''

  constructor(cookies) {
    this.cookies = cookies
  }

  ParseResponse(text) {
    let resData = {
      r: '',
      c: '',
      rc: '',
      responses: [],
    }
    try {
      let parseData = (data) => {
        if (typeof data === 'string') {
          if (data?.startsWith('c_')) {
            resData.c = data
            return
          }
          if (data?.startsWith('r_')) {
            resData.r = data
            return
          }
          if (data?.startsWith('rc_')) {
            resData.rc = data
            return
          }
          resData.responses.push(data)
        }
        if (Array.isArray(data)) {
          data.forEach((item) => {
            parseData(item)
          })
        }
      }
      try {
        const lines = text.split('\n')
        for (let i in lines) {
          const line = lines[i]
          if (line.includes('wrb.fr')) {
            let data = JSON.parse(line)
            let responsesData = JSON.parse(data[0][2])
            responsesData.forEach((response) => {
              parseData(response)
            })
          }
        }
      } catch (e) {
        throw new Error(
          `Error parsing response: make sure you are using the correct cookie, copy the value of "__Secure-1PSID" cookie and set it like this: \n\nnew Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\nAlso using a US proxy is recommended.\n\nIf this error persists, please open an issue on github.\nhttps://github.com/PawanOsman/GoogleBard`,
        )
      }
    } catch (err) {
      throw new Error(
        `Error parsing response: make sure you are using the correct cookie, copy the value of "__Secure-1PSID" cookie and set it like this: \n\nnew Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\nAlso using a US proxy is recommended.\n\nIf this error persists, please open an issue on github.\nhttps://github.com/PawanOsman/GoogleBard`,
      )
    }
    return resData
  }

  async GetRequestParams() {
    try {
      const response = await fetch('https://gemini.google.com', {
        headers: {
          Cookie: this.cookies,
        },
      })
      const text = await response.text()
      const cfb2h = text.match(/"cfb2h":\s*"([^"]+)"/)?.[1]
      const SNlM0e = text.match(/"SNlM0e":\s*"([^"]+)"/)?.[1]
      const context = { googleData: { cfb2h, SNlM0e } }
      const at = context.googleData.SNlM0e
      const bl = context.googleData.cfb2h
      return { at, bl }
    } catch (e) {
      throw new Error(
        `Error parsing response: make sure you are using the correct cookie, copy the value of "__Secure-1PSID" cookie and set it like this: \n\nnew Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\nAlso using a US proxy is recommended.\n\nIf this error persists, please open an issue on github.\nhttps://github.com/PawanOsman/GoogleBard`,
      )
    }
  }

  async ask(prompt, conversationObj) {
    return await this.send(prompt, conversationObj)
  }

  async send(prompt, conversationObj) {
    let conversation = {
      id: conversationObj.id || '',
      c: conversationObj.c || '',
      r: conversationObj.r || '',
      rc: conversationObj.rc || '',
      lastActive: Date.now(),
    }
    // eslint-disable-next-line
    try {
      let { at, bl } = await this.GetRequestParams()
      const response = await fetch(
        'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?' +
          new URLSearchParams({
            bl: bl,
            rt: 'c',
            _reqid: 0,
          }),
        {
          method: 'POST',
          body: new URLSearchParams({
            at: at,
            'f.req': JSON.stringify([
              null,
              `[[${JSON.stringify(prompt)}],null,${JSON.stringify([
                conversation.c,
                conversation.r,
                conversation.rc,
              ])}]`,
            ]),
          }),
          headers: {
            Cookie: this.cookies,
          },
        },
      )
      const data = await response.text()
      let parsedResponse = this.ParseResponse(data)
      conversation.c = parsedResponse.c
      conversation.r = parsedResponse.r
      conversation.rc = parsedResponse.rc
      const conversationObj = { c: conversation.c, r: conversation.r, rc: conversation.rc }
      return { answer: parsedResponse.responses[3], conversationObj: conversationObj }
    } catch (e) {
      throw e
    }
  }
}
