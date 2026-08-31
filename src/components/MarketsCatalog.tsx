import React, { useState, useMemo } from 'react';
import { Search, Sparkles, TrendingUp, TrendingDown, ArrowRight, Layers, Flame, Shield, Filter } from 'lucide-react';
import { Token, TokenCategory } from '../types';
import { POPULAR_TOKENS, CATEGORIES } from '../data/tokens';

interface MarketsCatalogProps {
  onSelectPairForSwap: (fromToken: Token, toToken: Token) => void;
}

export const MarketsCatalog: React.FC<MarketsCatalogProps> = ({ onSelectPairForSwap }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<TokenCategory>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('volume');

  const filteredTokens = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    return POPULAR_TOKENS.filter((t) => {
      const matchCat = selectedCat === 'all' || t.category === selectedCat;
      if (!matchCat) return false;
      if (!cleanSearch) return true;
      return (
        t.symbol.toLowerCase().includes(cleanSearch) ||
        t.name.toLowerCase().includes(cleanSearch) ||
        t.chainName.toLowerCase().includes(cleanSearch) ||
        t.networkBadge.toLowerCase().includes(cleanSearch)
      );
    }).sort((a, b) => {
      if (cleanSearch) {
        const symA = a.symbol.toLowerCase();
        const symB = b.symbol.toLowerCase();
        if (symA === cleanSearch && symB !== cleanSearch) return -1;
        if (symB === cleanSearch && symA !== cleanSearch) return 1;
        if (symA.startsWith(cleanSearch) && !symB.startsWith(cleanSearch)) return -1;
        if (symB.startsWith(cleanSearch) && !symA.startsWith(cleanSearch)) return 1;
      }
      if (sortBy === 'volume') return b.volume24hUsd - a.volume24hUsd;
      if (sortBy === 'price') return b.priceUsd - a.priceUsd;
      if (sortBy === 'change') return b.change24h - a.change24h;
      return 0;
    });
  }, [search, selectedCat, sortBy]);

  // Default target token for quick swaps
  const usdtToken = POPULAR_TOKENS.find((t) => t.id === 'usdt-tron') || POPULAR_TOKENS[1];
  const btcToken = POPULAR_TOKENS.find((t) => t.id === 'btc-bitcoin') || POPULAR_TOKENS[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Hero Stats Header */}
      <div className="bg-gradient-to-r from-[#141b27] via-[#121722] to-[#10141e] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 22,400,000+ Cross-Chain Liquidity Markers
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore 5,000+ Tokens Across 40+ Blockchains
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Non-custodial cross-chain swapping with zero registration. Select any asset below to instantly initiate high-depth liquidity routing.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-[#0a0d14]/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Active Pairs</span>
              <span className="text-xl font-black text-emerald-400 font-mono">22.4M+</span>
            </div>
            <div className="p-3 bg-[#0a0d14]/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Integrated DEX/CEX</span>
              <span className="text-xl font-black text-white font-mono">25+ Pools</span>
            </div>
            <div className="p-3 bg-[#0a0d14]/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">24h Swapping Vol</span>
              <span className="text-xl font-black text-cyan-400 font-mono">$184.2M</span>
            </div>
            <div className="p-3 bg-[#0a0d14]/80 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Avg Execution</span>
              <span className="text-xl font-black text-amber-400 font-mono">3.4 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search 5,000+ assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id as TokenCategory)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                selectedCat === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0a0d14] border border-slate-800 text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="volume">Highest 24h Volume</option>
            <option value="price">Highest Price</option>
            <option value="change">Top Gainers</option>
          </select>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0e121a] text-slate-400 border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4"># Asset</th>
                <th className="py-3.5 px-4">Network</th>
                <th className="py-3.5 px-4 text-right">Price (USD)</th>
                <th className="py-3.5 px-4 text-right">24h Change</th>
                <th className="py-3.5 px-4 text-right hidden sm:table-cell">24h Volume</th>
                <th className="py-3.5 px-4 text-right">Instant Swap Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTokens.map((token, idx) => {
                const isPositive模糊 = token.change24h >= 0;
                return (
                  <tr
                    key={token.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Token Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs font-mono w-4">{idx + 1}</span>
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full object-contain bg-slate-900 border border-slate-700/50 p-0.5"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {token.symbol}
                          </div>
                          <span className="text-xs text-slate-400 truncate max-w-[140px] block">
                            {token.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Network Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0b0e14] text-emerald-300 border border-slate-800 text-xs font-mono font-semibold">
                        {token.networkBadge}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(8) : token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold font-mono ${
                          isPositive模糊 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive模糊 ? '+' : ''}{token.change24h}%
                      </span>
                    </td>

                    {/* 24h Volume */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 hidden sm:table-cell">
                      ${(token.volume24hUsd / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            // If user clicked USDT, swap to BTC; otherwise swap token to USDT
                            const target = token.symbol === 'USDT' ? btcToken : usdtToken;
                            onSelectPairForSwap(token, target);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-500 font-bold rounded-xl transition-all flex items-center gap-1 text-xs"
                        >
                          <span>Swap {token.symbol}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
