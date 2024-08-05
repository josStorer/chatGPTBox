import { createParser } from './eventsource-parser.mjs'

export async function fetchSSE(resource, options) {
  const { onMessage, onStart, onEnd, onError, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions).catch(async (err) => {
    await onError(err)
  })
  if (!resp) return
  if (!resp.ok) {
    await onError(resp)
    return
  }
  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data)
    }
  })
  let hasStarted = false
  const reader = resp.body.getReader()
  let result
  while (!(result = await reader.read()).done) {
    const chunk = result.value
    if (!hasStarted) {
      const str = new TextDecoder().decode(chunk)
      hasStarted = true
      await onStart(str)

      let fakeSseData
      try {
        const commonResponse = JSON.parse(str)
        fakeSseData = 'data: ' + JSON.stringify(commonResponse) + '\n\ndata: [DONE]\n\n'
      } catch (error) {
        console.debug('not common response', error)
      }
      if (fakeSseData) {
        parser.feed(new TextEncoder().encode(fakeSseData))
        break
      }
    }
    parser.feed(chunk)
  }
  await onEnd()
}
