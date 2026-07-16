import type { CompletionProvider, CompletionRequest } from '@conote/ai-core'

interface Deferred {
  promise: Promise<void>
  resolve: () => void
}

function deferred(): Deferred {
  let resolve!: () => void
  const promise = new Promise<void>(res => {
    resolve = res
  })
  return { promise, resolve }
}

function whenAborted(signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise<void>(() => {})
  }
  if (signal.aborted) {
    return Promise.resolve()
  }
  return new Promise<void>(res => {
    signal.addEventListener('abort', () => res(), { once: true })
  })
}

function abortError(): Error {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

export interface FakeProviderOptions {
  /** When set, each chunk waits for a matching `open(i)` before it is yielded. */
  gated?: boolean
  /** Error thrown by the stream. */
  error?: Error
  /** Chunk index after which `error` is thrown; omit to throw before any chunk. */
  errorAfter?: number
}

/**
 * Scripted `CompletionProvider` for tests. Records every request it receives and,
 * when `gated`, lets a test release chunks one at a time to control timing.
 */
export class FakeProvider implements CompletionProvider {
  readonly calls: CompletionRequest[] = []
  private readonly gates: Deferred[]

  constructor(
    private readonly chunks: string[],
    private readonly options: FakeProviderOptions = {},
  ) {
    this.gates = options.gated ? chunks.map(() => deferred()) : []
  }

  get lastRequest(): CompletionRequest | undefined {
    return this.calls[this.calls.length - 1]
  }

  /** Release the chunk at index `i` (gated mode only). */
  open(i: number): void {
    this.gates[i]?.resolve()
  }

  /** Release every chunk (gated mode only). */
  openAll(): void {
    this.gates.forEach(gate => gate.resolve())
  }

  async complete(request: CompletionRequest): Promise<string> {
    let result = ''
    for await (const chunk of this.stream(request)) {
      result += chunk
    }
    return result
  }

  async *stream(request: CompletionRequest): AsyncIterable<string> {
    this.calls.push(request)
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.options.gated) {
        await Promise.race([this.gates[i].promise, whenAborted(request.signal)])
      } else {
        await Promise.resolve()
      }
      if (request.signal?.aborted) {
        throw abortError()
      }
      if (this.options.error && this.options.errorAfter === i) {
        throw this.options.error
      }
      yield this.chunks[i]
    }
    if (this.options.error && this.options.errorAfter === undefined) {
      throw this.options.error
    }
  }
}
