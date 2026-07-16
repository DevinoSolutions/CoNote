import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Plugin state that tracks where the next streamed chunk should be inserted.
 * `pos` is remapped through every transaction so concurrent edits (including the
 * streamed insertions themselves) keep the insertion cursor consistent.
 */
export interface AiPluginState {
  pos: number | null
}

export const aiPluginKey = new PluginKey<AiPluginState>('conoteAi')

type AiPluginMeta = { type: 'init'; pos: number } | { type: 'clear' }

/**
 * Creates the ProseMirror plugin backing streamed insertion. The plugin does not
 * touch the document; it only maintains a mapped insertion position.
 */
export function createAiPlugin(): Plugin<AiPluginState> {
  return new Plugin<AiPluginState>({
    key: aiPluginKey,
    state: {
      init(): AiPluginState {
        return { pos: null }
      },
      apply(tr, value): AiPluginState {
        const meta = tr.getMeta(aiPluginKey) as AiPluginMeta | undefined
        if (meta?.type === 'init') {
          return { pos: meta.pos }
        }
        if (meta?.type === 'clear') {
          return { pos: null }
        }
        if (value.pos == null) {
          return value
        }
        // Bias to the right so text inserted at `pos` advances the cursor past it.
        return { pos: tr.mapping.map(value.pos, 1) }
      },
    },
  })
}
