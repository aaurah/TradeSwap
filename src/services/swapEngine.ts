import { Token, SwapMode, LiquidityProvider, SwapQuote, SwapOrder, OrderStatus } from '../types';
import { LIQUIDITY_PROVIDERS } from '../data/providers';
import { CHAINS } from '../data/chains';
import { fetchExchangeQuote, createExchangeTransaction, resolveExchangeCode } from './letsexchangeApi';

export function calculateSwapQuote(
  fromToken: Token,
  toToken: Token,
  fromAmount: number,
  mode: SwapMode,
  selectedProviderId?: string
): SwapQuote {
  const fromUsd = fromAmount * fromToken.priceUsd;
  
  // Base raw output before fee
  const rawToAmount = fromUsd / toToken.priceUsd;

  // Rate impact based on size (simulating depth)
  const priceImpact = Math.min(2.5, (fromUsd / 250000) * 0.08);

  // Generate quotes from all providers
  const allQuotes = LIQUIDITY_PROVIDERS.map((provider) => {
    // If Solana pair, Jupiter is prioritized
    let adjustedMultiplier = provider.rateMultiplier;
    if (fromToken.chainId === 'solana' || toToken.chainId === 'solana') {
      if (provider.id === 'jupiter') adjustedMultiplier = 1.003;
    }
    
    // Fixed rate mode applies a small rate lock hedge (-0.45%)
    const modeFactor = mode === 'fixed' ? 0.9955 : 1.0;
    const providerFeeDiscount = (100 - provider.feePercentage) / 100;
    
    const finalToAmount = rawToAmount * adjustedMultiplier * modeFactor * providerFeeDiscount * (1 - priceImpact / 100);
    const networkFeeUsd = provider.networkFeeUsd + (fromToken.chainId === 'ethereum' || toToken.chainId === 'ethereum' ? 4.5 : 0.8);

    return {
      provider,
      toAmount: Number(finalToAmount.toFixed(toToken.decimals > 8 ? 6 : toToken.decimals)),
      networkFeeUsd: Number(networkFeeUsd.toFixed(2)),
      differencePercent: Number(((adjustedMultiplier * modeFactor - 1) * 100).toFixed(2)),
    };
  }).sort((a, b) => b.toAmount - a.toAmount);

  // Mark best rate and fastest
  allQuotes.forEach((q, idx) => {
    q.provider.isBestRate = idx === 0;
  });

  const chosenQuote = selectedProviderId
    ? allQuotes.find(q => q.provider.id === selectedProviderId) || allQuotes[0]
    : allQuotes[0];

  const toAmount = chosenQuote.toAmount;
  const exchangeRate = toAmount / fromAmount;
  const inverseRate = fromAmount / toAmount;
  const serviceFeeUsd = Number((fromUsd * (chosenQuote.provider.feePercentage / 100)).toFixed(2));
  const minReceived = mode === 'floating'
    ? Number((toAmount * 0.995).toFixed(toToken.decimals > 8 ? 6 : toToken.decimals))
    : toAmount; // Fixed rate guarantees exact output

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    exchangeRate: Number(exchangeRate.toFixed(8)),
    inverseRate: Number(inverseRate.toFixed(8)),
    mode,
    provider: chosenQuote.provider,
    estimatedNetworkFeeUsd: chosenQuote.networkFeeUsd,
    serviceFeeUsd,
    priceImpact: Number(priceImpact.toFixed(2)),
    minReceived,
    guaranteedTimeMinutes: mode === 'fixed' ? 20 : undefined,
    allQuotes,
  };
}

/**
 * Fetch live quote directly from DEX API with fallback to simulated aggregation
 */
