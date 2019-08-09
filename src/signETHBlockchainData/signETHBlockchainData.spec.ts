import { buildETHBlockchainSignatureData, signETHBlockchainData } from './signETHBlockchainData'
import { SigningPayloadID, MovementTypeDeposit } from '../payload'
import config from '../__tests__/config.json'
import signPayload from '../signPayload'
import sigTestVectors from '../__tests__/signatureVectors.json'
import { buildNEOBlockchainSignatureData, signNEOBlockchainData } from '../signNEOBlockchainData'

test('sign eth deposit movement', async () => {
  const data = sigTestVectors.movements.b
  const payload = {
    address: data.address,
    nonce: data.nonce,
    quantity: { amount: '1.32450000', currency: 'eth' },
    timestamp: data.timestamp,
    type: MovementTypeDeposit
  }

  const signingPayload = { kind: SigningPayloadID.addMovementPayload, payload }

  const rawData = buildETHBlockchainSignatureData(config, signingPayload).toUpperCase()
  expect(rawData).toBe(data.raw.eth)
  const sig = signETHBlockchainData(config.wallets.eth.privateKey, rawData)
  expect(sig.blockchain).toBe('eth')
  expect(sig.signature.toUpperCase()).toBe(data.blockchainSignatures.eth)

  const payloadRes = signPayload(Buffer.from(config.payloadSigningKey.privateKey, 'hex'), signingPayload, config)

  const expectedCanonicalString =
    'add_movement,{"address":"fa39fddde46cea3060b91f80abed8672f77c5bea","nonce":5432876,"quantity":{"amount":"1.32450000","currency":"eth"},"timestamp":1565323885016,"type":"deposit"}'
  expect(payloadRes.canonicalString).toBe(expectedCanonicalString)
})

test('sign ETH blockchain market order data', async () => {
  const data = sigTestVectors.marketOrders.eth_usdc
  const payload = {
    amount: { amount: data.amount.value, currency: data.amount.currency },
    buyOrSell: data.buyOrSell,
    marketName: data.marketName,
    nonceFrom: data.nonceFrom,
    nonceOrder: data.nonceOrder,
    nonceTo: data.nonceTo,
    timestamp: data.timestamp
  }

  const signingPayload = { kind: SigningPayloadID.placeMarketOrderPayload, payload }
  const rawData = buildETHBlockchainSignatureData(config, signingPayload)
  expect(rawData).toBe(data.raw.eth)

  const sig = await signETHBlockchainData(config.wallets.eth.privateKey, rawData)
  expect(sig.blockchain).toBe('eth')
  expect(sig.signature.toUpperCase()).toBe(data.blockchainSignatures.eth)

  const payloadRes = signPayload(Buffer.from(config.payloadSigningKey.privateKey, 'hex'), signingPayload, config)
  const canonicalExpected =
    'place_market_order,{"amount":{"amount":"10.000000","currency":"eth"},"buy_or_sell":"sell","market_name":"eth_usdc","nonce_from":5432876,"nonce_order":5432876,"nonce_to":5432876,"timestamp":12345648}'

  expect(payloadRes.canonicalString).toBe(canonicalExpected)
})

test('sign ETH/NEO blockchain market order data', async () => {
  const data = sigTestVectors.marketOrders.eth_neo
  const payload = {
    amount: { amount: data.amount.value, currency: data.amount.currency },
    buyOrSell: data.buyOrSell,
    marketName: data.marketName,
    nonceFrom: data.nonceFrom,
    nonceOrder: data.nonceOrder,
    nonceTo: data.nonceTo,
    timestamp: data.timestamp
  }

  const signingPayload = { kind: SigningPayloadID.placeMarketOrderPayload, payload }
  const rawDataEth = buildETHBlockchainSignatureData(config, signingPayload).toUpperCase()
  const rawDataNeo = buildNEOBlockchainSignatureData(config, signingPayload).toUpperCase()
  expect(rawDataEth).toBe(data.raw.eth)
  expect(rawDataNeo).toBe(data.raw.neo)

  const sigEth = signETHBlockchainData(config.wallets.eth.privateKey, rawDataEth)
  const sigNeo = signNEOBlockchainData(config.wallets.neo.privateKey, rawDataNeo)

  expect(sigNeo.signature.toUpperCase()).toBe(data.blockchainSignatures.neo)
  expect(sigEth.signature.toUpperCase()).toBe(data.blockchainSignatures.eth)

  const canonicalExpected =
    'place_market_order,{"amount":{"amount":"10.00000000","currency":"eth"},"buy_or_sell":"sell","market_name":"eth_neo","nonce_from":5432876,"nonce_order":5432876,"nonce_to":5432876,"timestamp":12345648}'
  const payloadRes = signPayload(Buffer.from(config.payloadSigningKey.privateKey, 'hex'), signingPayload, config)
  expect(payloadRes.canonicalString).toBe(canonicalExpected)

  expect(payloadRes.signature.toUpperCase()).toBe(data.signature)
})
