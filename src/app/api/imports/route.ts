import { assertViewer, getCurrentWebsite } from '@/lib/auth'
import { assertSameOrigin } from '@/lib/csrf'
import { AppError, route } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { runImport, type ImportSource } from '@/lib/imports/pipeline'

export const runtime = 'nodejs'
export const maxDuration = 120

const FILE_SOURCES = new Set(['resume_pdf', 'resume_docx', 'linkedin_pdf', 'image'])
const URL_SOURCES = new Set(['website_url', 'github_url'])

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request)
    const viewer = await assertViewer()
    if (viewer.role === 'viewer') throw new AppError('FORBIDDEN', 'You cannot import into this workspace.')
    checkRateLimit(`import:${viewer.userId}`, 10, 10 * 60_000)
    const site = await getCurrentWebsite()
    if (!site) throw new AppError('NOT_FOUND', 'Create your website first.')
    const ctx = { workspaceId: viewer.workspaceId, userId: viewer.userId, profileId: site.profile_id }

    const form = await request.formData()
    const source = String(form.get('source') ?? '')
    if (FILE_SOURCES.has(source)) {
      const file = form.get('file')
      if (!(file instanceof File)) throw new AppError('VALIDATION_ERROR', 'Choose a file to import.')
      return { id: await runImport(ctx, source as ImportSource, { file }) }
    }
    if (URL_SOURCES.has(source)) return { id: await runImport(ctx, source as ImportSource, { url: String(form.get('url') ?? '').trim() }) }
    if (source === 'text') return { id: await runImport(ctx, 'text', { text: String(form.get('text') ?? '').slice(0, 60_000) }) }
    if (source === 'linkedin_url') throw new AppError('SOURCE_NOT_ALLOWED', 'LinkedIn doesn’t allow automated reading of profiles. On LinkedIn choose More → Save to PDF, then upload that file.')
    throw new AppError('VALIDATION_ERROR', 'Choose what to import.')
  })
}
