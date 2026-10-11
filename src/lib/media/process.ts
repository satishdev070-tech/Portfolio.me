import 'server-only'
import sharp from 'sharp'

/** Normalize an uploaded image: honour EXIF rotation, strip metadata (incl. GPS), cap size, encode WebP. */
export async function toWebp(input: Uint8Array, maxDim: number) {
  const pipeline = sharp(input, { limitInputPixels: 50_000_000, failOn: 'error' })
    .rotate()
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}
