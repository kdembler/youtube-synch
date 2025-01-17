import { Readable } from 'stream'
import { createHash } from 'blake3'
import { encode as encodeHash, toB58String } from 'multihashes'
import { promises } from 'stream'

type FileMetadata = { size: number; hash: string }

export async function computeFileHashAndSize(file: Readable): Promise<FileMetadata> {
  const hash = createHash()
  let finalSize = 0
  let digest
  await promises.finished(
    file
      .on('data', (chunk) => (finalSize += chunk.length))
      .pipe(hash)
      .on('data', (hash) => (digest = hash))
      .resume()
  )

  const computedHash = toB58String(encodeHash(digest, 'blake3'))
  return { hash: computedHash, size: finalSize }
}
