export default class BingImageCreator {
  /**
   * @constructor
   * @param {Object} options - Options for BingImageCreator.
   */
  constructor(options) {
    this.setOptions(options)
  }

  /**
   * Set options for BingImageCreator.
   * @param {Object} options - Options for BingImageCreator. The format of the options is almost same as the bingAiClient options of 'node-chatgpt-api'.
   */
  setOptions(options) {
    if (this.options && !this.options.replaceOptions) {
      this.options = {
        ...this.options,
        ...options,
      }
    } else {
      this.options = {
        ...options,
        host: options.host || 'https://www.bing.com',
        apipath: options.apipath || '/images/create?partner=sydney&re=1&showselective=1&sude=1',
        ua:
          options.ua ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.35',
        xForwardedFor: this.constructor.getValidIPv4(options.xForwardedFor),
        features: {
          enableAnsCardSfx: true,
        },
        enableTelemetry: true,
        telemetry: {
          eventID: 'Codex',
          instrumentedLinkName: 'CodexInstLink',
          externalLinkName: 'CodexInstExtLink',
          kSeedBase: 6500,
          kSeedIncrement: 500,
          instSuffix: 0,
          instSuffixIncrement: 1,
        },
      }
    }
    this.apiurl = `${this.options.host}${this.options.apipath}`
    this.telemetry = {
      config: this.options,
      currentKSeed: this.options.telemetry.kSeedBase,
      instSuffix: this.options.telemetry.instSuffix,
      getNextKSeed() {
        // eslint-disable-next-line no-return-assign, no-sequences
        return (this.currentKSeed += this.config.telemetry.kSeedIncrement), this.currentKSeed
      },
      getNextInstSuffix() {
        // eslint-disable-next-line no-return-assign
        return this.config.features.enableAnsCardSfx
          ? ((this.instSuffix += this.config.telemetry.instSuffixIncrement),
            this.instSuffix > 1 ? `${this.instSuffix}` : '')
          : ''
      },
    }
    this.debug = this.options.debug
  }

  /**
   * Get a valid IPv4 address string from input IP.
   * @param {string} ip - A fixed IPv4 address or a range of IPv4 using CIDR notation.
   * @returns {string} A valid IPv4 address or undefined.
   *                   If 'ip' is a valid fixed IPv4 address, it returns 'ip' itself.
   *                   If 'ip' is a range of IPv4 using CIDR notation, it returns a random address within the range.
   *                   Otherwise, it returns undefined.
   */
  static getValidIPv4(ip) {
    const match =
      !ip ||
      ip.match(
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
      )
    if (match) {
      if (match[5]) {
        const mask = parseInt(match[5], 10)
        let [a, b, c, d] = ip.split('.').map((x) => parseInt(x, 10))
        // eslint-disable-next-line no-bitwise
        const max = (1 << (32 - mask)) - 1
        const rand = Math.floor(Math.random() * max)
        d += rand
        c += Math.floor(d / 256)
        d %= 256
        b += Math.floor(c / 256)
        c %= 256
        a += Math.floor(b / 256)
        b %= 256
        return `${a}.${b}.${c}.${d}`
      }
      return ip
    }
    return undefined
  }

  /**
   * Get fetchOptions of BingImageCreator.
   * {Object} The fetch options used for BingImageCreator.
   */
  get fetchOptions() {
    let fetchOptions
    return (
      this.options.fetchOptions ??
      (() => {
        if (!fetchOptions) {
          fetchOptions = {
            headers: {
              accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'accept-language': 'en-US,en;q=0.9',
              'cache-control': 'no-cache',
              'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
              'sec-ch-ua-arch': '"x86"',
              'sec-ch-ua-bitness': '"64"',
              'sec-ch-ua-full-version': '"113.0.1774.35"',
              'sec-ch-ua-full-version-list':
                '"Microsoft Edge";v="113.0.1774.35", "Chromium";v="113.0.5672.63", "Not-A.Brand";v="24.0.0.0"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-model': '""',
              'sec-ch-ua-platform': '"Windows"',
              'sec-ch-ua-platform-version': '"11.0.0"',
              'sec-fetch-dest': 'iframe',
              'sec-fetch-mode': 'navigate',
              'sec-fetch-site': 'same-origin',
              cookie:
                this.options.cookies ||
                (this.options.userToken ? `_U=${this.options.userToken}` : undefined),
              pragma: 'no-cache',
              referer: 'https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx',
              'Referrer-Policy': 'origin-when-cross-origin',
              // Workaround for request being blocked due to geolocation
              ...(this.options.xForwardedFor
                ? { 'x-forwarded-for': this.options.xForwardedFor }
                : {}),
              'upgrade-insecure-requests': '1',
              'user-agent': this.options.ua,
              'x-edge-shopping-flag': '1',
            },
          }

          if (this.options.proxy) {
            // fetchOptions.dispatcher = new ProxyAgent(this.options.proxy);
          }
        }

        return fetchOptions
      })()
    )
  }

