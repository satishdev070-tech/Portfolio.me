import { z } from 'zod'
import { FONT_KEYS, SHELLS } from '@/site/types'

// Shape of template_versions.config (see src/site/types.ts TemplateConfig). Used by the admin editor.
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const templateConfigSchema = z.object({
  tokens: z.object({
    colors: z.object({ background: hex, surface: hex, text: hex, muted: hex, primary: hex, primaryContrast: hex, accent: hex, border: hex }),
    typography: z.object({ heading: z.enum(FONT_KEYS), body: z.enum(FONT_KEYS), mono: z.enum(FONT_KEYS).optional(), scale: z.enum(['compact', 'default', 'large']), headingWeight: z.number().int().min(300).max(900) }),
    spacing: z.object({ section: z.enum(['compact', 'default', 'airy']), width: z.enum(['narrow', 'default', 'wide']) }),
    components: z.object({ radius: z.enum(['none', 'sm', 'md', 'lg']), button: z.enum(['solid', 'outline', 'pill']), card: z.enum(['flat', 'bordered', 'elevated']) }),
  }),
  layout: z.object({ shell: z.enum(SHELLS), heroAlign: z.enum(['left', 'center']) }),
  sections: z.array(z.object({ type: z.string().regex(/^[a-z_]+$/), variant: z.string().regex(/^[a-z_]+$/) })).min(1).max(30),
  features: z.array(z.string()).optional(),
})

