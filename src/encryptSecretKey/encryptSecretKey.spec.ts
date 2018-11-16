import encryptSecretKey from './encryptSecretKey'

import getHKDFKeysFromPassword from '../getHKDFKeysFromPassword'

test('returns an AEAD object', async () => {
  const password = 'hunter2'
  const userID = '123'
  const { encryptionKey } = await getHKDFKeysFromPassword(password, userID)
  const secretKey = Buffer.from('secretKey')

  const output = encryptSecretKey(encryptionKey, secretKey)

  expect(output).toEqual(
    expect.objectContaining({
      encryptedSecretKey: expect.any(Buffer),
      nonce: expect.any(Buffer),
      tag: expect.any(Buffer)
    })
  )
})
