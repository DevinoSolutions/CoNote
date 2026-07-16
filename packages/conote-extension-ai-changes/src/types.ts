import type { CompletionProvider } from '@conote/ai-core'

/**
 * A single reviewable change: replace the document text in `range` (equal to
 * `oldText`) with `newText`. A pure insertion has an empty `range` (`from === to`)
 * and `oldText === ''`; a pure deletion has `newText === ''`.
 */
export interface AiChange {
  /** Generated identifier, unique within a proposal. */
  id: string
  /** ProseMirror positions of the old text, remapped on every edit. */
  range: { from: number; to: number }
  /** Exact document text the change replaces; used to validate the range after edits. */
  oldText: string
  /** Text that replaces `oldText` when the change is accepted. */
  newText: string
}

/** Lifecycle of a proposal, surfaced through storage for UI binding. */
export type AiChangesState = 'idle' | 'loading' | 'error'

/** Options for the AI changes extension. */
export interface AiChangesOptions {
  /** Provider that performs completions (e.g. `OpenRouterProvider` from `@conote/ai-core`). */
  provider: CompletionProvider
  /** Model passed to the provider when a proposal does not override it. */
  defaultModel?: string
  /** Sampling temperature passed to the provider when a proposal does not override it. */
  temperature?: number
}

/**
 * Extension storage. `changes` and `selectedId` mirror the authoritative
 * ProseMirror plugin state; `state` and `error` track the last proposal.
 * Bind UI to these fields.
 */
export interface AiChangesStorage {
  /** Current proposal lifecycle state. */
  state: AiChangesState
  /** Last error, set when `state` is `'error'`. Cleared when a new proposal starts. */
  error: Error | null
  /** Active changes, in document order. Mirror of plugin state. */
  changes: AiChange[]
  /** Currently selected change id, or `null`. Mirror of plugin state. */
  selectedId: string | null
}

/** Arguments for `aiChangesPropose`. */
export interface AiChangesProposeOptions {
  /** The user instruction describing the edit to make. */
  prompt: string
  /** Overrides `defaultModel` for this proposal. */
  model?: string
  /** Overrides `temperature` for this proposal. */
  temperature?: number
}

declare module '@tiptap/core' {
  interface Storage {
    aiChanges: AiChangesStorage
  }

  interface Commands<ReturnType> {
    aiChanges: {
      /** Ask the provider to rewrite the selection (or whole doc) and stage the diff. Single-flight: returns `false` while a proposal is in progress. */
      aiChangesPropose: (options: AiChangesProposeOptions) => ReturnType
      /** Accept one change: replace its range with `newText`, drop it, and remap the rest. */
      aiChangesAccept: (id: string) => ReturnType
      /** Reject one change: drop it without changing the document. */
      aiChangesReject: (id: string) => ReturnType
      /** Accept every change in one transaction. */
      aiChangesAcceptAll: () => ReturnType
      /** Drop every change without changing the document. */
      aiChangesRejectAll: () => ReturnType
      /** Mark a change selected (or pass `null` to clear the selection). */
      aiChangesSelect: (id: string | null) => ReturnType
      /** Stage changes programmatically. Invalid ranges (out of bounds or mismatched `oldText`) are dropped. */
      aiChangesSet: (changes: Array<Omit<AiChange, 'id'>>) => ReturnType
    }
  }
}
