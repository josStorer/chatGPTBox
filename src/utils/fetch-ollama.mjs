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
  let hasStarted = false
  const reader = resp.body.getReader()
  let result
  while (!(result = await reader.read()).done) {
    const chunk = result.value
    const str = new TextDecoder().decode(chunk)
    if (!hasStarted) {
      const str = new TextDecoder().decode(chunk)
      hasStarted = true
      await onStart(str)
    }
    let data = JSON.parse(str)
    onMessage(data)
    if (data.done) break
  }
  await onEnd()
}
