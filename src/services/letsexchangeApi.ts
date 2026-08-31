import { Token } from '../types';

/**
 * Frontend client service for interacting with the server-side cross-chain DEX exchange API proxy.
 * Provides live token lists, real-time market/fixed exchange rates, order creation,
 * and live transaction tracking across 5,600+ crypto pairs.
 */

const CLIENT_API_KEY_STORAGE = 'dex_custom_api_key';

export function getStoredCustomApiKey(): string {
  try {
    return localStorage.getItem(CLIENT_API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setStoredCustomApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(CLIENT_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(CLIENT_API_KEY_STORAGE);
    }
  } catch {}
}

function getClientHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const customKey = getStoredCustomApiKey();
  if (customKey) {
    headers['x-exchange-key'] = customKey;
    headers['x-letsexchange-key'] = customKey;
  }
  return headers;
}

/**
 * Resolves the precise coin code for cross-chain exchange API calls.
 * Ensures multi-chain tokens (like USDT on TRC20, ERC20, BSC, Solana) receive the exact ticker expected.
 */
export function resolveExchangeCode(token: Token): string {
  if (token.exchangeCode) {
    return token.exchangeCode.toUpperCase().trim();
  }

  const sym = (token.symbol || '').toUpperCase().trim();
  const chain = (token.chainId || '').toLowerCase().trim();

  // Multi-chain Tether USDT mappings
  if (sym === 'USDT') {
    if (chain === 'tron') return 'USDTTRC20';
    if (chain === 'ethereum') return 'USDTERC20';
    if (chain === 'bsc') return 'USDTBSC';
    if (chain === 'solana') return 'USDTSOL';
    if (chain === 'polygon') return 'USDTMATIC';
    if (chain === 'arbitrum') return 'USDTARB';
    if (chain === 'optimism') return 'USDTOP';
    if (chain === 'ton') return 'USDTTON';
    if (chain === 'avalanche') return 'USDTAVAXC';
    if (chain === 'near') return 'USDTNEAR';
    return 'USDTTRC20';
  }

  // Multi-chain USD Coin USDC mappings
  if (sym === 'USDC') {
    if (chain === 'solana') return 'USDCSOL';
    if (chain === 'ethereum') return 'USDC';
    if (chain === 'polygon') return 'USDCPOLYGON';
    if (chain === 'arbitrum') return 'USDCARB';
    if (chain === 'base') return 'USDCBASE';
    if (chain === 'bsc') return 'USDCBSC';
    if (chain === 'optimism') return 'USDCOP';
    if (chain === 'avalanche') return 'USDCAVAXC';
    return 'USDC';
  }

  // Multi-chain Ethereum mappings
  if (sym === 'ETH') {
    if (chain === 'arbitrum') return 'ETHARB';
    if (chain === 'optimism') return 'ETHOP';
    if (chain === 'base') return 'ETHBASE';
    if (chain === 'bsc') return 'ETHBSC';
    return 'ETH';
  }

  // Multi-chain BNB mappings
  if (sym === 'BNB') {
    if (chain === 'bsc') return 'BNBBSC';
    return 'BNB';
  }

  // Direct 1:1 tickers
  if (sym === 'BTC') return 'BTC';
  if (sym === 'SOL') return 'SOL';
  if (sym === 'TRX') return 'TRX';
  if (sym === 'XRP') return 'XRP';
  if (sym === 'DOGE') return 'DOGE';
  if (sym === 'ADA') return 'ADA';
  if (sym === 'AVAX') return 'AVAXC';
  if (sym === 'DOT') return 'DOT';
  if (sym === 'NEAR') return 'NEAR';
  if (sym === 'TON') return 'TON';
  if (sym === 'SUI') return 'SUI';
  if (sym === 'APT') return 'APT';
  if (sym === 'APE') return 'APE';
  if (sym === 'A8') return 'A8';
  if (sym === 'ETC') return 'ETC';
  if (sym === 'ALGO') return 'ALGO';
  if (sym === 'FTM') return 'FTM';
  if (sym === 'FIL') return 'FIL';
  if (sym === 'ICP') return 'ICP';
  if (sym === 'HBAR') return 'HBAR';
  if (sym === 'ZEC') return 'ZEC';
  if (sym === 'DASH') return 'DASH';
  if (sym === 'XMR') return 'XMR';

  return sym;
}

// Alias for backward compatibility if needed
export const resolveLetsExchangeCode = resolveExchangeCode;

export interface ExchangeCoin {
  code: string;
  name: string;
  icon: string;
  price_change_24h: string;
  network_code: string;
  network_name: string;
  network_icon?: string;
  min_amount: string;
  max_amount: string;
  default_amount: string;
  is_active: number;
  disabled: number;
  rating?: number;
  stable?: number;
}

export type LetsExchangeCoin = ExchangeCoin;

export interface ExchangeQuoteResponse {
  deposit_min_amount: string;
  deposit_max_amount: string;
  min_amount: string;
  max_amount: string;
  amount: string; // output amount
  rate: string; // 1 from = x to
  fee: string;
  profit?: string;
  withdrawal_fee?: string;
  rate_id?: string;
  rate_id_expired_at?: string;
  deposit_amount_usdt?: string;
  expired_at?: string;
  base_amount?: string;
}

