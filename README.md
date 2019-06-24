# nex-auth-protocol

Implementation of NEX Auth Protocol.

This document is very WIP and should be checked for accuracy by someone with more expertise!

## Getting started

    yarn install
    yarn build
    yarn test


## API

```typescript
/*
  Secure-randomly generates a series of random bytes.
  * publicKey is used to verify signatures.
  * secretKey is the "master key" used to sign stuff and to generate mnemonic.

  Uses crypto-browserify/randombytes which polyfills node crypto.

  Spec: SIGGEN()
 */
getEntropy = () => { publicKey: Buffer, secretKey: Buffer }

/*
  Converts entropy to wordlist. We can supply our own wordlist for i18n.
  This is not an encryption, it's a simple mapping.

  Uses bitcoinjs/bip39 implementation.
 */
secretKeyToMnemonic = (secretKey: Buffer) => Array<string>

/*
  Converts wordlist back to entropy.
 */
mnemonictoSecretKey = (Array<string>) => Buffer

/*
  Creates the master seed which is the foundation of all wallet secret keys.
  Use PBKDF2.

  Uses bitcoinjs/bip39 implementation.
 */
mnemonicToMasterSeed = (mnemonic: Array<string>) => Buffer

/*
  Hashes user password using scrypt with parameters N = 16384, r = 8, p = 1.

  Spec: SCRYPT()

  Uses scrypt-js implementation.
 */
hashPassword = (password: string) => Promise<Buffer>

/*
  Derives two symmetric secret keys from password via HKDF. Uses user ID as salt.
  * authKey is stored server side for use in authentication
  * encryptionKey is used to encrypt the secret key

  Uses futoin-hkdf implementation.

  Spec: HKDF()
 */
getHKDFKeysFromPassword = (password: string, salt: string) => Promise<{ authKey: Buffer, encryptionKey: Buffer }>

/*
  Encrypts master key using encryptionKey. Uses AEAD. Reversible.

  aead is stored server-side.

  Uses crypto-browserify/browserify-aes implementation, which polyfills Node `crypto`.

  Spec: ENC(), DEC()
 */
interface AEAD = {
  encryptedSecretKey: Buffer
  nonce: Buffer
  tag: Buffer
}
encryptSecretKey = (encryptionKey: Buffer, secretKey: Buffer) => AEAD
decryptSecretKey = (encryptionKey: Buffer, aead: AEAD) => Promise<Buffer>

/*
  Regenerates mnemonic. Because the only information the user has is their
  password, we have to go through several hash/encrypt/decrypt steps.

  aead can come from the server as it is secure.
 */
regenerateMnemonic = (aead: AEAD, password: string): Array<String>
```

## Usage Summary

### Onboarding

1. User signs up for an account with a password (and other stuff). `getEntropy()` generates their keys.
2. Secret key is used to generate mnemonic with `secretKeyToMnemonic()`. Asynchronously, the master seed is used to generate the master seed with `mnemonicToMasterSeed()`.
3. User confirms they recorded the mnemonic.
4. Auth / encryption keys are derived from password with `hashPassword()` and `getHKDFKeysFromPassword()`. Auth key is sent to server.
5. Encryption key is used to encrypt the secret key with `encryptSecretKey()`. Output is sent to server.
6. Wallets are created with the master seed.

### Logging in

1. User submits password. Client processes into auth / encryption keys. Auth key is used to login, server responds with `aead` which can be decrypted using the encryption key.

## Glossary

- Auth key: Derived from password. **Stored on the server side** to validate sessions.
- BIP-39: Protocol for generating master seed from private key.
- BIP-44: Protocol for generating wallet addresses from master seed.
- Chain: an ID for each blockchain we want to generate a private key for. Constant. TODO: Should this use the standardized chain IDs described in BIP-44, or should we make our own?
- Encryption key: Derived from password. Used to encrypt the private key for server side storage.
- Entropy: A secure-randomly generated bitstring composed of public and private key.
- Master seed: Hash generated by `PBKDF2(mnemonic, passphrase = "")` Iteration = 2048, uses HMAC-SHA512. Should be 512 bits (64 bytes). Used to generate wallet addresses.
- Mnemonic: A n-word phrase generated from the entropy using a wordlist. Can be used along with passphrase to (re)generate the master seed. **User needs to memorize this.**
- Passphrase: An optional string for use with the `PBKDF2()` encryption function.
- Password: User's login credential. Used to generate encryption key and auth key via HKDF.
- PBKDF2: The encryption function used to generate the master seed from the mnemonic and an optional passphrase.
- Private key: Abstracted into the **mnemonic** for better UX. We use this as the "master key" -- the ultimate password from which everything is derived, that should be protected at all costs. **An encrypted version is stored on the server side.**
- Public key: Used to verify signatures.

## Notes

### External wallet keys

We will NOT support the user supplying their own wallet keys. While users will control their own wallets, we will generate the wallets for them. This is partially because we want wallets to be deterministically derivable from the master seed.

## Development

### Publishing to NPM

Decide on a new release version, eg. `v1.2.3`.

```sh
# Make sure you are on master and that all work for this release is committed and merged
# Then clean git, run all the tests and set a new version number with this script:
yarn prepare-release
git push origin master

# Do the actual npm release on https://www.npmjs.com/package/@neon-exchange/nex-auth-protocol
# by creating and pushing a git tag:
git tag v1.2.3
git push origin v1.2.3

# At this point, the CI will run and if successful push to npm
```

## TODO

- [x] Switch from Ava to Jest. Scaffold tests for TDD.
- [x] Start building!
- [x] Standardize `.tsconfig`
- [x] Precommit hooks, CI, etc.
- [ ] Upgrade to `bip39@3.x.x` when released. Currently `bip39` is not packaged as a module, and ~90% of the bundle is composed of foreign language wordlists and an optional string normalization library. With proper treeshaking this will reduce the size of the bundled `nex-auth-protocol` by _literally 98%_ as seen from webpack-analyzer (100kb gzipped to 14.5kb gzipped).

## References

- [BIP-39 - master seed generation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
  - [Detail: seed generation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#from-mnemonic-to-seed)
  - [Implementation](https://github.com/bitcoinjs/bip39)
  - [Playground](https://iancoleman.io/bip39/)
- [BIP-44 - deterministic wallets](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
  - [Current address master list](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
- [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2)
  - [Implementation](https://github.com/crypto-browserify/pbkdf2)