export async function fetchLiveSwapQuote(
  fromToken: Token,
  toToken: Token,
  fromAmount: number,
  mode: SwapMode,
  selectedProviderId?: string
): Promise<SwapQuote> {
  const fallbackQuote = calculateSwapQuote(fromToken, toToken, fromAmount, mode, selectedProviderId);

  try {
    const fromCode = resolveExchangeCode(fromToken);
    const toCode = resolveExchangeCode(toToken);

    const liveInfo = await fetchExchangeQuote(
      fromCode,
      toCode,
      fromAmount,
      mode
    );

    if (liveInfo && liveInfo.amount && Number(liveInfo.amount) > 0) {
      const liveToAmount = Number(liveInfo.amount);
      const liveRate = Number(liveInfo.rate) || liveToAmount / fromAmount;
      const primaryProvider = LIQUIDITY_PROVIDERS.find(p => p.id === 'instant-dex') || fallbackQuote.provider;

      const chosenProvider = selectedProviderId && selectedProviderId !== 'instant-dex'
        ? fallbackQuote.provider
        : primaryProvider;

      // Update provider list to reflect real live rate
      const updatedQuotes = fallbackQuote.allQuotes.map(q => {
        if (q.provider.id === 'instant-dex') {
          return {
            ...q,
            toAmount: liveToAmount,
            differencePercent: 0.35,
          };
        }
        return q;
      });

      return {
        ...fallbackQuote,
        toAmount: liveToAmount,
        exchangeRate: liveRate,
        inverseRate: 1 / liveRate,
        minReceived: mode === 'floating' ? liveToAmount * 0.995 : liveToAmount,
        exchangeRateId: liveInfo.rate_id,
        depositMin: liveInfo.min_amount || liveInfo.deposit_min_amount,
        depositMax: liveInfo.max_amount || liveInfo.deposit_max_amount,
        isLiveApiQuote: true,
        provider: chosenProvider,
        allQuotes: updatedQuotes,
      };
    }
  } catch (error) {
    console.warn('Live quote fetch failed, using internal calculation:', error);
  }

  return fallbackQuote;
}

export function generateDepositAddress(token: Token): { address: string; memo?: string } {
  const chainId = token.chainId;
  const randomHex = (length: number) => {
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };

  const randomBase58 = (length: number) => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };

  switch (chainId) {
    case 'bitcoin':
      return { address: `bc1q${randomHex(14)}dex${randomHex(20)}` };
    case 'ethereum':
    case 'bsc':
    case 'polygon':
    case 'arbitrum':
    case 'base':
    case 'avalanche':
      return { address: `0x${randomHex(4)}9F7E${randomHex(32)}` };
    case 'solana':
      return { address: `Dex${randomBase58(40)}` };
    case 'tron':
      return { address: `TDex${randomBase58(30)}` };
    case 'ton':
      return {
        address: `EQCD39VS5jcptHL8vMjEXoP7a0698lYT-OwqCJ06YN05U9l7`,
        memo: `DEX-${Math.floor(100000 + Math.random() * 900000)}`,
      };
    case 'ripple':
      return {
        address: `rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh`,
        memo: `${Math.floor(10000000 + Math.random() * 90000000)}`,
      };
    case 'monero':
      return { address: `48DEX${randomBase58(89)}` };
    case 'doge':
      return { address: `D${randomBase58(33)}` };
    case 'sui':
      return { address: `0x${randomHex(64)}` };
    case 'near':
      return { address: `omnichain-pool.near` };
    default:
      return { address: `0x${randomHex(40)}` };
  }
}

