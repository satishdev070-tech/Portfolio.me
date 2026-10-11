import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': r('./src'),
      'server-only': r('./tests/stubs/server-only.ts'),
      'next/font/google': r('./tests/stubs/next-font.ts'),
    },
  },
  test: {
    environment: 'node',
    css: false,
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts', 'tests/unit/**/*.test.{ts,tsx}'] } },
      // Needs `supabase start` (local stack) and .env.local.
      { extends: true, test: { name: 'db', include: ['tests/db/**/*.test.ts'], testTimeout: 30000, fileParallelism: false } },
    ],
  },
})
