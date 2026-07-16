import type { CompletionProvider } from '@conote/ai-core'

/** Lifecycle of the AI extension, surfaced through storage for UI binding. */
export type AiState = 'idle' | 'pending' | 'streaming' | 'error'

/** How generated text is written into the document. */
export type AiInsertMode = 'cursor' | 'replaceSelection'

/**
 * Options for the AI extension.
 */
export interface AiOptions {
  /** Provider that performs completions (e.g. `OpenRouterProvider` from `@conote/ai-core`). */
  provider: CompletionProvider
  /** Model passed to the provider when a command does not override it. */
  defaultModel?: string
  /** Sampling temperature passed to the provider when a command does not override it. */
  temperature?: number
  /** Overrides the base system prompt shared by every command. */
  systemPrompt?: string
  /** Supplies extra document context appended to the prompt as a system message. */
  context?: () => string
}

/**
 * Extension storage. Commands read and mutate `editor.storage.ai`; bind UI to these fields.
 */
export interface AiStorage {
  /** Current lifecycle state. */
  state: AiState
  /** Last error, set when `state` is `'error'`. Cleared when a new request starts. */
  error: Error | null
  /** Controller for the in-flight request, or `null` when idle. */
  abortController: AbortController | null
}

/**
 * Per-command overrides.
 */
export interface AiCommandOptions {
  /** Overrides `defaultModel` for this call. */
  model?: string
  /** Overrides `temperature` for this call. */
  temperature?: number
  /** Overrides the command's default insertion behavior. */
  insert?: AiInsertMode
}

declare module '@tiptap/core' {
  interface Storage {
    ai: AiStorage
  }

  interface Commands<ReturnType> {
    ai: {
      /** Continue writing from the cursor using the preceding text as context. Inserts at the cursor. */
      aiComplete: (options?: AiCommandOptions) => ReturnType
      /** Rewrite the current selection. Requires a non-empty selection; replaces it. */
      aiRewrite: (options?: AiCommandOptions) => ReturnType
      /** Summarize the selection, or the whole document when the selection is empty. */
      aiSummarize: (options?: AiCommandOptions) => ReturnType
      /** Change the tone of the current selection. Requires a non-empty selection; replaces it. */
      aiAdjustTone: (tone: string, options?: AiCommandOptions) => ReturnType
      /** Translate the current selection. Requires a non-empty selection; replaces it. */
      aiTranslate: (language: string, options?: AiCommandOptions) => ReturnType
      /** Apply an arbitrary instruction to the selection (replace), or at the cursor when empty (insert). */
      aiCustomPrompt: (prompt: string, options?: AiCommandOptions) => ReturnType
      /** Abort the in-flight request. Returns `true` if something was aborted. */
      aiAbort: () => ReturnType
    }
  }
}
