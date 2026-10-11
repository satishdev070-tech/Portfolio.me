import { assertViewer } from '@/lib/auth'
import { assertSameOrigin } from '@/lib/csrf'
import { AppError, route } from '@/lib/errors'
import { isPurpose } from '@/lib/media/validate'
import { storeUpload } from '@/lib/media/upload'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return route(async () => {
    assertSameOrigin(request)
    const viewer = await assertViewer()
    if (viewer.role === 'viewer') throw new AppError('FORBIDDEN', 'You cannot upload to this workspace.')
    checkRateLimit(`upload:${viewer.userId}`, 30, 60_000)
    const form = await request.formData()
    const file = form.get('file')
    const purpose = form.get('purpose') ?? 'general'
    if (!(file instanceof File)) throw new AppError('VALIDATION_ERROR', 'Choose a file to upload.')
    if (!isPurpose(purpose)) throw new AppError('VALIDATION_ERROR', 'Unknown upload type.')
    return storeUpload(viewer.workspaceId, viewer.userId, file, purpose, (form.get('alt') as string | null) ?? undefined)
  })
}
