import { createDecipheriv } from 'browserify-aes'

import AEAD from '../types/AEAD'

/**
 * Decrypts an encrypted secret key via AEAD. Takes an `AEAD` object.
 *
 * See `encryptSecretKey.ts`.
 */
export default function decryptSecretKey(encryptionKey: Buffer, aead: AEAD): Promise<Buffer> {
  const { encryptedSecretKey, nonce, tag } = aead
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, nonce, {
    authTagLength: 16
  })

  decipher.setAuthTag(tag)
  const decryptedKey = decipher.update(encryptedSecretKey)

  try {
    return Promise.resolve(Buffer.concat([decryptedKey, decipher.final()]))
  } catch (e) {
    // Authentication failed
    return Promise.reject(e)
  }
}
