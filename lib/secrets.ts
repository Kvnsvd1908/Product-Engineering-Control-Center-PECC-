import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function key() {
  const value = process.env.SUPABASE_CONNECTION_ENCRYPTION_KEY
  if (!value) throw new Error('Configura SUPABASE_CONNECTION_ENCRYPTION_KEY para guardar integraciones.')
  return createHash('sha256').update(value).digest()
}

export function encryptSecret(value: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')
}

export function decryptSecret<T>(value: string) {
  const payload = Buffer.from(value, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key(), payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8')) as T
}