import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { slugify, slugSchema, profileBasicsSchema } from '@/lib/validation/schemas'
import { collectionSchema } from '@/lib/collections'
import { fromDbError } from '@/lib/errors'
import { heuristicExtract } from '@/lib/imports/heuristic'
import { htmlToText } from '@/lib/imports/extract'
import { isPrivateAddress } from '@/lib/imports/fetch-url'
import { deviceFromUA, isBot, referrerHost, visitorHash, sanitizePath } from '@/lib/analytics/ingest'
import { verifyRazorpaySignature } from '@/lib/billing/providers/razorpay'
import { extractJson, TASKS } from '@/lib/ai/tasks'
import { MockProvider } from '@/lib/ai/providers/mock'
import { detectFileType } from '@/lib/media/validate'
import { getTranslator } from '@/i18n'

describe('slugs', () => {
  it('slugifies names', () => {
    expect(slugify('Dr. Rahul Sharma')).toBe('dr-rahul-sharma')
    expect(slugify('  Ánanya   Íyer!! ')).toBe('ananya-iyer')
  })
  it('validates format', () => {
    expect(slugSchema.safeParse('good-slug').success).toBe(true)
    for (const bad of ['ab', '-start', 'end-', 'double--dash', 'UPPER', 'sp ace', 'a'.repeat(31)]) {
      expect(slugSchema.safeParse(bad).success, bad).toBe(bad === 'UPPER') // UPPER is lowercased first
    }
  })
})

describe('validation', () => {
  it('normalizes profile input and rejects bad values', () => {
    const ok = profileBasicsSchema.parse({ full_name: ' Asha ', whatsapp_number: '+91 98765 43210', languages: 'English, Hindi', email_public: '' })
    expect(ok).toMatchObject({ full_name: 'Asha', whatsapp_number: '+919876543210', languages: ['English', 'Hindi'], email_public: null })
    expect(profileBasicsSchema.safeParse({ full_name: 'A', website_url: 'javascript:alert(1)' }).success).toBe(false)
  })
  it('derives collection schemas from field config', () => {
    const s = collectionSchema('experiences')
    const r = s.parse({ title: 'Engineer', organization: 'Acme', start_date: '2020-03', end_date: '', is_current: 'on', highlights: 'Built X\nShipped Y\n' })
    expect(r).toMatchObject({ start_date: '2020-03-01', end_date: null, is_current: true, highlights: ['Built X', 'Shipped Y'] })
    expect(s.safeParse({ title: '', organization: 'Acme' }).success).toBe(false)
    expect(s.safeParse({ title: 'x', organization: 'y', workspace_id: 'evil' }).success).toBe(false)
  })
})

describe('errors', () => {
  it('maps database errors to structured codes', () => {
    expect(fromDbError({ message: 'PLAN_LIMIT_REACHED: Your plan includes 1 website(s).', code: 'P0001' }).toJSON()).toEqual({ code: 'PLAN_LIMIT_REACHED', message: 'Your plan includes 1 website(s).' })
    expect(fromDbError({ message: 'permission denied for table websites', code: '42501' }).code).toBe('FORBIDDEN')
    expect(fromDbError({ message: 'weird internal detail', code: 'XX000' }).toJSON()).toEqual({ code: 'INTERNAL_ERROR', message: 'Something went wrong.' })
  })
})

describe('CV import (rule-based)', () => {
  const cv = `Priya Nair
Senior Data Scientist
priya.nair@example.com | +91 98450 12345 | linkedin.com/in/priyanair | github.com/priyanair

Summary
Data scientist with 8 years of experience in forecasting and NLP.

Experience
Senior Data Scientist at Lattice Analytics
Jan 2021 - Present
Led demand forecasting for 40 retail clients.
Data Scientist, Quasar Labs
Jun 2016 – Dec 2020
Built NLP pipelines.

Education
M.Tech, IIT Madras
2014 - 2016

Skills
Python, SQL, PyTorch, Forecasting`
  const r = heuristicExtract(cv)
  it('finds contact details and links', () => {
    expect(r.profile).toMatchObject({ full_name: 'Priya Nair', headline: 'Senior Data Scientist', email: 'priya.nair@example.com' })
    expect(r.social_links.map((s) => s.platform).sort()).toEqual(['github', 'linkedin'])
  })
  it('splits experience entries with dates', () => {
    expect(r.experiences).toHaveLength(2)
    expect(r.experiences[0]).toMatchObject({ title: 'Senior Data Scientist', organization: 'Lattice Analytics', start_date: '2021-01-01', is_current: true })
    expect(r.experiences[1]).toMatchObject({ title: 'Data Scientist', organization: 'Quasar Labs', start_date: '2016-06-01', end_date: '2020-12-01' })
  })
  it('reads skills and education', () => {
    expect(r.skills).toEqual(['Python', 'SQL', 'PyTorch', 'Forecasting'])
    expect(r.education[0]).toMatchObject({ degree: 'M.Tech', institution: 'IIT Madras' })
  })
  it('converts HTML to readable text', () => {
    const text = htmlToText('<h1>Hi</h1><script>x()</script><p>A &amp; B</p><ul><li>One</li></ul>')
    expect(text.split('\n').filter(Boolean)).toEqual(['Hi', 'A & B', '• One'])
  })
})

