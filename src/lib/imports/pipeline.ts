import 'server-only'
import sharp from 'sharp'
import { createServerSupabase } from '@/lib/supabase/server'
import { AppError, fromDbError } from '@/lib/errors'
import { asJson } from '@/lib/supabase/json'
import { runAITask } from '@/lib/ai/service'
import type { ImportData } from '@/lib/ai/tasks'
import { detectFileType, IMAGE_TYPES } from '@/lib/media/validate'
import { extractDocumentText, htmlToText, normalize } from './extract'
import { fetchPublicPage } from './fetch-url'
import { importGitHub } from './github'
import { heuristicExtract } from './heuristic'

// Input → import job → extract text (OCR for images) → AI structuring (rule-based fallback)
// → status "review". Nothing touches the profile until the user applies selected items.
// Runs inline for now (a CV takes a few seconds); the job row makes moving it to a queue a drop-in change.

export type ImportSource = 'resume_pdf' | 'resume_docx' | 'linkedin_pdf' | 'website_url' | 'github_url' | 'text' | 'image'
type Ctx = { workspaceId: string; userId: string; profileId: string }

export async function runImport(ctx: Ctx, source: ImportSource, payload: { file?: File; url?: string; text?: string }) {
  const supabase = await createServerSupabase()
  const { data: job, error } = await supabase.from('imports').insert({
    workspace_id: ctx.workspaceId, profile_id: ctx.profileId, created_by: ctx.userId, source_key: source,
    source_url: payload.url?.slice(0, 500) ?? null, status: 'extracting',
  }).select('id').single()
  if (error) throw fromDbError(error)
  const update = (patch: Record<string, unknown>) => supabase.from('imports').update(patch as never).eq('id', job.id)

  try {
    let text = ''
    let direct: ImportData | null = null
    const meta: Record<string, unknown> = { source }

    if (source === 'github_url') {
      const r = await importGitHub(payload.url ?? '')
      direct = r.data; text = r.text; meta.method = 'github_api'
    } else if (source === 'website_url') {
      const page = await fetchPublicPage(payload.url ?? '')
      text = htmlToText(page.html); meta.final_url = page.url
    } else if (source === 'text') {
      text = normalize(payload.text ?? '')
    } else {
      const file = payload.file
      if (!file) throw new AppError('VALIDATION_ERROR', 'Choose a file to import.')
      if (file.size > 15 * 1024 * 1024) throw new AppError('FILE_TOO_LARGE', 'Files must be under 15 MB.')
      const bytes = new Uint8Array(await file.arrayBuffer())
      const type = detectFileType(bytes)
      if (source === 'image') {
        if (!type || !IMAGE_TYPES.has(type)) throw new AppError('UNSUPPORTED_FILE', 'Upload a JPG, PNG or WebP image.')
        const jpeg = await sharp(bytes, { limitInputPixels: 50_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
        const ocr = await runAITask(ctx, 'ocr_processing', { image_data_url: `data:image/jpeg;base64,${jpeg.toString('base64')}` })
        text = normalize(ocr.output.text); meta.ocr = true
      } else {
        if (type !== 'application/pdf' && type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          throw new AppError('UNSUPPORTED_FILE', 'Upload a PDF or Word (.docx) file.')
        }
        text = await extractDocumentText(bytes, type)
        if (text.length < 40 && type === 'application/pdf') {
          throw new AppError('IMPORT_FAILED', 'This PDF looks like a scan with no text layer. Upload it as an image (photo or screenshot) to read it with OCR.')
        }
      }
    }

    if (!direct && text.length < 20) throw new AppError('IMPORT_FAILED', 'We couldn’t find enough text to import.')
    await update({ status: 'structuring', extracted_text: text })

    let structured = direct
    if (!structured) {
      try {
        const task = source === 'website_url' ? 'url_extraction' : 'document_extraction'
        const r = task === 'url_extraction'
          ? await runAITask(ctx, 'url_extraction', { text, url: payload.url ?? '' })
          : await runAITask(ctx, 'document_extraction', { text })
        structured = r.output as ImportData
        meta.method = r.provider === 'mock' ? 'rules' : 'ai'
        meta.provider = r.provider
      } catch (e) {
        // No AI (not configured, out of credits, or not in plan): use rule-based extraction and say so.
        if (!(e instanceof AppError) || !['AI_UNAVAILABLE', 'AI_CREDITS_EXHAUSTED', 'FEATURE_NOT_AVAILABLE', 'RATE_LIMITED'].includes(e.code)) throw e
        structured = heuristicExtract(text)
        meta.method = 'rules'
        meta.fallback_reason = e.code
      }
    }
    await update({ status: 'review', structured: asJson(structured), raw_metadata: asJson(meta) })
    return job.id
  } catch (e) {
    const err = e instanceof AppError ? e : new AppError('IMPORT_FAILED', 'Import failed. Please try another file or link.')
    await update({ status: 'failed', error_code: err.code, error_message: err.message })
    throw err
  }
}
