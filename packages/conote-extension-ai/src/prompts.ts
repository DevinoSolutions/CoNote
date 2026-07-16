import type { ChatMessage } from '@conote/ai-core'

/** Base system prompt shared by every command unless overridden via options. */
export const DEFAULT_SYSTEM_PROMPT =
  'You are a writing assistant embedded in a rich-text editor. Output only the requested text without preamble, commentary, or surrounding quotes.'

/** Per-command instructions appended to the system prompt. */
export const INSTRUCTIONS = {
  complete:
    'Continue the text from where it ends. Match the existing voice, tone, and style. Do not repeat the provided text; output only the continuation.',
  rewrite:
    'Rewrite the text to improve clarity, flow, and readability while preserving its original meaning. Output only the rewritten text.',
  summarize: 'Summarize the text concisely, capturing its key points. Output only the summary.',
} as const

export function toneInstruction(tone: string): string {
  return `Rewrite the text in a ${tone} tone. Preserve the original meaning. Output only the rewritten text.`
}

export function translateInstruction(language: string): string {
  return `Translate the text into ${language}. Preserve meaning and formatting. Output only the translation.`
}

export function customInstruction(prompt: string): string {
  return `Apply the following instruction to the text.\n\nInstruction: ${prompt}`
}

/**
 * Assembles the message list sent to the provider. The base prompt and the
 * command instruction are combined into the leading system message; optional
 * document context becomes a second system message; the input is the user turn.
 */
export function buildMessages(params: {
  system: string
  instruction: string
  context?: string
  input: string
}): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: `${params.system}\n\n${params.instruction}` },
  ]
  if (params.context && params.context.trim().length > 0) {
    messages.push({ role: 'system', content: `Additional document context:\n${params.context}` })
  }
  messages.push({ role: 'user', content: params.input })
  return messages
}
