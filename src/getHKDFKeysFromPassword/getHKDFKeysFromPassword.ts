import hkdf from 'futoin-hkdf'
/*
  HKDF seems easy enough to implement on top of crypto.createHmac which would
  allow us to reduce external dependencies.
  https://en.wikipedia.org/wiki/HKDF#Example:_Python_implementation
 */
import hashPassword from '../hashPassword'

interface HKDFKeys {
  readonly authKey: Buffer
  readonly encryptionKey: Buffer
}

/*
  HKDF parameters
 */
// TODO: We're expanding the key here right? The scrypted key is already len=32. Do we want this to be longer?
const length = 32
const hash = 'SHA-256'

export default async function getHKDFKeysFromPassword(
  password: string,
  userID: string
): Promise<HKDFKeys> {
  const hashed = await hashPassword(password, userID)

  // TODO: do we need to salt here again? If the original input is already hashed we shouldn't need to salt again right?
  // Does it matter?
  return {
    authKey: hkdf(hashed, length, { hash, info: 'auth' }),
    encryptionKey: hkdf(hashed, length, { hash, info: 'encryption' })
  }
}
