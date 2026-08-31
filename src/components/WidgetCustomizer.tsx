import React, { useState } from 'react';
import { Code, Copy, Check, Sparkles, DollarSign, Eye, Settings, ShieldCheck, ArrowRight } from 'lucide-react';
import { POPULAR_TOKENS } from '../data/tokens';

export const WidgetCustomizer: React.FC = () => {
  const [affiliateId, setAffiliateId] = useState('AFF-9824');
  const [themeColor, setThemeColor] = useState('#10B981'); // Emerald
  const [defaultFrom, setDefaultFrom] = useState('BTC');
  const [defaultTo, setDefaultTo] = useState('USDT');
  const [monthlyVolume, setMonthlyVolume] = useState(250000); // $250k
  const [copiedCode, setCopiedCode] = useState(false);

  // Revenue share calculation (0.5% standard to 1.0% VIP)
  const feeSharePercent = monthlyVolume > 500000 ? 1.0 : monthlyVolume > 100000 ? 0.75 : 0.5;
  const estimatedMonthlyRevenue = (monthlyVolume * (feeSharePercent / 100)).toFixed(0);

  const iframeSnippet = `<!-- Instant Cross-Chain Swap Widget -->
<iframe
  src="https://swap-widget.network/embed?aff_id=${affiliateId}&from=${defaultFrom}&to=${defaultTo}&theme_color=${encodeURIComponent(themeColor)}"
  width="100%"
  height="480"
  frameBorder="0"
  allow="clipboard-write"
  style="border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#121722] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Code className="w-4 h-4" /> B2B Swap API & Widget Hub
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Monetize Your Traffic with Cross-Chain Swaps
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Integrate our non-custodial crypto exchange widget or REST API directly into your dApp, wallet, media site, or telegram bot. Earn up to 1.0% on every swap ticket with zero custody overhead.
        </p>

        {/* Affiliate Revenue Calculator */}
        <div className="mt-6 p-6 bg-[#0a0d14] rounded-2xl border border-emerald-500/30 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold">Estimated Monthly Swap Volume:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">${monthlyVolume.toLocaleString()} USD</span>
            </div>
            <input
              type="range"
              min="10000"
              max="2000000"
              step="10000"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$10,000 / mo</span>
              <span>$1,000,000 / mo</span>
              <span>$2,000,000+ / mo</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-950/60 to-slate-900 rounded-xl border border-emerald-500/50 text-center">
            <span className="text-xs text-emerald-300 font-bold block uppercase tracking-wider">Your Monthly Payout</span>
            <div className="text-3xl font-black text-white font-mono mt-1">${Number(estimatedMonthlyRevenue).toLocaleString()}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Based on {feeSharePercent}% profit share tier
            </span>
          </div>
        </div>
      </div>

      {/* Widget Builder & Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customizer Controls */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" /> Widget Customization Settings
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Partner Affiliate ID:</label>
            <input
              type="text"
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Default From Token:</label>
              <select
                value={defaultFrom}
                onChange={(e) => setDefaultFrom(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {POPULAR_TOKENS.slice(0, 10).map((t) => (
                  <option key={t.id} value={t.symbol}>
                    {t.symbol} ({t.networkBadge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Default To Token:</label>
              <select
                value={defaultTo}
                onChange={(e) => setDefaultTo(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {POPULAR_TOKENS.slice(0, 10).map((t) => (
                  <option key={t.id} value={t.symbol}>
                    {t.symbol} ({t.networkBadge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Brand Accent Color:</label>
            <div className="flex items-center gap-2">
              {['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setThemeColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    themeColor === color ? 'scale-110 border-white ring-2 ring-white/20' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Embed Code Output */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold">Embed HTML Code:</span>
              <button
                onClick={copySnippet}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="p-3 bg-[#080a0f] rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {iframeSnippet}
            </pre>
          </div>
        </div>

        {/* Right: Live Interactive Widget Simulation */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Embedded Preview in Partner dApp
            </span>
            <span className="font-mono text-[11px] text-emerald-400">Partner: {affiliateId}</span>
          </div>

          {/* Mock iframe container */}
          <div className="my-4 p-5 bg-[#0a0d14] rounded-2xl border border-slate-700/80 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white">Instant Swap</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Powered by Instant DEX</span>
            </div>

            <div className="p-3 bg-[#121722] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Send:</span>
                <span className="text-lg font-bold text-white font-mono">1.0</span>
              </div>
              <span className="px-3 py-1 bg-[#182030] rounded-lg text-xs font-bold text-white">
                {defaultFrom}
              </span>
            </div>

            <div className="p-3 bg-[#121722] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Receive:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">Estimated Output</span>
              </div>
              <span className="px-3 py-1 bg-[#182030] rounded-lg text-xs font-bold text-white">
                {defaultTo}
              </span>
            </div>

            <button
              type="button"
              className="w-full py-3 rounded-xl font-extrabold text-slate-950 text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: themeColor }}
            >
              <span>Exchange Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fully White-labeled & Zero API Rate Limits
          </div>
        </div>
      </div>
    </div>
  );
};