describe('SSRF guard', () => {
  it('blocks private and reserved addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', '::ffff:127.0.0.1', '100.64.0.1']) expect(isPrivateAddress(ip), ip).toBe(true)
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) expect(isPrivateAddress(ip), ip).toBe(false)
  })
})

describe('analytics privacy', () => {
  it('rotates visitor hashes daily and per site', () => {
    const a = visitorHash('s', 'site', '1.2.3.4', 'ua', new Date('2026-10-11T10:00:00Z'))
    expect(visitorHash('s', 'site', '1.2.3.4', 'ua', new Date('2026-10-11T23:00:00Z'))).toBe(a)
    expect(visitorHash('s', 'site', '1.2.3.4', 'ua', new Date('2026-10-12T01:00:00Z'))).not.toBe(a)
    expect(visitorHash('s', 'other', '1.2.3.4', 'ua', new Date('2026-10-11T10:00:00Z'))).not.toBe(a)
    expect(a).not.toContain('1.2.3.4')
  })
  it('classifies devices, bots and referrers', () => {
    expect(isBot('Googlebot/2.1')).toBe(true)
    expect(isBot(null)).toBe(true)
    expect(deviceFromUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile')).toBe('mobile')
    expect(deviceFromUA('Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('tablet')
    expect(referrerHost('https://www.google.com/search?q=x', 'asha.hellome.in')).toBe('google.com')
    expect(referrerHost('https://asha.hellome.in/', 'asha.hellome.in')).toBeNull()
    expect(sanitizePath('/a?email=x@y.z')).toBe('/a')
  })
})

describe('billing webhooks', () => {
  it('verifies Razorpay signatures in constant time', () => {
    const body = '{"event":"subscription.activated"}'
    const sig = createHmac('sha256', 'whsec').update(body).digest('hex')
    expect(verifyRazorpaySignature(body, sig, 'whsec')).toBe(true)
    expect(verifyRazorpaySignature(body + ' ', sig, 'whsec')).toBe(false)
    expect(verifyRazorpaySignature(body, 'deadbeef', 'whsec')).toBe(false)
    expect(verifyRazorpaySignature(body, null, 'whsec')).toBe(false)
  })
})

describe('AI', () => {
  it('extracts JSON from fenced or chatty output', () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJson('prefix {"b":{"c":2}} suffix')).toEqual({ b: { c: 2 } })
    expect(() => extractJson('no json')).toThrow()
  })
  it('mock provider output satisfies every studio task schema', async () => {
    const mock = new MockProvider()
    const inputs = {
      bio_generation: { profession: 'Doctor', skills: 'Cardiology', name: 'Asha' }, headline_generation: { profession: 'Doctor' },
      experience_generation: { notes: 'Ran the cath lab. Trained residents.' }, service_generation: { services: 'Consultation\nAngioplasty' },
      project_generation: { notes: 'Built a clinic app for appointments.' }, seo_generation: { name: 'Asha', profession: 'Doctor' },
      rewrite: { text: 'I fix hearts.' }, translation: { text: 'Hello' }, summarization: { text: 'A long text about many things that happened.' },
      document_extraction: { text: 'Priya Nair\npriya@example.com\nSkills\nPython, SQL' },
    } as const
    for (const [task, raw] of Object.entries(inputs)) {
      const spec = TASKS[task as keyof typeof TASKS]
      const input = spec.input.parse(raw)
      const res = await mock.complete({ model: 'mock', messages: spec.build(input as never), maxTokens: 500, temperature: 0.5 })
      expect(spec.output.safeParse(extractJson(res.text)).success, task).toBe(true)
    }
  })
})

describe('uploads', () => {
  it('detects file types from magic bytes, not names', () => {
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(detectFileType(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf')
    expect(detectFileType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
  })
})

describe('i18n', () => {
  it('translates with variables and falls back to English', () => {
    expect(getTranslator('hi')('site.section.experience')).toBe('अनुभव')
    expect(getTranslator('fr')('site.section.experience')).toBe('Experience')
    expect(getTranslator('en')('site.years_experience', { n: 12 })).toBe('12+ years of experience')
  })
})
