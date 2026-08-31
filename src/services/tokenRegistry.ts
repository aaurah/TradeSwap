import { Token, TokenCategory } from '../types';
import { POPULAR_TOKENS } from '../data/tokens';
import { ALL_5638_CRYPTOCURRENCIES, TOTAL_CRYPTOS_COUNT } from '../data/allCryptos';
import { CHAINS } from '../data/chains';
import { fetchExchangeCoins, ExchangeCoin } from './letsexchangeApi';

// In-Memory merged token database
let dynamicTokensList: Token[] = [...ALL_5638_CRYPTOCURRENCIES];
let dynamicTokensMap = new Map<string, Token>();
let isLoadedFromApi = false;
let isLoadingApi = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToTokens(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Map exchange network_code / name to internal chainId
export function mapExchangeNetworkToChainId(networkCode: string, networkName: string): string {
  const code = (networkCode || '').toLowerCase().trim();
  const name = (networkName || '').toLowerCase().trim();

  if (code.includes('eth') || name.includes('ethereum') || code === 'erc20') return 'ethereum';
  if (code.includes('bsc') || code.includes('bnb') || name.includes('smart chain') || code === 'bep20') return 'bsc';
  if (code.includes('sol') || name.includes('solana')) return 'solana';
  if (code.includes('trx') || code.includes('tron') || name.includes('tron') || code === 'trc20') return 'tron';
  if (code.includes('matic') || code.includes('pol') || name.includes('polygon')) return 'polygon';
  if (code.includes('arb') || name.includes('arbitrum')) return 'arbitrum';
  if (code.includes('base') || name.includes('base')) return 'base';
  if (code.includes('op') || name.includes('optimism')) return 'optimism';
  if (code.includes('ton') || name.includes('the open network')) return 'ton';
  if (code.includes('sui') || name.includes('sui')) return 'sui';
  if (code.includes('apt') || name.includes('aptos')) return 'aptos';
  if (code.includes('avax') || name.includes('avalanche')) return 'avalanche';
  if (code.includes('xrp') || name.includes('ripple')) return 'ripple';
  if (code.includes('ada') || name.includes('cardano')) return 'cardano';
  if (code.includes('dot') || name.includes('polkadot')) return 'polkadot';
  if (code.includes('atom') || name.includes('cosmos')) return 'cosmos';
  if (code.includes('xmr') || name.includes('monero')) return 'monero';
  if (code.includes('doge') || name.includes('dogecoin')) return 'doge';
  if (code.includes('kas') || name.includes('kaspa')) return 'kaspa';
  if (code.includes('inj') || name.includes('injective')) return 'injective';
  if (code.includes('near') || name.includes('near')) return 'near';
  if (code.includes('etc') || name.includes('ethereum classic')) return 'etc';
  if (code.includes('a8') || name.includes('ancient8')) return 'ancient8';
  if (code.includes('ape') || name.includes('apechain')) return 'apechain';
  if (code.includes('algo') || name.includes('algorand')) return 'algorand';
  if (code.includes('ftm') || name.includes('fantom')) return 'fantom';
  if (code.includes('fil') || name.includes('filecoin')) return 'filecoin';
  if (code.includes('icp') || name.includes('internet computer')) return 'icp';
  if (code.includes('hbar') || name.includes('hedera')) return 'hedera';
  if (code.includes('zec') || name.includes('zcash')) return 'zcash';
  if (code.includes('dash') || name.includes('dash')) return 'dash';
  if (code.includes('btc') || name.includes('bitcoin')) return 'bitcoin';

  return 'ethereum';
}

export const mapLetsExchangeNetworkToChainId = mapExchangeNetworkToChainId;

// Convert an ExchangeCoin object to our Token interface
export function convertExchangeCoin(coin: ExchangeCoin): Token {
  const symbol = (coin.code || '').toUpperCase().trim();
  const rawNetwork = coin.network_code || coin.network_name || 'MAINNET';
  const networkBadge = rawNetwork.toUpperCase();
  const chainId = mapExchangeNetworkToChainId(coin.network_code, coin.network_name);
  const chain = CHAINS[chainId] || {
    id: chainId,
    name: coin.network_name || networkBadge,
    shortName: networkBadge,
  };

  const priceChange = parseFloat(coin.price_change_24h) || 0;
  const minAmt = parseFloat(coin.min_amount) || 0.01;
  const maxAmt = parseFloat(coin.max_amount) || 500000;

  // Derive sensible category
  let category: TokenCategory = 'defi';
  const symLower = symbol.toLowerCase();
  const nameLower = (coin.name || '').toLowerCase();
  if (coin.stable || symLower.includes('usd') || symLower === 'dai' || symLower === 'tusd') {
    category = 'stable';
  } else if (['btc', 'eth', 'sol', 'bnb', 'xrp', 'ada', 'avax', 'dot', 'near', 'sui', 'apt', 'trx', 'etc', 'algo', 'ftm', 'fil', 'icp', 'hbar'].includes(symLower)) {
    category = 'l1';
  } else if (['arb', 'op', 'base', 'pol', 'matic', 'strk', 'zk', 'blast'].includes(symLower)) {
    category = 'l2';
  } else if (['doge', 'shib', 'pepe', 'wif', 'bonk', 'floki', 'popcat', 'dogs', 'brett', 'bome', 'turbo', 'mew', 'neiro'].includes(symLower) || nameLower.includes('inu') || nameLower.includes('pepe') || nameLower.includes('doge')) {
    category = 'meme';
  } else if (['fet', 'render', 'rndr', 'tao', 'wld', 'ocean', 'agix', 'akt', 'io', 'grass'].includes(symLower) || nameLower.includes('ai') || nameLower.includes('intel')) {
    category = 'ai';
  } else if (['gala', 'sand', 'mana', 'axs', 'beam', 'not', 'hmstr', 'cati', 'ape', 'a8', 'pixel', 'ron', 'ronin', 'ilv'].includes(symLower) || nameLower.includes('game') || nameLower.includes('ape')) {
    category = 'gaming';
  } else if (['xmr', 'zec', 'dash', 'scrt', 'zen'].includes(symLower)) {
    category = 'privacy';
  } else if (['hnt', 'fil', 'ar', 'iotx', 'jasmy'].includes(symLower)) {
    category = 'depin';
  } else if (['ondo', 'om', 'cfg', 'mpl', 'polyx'].includes(symLower)) {
    category = 'rwa';
  } else if (['ldo', 'rpl', 'ethfi', 'mkr', 'aave', 'uni', 'pendle', 'jup', 'crv', '1inch'].includes(symLower)) {
    category = 'staking';
  }

  return {
    id: `${symbol.toLowerCase()}-${chainId}`,
    symbol,
    name: coin.name || symbol,
    chainId,
    chainName: coin.network_name || chain.name || networkBadge,
    networkBadge,
    icon: coin.icon || `https://assets.coingecko.com/coins/images/1/standard/bitcoin.png`,
    priceUsd: 1.0,
    change24h: priceChange,
    volume24hUsd: 1000000,
    decimals: 18,
    minAmount: minAmt,
    maxAmount: maxAmt,
    category,
    isPopular: Boolean(coin.rating && coin.rating > 70),
    exchangeCode: coin.code,
  };
}

export const convertLetsExchangeCoin = convertExchangeCoin;

// Build index map for ultra-fast lookups
function rebuildIndexMap() {
  dynamicTokensMap.clear();
  dynamicTokensList.forEach((t) => {
    dynamicTokensMap.set(t.id, t);
    dynamicTokensMap.set(t.symbol.toUpperCase(), t);
    dynamicTokensMap.set(`${t.symbol.toUpperCase()}-${t.networkBadge.toUpperCase()}`, t);
    if (t.exchangeCode) {
      dynamicTokensMap.set(t.exchangeCode.toUpperCase(), t);
    }
  });
}

rebuildIndexMap();

/**
 * Initialize dynamic tokens from live API
 */
export async function initializeLiveTokensFromApi(): Promise<Token[]> {
  if (isLoadingApi || isLoadedFromApi) return dynamicTokensList;
  isLoadingApi = true;

  try {
    const liveCoins = await fetchExchangeCoins();
    if (Array.isArray(liveCoins) && liveCoins.length > 0) {
      const convertedTokens: Token[] = [];
      const seenKeys = new Set<string>();

      // 1. Process and convert all live coins
      liveCoins.forEach((c) => {
        if (!c.code) return;
        const tok = convertExchangeCoin(c);
        const key = `${tok.symbol.toUpperCase()}-${tok.chainId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          convertedTokens.push(tok);
        }
      });

      // 2. Ensure all curated popular tokens and top catalog tokens are retained
      POPULAR_TOKENS.forEach((pop) => {
        const key = `${pop.symbol.toUpperCase()}-${pop.chainId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          convertedTokens.push(pop);
        }
      });

      ALL_5638_CRYPTOCURRENCIES.forEach((cur) => {
        const key = `${cur.symbol.toUpperCase()}-${cur.chainId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          convertedTokens.push(cur);
        }
      });

      dynamicTokensList = convertedTokens;
      rebuildIndexMap();
      isLoadedFromApi = true;
      notifyListeners();
    }
  } catch (err) {
    console.warn('Could not load live tokens from API, using full fallback catalog:', err);
  } finally {
    isLoadingApi = false;
  }

  return dynamicTokensList;
}

/**
 * Get all available tokens
 */
export function getAllTokens(): Token[] {
  return dynamicTokensList;
}

/**
 * Calculate relevance score for searching
 */
export function calculateTokenRelevance(token: Token, cleanQuery: string): number {
  if (!cleanQuery) return 0;
  const sym = token.symbol.toLowerCase();
  const name = token.name.toLowerCase();
  const net = token.networkBadge.toLowerCase();
  const chain = token.chainName.toLowerCase();

  // 1. Exact Symbol match (e.g. "ape" -> APE, "a8" -> A8, "etc" -> ETC)
  if (sym === cleanQuery) return 10000;

  // 2. Exact ID match (e.g. "ape-ethereum" or "a8-ancient8")
  if (token.id.toLowerCase() === cleanQuery) return 9000;

  // 3. Symbol starts with query (e.g. "ape" -> APEX)
  if (sym.startsWith(cleanQuery)) return 7000;

  // 4. Exact Name match (e.g. "apecoin" -> ApeCoin, "ancient8" -> Ancient8)
  if (name === cleanQuery) return 6000;

  // 5. Name starts with query
  if (name.startsWith(cleanQuery)) return 5000;

  // 6. Symbol contains query
  if (sym.includes(cleanQuery)) return 4000;

  // 7. Network badge exact match (e.g. "erc20", "trc20")
  if (net === cleanQuery) return 3000;

  // 8. Word in name starts with query
  const words = name.split(/\s+/);
  if (words.some((w) => w.startsWith(cleanQuery))) return 2500;

  // 9. Name contains query
  if (name.includes(cleanQuery)) return 2000;

  // 10. Chain Name contains query
  if (chain.includes(cleanQuery) || net.includes(cleanQuery)) return 1000;

  // 11. Contract Address match
  if (token.contractAddress && token.contractAddress.toLowerCase().includes(cleanQuery)) return 500;

  return 0;
}

/**
 * Search tokens with smart priority ranking
 */
export function searchTokens(options: {
  query?: string;
  category?: TokenCategory;
  chainId?: string;
  limit?: number;
}): Token[] {
  const { query = '', category = 'all', chainId = 'all', limit = 100 } = options;
  const cleanQuery = query.trim().toLowerCase();

  const filtered = dynamicTokensList.filter((t) => {
    const matchesCat = category === 'all' || t.category === category;
    const matchesChain = chainId === 'all' || t.chainId === chainId;
    if (!matchesCat || !matchesChain) return false;

    if (!cleanQuery) return true;
    return calculateTokenRelevance(t, cleanQuery) > 0;
  });

  if (cleanQuery) {
    filtered.sort((a, b) => {
      const scoreA = calculateTokenRelevance(a, cleanQuery);
      const scoreB = calculateTokenRelevance(b, cleanQuery);
      if (scoreA !== scoreB) return scoreB - scoreA; // Highest score first
      // Tie breaker: popular tokens and 24h volume
      if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
      return b.volume24hUsd - a.volume24hUsd;
    });
  }

  return limit > 0 ? filtered.slice(0, limit) : filtered;
}

/**
 * Find token by ID or Symbol
 */
export function findToken(identifier: string): Token | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim();
  return (
    dynamicTokensMap.get(clean) ||
    dynamicTokensMap.get(clean.toLowerCase()) ||
    dynamicTokensMap.get(clean.toUpperCase()) ||
    dynamicTokensList.find(
      (t) =>
        t.id.toLowerCase() === clean.toLowerCase() ||
        t.symbol.toUpperCase() === clean.toUpperCase()
    )
  );
}
