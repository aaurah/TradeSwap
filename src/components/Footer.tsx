import React from 'react';
import { ShieldCheck, Zap, Layers, Lock, Heart, Globe, Cpu, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#080a0f] border-t border-slate-800/80 mt-16 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top 4 Trust Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10 border-b border-slate-800/80">
          <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Non-Custodial Architecture</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Your private keys never leave your custody. All token swaps settle directly into your self-hosted wallet.
            </p>
          </div>

          <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800">
            <Layers className="w-6 h-6 text-cyan-400 mb-2" />
            <h4 className="font-bold text-white text-sm">22M+ Market Pairs</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Dynamic multi-hop cross-chain routing across 5,000+ coins, ERC20, BEP20, TRC20, Solana, Cosmos, & L2s.
            </p>
          </div>

          <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800">
            <Lock className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Fixed & Floating Rates</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Protect against market volatility with our 20-minute guaranteed rate lock or capture dynamic market high-speed rates.
            </p>
          </div>

          <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800">
            <Zap className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Multi-DEX Aggregation</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Integrated with THORChain, 1inch, Uniswap V3, Changelly, Stargate, and Jupiter for lowest slippage.
            </p>
          </div>
        </div>

        {/* Supported Networks Ticker */}
        <div className="py-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Supported Chains:
          </span>
          <div className="flex flex-wrap gap-2 text-slate-400 font-mono">
            {['Bitcoin', 'Ethereum', 'Solana', 'TRON', 'BNB Chain', 'Polygon', 'Arbitrum', 'Base', 'TON', 'Sui', 'Avalanche', 'XRP Ledger', 'Monero', 'Near', 'Dogecoin'].map((net) => (
              <span key={net} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {net}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom copyright & status */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">TradeSwap</span>
            <span>•</span>
            <span>Non-Custodial Multi-Provider Token Swapping</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All 8 Liquidity Bridges Operational (22.4M Pairs Online)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
