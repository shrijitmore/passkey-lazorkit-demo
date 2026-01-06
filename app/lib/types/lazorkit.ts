/**
 * TypeScript type definitions for LazorKit SDK
 * 
 * These types provide proper TypeScript support for LazorKit provider configuration
 * properties that may not be fully typed in the SDK yet.
 * 
 * @see https://docs.lazorkit.com/ - Official LazorKit documentation
 */

/**
 * Solana network identifier
 */
export type SolanaNetwork = 'devnet' | 'mainnet' | 'testnet';

/**
 * Paymaster configuration for gasless transactions
 */
export interface PaymasterConfig {
  /**
   * Paymaster service URL for sponsoring transaction fees
   * @example "https://kora.devnet.lazorkit.com"
   */
  paymasterUrl: string;
}

/**
 * Extended LazorKit Provider configuration
 * 
 * This interface includes all properties that can be passed to LazorkitProvider,
 * including optional properties that may not be in the official SDK types yet.
 * 
 * @example
 * ```tsx
 * const config: LazorkitProviderConfig = {
 *   rpcUrl: "https://api.devnet.solana.com",
 *   portalUrl: "https://portal.lazor.sh",
 *   paymasterConfig: { paymasterUrl: "https://kora.devnet.lazorkit.com" },
 *   isDebug: true,
 *   network: 'devnet'
 * };
 * ```
 */
export interface LazorkitProviderConfig {
  /**
   * Solana RPC endpoint URL
   * @example "https://api.devnet.solana.com"
   */
  rpcUrl: string;

  /**
   * LazorKit authentication portal URL
   * @example "https://portal.lazor.sh"
   */
  portalUrl: string;

  /**
   * Paymaster configuration for gasless transactions
   * Optional - if not provided, transactions will use wallet balance for fees
   */
  paymasterConfig?: PaymasterConfig;

  /**
   * Enable debug logging for development
   * Optional - defaults to false
   * @default false
   */
  isDebug?: boolean;

  /**
   * Solana network identifier
   * Optional - helps SDK configure network-specific behavior
   * @default 'devnet'
   */
  network?: SolanaNetwork;
}

/**
 * Partial configuration for extending existing provider props
 * 
 * Use this type when you need to spread additional props that may not
 * be in the official SDK types but are supported at runtime.
 * 
 * @example
 * ```tsx
 * <LazorkitProvider
 *   rpcUrl={RPC_URL}
 *   portalUrl={PORTAL_URL}
 *   {...({ isDebug: true, network: 'devnet' } as Partial<LazorkitProviderConfig>)}
 * >
 * ```
 */
export type PartialLazorkitProviderConfig = Partial<Pick<LazorkitProviderConfig, 'isDebug' | 'network'>>;

