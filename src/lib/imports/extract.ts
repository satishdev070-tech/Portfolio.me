import 'server-only'
import { AppError } from '@/lib/errors'

/** Extract plain text from an uploaded PDF or DOCX. Images go through OCR instead (see pipeline). */
export async function extractDocumentText(bytes: Uint8Array, mime: string): Promise<string> {
  try {
    if (mime === 'application/pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf')
      const pdf = await getDocumentProxy(bytes)
      if (pdf.numPages > 30) throw new AppError('IMPORT_FAILED', 'That PDF is too long. Upload a CV of up to 30 pages.')
      const { text } = await extractText(pdf, { mergePages: true })
      return normalize(Array.isArray(text) ? text.join('\n') : text)
    }
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
    return normalize(value)
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('IMPORT_FAILED', 'We couldn’t read that file. Is it password protected or damaged?')
  }
}

export function normalize(text: string) {
  return text.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 60_000)
}

/** Readable text from HTML: drops scripts/styles/nav chrome, keeps block boundaries as newlines. */
export function htmlToText(html: string) {
  return normalize(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(br|hr)\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|li|h[1-6]|tr|header|footer|ul|ol|dd|dt)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).join('\n'),
  )
}