export type LetsExchangeQuoteResponse = ExchangeQuoteResponse;

export interface ExchangeCreateTxParams {
  coin_from: string;
  coin_to: string;
  deposit_amount: string | number;
  withdrawal: string;
  withdrawal_extra_id?: string;
  rate_id?: string;
  return_address?: string;
  return_extra_id?: string;
}

export type LetsExchangeCreateTxParams = ExchangeCreateTxParams;

export interface ExchangeTxData {
  transaction_id: string;
  status: 'wait' | 'confirming' | 'confirmation' | 'exchanging' | 'exchange' | 'sending' | 'sending_to_user' | 'finished' | 'completed' | 'success' | 'failed' | 'error' | 'refunded' | 'expired' | string;
  type: string;
  coin_from: string;
  coin_to: string;
  deposit_amount: string;
  withdrawal_amount: string;
  rate: string;
  deposit: string; // real deposit address generated
  deposit_extra_id: string | null;
  withdrawal: string;
  withdrawal_extra_id: string | null;
  hash_in: string | null;
  hash_out: string | null;
  confirmations: number;
  need_confirmations: number;
  coin_from_explorer_url?: string;
  coin_to_explorer_url?: string;
  expired_at?: number | string;
  created_at?: string;
  execution_time?: string | null;
  real_deposit_amount?: string;
  real_withdrawal_amount?: string;
}

export type LetsExchangeTxData = ExchangeTxData;

export interface ExchangeStatusResponse {
  success: boolean;
  service: string;
  configured: boolean;
  connected: boolean;
  latencyMs: number;
  keySource?: string;
  keyMasked?: string;
  errorDetail?: string | null;
  features: string[];
}

export type LetsExchangeStatusResponse = ExchangeStatusResponse;

/**
 * Check Exchange Backend & Key Connection Status
 */
export async function checkExchangeStatus(): Promise<ExchangeStatusResponse> {
  try {
    const res = await fetch('/api/exchange/status', {
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error(`Status check failed: HTTP ${res.status}`);
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      service: 'Exchange Engine Offline',
      configured: false,
      connected: false,
      latencyMs: 0,
      errorDetail: error.message,
      features: [],
    };
  }
}

export const checkLetsExchangeStatus = checkExchangeStatus;

/**
 * Test a custom API key against the server
 */
export async function testExchangeApiKey(key: string): Promise<{ success: boolean; valid: boolean; latencyMs: number; error?: string; coinsCount?: number }> {
  try {
    const res = await fetch('/api/exchange/test-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      valid: false,
      latencyMs: 0,
      error: error.message || 'Network request failed',
    };
  }
}

export const testLetsExchangeApiKey = testExchangeApiKey;

/**
 * Fetch list of all active coins from Exchange Engine
 */
export async function fetchExchangeCoins(): Promise<ExchangeCoin[]> {
  try {
    const res = await fetch('/api/exchange/coins', {
      headers: getClientHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch coins from Exchange API:', error);
    return [];
  }
}

export const fetchLetsExchangeCoins = fetchExchangeCoins;

/**
 * Fetch real-time rate & limits for a trading pair
 */
export async function fetchExchangeQuote(
  fromCode: string,
  toCode: string,
  amount: number | string,
  rateType: 'floating' | 'fixed' = 'floating'
): Promise<ExchangeQuoteResponse | null> {
  try {
    const res = await fetch('/api/exchange/info', {
      method: 'POST',
      headers: getClientHeaders(),
      body: JSON.stringify({
        from: fromCode.toUpperCase(),
        to: toCode.toUpperCase(),
        amount: String(amount),
        rate_type: rateType,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('Exchange quote info error:', errJson);
      return null;
    }

    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch quote from Exchange API:', error);
    return null;
  }
}

export const fetchLetsExchangeQuote = fetchExchangeQuote;

/**
 * Create a live cryptocurrency swap transaction
 */
export async function createExchangeTransaction(
  params: ExchangeCreateTxParams
): Promise<ExchangeTxData> {
  const res = await fetch('/api/exchange/transaction', {
    method: 'POST',
    headers: getClientHeaders(),
    body: JSON.stringify(params),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const errorMsg =
      (json && (json.error || json.message || (json.raw && JSON.stringify(json.raw)))) ||
      `HTTP ${res.status}: Failed to create transaction`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const createLetsExchangeTransaction = createExchangeTransaction;

/**
 * Query real-time status of an ongoing transaction
 */
export async function fetchExchangeTxStatus(transactionId: string): Promise<ExchangeTxData | null> {
  try {
    const res = await fetch(`/api/exchange/transaction/${encodeURIComponent(transactionId)}`, {
      headers: getClientHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch status for tx ${transactionId}:`, error);
    return null;
  }
}

export const fetchLetsExchangeTxStatus = fetchExchangeTxStatus;