  /**
   * Decode the HTML entities, a very lite version.
   * @param {string} html - The HTML string to be decoded.
   * @returns {string} Decoded string.
   */
  static decodeHtmlLite(html) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&nbsp;': String.fromCharCode(160),
    }
    return html.replace(/&[a-z]+;/g, (match) => entities[match] || match)
  }

  /**
   * Removes a specific HTML element and its corresponding closing tag from a web page string.
   * @param {string} html - The web page string to be processed.
   * @param {string} tag - The element tag to be removed, such as 'div'.
   * @param {string} tagId - The id of the element to be removed, such as 'giloader'.
   * @returns {string} A new web page string with the specified element and its closing tag removed.
   */
  static removeHtmlTagLite(html, tag, tagId) {
    // Create a regex, matches <tag id="tagId">, id can be at any available position.
    const regex = new RegExp(`<${tag}[^>]*id="${tagId}"[^>]*>`)

    // Find out the start and end position of <tag id="tagId">.
    const match = regex.exec(html)

    // return the original html if nothing matches.
    if (!match) {
      return html
    }

    const start = match.index
    let end = match.index + match[0].length

    // Count the nested tags, the initial value is 0.
    let nested = 0
    let i = end
    let s = i - 1
    let e = s
    const tagStart = `<${tag} `
    const tagEnd = `</${tag}>`

    // loop the string, until find out its matched '</tag>'.
    while (e > 0) {
      if (e < i) {
        e = html.indexOf(tagEnd, i)
      }
      if (e > 0) {
        if (s > 0 && s < i) {
          s = html.indexOf(tagStart, i)
        }
        if (s > 0) {
          i = Math.min(s, e)
          nested += i === s ? ((i += tagStart.length), 1) : ((i += tagEnd.length), -1)
        } else {
          i = e + tagEnd.length
          nested -= 1
        }
        // If nested is -1, the matched '</tag>' is found.
        if (nested === -1) {
          // Update the end position, make it point to the position after </tag>.
          end = i
          // Break the loop;
          break
        }
      }
    }

    // Remove the strings between the '<tag id="tagId">' and the matched '</tag>'.
    return html.slice(0, start) + html.slice(end)
  }

  /**
   * Delay the execution for a given time in millisecond unit.
   * @param {number} ms - The time to be delayed in millisecond unit.
   * @returns {Promise} A promise object that is used to wait.
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * @typedef {Object} BicCreationResult
   * @property {string} contentUrl - A URL pointing to the creation page.
   * @property {string} pollingUrl - The URL to poll the image creation request.
   * @property {string} contentHtml - The source code of the creation page.
   * @property {string} prompt - The prompt for the image generation.
   * @property {string} iframeid -  The message ID refers to the image generation.
   */

  /**
   * Use BIC to generate images according to the given prompt and message ID.
   * @param {string} prompt - The prompt for the image generation. It should be given by 'Sydney'.
   * @param {string} messageId - The message ID refers to the message of 'Sydney'.
   * @returns {BicCreationResult} A BicCreationResult object that contains the result of the creation.
   */
  async genImagePage(prompt, messageId) {
    let telemetryData = ''
    if (this.options.enableTelemetry) {
      telemetryData = `&kseed=${this.telemetry.getNextKSeed()}&SFX=${this.telemetry.getNextInstSuffix()}`
    }

    // https://www.bing.com/images/create?partner=sydney&re=1&showselective=1&sude=1&kseed=8000&SFX=3&q=${encodeURIComponent(prompt)}&iframeid=${messageId}
    const url = `${this.apiurl}${telemetryData}&q=${encodeURIComponent(prompt)}${
      messageId ? `&iframeid=${messageId}` : ''
    }`

    if (this.debug) {
      console.debug(`The url of the request for image creation: ${url}`)
      console.debug()
    }

    const response = await fetch(url, this.fetchOptions)
    const { status } = response
    if (this.debug) {
      console.debug('The response of the request for image creation:')
      console.debug(response)
      console.debug()
    }

    if (status !== 200) {
      throw new Error(`Bing Image Creator Error: response status = ${status}`)
    }

    const body = await response.text()
    let regex = /<div id="gir" data-c="([^"]*)"/
    const pollingUrl = regex.exec(body)?.[1]

    if (!pollingUrl) {
      regex = /<div class="gil_err_mt">(.*?)<\/div>/
      const err = regex.exec(body)?.[1]
      throw new Error(`Bing Image Creator Error: ${err}`)
    }

    return {
      contentUrl: `${response.url}`,
      pollingUrl: `${this.options.host}${this.constructor.decodeHtmlLite(pollingUrl)}`,
      contentHtml: body,
      prompt: `${prompt}`,
      iframeid: `${messageId}`,
    }
  }

  /**
   * @typedef {Object} BicProgressContext
   * @property {string} contentIframe - A iframe element points to the image creation page.
   *                                    Note: This parameter may or may not present, depending on the function you are currently calling
   *                                    or the stage of the function execution. For now, it's presented only when genImageIframeSsr calls
   *                                    the onProgress at the first time.
   * @property {Date} pollingStartTime - The start time of the polling request.
   *                                     Note: This parameter may or may not present, depending on the function you are currently calling
   *                                     or the stage of the function execution. For now, it's presented only in any 'polling' stage callbacks.
   */

  /**
   * Polling the image creation request.
   * @param {string} pollingUrl - The url to poll the image creation request.
   * @param {function({BicProgressContext}):boolean} onProgress - A callback function that will be invoked intervally during the image generation.
   *                                                              Return true to cancel creation.
   * @returns {string} The result html string which contains the generated image links.
   */
  async pollingImgRequest(pollingUrl, onProgress) {
    let polling = true
    let body

    if (typeof onProgress !== 'function') {
      onProgress = () => false
    }

    const pollingStartTime = new Date().getTime()

    while (polling) {
      if (this.debug) {
        console.debug(`polling the image request: ${pollingUrl}`)
      }

      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(pollingUrl, this.fetchOptions)
      const { status } = response

      if (status !== 200) {
        throw new Error(`Bing Image Creator Error: response status = ${status}`)
      }

      // eslint-disable-next-line no-await-in-loop
      body = await response.text()

      if (body && body.indexOf('errorMessage') === -1) {
        polling = false
      } else {
        const cancelRequest = onProgress({ pollingStartTime })
        if (cancelRequest) {
          throw new Error('Bing Image Creator Error: cancelled')
        }

        // eslint-disable-next-line no-await-in-loop
        await this.constructor.sleep(1000)
      }
    }

    return body
  }

  /**
   * Get a list of the generated images.
   * @param {string} prompt - The prompt for the image generation. It should be given by 'Sydney'.
   * @param {string} messageId - The message ID refers to the message of 'Sydney'.
   * @param {boolean} removeSizeLimit - Set it to true to remove the parameters according to the sizes from the reslut image links.
   * @param {function({BicProgressContext}):boolean} onProgress - A callback function that will be invoked intervally during the image generation.
   *                                                              Return true to cancel creation.
   * @returns {string[]} An array containing the url strings of the generated images.
   */
  async genImageList(prompt, messageId, removeSizeLimit, onProgress) {
    const { pollingUrl } = await this.genImagePage(prompt, messageId)
    const resultHtml = await this.pollingImgRequest(pollingUrl, onProgress)
    if (this.debug) {
      console.debug('The result of the request for image creation:')
      console.debug(resultHtml)
      console.debug()
    }

    const regex = /(?<=src=")[^"]+(?=")/g
    return Array.from(resultHtml.matchAll(regex), (match) =>
      (() => {
        const l = this.constructor.decodeHtmlLite(match[0])
        return removeSizeLimit ? l.split('?w=')[0] : l
      })(),
    )
  }

  /**
   * Create a html iframe element with the given src or srcdoc if isDoc is set to true.
   * @param {string} src
   * @param {boolean} isDoc
   * @returns {string} The html string of the iframe created.
   */
  createImageIframe(src, isDoc) {
    return (
      '<iframe role="presentation" style="position:relative;overflow:hidden;width:475px;height:520px;' +
      'border:none;outline:none;padding:0px;margin:0px;display:flex;align-self:flex-start;border-radius:12px;' +
      'box-shadow:0px 0.3px 0.9px rgba(0, 0, 0, 0.12), 0px 1.6px 3.6px rgba(0, 0, 0, 0.16);z-index: 1;" ' +
      `${isDoc ? `srcdoc='${this.rewriteHtml(src)}'` : `src="${src}"`} />`
    )
  }

  /**
   * Rewrite the html by replacing the relative path with the absolute path and escaping the "'".
   * @param {string} html
   * @returns {string} The rewritten html.
   */
  rewriteHtml(html) {
    return html.replace(/'/g, '&#39;').replace(/="\//g, `="${this.options.host}/`)
  }

  /**
   * Mix the the container page and the result page, and 'render' them together into an iframe.
   * @param {string} containerHtml - The container page's html string.
   * @param {string} resultHtml - The result page's html string.
   * @returns {string} The html string of the iframe created.
   */
  renderImageIframe(containerHtml, resultHtml) {
    // "Render" it fastly.
    // Note: It is heavily hard-coded and may break in future upgrades of the BingAI.
    const renderedHtml = this.constructor
      .removeHtmlTagLite(containerHtml, 'div', 'giloader')
      .replace(/<div([^>]*)id="giric"([^>]*)>/, (match, group1, group2) => {
        if (group1.indexOf(' style="') === -1 && group2.indexOf(' style="') === -1) {
          return `<div${group1}id="giric"${group2} style="display: block;">`
        }
        return match
      })
      .replace(/(?<=<div[^>]*?id="giric"[^>]*?>)[\s\S]*?(?=<\/div>)/, `${resultHtml}`)
    return this.createImageIframe(renderedHtml, true)
  }

  /**
   * Create a server side render iframe which uses 'srcdoc' attribute to hold the rendered result page.
   * Unlike genImageIframeSsrLite, it returns an iframe that contains the full content of the result page
   * just like the original bing browser client does.
   * @param {string} prompt - The prompt for the image generation. It should be given by 'Sydney'.
   * @param {string} messageId - The message ID refers to the message of 'Sydney'.
   * @param {function({BicProgressContext}):boolean} onProgress - A callback function that will be invoked intervally during the image generation.
   *                                                              Return true to cancel creation.
   * @returns {string}
   */
  async genImageIframeSsr(prompt, messageId, onProgress) {
    const { contentUrl, pollingUrl, contentHtml } = await this.genImagePage(prompt, messageId)
    if (typeof onProgress === 'function') {
      const cancelRequest = onProgress({ contentIframe: this.createImageIframe(contentUrl) })
      if (cancelRequest) {
        throw new Error('Bing Image Creator Error: cancelled')
      }
    }
    const resultHtml = await this.pollingImgRequest(pollingUrl, onProgress)
    return this.renderImageIframe(contentHtml, resultHtml)
  }

  /**
   * Create a server side render iframe which uses 'srcdoc' attribute to hold the rendered result page.
   * Unlike genImageIframeSsr, it returns an iframe that only contains the content of the image result page.
   * @param {string} prompt - The prompt for the image generation. It should be given by 'Sydney'.
   * @param {string} messageId - The message ID refers to the message of 'Sydney'.
   * @param {function({BicProgressContext}):boolean} onProgress - A callback function that will be invoked intervally during the image generation.
   *                                                              Return true to cancel creation.
   * @returns {string} The html string of the iframe created.
   */
  async genImageIframeSsrLite(prompt, messageId, onProgress) {
    const { pollingUrl } = await this.genImagePage(prompt, messageId)
    const resultHtml = await this.pollingImgRequest(pollingUrl, onProgress)
    return this.createImageIframe(resultHtml, true)
  }

  /**
   * Create a client side render iframe which just points to the image creation page.
   * Note: If this element is returned to client side, the client must be logged in
   * to bing.com in order to generate the image successfully. The user's cookie is
   * required for the polling requests of the generation process.
   * @param prompt {string} - The prompt for the image generation. It should be given by 'Sydney'.
   * @param messageId {string} - The message ID refers to the message of 'Sydney'.
   * @returns {string} The html string of the iframe created.
   */
  async genImageIframeCsr(prompt, messageId) {
    const { contentUrl } = await this.genImagePage(prompt, messageId)
    return this.createImageIframe(contentUrl)
  }

  /**
   * The pattern to match the inline image generation request.
   */
  static get inlineImagePattern() {
    return /!\[(.*?)\]\(#generative_image\)/g
  }

  /**
   * Why is there such a function here? I have seen the messages with inline generative image style at a converation with bing, but only once.
   * The message contains a markdown tag like '![prompt](#generative_image)', and can appear at the middle or end of the message.
   * After starting a new conversation, I couldn't reproduce it anymore. Of course I tried various methods, but none of them works.
   * Maybe it's a new function still in testing.
   * Parse the message object or text, return the prompt for generative image if it exists.
   * @param {string|object} message - The message to parese.
   * @returns {string} The prompt for inline image generation request found in message, or undefined if it is not found.
   */
  static parseInlineGenerativeImage(message) {
    if (typeof message !== 'string') {
      message = message.text
    }

    const match = BingImageCreator.inlineImagePattern.exec(message)
    if (match) {
      return match[1]
    }

    return undefined
  }
}
