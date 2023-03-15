export function getConversationPairs(records, isChatgpt) {
  let pairs
  if (isChatgpt) {
    pairs = []
    for (const record of records) {
      pairs.push({ role: 'user', content: record['question'] })
      pairs.push({ role: 'assistant', content: record['answer'] })
    }
  } else {
    pairs = ''
    for (const record of records) {
      pairs += 'Human:' + record.question + '\nAI:' + record.answer + '\n'
    }
  }

  return pairs
}
