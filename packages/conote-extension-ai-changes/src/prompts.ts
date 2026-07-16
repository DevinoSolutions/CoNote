import type { ChatMessage } from '@conote/ai-core'

/** Instruction telling the model to return only the revised text. */
export const CHANGE_SYSTEM_PROMPT =
  'You are an editing assistant. Rewrite the provided text according to the user instruction. ' +
  'Respond with ONLY the revised text: no preamble, no explanation, no markdown, and no code ' +
  'fences. Preserve paragraph breaks as newlines. If the instruction requires no change, return ' +
  'the text exactly as given.'

/** Assembles the message list sent to the provider for a rewrite. */
export function buildChangeMessages(text: string, instruction: string): ChatMessage[] {
  const user = `Instruction:\n${instruction}\n\nText:\n"""\n${text}\n"""`
  return [
    { role: 'system', content: CHANGE_SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

/** Removes an optional surrounding markdown code fence from a model response. */
export function stripFences(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^```(?:[\w-]+)?\s*\n?([\s\S]*?)\n?```$/)
  return match ? match[1] : trimmed
}
