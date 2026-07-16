import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/** The horizontal spaces we collapse at a replacement seam (never newlines). */
function isSeamSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t'
}

/** Character immediately before `pos`, or '' at a block/document boundary. */
function charBefore(doc: ProseMirrorNode, pos: number): string {
  if (pos <= 0) {
    return ''
  }
  return doc.textBetween(pos - 1, pos)
}

/** Character immediately after `pos`, or '' at a block/document boundary. */
function charAfter(doc: ProseMirrorNode, pos: number): string {
  if (pos >= doc.content.size) {
    return ''
  }
  return doc.textBetween(pos, pos + 1)
}

/**
 * Adjusts a replacement so applying it never doubles a space against the text it
 * abuts. Leading/trailing spaces of `text` are dropped when they would sit next
 * to an existing space, and — when the replacement is empty (a deletion) with a
 * space on both sides — the range is widened by one so the two neighbours keep
 * single spacing. Interior spacing of `text` is left untouched and no space is
 * ever invented, so a deliberate word-join survives.
 */
export function normalizeReplacement(
  doc: ProseMirrorNode,
  from: number,
  to: number,
  text: string,
): { text: string; from: number; to: number } {
  let out = text
  let end = to

  if (isSeamSpace(charBefore(doc, from))) {
    let i = 0
    while (i < out.length && isSeamSpace(out[i])) {
      i++
    }
    out = out.slice(i)
  }

  if (isSeamSpace(charAfter(doc, to))) {
    let j = out.length
    while (j > 0 && isSeamSpace(out[j - 1])) {
      j--
    }
    out = out.slice(0, j)
  }

  if (out === '' && isSeamSpace(charBefore(doc, from)) && isSeamSpace(charAfter(doc, to))) {
    end = to + 1
  }

  return { text: out, from, to: end }
}
