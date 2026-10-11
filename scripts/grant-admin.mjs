#!/usr/bin/env node
// Grant (or revoke with --revoke) platform-admin rights. Uses the service role key from .env.local.
// Usage: node scripts/grant-admin.mjs someone@example.com [--revoke]
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const [email, flag] = process.argv.slice(2)
if (!email) { console.error('Usage: node scripts/grant-admin.mjs <email> [--revoke]'); process.exit(1) }
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await supabase.from('users').update({ is_platform_admin: flag !== '--revoke' }).eq('email', email.toLowerCase()).select('email, is_platform_admin')
if (error) { console.error(error.message); process.exit(1) }
if (!data.length) { console.error(`No user with email ${email}. Sign up first.`); process.exit(1) }
console.log(`${data[0].email}: is_platform_admin = ${data[0].is_platform_admin}`)
