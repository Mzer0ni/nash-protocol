import { fillRPoolIfNeeded } from './fillRPool'
import { ComputePresigParams, BlockchainCurve, Presignature } from '../types/MPC'

export async function computePresig(params: ComputePresigParams): Promise<Presignature> {
  const MPCWallet = await import('../mpc-lib')
  await fillRPoolIfNeeded({
    blockchain: params.blockchain,
    fillPoolFn: params.fillPoolFn
  })

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
