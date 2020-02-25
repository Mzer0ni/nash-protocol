import os from 'os'

interface NodeFileInterface {
  dh_init: (size: number, curve: string) => string
  fill_rpool: (clientDHSecrets: string, serverDHPublics: string, curve: string) => string
  get_rpool_size: (curve: string) => string
  compute_presig: (apiKeyStr: string, msgHashStr: string, curve: string) => string
}

const loadNodeFile = (): NodeFileInterface => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin':
      return require('./index_osx.node')
    default:
      throw new Error(`${platform} not supported`)
  }
}

const MpcWallet = loadNodeFile()
console.log('using .node')
export function dh_init(size: string, curve: string): Promise<string> {
  console.log(size, curve)
  return Promise.resolve(MpcWallet.dh_init(parseInt(size, 10), JSON.parse(curve)))
}
export function fill_rpool(clientDHSecrets: string, serverDHPublics: string, curve: string): Promise<string> {
  console.log(clientDHSecrets, serverDHPublics, curve)
  return Promise.resolve(MpcWallet.fill_rpool(clientDHSecrets, serverDHPublics, JSON.parse(curve)))
}
export function get_rpool_size(curve: string): Promise<string> {
  console.log('get_rpool_size', curve)
  const resp = MpcWallet.get_rpool_size(JSON.parse(curve))
  console.log(resp)
  return Promise.resolve(resp)
}
export function compute_presig(apiKeyStr: string, msgHashStr: string, curve: string): Promise<string> {
  return Promise.resolve(MpcWallet.compute_presig(apiKeyStr, msgHashStr, JSON.parse(curve)))
}

export function init_api_childkey_creator(_: string): Promise<string> {
  throw new Error('Not supported')
}
export function init_api_childkey_creator_with_verified_paillier(a: string, b: string): Promise<string> {
  console.log(a, b)
  throw new Error('Not supported')
}
export function verify_paillier(a: string, b: string, c: string): Promise<string> {
  console.log(a, b, c)
  throw new Error('Not supported')
}
export function create_api_childkey(a: string, b: string): Promise<string> {
  console.log(a, b)
  throw new Error('Not supported')
}
export function verify(a: string, b: string, c: string, d: string, e: string): Promise<string> {
  console.log(a, b, c, d, e)
  throw new Error('Not supported')
}
export function publickey_from_secretkey(a: string, b: string): Promise<string> {
  console.log(a, b)
  throw new Error('Not supported')
}
