import React from 'react';
import { Layers, Zap, ShieldCheck, CheckCircle2, ArrowRight, Gauge, Clock, Sparkles } from 'lucide-react';
import { LiquidityProvider, SwapQuote } from '../types';

interface LiquidityMatrixProps {
  quote: SwapQuote;
  selectedProviderId: string;
  onSelectProvider: (provider: LiquidityProvider) => void;
}

export const LiquidityMatrix: React.FC<LiquidityMatrixProps> = ({
  quote,
  selectedProviderId,
  onSelectProvider,
}) => {
  return (
    <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cross-Chain Liquidity Routing Engine</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregating quotes across top decentralized & institutional liquidity pools for{' '}
            <span className="text-emerald-300 font-semibold">{quote.fromAmount} {quote.fromToken.symbol}</span> ➔{' '}
            <span className="text-cyan-300 font-semibold">{quote.toToken.symbol}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            8 Live Providers
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {quote.allQuotes.map(({ provider, toAmount, networkFeeUsd, differencePercent }) => {
          const isSelected = selectedProviderId === provider.id;
          const isBest = provider.isBestRate;
          const isFastest = provider.isFastest;

          return (
            <div
              key={provider.id}
              id={`provider-card-${provider.id}`}
              onClick={() => onSelectProvider(provider)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/40'
                  : 'bg-[#151b28]/60 hover:bg-[#182030] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{provider.logo}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{provider.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {provider.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        ★ {provider.rating.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> {provider.trustScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {isBest && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" /> Best Rate
                    </span>
                  )}
                  {isFastest && !isBest && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> Fastest
                    </span>
                  )}
                </div>
              </div>

              {/* Output Quote */}
              <div className="my-2 p-2.5 bg-[#0e121a] rounded-lg border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Estimated Output:</span>
                  <div className="text-sm font-extrabold text-white font-mono flex items-center gap-1">
                    {toAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {quote.toToken.symbol}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Diff vs Market:</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      differencePercent >= 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {differencePercent >= 0 ? `+${differencePercent}%` : `${differencePercent}%`}
                  </span>
                </div>
              </div>

              {/* Route Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> ~{provider.avgTimeMinutes} min execution
                </span>
                <span className="font-mono text-slate-300">
                  Est. Gas: ${networkFeeUsd}
                </span>
              </div>

              {/* Selection radio visual */}
              <div className="mt-3 pt-2 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400'}>
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Route
                    </>
                  ) : (
                    'Select Provider'
                  )}
                </span>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Use Route'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-[#0d1117] rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span>Automated failover: If selected route congests, order automatically settles through fastest backup pool.</span>
        </div>
        <span className="text-slate-300 font-mono text-[11px]">Slippage protection: Active</span>
      </div>
    </div>
  );
};