export function createNewSwapOrder(
  quote: SwapQuote,
  recipientAddress: string,
  recipientMemo?: string,
  refundAddress?: string
): SwapOrder {
  const orderId = `DEX-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = Date.now();
  const expiresAt = now + (quote.mode === 'fixed' ? 20 * 60 * 1000 : 3 * 60 * 60 * 1000);
  const deposit = generateDepositAddress(quote.fromToken);
  const chain = CHAINS[quote.fromToken.chainId];
  const requiredConfirmations = chain ? chain.requiredConfirmations : 6;

  return {
    id: orderId,
    createdAt: now,
    expiresAt,
    mode: quote.mode,
    fromToken: quote.fromToken,
    toToken: quote.toToken,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmount,
    expectedRate: quote.exchangeRate,
    recipientAddress,
    recipientMemo,
    refundAddress,
    depositAddress: deposit.address,
    depositMemo: deposit.memo,
    provider: quote.provider,
    status: 'awaiting_deposit',
    currentConfirmations: 0,
    requiredConfirmations,
    networkFeeUsd: quote.estimatedNetworkFeeUsd,
    serviceFeeUsd: quote.serviceFeeUsd,
    exchangeRateId: quote.exchangeRateId,
    isLiveApiOrder: false,
    logs: [
      {
        timestamp: now,
        message: `Order initialized. Awaiting deposit of ${quote.fromAmount} ${quote.fromToken.symbol} (${quote.fromToken.networkBadge})`,
        type: 'info',
      },
      {
        timestamp: now + 500,
        message: `Route locked via ${quote.provider.name} (${quote.provider.type})`,
        type: 'info',
      },
    ],
  };
}

/**
 * Create a live order directly via DEX API with exact coin code resolution
 */
export async function createLiveSwapOrder(
  quote: SwapQuote,
  recipientAddress: string,
  recipientMemo?: string,
  refundAddress?: string,
  allowSimulationFallback: boolean = false
): Promise<SwapOrder> {
  const now = Date.now();
  const chain = CHAINS[quote.fromToken.chainId];
  const requiredConfirmations = chain ? chain.requiredConfirmations : 2;

  const coinFromCode = resolveExchangeCode(quote.fromToken);
  const coinToCode = resolveExchangeCode(quote.toToken);

  try {
    const liveTx = await createExchangeTransaction({
      coin_from: coinFromCode,
      coin_to: coinToCode,
      deposit_amount: quote.fromAmount,
      withdrawal: recipientAddress,
      withdrawal_extra_id: recipientMemo || '',
      rate_id: quote.exchangeRateId,
      return_address: refundAddress,
    });

    if (liveTx && liveTx.transaction_id) {
      const expiresAt = liveTx.expired_at
        ? (typeof liveTx.expired_at === 'number' && liveTx.expired_at > 1e11 ? liveTx.expired_at : Number(liveTx.expired_at) * 1000)
        : now + 20 * 60 * 1000;

      return {
        id: liveTx.transaction_id,
        externalTxId: liveTx.transaction_id,
        exchangeRateId: quote.exchangeRateId,
        isLiveApiOrder: true,
        createdAt: now,
        expiresAt,
        mode: quote.mode,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: Number(liveTx.deposit_amount) || quote.fromAmount,
        toAmount: Number(liveTx.withdrawal_amount) || quote.toAmount,
        expectedRate: Number(liveTx.rate) || quote.exchangeRate,
        recipientAddress,
        recipientMemo,
        refundAddress,
        depositAddress: liveTx.deposit,
        depositMemo: liveTx.deposit_extra_id || undefined,
        provider: quote.provider,
        status: 'awaiting_deposit',
        currentConfirmations: liveTx.confirmations || 0,
        requiredConfirmations: liveTx.need_confirmations || requiredConfirmations,
        coinFromExplorerUrl: liveTx.coin_from_explorer_url,
        coinToExplorerUrl: liveTx.coin_to_explorer_url,
        networkFeeUsd: quote.estimatedNetworkFeeUsd,
        serviceFeeUsd: quote.serviceFeeUsd,
        logs: [
          {
            timestamp: now,
            message: `🚀 Live Swap Transaction created: #${liveTx.transaction_id}`,
            type: 'success',
          },
          {
            timestamp: now + 300,
            message: `Official deposit address generated: ${liveTx.deposit}`,
            type: 'info',
          },
          {
            timestamp: now + 600,
            message: `Awaiting transfer of ${quote.fromAmount} ${quote.fromToken.symbol} (${quote.fromToken.networkBadge})`,
            type: 'info',
          },
        ],
      };
    }
  } catch (error: any) {
    console.error('API order creation failed:', error);
    if (!allowSimulationFallback) {
      throw error;
    }
  }

  return createNewSwapOrder(quote, recipientAddress, recipientMemo, refundAddress);
}

export function getExplorerTxLink(chainId: string, txHash?: string): string {
  if (!txHash) return '#';
  const chain = CHAINS[chainId];
  if (chain) {
    return `${chain.explorerUrl}${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
}


