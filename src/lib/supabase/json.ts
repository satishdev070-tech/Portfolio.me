import type { Json } from './database.types'

/** Cast a typed object to the generated Json type for jsonb columns / RPC args. */
export const asJson = <T>(v: T) => v as unknown as NonNullable<Json>
