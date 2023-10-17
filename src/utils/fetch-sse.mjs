import { createParser } from 'eventsource-parser'
import { streamAsyncIterable } from './stream-async-iterable'

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
      if (event.data === '[DONE]') {
        onMessage(event.data)
      } else {
        try {
          JSON.parse(event.data)
          onMessage(event.data)
        } catch (error) {
          console.error('json error', error)
          onMessage(
            event.data
              .replace(/^"|"$/g, '')
              .replaceAll('\\"', '"')
              .replaceAll('\\\\u', '\\u')
              .replaceAll('\\\\n', '\\n'),
          )
        }
      }
    }
  })
  let hasStarted = false
  for await (const chunk of streamAsyncIterable(resp.body)) {
    const str = new TextDecoder().decode(chunk)
    parser.feed(str)

    if (!hasStarted) {
      hasStarted = true
      await onStart(str)
    }
  }
  await onEnd()
}
