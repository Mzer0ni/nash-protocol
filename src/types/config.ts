import Market from './market'
import Asset from './asset'
import Wallet from './wallet'
import { FillPoolFn } from './MPC'
/**
 * The user-specific configuration object generated by initialization of the
 * Nash protocol. Used as an input for various operations, such as signing.
 *
 * Derived from `InitParams`. Should generally be made accessible on program
 * start, as most important Nash operations require this `Config`.
 */
export default interface Config {
  /**
   * Transparently forwarded from `InitParams` for convenience.
   */
  readonly assetData: { readonly [key: string]: Asset }
  /**
   * Transparently forwarded from `InitParams` for convenience.
   */
  readonly marketData: { readonly [key: string]: Market }
  /**
   * All of a user's `Wallet`s for all supported blockchains.
   *
   * Note that private keys are included, so this should never be exposed.
   */
  readonly wallets: Record<string, Wallet>
  /**
   * The public and private keypair used by the user to sign payloads.
   *
   * Refer to `signPayload.ts` and
   * `generateWallet.ts#generateNashPayloadSigningKey()` for more information.
   *
   * @TODO: While this type is valid, it is confusing, as it's not _really_ a
   * wallet. It just coincidentally has a private and public key.
   */
  readonly payloadSigningKey: Wallet
}

export interface PresignConfig {
  /**
   * URL to the fill rpool endpoint
   */
  readonly fillPoolFn: FillPoolFn
  /**
   * Transparently forwarded from `InitParams` for convenience.
   */
  readonly assetData: { readonly [key: string]: Asset }
  /**
   * Transparently forwarded from `InitParams` for convenience.
   */
  readonly marketData: { readonly [key: string]: Market }
}
