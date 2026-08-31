import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { POPULAR_TOKENS } from '../data/tokens';

const RECENT_SWAPS_SEED = [
  { from: '1.45 ETH', to: '4,128 USDT', chain: 'Arbitrum ➔ Tron', time: '12s ago', provider: 'Thorchain' },
  { from: '0.045 BTC', to: '18.4 SOL', chain: 'Bitcoin ➔ Solana', time: '28s ago', provider: '1inch' },
  { from: '250 SUI', to: '855 USDC', chain: 'Sui ➔ Base', time: '45s ago', provider: 'Jupiter' },
  { from: '2,500 TON', to: '14,100 USDT', chain: 'TON ➔ Ethereum', time: '1m ago', provider: 'Symbiosis' },
  { from: '15.2 AVAX', to: '484 USDC', chain: 'Avalanche ➔ Solana', time: '2m ago', provider: 'Stargate' },
  { from: '12,000 TRX', to: '2,940 USDT', chain: 'Tron ➔ Polygon', time: '2m ago', provider: 'Uniswap V3' },
  { from: '1,200 XRP', to: '0.031 BTC', chain: 'XRP ➔ Bitcoin', time: '3m ago', provider: 'Changelly' },
];

export const LiveTickerTape: React.FC = () => {
  const [swaps, setSwaps] = useState(RECENT_SWAPS_SEED);
  const [tick, setTick] = useState(0);

  // Periodically inject a new live swap simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      const randomTokens = [...POPULAR_TOKENS].sort(() => 0.5 - Math.random());
      const t1 = randomTokens[0];
      const t2 = randomTokens[1];
      const amt = (Math.random() * (t1.maxAmount / 10) + t1.minAmount).toFixed(t1.decimals > 4 ? 4 : 2);
      const toAmt = ((Number(amt) * t1.priceUsd) / t2.priceUsd).toFixed(t2.decimals > 4 ? 4 : 2);

      const newSwap = {
        from: `${amt} ${t1.symbol}`,
        to: `${toAmt} ${t2.symbol}`,
        chain: `${t1.networkBadge} ➔ ${t2.networkBadge}`,
        time: 'Just now',
        provider: ['Thorchain', '1inch', 'Jupiter', 'Uniswap V3', 'Stargate'][Math.floor(Math.random() * 5)],
      };

      setSwaps((prev) => [newSwap, ...prev.slice(0, 8)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#0c1017] border-y border-slate-800/80 py-2 overflow-hidden text-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Market status badge */}
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap pr-3 border-r border-slate-800 text-slate-400 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-200 font-semibold">Live Swaps</span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
            22.4M Pairs
          </span>
        </div>

        {/* Ticker marquee */}
        <div className="flex-1 overflow-x-hidden relative">
          <div className="flex items-center gap-6 animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap">
            {swaps.map((item, index) => (
              <div
                key={`${item.from}-${index}-${tick}`}
                className="inline-flex items-center gap-2 bg-[#141a26]/80 hover:bg-[#1a2233] px-3 py-1 rounded-lg border border-slate-800 text-slate-300 transition-colors"
              >
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-bold text-white font-mono">{item.from}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="font-bold text-emerald-400 font-mono">{item.to}</span>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800/80 font-mono">
                  {item.chain}
                </span>
                <span className="text-[10px] text-slate-500">via {item.provider}</span>
                <span className="text-[10px] text-slate-500">({item.time})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
