export type SwapMode = 'floating' | 'fixed';

export type TokenCategory =
  | 'all'
  | 'l1'
  | 'l2'
  | 'defi'
  | 'meme'
  | 'stable'
  | 'ai'
  | 'privacy'
  | 'rwa'
  | 'gaming'
  | 'depin'
  | 'staking';

export interface ChainInfo {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  explorerUrl: string;
  addressRegex: RegExp;
  addressExample: string;
  memoRequired?: boolean;
  memoName?: string;
  avgBlockTimeSec: number;
  requiredConfirmations: number;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  chainId: string;
  chainName: string;
  networkBadge: string;
  icon: string;
  priceUsd: number;
  change24h: number;
  volume24hUsd: number;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  category: TokenCategory;
  contractAddress?: string;
  isPopular?: boolean;
  exchangeCode?: string;
}

export interface LiquidityProvider {
  id: string;
  name: string;
  logo: string;
  type: 'DEX' | 'CEX' | 'Cross-Chain Bridge' | 'Aggregator';
  avgTimeMinutes: number;
  rating: number; // 1 to 5
  trustScore: string;
  isBestRate?: boolean;
  isFastest?: boolean;
  rateMultiplier: number; // minor variation around market rate
  feePercentage: number;
  networkFeeUsd: number;
  description: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number; // 1 fromToken = x toToken
  inverseRate: number;
  mode: SwapMode;
  provider: LiquidityProvider;
  estimatedNetworkFeeUsd: number;
  serviceFeeUsd: number;
  priceImpact: number; // percentage
  minReceived: number;
  guaranteedTimeMinutes?: number;
  exchangeRateId?: string;
  depositMin?: string;
  depositMax?: string;
  isLiveApiQuote?: boolean;
  allQuotes: {
    provider: LiquidityProvider;
    toAmount: number;
    networkFeeUsd: number;
    differencePercent: number;
  }[];
}

export type OrderStatus =
  | 'awaiting_deposit'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface SwapOrder {
  id: string;
  createdAt: number;
  expiresAt: number;
  mode: SwapMode;
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  expectedRate: number;
  recipientAddress: string;
  recipientMemo?: string;
  refundAddress?: string;
  depositAddress: string;
  depositMemo?: string;
  provider: LiquidityProvider;
  status: OrderStatus;
  currentConfirmations: number;
  requiredConfirmations: number;
  depositTxHash?: string;
  payoutTxHash?: string;
  networkFeeUsd: number;
  serviceFeeUsd: number;
  externalTxId?: string;
  exchangeTxId?: string;
  letsexchangeTxId?: string;
  exchangeRateId?: string;
  isLiveApiOrder?: boolean;
  coinFromExplorerUrl?: string;
  coinToExplorerUrl?: string;
  logs: {
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }[];
}

export interface MarketPair {
  id: string;
  baseToken: Token;
  quoteToken: Token;
  price: number;
  change24h: number;
  volume24h: number;
  liquidityScore: number;
  providersCount: number;
}

export interface ConnectedWalletInfo {
  providerId: string;
  name: string;
  icon: string;
  address: string;
  networkName: string;
  chainId?: string | number;
  balance?: string;
  isRealExtension: boolean;
  connectedAt: number;
}

export interface Web3ProviderMeta {
  id: string;
  name: string;
  icon: string;
  category: 'evm' | 'solana' | 'bitcoin' | 'tron' | 'multi';
  desc: string;
  installUrl: string;
  checkInstalled: () => boolean;
}
