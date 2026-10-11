import 'server-only'

function optional(name: string) {
  const v = process.env[name]
  return v && v.length > 0 ? v : undefined
}

export const serverEnv = {
  serviceRoleKey: () => {
    const v = optional('SUPABASE_SERVICE_ROLE_KEY')
    if (!v) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return v
  },
  analyticsSalt: () => optional('ANALYTICS_SALT') ?? 'dev-only-salt',
  aiAllowMock: () => process.env.AI_ALLOW_MOCK === 'true' && process.env.NODE_ENV !== 'production',
  billingProvider: () => (optional('BILLING_PROVIDER') ?? 'none') as 'dev' | 'razorpay' | 'none',
  customDomainTarget: () => optional('CUSTOM_DOMAIN_CNAME_TARGET') ?? 'cname.hellome.in',
  secret: (name: string) => optional(name),
}
