// File type detection from content (magic bytes), never from the client-supplied name or MIME.

export type DetectedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function detectFileType(buf: Uint8Array): DetectedType | null {
  const at = (i: number, bytes: number[]) => bytes.every((b, k) => buf[i + k] === b)
  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp'
  if (at(0, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'
  // DOCX is a ZIP containing word/document.xml.
  if (at(0, [0x50, 0x4b, 0x03, 0x04])) {
    const head = new TextDecoder('latin1').decode(buf.subarray(0, Math.min(buf.length, 64 * 1024)))
    if (head.includes('word/') || head.includes('[Content_Types].xml')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return null
}

export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const PURPOSES = {
  avatar: { bucket: 'avatars', maxBytes: 5 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 800 },
  cover: { bucket: 'profile-media', maxBytes: 10 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 2400 },
  gallery: { bucket: 'profile-media', maxBytes: 10 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 2000 },
  project: { bucket: 'portfolio', maxBytes: 10 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 2000 },
  website: { bucket: 'website-assets', maxBytes: 10 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 2400 },
  general: { bucket: 'profile-media', maxBytes: 10 * 1024 * 1024, types: IMAGE_TYPES, maxDim: 2000 },
  document: { bucket: 'documents', maxBytes: 10 * 1024 * 1024, types: new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']), maxDim: 0 },
} as const
export type Purpose = keyof typeof PURPOSES
export const isPurpose = (v: unknown): v is Purpose => typeof v === 'string' && v in PURPOSES
