import { createAPIKey } from './createAPIKey'
import { GenerateApiKeysParams, BIP44, APIKey } from '../types/MPC'
import secretKeyToMnemonic from '../secretKeyToMnemonic'
import bufferize from '../bufferize'
import mnemonicToMasterSeed from '../mnemonicToMasterSeed'
import { generateNashPayloadSigningKey, generateWallet, coinTypeFromString } from '../generateWallet'
import keccak from 'keccak'

function toChecksumAddress(address: string): string {
  const hash = keccak('keccak256')
    .update(address)
    .digest()
    .toString('hex')
  let ret = '0x'

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

// Generates API keys based on https://www.notion.so/nashio/RFC-API-key-representation-cf619be1c8b045f9a5f2596261c8039b
export async function generateAPIKeys(params: GenerateApiKeysParams): Promise<APIKey> {
  const secretBuff = bufferize(params.secret)
  const masterSeed = mnemonicToMasterSeed(secretKeyToMnemonic(secretBuff))
  const payloadSigningKey = generateNashPayloadSigningKey(masterSeed, 1)

  const btcWallet = generateWallet(masterSeed, coinTypeFromString('btc'), params.walletIndices.btc, params.net)
  const ethWallet = generateWallet(masterSeed, coinTypeFromString('eth'), params.walletIndices.eth, params.net)
  const neoWallet = generateWallet(masterSeed, coinTypeFromString('neo'), params.walletIndices.neo, params.net)

  const btcSecret = btcWallet.privateKey
  const ethSecret = ethWallet.privateKey
  const neoSecret = neoWallet.privateKey
  const btc = await createAPIKey({
    ...params,
    curve: 'Secp256k1',
    secret: btcSecret
  })
  const eth = await createAPIKey({
    ...params,
    curve: 'Secp256k1',
    secret: ethSecret
  })
  const neo = await createAPIKey({
    ...params,
    curve: 'Secp256r1',
    secret: neoSecret
  })
  return {
    child_keys: {
      [BIP44.BTC]: {
        address: btcWallet.address,
        client_secret_share: btc.client_secret_share,
        public_key: btcWallet.publicKey,
        server_secret_share_encrypted: btc.server_secret_share_encrypted
      },
      [BIP44.ETH]: {
        address: toChecksumAddress(ethWallet.address),
        client_secret_share: eth.client_secret_share,
        public_key: ethWallet.publicKey,
        server_secret_share_encrypted: eth.server_secret_share_encrypted
      },
      [BIP44.NEO]: {
        address: neoWallet.address,
        client_secret_share: neo.client_secret_share,
        public_key: neoWallet.publicKey,
        server_secret_share_encrypted: neo.server_secret_share_encrypted
      }
    },
    paillier_pk: btc.paillier_pk,
    payload_public_key: payloadSigningKey.publicKey,
    payload_signing_key: payloadSigningKey.privateKey,
    version: 0
  }
}

export function encodeApiKeys(key: APIKey): string {
  return Buffer.from(JSON.stringify(key), 'utf-8').toString('base64')
}

export function decodeAPIKeys(encoded: string): APIKey {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
}
