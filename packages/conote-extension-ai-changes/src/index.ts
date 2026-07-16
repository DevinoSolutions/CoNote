import { AiChanges } from './aiChanges.js'

export { AiChanges } from './aiChanges.js'
export {
  aiChangesPluginKey,
  createAiChangesPlugin,
  CHANGE_DEL_CLASS,
  CHANGE_INS_CLASS,
  CHANGE_SELECTED_SUFFIX,
} from './plugin.js'
export type { AiChangesPluginState } from './plugin.js'
export { anchorHunk, buildDocTextIndex, docPlainText } from './locate.js'
export type { DocTextIndex } from './locate.js'
export { collapseWhitespace, diffWords, isWhitespaceOnlyEdit, tokenize } from './diff.js'
export type { DiffHunk } from './diff.js'
export { normalizeReplacement } from './apply.js'
export { buildChangeMessages, CHANGE_SYSTEM_PROMPT, stripFences } from './prompts.js'
export type {
  AiChange,
  AiChangesOptions,
  AiChangesProposeOptions,
  AiChangesState,
  AiChangesStorage,
} from './types.js'

export default AiChanges
