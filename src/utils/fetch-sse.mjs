import { createParser } from 'eventsource-parser'
import { streamAsyncIterable } from './stream-async-iterable'

export async function fetchSSE(resource, options) {
  const { onMessage, onStart, onEnd, onError, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions)
  if (!resp.ok) {
    await onError(resp)
  }
  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data)
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
