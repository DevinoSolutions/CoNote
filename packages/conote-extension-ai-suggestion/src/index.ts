import { AiSuggestion } from './aiSuggestion.js'

export { AiSuggestion } from './aiSuggestion.js'
export {
  aiSuggestionPluginKey,
  createAiSuggestionPlugin,
  SUGGESTION_CLASS,
  SUGGESTION_SELECTED_CLASS,
} from './plugin.js'
export type { AiSuggestionPluginState } from './plugin.js'
export {
  buildDocTextIndex,
  docPlainText,
  locateSuggestion,
} from './locate.js'
export type { DocTextIndex } from './locate.js'
export {
  buildSuggestionMessages,
  parseSuggestionResponse,
  SUGGESTION_SYSTEM_PROMPT,
} from './prompts.js'
export type { RawSuggestion } from './prompts.js'
// `AiSuggestion` (the data-model type) is re-exported together with the extension
// const above via `./aiSuggestion.js`, where the two names declaration-merge.
export type {
  AiSuggestionLoadOptions,
  AiSuggestionOptions,
  AiSuggestionRule,
  AiSuggestionState,
  AiSuggestionStorage,
} from './types.js'

export default AiSuggestion
