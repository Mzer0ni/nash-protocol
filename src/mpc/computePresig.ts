import { fillRPoolIfNeeded } from './fillRPool'
import { ComputePresigParams, BlockchainCurve, Presignature } from '../types/MPC'

export async function computePresig(params: ComputePresigParams): Promise<Presignature> {
  await fillRPoolIfNeeded({
    blockchain: params.blockchain,
    fillPoolFn: params.fillPoolFn
  })
  const MPCWallet = await import('../wasm')
  const [comutePresigOk, presigOrErrorMessage, r] = JSON.parse(
    MPCWallet.compute_presig(
      JSON.stringify(params.apiKey),
      params.messageHash,
      JSON.stringify(BlockchainCurve[params.blockchain])
    )
  ) as [boolean, string, string]
  if (comutePresigOk === false) {
    throw new Error('Error computing presig: ' + presigOrErrorMessage)
  }
  return {
    presig: presigOrErrorMessage,
    r
  }
}