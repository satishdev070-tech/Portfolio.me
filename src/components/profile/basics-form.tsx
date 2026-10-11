'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileBasics } from '@/app/actions/profile'
import { useServerAction } from '@/components/app/use-server-action'
import { Field } from '@/components/app/field'
import { ImageUpload } from '@/components/app/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Prof = { id: string; name: string; category: string; fields: { key: string; label: string }[] }

export function BasicsForm({ profile, professions }: { profile: Profile; professions: Prof[] }) {
  const router = useRouter()
  const { run, pending, fieldError } = useServerAction()
  const [v, setV] = useState({
    full_name: profile.full_name, display_name: profile.display_name ?? '', headline: profile.headline ?? '', tagline: profile.tagline ?? '',
    bio_short: profile.bio_short ?? '', bio_long: profile.bio_long ?? '', profession_id: profile.profession_id ?? '',
    email_public: profile.email_public ?? '', phone_public: profile.phone_public ?? '', whatsapp_number: profile.whatsapp_number ?? '',
    website_url: profile.website_url ?? '', city: profile.city ?? '', region: profile.region ?? '', country_code: profile.country_code ?? '',
    languages: profile.languages.join(', '), years_experience: profile.years_experience?.toString() ?? '', availability: profile.availability ?? '',
    pronouns: profile.pronouns ?? '',
  })
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url)
  const [cover, setCover] = useState<string | null>(profile.cover_url)
  const [extra, setExtra] = useState<Record<string, string>>((profile.extra ?? {}) as Record<string, string>)
  const profession = professions.find((p) => p.id === v.profession_id)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value })
  const save = (patch: Record<string, unknown>, success = 'Profile saved') => run(() => updateProfileBasics(profile.id, patch), { success, onSuccess: () => router.refresh() })
  const groups = [...new Set(professions.map((p) => p.category))]

  return (
    <form className="grid gap-6" onSubmit={(e) => { e.preventDefault(); save({ ...v, extra }) }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <ImageUpload label="Profile photo" purpose="avatar" shape="circle" value={avatar} onChange={(url) => { setAvatar(url); save({ avatar_url: url }, 'Photo updated') }} />
        <ImageUpload label="Cover image" purpose="cover" shape="wide" value={cover} onChange={(url) => { setCover(url); save({ cover_url: url }, 'Cover updated') }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" error={fieldError('full_name')}><Input id="full_name" value={v.full_name} onChange={set('full_name')} required /></Field>
        <Field label="Display name" htmlFor="display_name" optional hint="If different, e.g. “Dr. Asha Rao”."><Input id="display_name" value={v.display_name} onChange={set('display_name')} /></Field>
        <Field label="Profession" htmlFor="profession_id">
          <select id="profession_id" value={v.profession_id} onChange={set('profession_id')} className="h-8 rounded-lg border bg-transparent px-2 text-sm">
            <option value="">Not set</option>
            {groups.map((g) => <optgroup key={g} label={g}>{professions.filter((p) => p.category === g).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
          </select>
        </Field>
        <Field label="Years of experience" htmlFor="years_experience" optional><Input id="years_experience" type="number" min={0} max={80} value={v.years_experience} onChange={set('years_experience')} /></Field>
        <Field label="Headline" htmlFor="headline" className="sm:col-span-2" hint="One line under your name." error={fieldError('headline')}><Input id="headline" value={v.headline} onChange={set('headline')} maxLength={160} /></Field>
        <Field label="Tagline" htmlFor="tagline" optional className="sm:col-span-2"><Input id="tagline" value={v.tagline} onChange={set('tagline')} maxLength={200} /></Field>
        <Field label="Short bio" htmlFor="bio_short" className="sm:col-span-2" hint={`${v.bio_short.length}/600 · Used for search results and previews.`}><Textarea id="bio_short" rows={3} value={v.bio_short} onChange={set('bio_short')} maxLength={600} /></Field>
        <Field label="About (long bio)" htmlFor="bio_long" optional className="sm:col-span-2" hint="Separate paragraphs with a blank line."><Textarea id="bio_long" rows={7} value={v.bio_long} onChange={set('bio_long')} maxLength={8000} /></Field>
      </div>

      {profession?.fields?.length ? (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">{profession.name} details</legend>
          {profession.fields.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`extra-${f.key}`} optional>
              <Input id={`extra-${f.key}`} value={extra[f.key] ?? ''} onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })} maxLength={300} />
            </Field>
          ))}
        </fieldset>
      ) : null}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Contact <span className="font-normal text-muted-foreground">(shown publicly on your site)</span></legend>
        <Field label="Public email" htmlFor="email_public" optional error={fieldError('email_public')}><Input id="email_public" type="email" value={v.email_public} onChange={set('email_public')} /></Field>
        <Field label="Phone" htmlFor="phone_public" optional><Input id="phone_public" type="tel" value={v.phone_public} onChange={set('phone_public')} /></Field>
        <Field label="WhatsApp number" htmlFor="whatsapp_number" optional hint="With country code, e.g. +919876543210" error={fieldError('whatsapp_number')}><Input id="whatsapp_number" type="tel" value={v.whatsapp_number} onChange={set('whatsapp_number')} /></Field>
        <Field label="Other website" htmlFor="website_url" optional error={fieldError('website_url')}><Input id="website_url" type="url" placeholder="https://" value={v.website_url} onChange={set('website_url')} /></Field>
        <Field label="City" htmlFor="city" optional><Input id="city" value={v.city} onChange={set('city')} /></Field>
        <Field label="State / region" htmlFor="region" optional><Input id="region" value={v.region} onChange={set('region')} /></Field>
        <Field label="Country code" htmlFor="country_code" optional hint="Two letters, e.g. IN" error={fieldError('country_code')}><Input id="country_code" value={v.country_code} onChange={set('country_code')} maxLength={2} /></Field>
        <Field label="Languages" htmlFor="languages" optional hint="Comma separated."><Input id="languages" value={v.languages} onChange={set('languages')} /></Field>
        <Field label="Availability" htmlFor="availability" optional hint="e.g. “Accepting new patients”."><Input id="availability" value={v.availability} onChange={set('availability')} /></Field>
        <Field label="Pronouns" htmlFor="pronouns" optional><Input id="pronouns" value={v.pronouns} onChange={set('pronouns')} /></Field>
      </fieldset>

      <div className="flex justify-end border-t pt-5">
        <Button type="submit" size="lg" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  )
}
