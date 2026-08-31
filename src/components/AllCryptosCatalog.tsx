import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Filter,
  Download,
  FileSpreadsheet,
  FileCode,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  ExternalLink,
  Info,
  Shield,
  Zap,
  Flame,
  ArrowUpDown,
  Coins
} from 'lucide-react';
import { Token, TokenCategory } from '../types';
import {
  ALL_5638_CRYPTOCURRENCIES,
  TOTAL_CRYPTOS_COUNT,
  searchAllCryptos,
  exportCryptosAsCsv,
  exportCryptosAsJson
} from '../data/allCryptos';
import { CATEGORIES, POPULAR_TOKENS } from '../data/tokens';
import { CHAINS } from '../data/chains';

interface AllCryptosCatalogProps {
  onSelectPairForSwap: (fromToken: Token, toToken: Token) => void;
}

export const AllCryptosCatalog: React.FC<AllCryptosCatalogProps> = ({ onSelectPairForSwap }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<TokenCategory>('all');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change' | 'name'>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [inspectToken, setInspectToken] = useState<Token | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Search and paginate across all 5638 cryptocurrencies
  const searchResult = useMemo(() => {
    return searchAllCryptos({
      query: search,
      category: selectedCat,
      chainId: selectedChain,
      page,
      pageSize,
      sortBy,
      sortDirection,
    });
  }, [search, selectedCat, selectedChain, page, pageSize, sortBy, sortDirection]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (cat: TokenCategory) => {
    setSelectedCat(cat);
    setPage(1);
  };

  const handleChainChange = (chainId: string) => {
    setSelectedChain(chainId);
    setPage(1);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Download handlers
  const handleDownloadCsv = () => {
    const csvContent = exportCryptosAsCsv(ALL_5638_CRYPTOCURRENCIES);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_${TOTAL_CRYPTOS_COUNT}_cryptocurrencies.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleDownloadJson = () => {
    const jsonContent = exportCryptosAsJson(ALL_5638_CRYPTOCURRENCIES);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_${TOTAL_CRYPTOS_COUNT}_cryptocurrencies.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Default target token for quick swaps
  const usdtToken = POPULAR_TOKENS.find((t) => t.id === 'usdt-tron') || POPULAR_TOKENS[1];
  const btcToken = POPULAR_TOKENS.find((t) => t.id === 'btc-bitcoin') || POPULAR_TOKENS[0];

  // List of unique chain keys
  const chainOptions = [
    { id: 'all', name: 'All Blockchains' },
    { id: 'ethereum', name: 'Ethereum (ERC20)' },
    { id: 'solana', name: 'Solana (SPL)' },
    { id: 'bsc', name: 'BNB Smart Chain (BEP20)' },
    { id: 'bitcoin', name: 'Bitcoin (BTC)' },
    { id: 'tron', name: 'TRON (TRC20)' },
    { id: 'polygon', name: 'Polygon (POL)' },
    { id: 'arbitrum', name: 'Arbitrum One' },
    { id: 'base', name: 'Base Network' },
    { id: 'optimism', name: 'Optimism (OP)' },
    { id: 'ton', name: 'The Open Network (TON)' },
    { id: 'sui', name: 'Sui Network' },
    { id: 'avalanche', name: 'Avalanche C-Chain' },
    { id: 'ripple', name: 'XRP Ledger' },
    { id: 'cardano', name: 'Cardano (ADA)' },
    { id: 'polkadot', name: 'Polkadot (DOT)' },
    { id: 'cosmos', name: 'Cosmos Hub (ATOM)' },
    { id: 'monero', name: 'Monero (XMR)' },
    { id: 'doge', name: 'Dogecoin (DOGE)' },
    { id: 'kaspa', name: 'Kaspa (KAS)' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Hero Stats Banner */}
      <div className="bg-gradient-to-r from-[#141b27] via-[#121722] to-[#0e131d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                <Coins className="w-3.5 h-3.5" /> Full Non-Custodial Asset Directory
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                All {TOTAL_CRYPTOS_COUNT.toLocaleString()} Cryptocurrencies
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-3xl">
                Browse the complete catalogue of {TOTAL_CRYPTOS_COUNT.toLocaleString()} tokens and coins supported for instant, registration-free cross-chain swapping across 40+ decentralized networks.
              </p>
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                id="export-cryptos-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2.5 bg-[#0a0d14] hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export {TOTAL_CRYPTOS_COUNT} Coins</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#121722] border border-slate-700 rounded-2xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Export Directory
                  </div>
                  <button
                    onClick={handleDownloadCsv}
                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold block">Download CSV</span>
                      <span className="text-[10px] text-slate-400">Spreadsheet ready (.csv)</span>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="w-full px-3 py-2 text-left text-xs text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-semibold block">Download JSON</span>
                      <span className="text-[10px] text-slate-400">Full structured object (.json)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-[#0a0d14]/90 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Total Tokens</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {TOTAL_CRYPTOS_COUNT.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-[#0a0d14]/90 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Cross-Chain Pairs</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">22.4M+</span>
            </div>
            <div className="p-3 bg-[#0a0d14]/90 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Supported Blockchains</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">42 Chains</span>
            </div>
            <div className="p-3 bg-[#0a0d14]/90 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">Aggregate 24h Vol</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">$1.85 Billion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="crypto-search-input"
              type="text"
              placeholder="Search across all 5,638 cryptocurrencies, symbols, or contracts..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Chain Dropdown */}
          <div className="md:col-span-3">
            <select
              id="crypto-chain-select"
              value={selectedChain}
              onChange={(e) => handleChainChange(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {chainOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-2">
            <select
              id="crypto-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#0a0d14] border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="volume">Sort: 24h Volume</option>
              <option value="price">Sort: Price (USD)</option>
              <option value="change">Sort: 24h Change</option>
              <option value="name">Sort: Symbol (A-Z)</option>
            </select>
          </div>

          {/* Page Size & Direction */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-2.5 bg-[#0a0d14] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-mono flex items-center gap-1 shrink-0"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sortDirection.toUpperCase()}</span>
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="w-full bg-[#0a0d14] border border-slate-800 text-white rounded-xl px-2 py-2.5 text-xs font-semibold focus:outline-none"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={250}>250 / page</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as TokenCategory)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-xs ${
                selectedCat === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Results Counter & Pagination Top */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <div>
          Showing <span className="text-white font-mono font-bold">{((searchResult.page - 1) * pageSize) + (searchResult.total > 0 ? 1 : 0)}</span> -{' '}
          <span className="text-white font-mono font-bold">{Math.min(searchResult.page * pageSize, searchResult.total)}</span> of{' '}
          <span className="text-emerald-400 font-mono font-bold">{searchResult.total.toLocaleString()}</span> Cryptocurrencies
          {search && <span className="ml-1 text-slate-500">(filtered from {TOTAL_CRYPTOS_COUNT.toLocaleString()})</span>}
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="p-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs font-mono font-bold text-white">
            Page {searchResult.page} of {searchResult.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(searchResult.totalPages, p + 1))}
            disabled={page >= searchResult.totalPages}
            className="p-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(searchResult.totalPages)}
            disabled={page >= searchResult.totalPages}
            className="p-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5,638 Cryptocurrencies Master Table */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0e121a] text-slate-400 border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Cryptocurrency</th>
                <th className="py-3.5 px-4">Network / Chain</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price (USD)</th>
                <th className="py-3.5 px-4 text-right">24h Change</th>
                <th className="py-3.5 px-4 text-right hidden md:table-cell">24h Volume</th>
                <th className="py-3.5 px-4 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {searchResult.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-white text-base">No cryptocurrencies match your query</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting the search keywords or selecting "All Blockchains" and "All Assets"
                    </p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedCat('all');
                        setSelectedChain('all');
                        setPage(1);
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Reset Directory Filters
                    </button>
                  </td>
                </tr>
              ) : (
                searchResult.items.map((token, idx) => {
                  const globalRank = (searchResult.page - 1) * pageSize + idx + 1;
                  const isPositive = token.change24h >= 0;

                  return (
                    <tr
                      key={token.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {globalRank}
                      </td>

                      {/* Token info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={token.icon}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full object-contain bg-slate-900 border border-slate-700/60 p-0.5 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {token.symbol}
                              </span>
                              {token.isPopular && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">
                                  HOT
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-[200px] block">
                              {token.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Network badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0b0e14] text-emerald-300 border border-slate-800 text-xs font-mono font-semibold">
                            {token.networkBadge}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                            {token.chainName}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] capitalize px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/40">
                          {token.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${token.priceUsd < 0.01
                          ? token.priceUsd.toFixed(8)
                          : token.priceUsd.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? '+' : ''}
                          {token.change24h}%
                        </span>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400 hidden md:table-cell">
                        ${(token.volume24hUsd / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectToken(token)}
                            className="p-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Inspect Token Details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const target = token.symbol === 'USDT' ? btcToken : usdtToken;
                              onSelectPairForSwap(token, target);
                            }}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-500 font-bold rounded-xl transition-all flex items-center gap-1 text-xs"
                          >
                            <span>Swap</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#0e121a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-mono font-bold">{searchResult.items.length}</span> tokens on this page (out of{' '}
            <span className="text-emerald-400 font-mono font-bold">{searchResult.total.toLocaleString()}</span> total matching)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-2.5 py-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-semibold"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-semibold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-3 py-1.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs font-mono font-bold text-white">
              {searchResult.page} / {searchResult.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(searchResult.totalPages, p + 1))}
              disabled={page >= searchResult.totalPages}
              className="px-3 py-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-semibold flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(searchResult.totalPages)}
              disabled={page >= searchResult.totalPages}
              className="px-2.5 py-1.5 bg-[#121722] hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-semibold"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Token Details / Contract Inspector Modal */}
      {inspectToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setInspectToken(null)}
        >
          <div
            className="bg-[#121722] border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectToken.icon}
                  alt={inspectToken.symbol}
                  className="w-10 h-10 rounded-full object-contain bg-slate-900 border border-slate-700 p-0.5"
                />
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {inspectToken.name} ({inspectToken.symbol})
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono">
                    {inspectToken.networkBadge} • {inspectToken.chainName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectToken(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800">
                <span className="text-slate-500 block">USD Price</span>
                <span className="text-base font-bold text-white font-mono">
                  ${inspectToken.priceUsd < 0.01 ? inspectToken.priceUsd.toFixed(8) : inspectToken.priceUsd.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800">
                <span className="text-slate-500 block">24h Price Change</span>
                <span className={`text-base font-bold font-mono ${inspectToken.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {inspectToken.change24h >= 0 ? '+' : ''}{inspectToken.change24h}%
                </span>
              </div>
              <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800">
                <span className="text-slate-500 block">24h Swapping Volume</span>
                <span className="text-sm font-bold text-white font-mono">
                  ${(inspectToken.volume24hUsd / 1000000).toLocaleString()}M USD
                </span>
              </div>
              <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Category</span>
                <span className="text-sm font-bold text-emerald-300 capitalize">
                  {inspectToken.category}
                </span>
              </div>
            </div>

            {/* Smart Contract / Network Info */}
            <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Smart Contract / Identifier:</span>
                {inspectToken.contractAddress && (
                  <button
                    onClick={() => handleCopy(inspectToken.contractAddress!, inspectToken.id)}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedAddress === inspectToken.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedAddress === inspectToken.id ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="text-xs font-mono text-slate-200 break-all bg-[#121722] p-2 rounded-lg border border-slate-800">
                {inspectToken.contractAddress || 'Native Blockchain Layer 1 Asset'}
              </p>
            </div>

            {/* Min / Max Swap Limits */}
            <div className="text-xs text-slate-400 flex items-center justify-between px-1">
              <span>Min Limit: <strong className="text-white font-mono">{inspectToken.minAmount} {inspectToken.symbol}</strong></span>
              <span>Max Limit: <strong className="text-white font-mono">{inspectToken.maxAmount.toLocaleString()} {inspectToken.symbol}</strong></span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setInspectToken(null)}
                className="w-1/2 py-2.5 bg-[#0a0d14] hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = inspectToken.symbol === 'USDT' ? btcToken : usdtToken;
                  onSelectPairForSwap(inspectToken, target);
                  setInspectToken(null);
                }}
                className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span>Swap {inspectToken.symbol} Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
