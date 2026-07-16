import type { CompletionProvider } from '@conote/ai-core'

// `AiSuggestion` (the data-model interface) is declared alongside the extension
// const of the same name in `aiSuggestion.ts` so TypeScript declaration-merges
// them into a single public export. It is re-exported here for internal use.
export type { AiSuggestion } from './aiSuggestion.js'
import type { AiSuggestion } from './aiSuggestion.js'

/** A named proofreading rule the model applies to the document. */
export interface AiSuggestionRule {
  /** Stable identifier referenced by each suggestion's `ruleId`. */
  id: string
  /** Human-readable label shown in UI. */
  title: string
  /** Instruction handed to the model describing what to look for. */
  prompt: string
  /** Optional color used to style the rule's decorations (exposed as a CSS variable). */
  color?: string
}

/** Lifecycle of a suggestion load, surfaced through storage for UI binding. */
export type AiSuggestionState = 'idle' | 'loading' | 'error'

/** Options for the AI suggestion extension. */
export interface AiSuggestionOptions {
  /** Provider that performs completions (e.g. `OpenRouterProvider` from `@conote/ai-core`). */
  provider: CompletionProvider
  /** Rules the model applies. Suggestions referencing an unknown rule id are dropped. */
  rules: AiSuggestionRule[]
  /** Model passed to the provider when a load does not override it. */
  defaultModel?: string
  /** Sampling temperature passed to the provider when a load does not override it. */
  temperature?: number
}

/**
 * Extension storage. `suggestions` and `selectedId` mirror the authoritative
 * ProseMirror plugin state; `state`, `error`, and `droppedCount` track the last load.
 * Bind UI to these fields.
 */
export interface AiSuggestionStorage {
  /** Current load lifecycle state. */
  state: AiSuggestionState
  /** Last error, set when `state` is `'error'`. Cleared when a new load starts. */
  error: Error | null
  /** Active suggestions, in document order. Mirror of plugin state. */
  suggestions: AiSuggestion[]
  /** Currently selected suggestion id, or `null`. Mirror of plugin state. */
  selectedId: string | null
  /** How many suggestions from the last load were dropped (unmatched or unknown rule). */
  droppedCount: number
}

/** Per-load overrides for `aiSuggestionLoad`. */
export interface AiSuggestionLoadOptions {
  /** Overrides `defaultModel` for this load. */
  model?: string
  /** Overrides `temperature` for this load. */
  temperature?: number
}

declare module '@tiptap/core' {
  interface Storage {
    aiSuggestion: AiSuggestionStorage
  }

  interface Commands<ReturnType> {
    aiSuggestion: {
      /** Fetch suggestions from the provider. Single-flight: returns `false` while a load is in progress. */
      aiSuggestionLoad: (options?: AiSuggestionLoadOptions) => ReturnType
      /** Apply one suggestion: replace its range with `replacementText` and remap the rest. */
      aiSuggestionApply: (id: string) => ReturnType
      /** Reject one suggestion: remove it without changing the document. */
      aiSuggestionReject: (id: string) => ReturnType
      /** Apply every suggestion in one transaction. */
      aiSuggestionApplyAll: () => ReturnType
      /** Remove every suggestion without changing the document. */
      aiSuggestionClear: () => ReturnType
      /** Mark a suggestion selected (or pass `null` to clear the selection). */
      aiSuggestionSelect: (id: string | null) => ReturnType
    }
  }
}
