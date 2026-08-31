import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, Flame, Shield, Sparkles, Layers, RefreshCw } from 'lucide-react';
import { Token, TokenCategory } from '../types';
import { POPULAR_TOKENS, CATEGORIES } from '../data/tokens';
import { CHAINS } from '../data/chains';
import {
  getAllTokens,
  searchTokens,
  initializeLiveTokensFromApi,
  subscribeToTokens,
} from '../services/tokenRegistry';

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  selectedToken: Token;
  title: string;
}

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  selectedToken,
  title,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory>('all');
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('all');
  const [tokensVersion, setTokensVersion] = useState(0);

  // Trigger dynamic loading of all live coins from LetsExchange API on mount / open
  useEffect(() => {
    if (isOpen) {
      initializeLiveTokensFromApi();
    }
  }, [isOpen]);

  // Subscribe to token updates
  useEffect(() => {
    return subscribeToTokens(() => {
      setTokensVersion((v) => v + 1);
    });
  }, []);

  // Filter and smart-score tokens across full crypto universe (5600+ static + live LetsExchange coins)
  const filteredTokens = useMemo(() => {
    return searchTokens({
      query: searchQuery,
      category: selectedCategory,
      chainId: selectedChainFilter,
      limit: 120, // Return top 120 highest relevance matches
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedChainFilter, tokensVersion]);

  // Unique chains for filter pills
  const availableChains = useMemo(() => {
    const all = getAllTokens();
    const chainIds = Array.from(new Set(all.slice(0, 100).map((t) => t.chainId)));
    // Always include major chains
    const priorityChains = [
      'ethereum',
      'bsc',
      'solana',
      'tron',
      'polygon',
      'arbitrum',
      'base',
      'optimism',
      'ton',
      'sui',
      'aptos',
      'avalanche',
      'ripple',
      'etc',
      'ancient8',
      'apechain',
      'algorand',
      'fantom',
      'filecoin',
      'icp',
      'hedera',
      'zcash',
      'dash',
      'bitcoin',
    ];
    const combinedIds = Array.from(new Set([...priorityChains, ...chainIds]));
    return combinedIds
      .map((cid) => CHAINS[cid] || { id: cid, name: cid.toUpperCase(), shortName: cid.toUpperCase() })
      .filter(Boolean);
  }, [tokensVersion]);

  if (!isOpen) return null;

  const totalTokensCount = getAllTokens().length;

  return (
    <div
      id="token-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="token-modal-container"
        className="relative w-full max-w-lg bg-[#121722] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151b28]">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button
            id="close-token-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-800/60 bg-[#121722]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="token-search-input"
              type="text"
              placeholder="Search coin (e.g. APE, A8, ETC, BTC, SOL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#0b0e14] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Popular Quick Chips */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Flame className="w-3 h-3 text-amber-400" /> Hot:
            </span>
            {POPULAR_TOKENS.filter((t) => t.isPopular)
              .slice(0, 7)
              .map((popToken) => (
                <button
                  key={popToken.id}
                  id={`quick-token-${popToken.id}`}
                  onClick={() => {
                    onSelectToken(popToken);
                    onClose();
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                    selectedToken.id === popToken.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <img
                    src={popToken.icon}
                    alt={popToken.symbol}
                    className="w-3.5 h-3.5 rounded-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-semibold">{popToken.symbol}</span>
                  <span className="text-[10px] text-slate-400">({popToken.networkBadge})</span>
                </button>
              ))}
          </div>
        </div>

        {/* Categories & Chain Filter Bar */}
        <div className="px-4 py-2 bg-[#0e121a] border-b border-slate-800 flex flex-col gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id as TokenCategory)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors font-medium text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Chain Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Chain:</span>
            <button
              onClick={() => setSelectedChainFilter('all')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                selectedChainFilter === 'all'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              All Chains
            </button>
            {availableChains.map((c) => (
              <button
                key={c.id}
                id={`chain-filter-${c.id}`}
                onClick={() => setSelectedChainFilter(c.id)}
                className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 whitespace-nowrap ${
                  selectedChainFilter === c.id
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 font-semibold'
                    : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{c.shortName || c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tokens List */}
        <div id="token-list-scrollable" className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">No assets matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing the search query or setting Chain filter to "All Chains"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedChainFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredTokens.map((token) => {
              const isSelected = selectedToken.id === token.id;
              const isPositive = token.change24h >= 0;

              return (
                <div
                  key={token.id}
                  id={`token-row-${token.id}`}
                  onClick={() => {
                    onSelectToken(token);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'hover:bg-slate-800/50 hover:border hover:border-slate-700/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={token.icon}
                        alt={token.symbol}
                        className="w-9 h-9 rounded-full object-contain bg-slate-900 border border-slate-700/60 p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png';
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-[#0b0e14] text-emerald-400 px-1 py-0.2 rounded border border-slate-700">
                        {token.networkBadge}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {token.symbol}
                        </span>
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">
                          {token.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="bg-slate-800/80 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                          {token.chainName}
                        </span>
                        {token.category === 'privacy' && (
                          <span className="flex items-center gap-0.5 text-amber-400 text-[10px]">
                            <Shield className="w-2.5 h-2.5" /> Privacy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-100 font-mono">
                      ${token.priceUsd < 0.01
                        ? token.priceUsd.toFixed(8)
                        : token.priceUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span
                        className={`text-xs font-semibold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {token.change24h}%
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#121722] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredTokens.length}</strong> of{' '}
            <strong className="text-emerald-400 font-mono">{totalTokensCount.toLocaleString()}</strong> assets
          </span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LetsExchange API synced
          </span>
        </div>
      </div>
    </div>
  );
};

