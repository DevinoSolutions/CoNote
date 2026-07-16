import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import type { AiSuggestion, AiSuggestionRule, AiSuggestionStorage } from './types.js'

/** Authoritative state for suggestions and their decorations. */
export interface AiSuggestionPluginState {
  suggestions: AiSuggestion[]
  selectedId: string | null
  decorations: DecorationSet
}

export const aiSuggestionPluginKey = new PluginKey<AiSuggestionPluginState>('conoteAiSuggestion')

type AiSuggestionMeta =
  | { type: 'set'; suggestions: AiSuggestion[] }
  | { type: 'select'; id: string | null }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

/** CSS class applied to every suggestion decoration. */
export const SUGGESTION_CLASS = 'conote-ai-suggestion'
/** Modifier class added to the selected suggestion's decoration. */
export const SUGGESTION_SELECTED_CLASS = 'conote-ai-suggestion--selected'

function ruleColorMap(rules: AiSuggestionRule[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const rule of rules) {
    if (rule.color) {
      map.set(rule.id, rule.color)
    }
  }
  return map
}

function buildDecorations(
  doc: ProseMirrorNode,
  suggestions: AiSuggestion[],
  selectedId: string | null,
  ruleColors: Map<string, string>,
): DecorationSet {
  if (suggestions.length === 0) {
    return DecorationSet.empty
  }
  const decorations = suggestions.map(suggestion => {
    const classes = [SUGGESTION_CLASS]
    if (suggestion.id === selectedId) {
      classes.push(SUGGESTION_SELECTED_CLASS)
    }
    const attrs: Record<string, string> = {
      class: classes.join(' '),
      'data-rule-id': suggestion.ruleId,
    }
    const color = ruleColors.get(suggestion.ruleId)
    if (color) {
      attrs.style = `--conote-ai-suggestion-color: ${color}`
    }
    return Decoration.inline(suggestion.range.from, suggestion.range.to, attrs, {
      id: suggestion.id,
    })
  })
  return DecorationSet.create(doc, decorations)
}

/**
 * Maps each suggestion range through a document-changing transaction and drops
 * any whose mapped range no longer contains exactly its `deleteText`. This is
 * what invalidates a suggestion when the user edits inside it while keeping it
 * (shifted) when they edit before it.
 */
function mapSuggestions(
  tr: Transaction,
  doc: ProseMirrorNode,
  suggestions: AiSuggestion[],
): AiSuggestion[] {
  const out: AiSuggestion[] = []
  for (const suggestion of suggestions) {
    const from = tr.mapping.map(suggestion.range.from, 1)
    const to = tr.mapping.map(suggestion.range.to, -1)
    if (to <= from) {
      continue
    }
    if (doc.textBetween(from, to) !== suggestion.deleteText) {
      continue
    }
    out.push({ ...suggestion, range: { from, to } })
  }
  return out
}

/**
 * Creates the ProseMirror plugin that owns suggestions and renders them as
 * inline decorations. Suggestions are remapped through every transaction and
 * mirrored into `storage` for UI binding after each view update.
 */
export function createAiSuggestionPlugin(config: {
  rules: AiSuggestionRule[]
  storage: AiSuggestionStorage
}): Plugin<AiSuggestionPluginState> {
  const ruleColors = ruleColorMap(config.rules)

  return new Plugin<AiSuggestionPluginState>({
    key: aiSuggestionPluginKey,
    state: {
      init(): AiSuggestionPluginState {
        return { suggestions: [], selectedId: null, decorations: DecorationSet.empty }
      },
      apply(tr, value, _oldState, newState): AiSuggestionPluginState {
        const meta = tr.getMeta(aiSuggestionPluginKey) as AiSuggestionMeta | undefined

        let suggestions = value.suggestions
        let selectedId = value.selectedId

        if (tr.docChanged) {
          suggestions = mapSuggestions(tr, newState.doc, suggestions)
        }

        if (meta) {
          if (meta.type === 'set') {
            suggestions = meta.suggestions
            selectedId = null
          } else if (meta.type === 'select') {
            selectedId = meta.id
          } else if (meta.type === 'remove') {
            suggestions = suggestions.filter(suggestion => suggestion.id !== meta.id)
          } else if (meta.type === 'clear') {
            suggestions = []
            selectedId = null
          }
        }

        if (selectedId && !suggestions.some(suggestion => suggestion.id === selectedId)) {
          selectedId = null
        }

        if (
          !meta &&
          !tr.docChanged &&
          suggestions === value.suggestions &&
          selectedId === value.selectedId
        ) {
          return value
        }

        return {
          suggestions,
          selectedId,
          decorations: buildDecorations(newState.doc, suggestions, selectedId, ruleColors),
        }
      },
    },
    props: {
      decorations(state) {
        return aiSuggestionPluginKey.getState(state)?.decorations ?? DecorationSet.empty
      },
    },
    view() {
      return {
        update(view) {
          const pluginState = aiSuggestionPluginKey.getState(view.state)
          if (!pluginState) {
            return
          }
          config.storage.suggestions = pluginState.suggestions
          config.storage.selectedId = pluginState.selectedId
        },
      }
    },
  })
}
