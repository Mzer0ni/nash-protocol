import hexEncoding from 'crypto-js/enc-hex'
import SHA256 from 'crypto-js/sha256'
import _ from 'lodash'
import { ec as EC } from 'elliptic'
import compose from 'lodash/fp/compose'
import mapKeys from 'lodash/fp/mapKeys'
import snakeCase from 'lodash/fp/snakeCase'
import toLower from 'lodash/fp/toLower'

import bufferize from '../bufferize'
import stringify from '../stringify'
import deep from '../utils/deep'

import {
  kindToName,
  needBlockchainMovement,
  needBlockchainSignature,
  SigningPayloadID,
  isStateSigning
} from '../payload/signingPayloadID'
import { Config, PayloadSignature, BlockchainSignature, Asset } from '../types'
import { PayloadAndKind, SignStatesPayload, ClientSignedState, SignStatesRequestPayload } from '../payload'
import { inferBlockchainData, getUnitPairs, getBlockchainMovement } from '../utils/blockchain'
import { buildNEOBlockchainSignatureData, signNEOBlockchainData } from '../signNEOBlockchainData'
import { buildETHBlockchainSignatureData, signETHBlockchainData } from '../signETHBlockchainData'

const curve = new EC('secp256k1')

// Generates the canonical string for the given arbitrary payload.
export const canonicalString = compose(
  toLower,
  JSON.stringify,
  o =>
    Object.keys(o)
      .sort()
      .reduce((acc, el) => ({ ...acc, [el]: o[el] }), {}),
  deep(mapKeys(snakeCase))
)

export const canonicalizePayload = (kind: SigningPayloadID, payload: object): string => {
  switch (kind) {
    case SigningPayloadID.signStatesPayload:
      const signStatesPayload = { timestamp: (payload as SignStatesPayload).timestamp }
      return canonicalString(signStatesPayload)
    default:
      return canonicalString(payload)
  }
}

// Signs the given payload with the given private key.
export default function signPayload(
  privateKey: Buffer,
  payloadAndKind: PayloadAndKind,
  config?: Config
): PayloadSignature {
  const kind = payloadAndKind.kind
  let payload = payloadAndKind.payload
  const payloadName = kindToName(kind)
  const message = `${payloadName},${canonicalizePayload(kind, payload)}`
  const keypair = curve.keyFromPrivate(privateKey)

  const sig = keypair.sign(SHA256(message).toString(hexEncoding), {
    canonical: true,
    pers: null
  })

  if (needBlockchainSignature(kind)) {
    if (config === undefined) {
      throw new Error('blockchain signatures needs a Config object')
    }
    payload.blockchainSignatures = signBlockchainData(config, { payload, kind })
  }

  if (needBlockchainMovement(kind)) {
    if (config === undefined) {
      throw new Error('blockchain movement needs a Config object')
    }
    return {
      blockchainMovement: getBlockchainMovement(config, { kind, payload }),
      canonicalString: message,
      payload,
      signature: stringify(bufferize(sig.toDER()))
    }
  }

  if (isStateSigning(kind)) {
    payload = signStateListAndRecycledOrders(config as Config, payload)
  }

  return {
    canonicalString: message,
    payload,
    signature: stringify(bufferize(sig.toDER()))
  }
}

// If we are trading within the same blockchain origin we only need 1 signature,
// neo_gas, nos_neo, etc..
// Otherwise we are trading cross chain, hence need signatures for both blockchains,
// neo_eth, eth_btc, etc..
export function signBlockchainData(config: Config, payloadAndKind: PayloadAndKind): ReadonlyArray<BlockchainSignature> {
  // if this is a movement we don't want to do all the stuff below
  if (payloadAndKind.kind === SigningPayloadID.addMovementPayload) {
    const blockchain = config.assetData[payloadAndKind.payload.quantity.currency].blockchain
    switch (blockchain) {
      case 'neo':
        const neoData = buildNEOBlockchainSignatureData(config, payloadAndKind)
        return [signNEOBlockchainData(config.wallets.neo.privateKey, neoData)]
      case 'eth':
        const ethData = buildETHBlockchainSignatureData(config, payloadAndKind)
        return [signETHBlockchainData(config.wallets.eth.privateKey, ethData)]
    }
  }

  // if this is an order then its a bit more complicated
  const blockchainData = inferBlockchainData(payloadAndKind)
  const { unitA, unitB } = getUnitPairs(blockchainData.marketName)
  const blockchains: ReadonlyArray<Asset> = [config.assetData[unitA], config.assetData[unitB]]
  const sigs = _.map(_.uniq(blockchains), unit => {
    switch (unit.blockchain) {
      case 'neo':
        const neoData = buildNEOBlockchainSignatureData(config, payloadAndKind)
        return signNEOBlockchainData(config.wallets.neo.privateKey, neoData)
      case 'eth':
        const ethData = buildETHBlockchainSignatureData(config, payloadAndKind)
        return signETHBlockchainData(config.wallets.eth.privateKey, ethData)
      default:
        throw new Error(`invalid unit ${unit}`)
    }
  })

  return sigs
}

export function signStateListAndRecycledOrders(config: Config, payload: any): SignStatesRequestPayload {
  const signStatesPayload = payload as SignStatesPayload
  return {
    client_signed_states: signStateList(config, signStatesPayload.states),
    signed_recycled_orders: signStateList(config, signStatesPayload.recycled_orders),
    timestamp: signStatesPayload.timestamp
  }
}

export function signStateList(config: Config, items: ClientSignedState[]): ClientSignedState[] {
  const result: ClientSignedState[] = items.map((item: ClientSignedState) => {
    switch (item.blockchain.toLowerCase()) {
      case 'neo':
        item.signature = signNEOBlockchainData(config.wallets.neo.privateKey, item.message).signature.toUpperCase()
        return item
      case 'eth':
        item.signature = signETHBlockchainData(config.wallets.eth.privateKey, item.message).signature.toUpperCase()
        return item
      default:
        throw new Error(`Cannot sign states for blockchain ${item.blockchain}`)
    }
  })
  return result
}
