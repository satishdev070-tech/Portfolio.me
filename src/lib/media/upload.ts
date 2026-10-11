import 'server-only'
import { randomUUID } from 'node:crypto'
import { createServerSupabase } from '@/lib/supabase/server'
import { AppError, fromDbError } from '@/lib/errors'
import { detectFileType, IMAGE_TYPES, PURPOSES, type Purpose } from './validate'
import { toWebp } from './process'

export interface StoredAsset { id: string; public_url: string | null; bucket: string; path: string; mime_type: string; width: number | null; height: number | null; size_bytes: number }

/** Validate, optimize and store a file for the viewer's workspace. Storage RLS + the DB quota trigger apply. */
export async function storeUpload(workspaceId: string, userId: string, file: File, purpose: Purpose, altText?: string): Promise<StoredAsset> {
  const rule = PURPOSES[purpose]
  if (file.size === 0) throw new AppError('UNSUPPORTED_FILE', 'The file is empty.')
  if (file.size > rule.maxBytes) throw new AppError('FILE_TOO_LARGE', `Files must be under ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`)
  const raw = new Uint8Array(await file.arrayBuffer())
  const detected = detectFileType(raw)
  if (!detected || !(rule.types as Set<string>).has(detected)) {
    throw new AppError('UNSUPPORTED_FILE', IMAGE_TYPES.has(detected ?? '') || purpose !== 'document' ? 'Upload a JPG, PNG or WebP image.' : 'Upload a PDF or Word (.docx) file.')
  }

  let body = raw
  let mime: string = detected
  let width: number | null = null
  let height: number | null = null
  let ext = detected === 'application/pdf' ? 'pdf' : 'docx'
  if (IMAGE_TYPES.has(detected)) {
    try {
      const out = await toWebp(raw, rule.maxDim)
      body = out.data; width = out.width; height = out.height; mime = 'image/webp'; ext = 'webp'
    } catch {
      throw new AppError('UNSUPPORTED_FILE', 'This image could not be read. Try a different file.')
    }
  }

  const supabase = await createServerSupabase()
  const path = `${workspaceId}/${purpose}/${randomUUID()}.${ext}`
  const up = await supabase.storage.from(rule.bucket).upload(path, body, { contentType: mime, cacheControl: '31536000', upsert: false })
  if (up.error) {
    if (/row-level security|unauthorized|403/i.test(up.error.message)) throw new AppError('STORAGE_LIMIT_REACHED', 'Upload not allowed. You may have reached your storage limit.')
    throw new AppError('INTERNAL_ERROR', 'Upload failed. Please try again.')
  }
  const isPublic = rule.bucket !== 'documents'
  const publicUrl = isPublic ? supabase.storage.from(rule.bucket).getPublicUrl(path).data.publicUrl : null

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      workspace_id: workspaceId, uploaded_by: userId, bucket: rule.bucket, path, public_url: publicUrl, mime_type: mime,
      size_bytes: body.byteLength, width, height, purpose, alt_text: altText?.slice(0, 300) || null, original_name: file.name.slice(0, 200),
    })
    .select('id, public_url, bucket, path, mime_type, width, height, size_bytes')
    .single()
  if (error) {
    await supabase.storage.from(rule.bucket).remove([path])
    throw fromDbError(error)
  }
  return data
}
