import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Activity, Maximize2 } from 'lucide-react';
import { Token } from '../types';

interface PriceChartProps {
  fromToken: Token;
  toToken: Token;
}

type TimeFrame = '1H' | '24H' | '7D' | '1M' | '1Y';

export const PriceChart: React.FC<PriceChartProps> = ({ fromToken, toToken }) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24H');
  const [chartType, setChartType] = useState<'line' | 'candles'>('line');

  // Pair relative rate
  const pairRate = fromToken.priceUsd / toToken.priceUsd;
  const isPositive = fromToken.change24h >= 0;

  // Generate deterministic realistic historical data points for the SVG chart
  const points = useMemo(() => {
    const count = timeframe === '1H' ? 24 : timeframe === '24H' ? 48 : timeframe === '7D' ? 35 : 50;
    const baseVal = pairRate;
    const volatility = timeframe === '1H' ? 0.008 : timeframe === '24H' ? 0.03 : 0.08;
    const data: { time: string; price: number; high: number; low: number; open: number; close: number; vol: number }[] = [];

    let current = baseVal * (1 - (isPositive ? 1 : -1) * (volatility * 0.8));

    for (let i = 0; i < count; i++) {
      const delta = (Math.sin(i / 3) + (Math.random() - 0.48)) * (baseVal * volatility * 0.25);
      const open = current;
      current = Math.max(baseVal * 0.5, current + delta);
      const close = current;
      const high = Math.max(open, close) + Math.random() * (baseVal * volatility * 0.1);
      const low = Math.min(open, close) - Math.random() * (baseVal * volatility * 0.1);
      const vol = Math.floor(Math.random() * 500000 + 50000);

      data.push({
        time: `${i + 1}`,
        price: close,
        high,
        low,
        open,
        close,
        vol,
      });
    }

    // Force final point to match current pairRate
    if (data.length > 0) {
      data[data.length - 1].price = pairRate;
      data[data.length - 1].close = pairRate;
    }

    return data;
  }, [fromToken.id, toToken.id, pairRate, timeframe, isPositive]);

  // Compute min/max for SVG scaling
  const minPrice = Math.min(...points.map((p) => p.low || p.price));
  const maxPrice = Math.max(...points.map((p) => p.high || p.price));
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 20;

  const getCoordinates = (index: number, price: number) => {
    const x = padding + (index / (points.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((price - minPrice) / priceRange) * (svgHeight - padding * 2);
    return { x, y };
  };

  // Build SVG Path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, pt, idx) => {
      const { x, y } = getCoordinates(idx, pt.price);
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [points, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = getCoordinates(0, points[0].price);
    const last = getCoordinates(points.length - 1, points[points.length - 1].price);
    return `${linePath} L ${last.x},${svgHeight - padding} L ${first.x},${svgHeight - padding} Z`;
  }, [linePath, points, minPrice, maxPrice]);

  return (
    <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-white">
              {fromToken.symbol} / {toToken.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {fromToken.networkBadge} ➔ {toToken.networkBadge}
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              1 {fromToken.symbol} = {pairRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toToken.symbol}
            </span>
            <span
              className={`text-xs font-bold flex items-center gap-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{fromToken.change24h}% (24h)
            </span>
          </div>
        </div>

        {/* Timeframe & Chart toggle controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-slate-800 text-xs">
            {(['1H', '24H', '7D', '1M', '1Y'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                id={`chart-tf-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                chartType === 'line' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                chartType === 'candles' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Candles
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative mt-4 w-full h-[220px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1e293b" strokeDasharray="3 3" />

          {chartType === 'line' ? (
            <>
              {/* Area */}
              <path d={areaPath} fill="url(#chartGradient)" />
              {/* Line */}
              <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            // Candlesticks rendering
            points.map((p, idx) => {
              const { x } = getCoordinates(idx, p.close);
              const openY = getCoordinates(idx, p.open).y;
              const closeY = getCoordinates(idx, p.close).y;
              const highY = getCoordinates(idx, p.high).y;
              const lowY = getCoordinates(idx, p.low).y;
              const isUp = p.close >= p.open;
              const color = isUp ? '#10B981' : '#F43F5E';
              const topY = Math.min(openY, closeY);
              const height = Math.max(2, Math.abs(closeY - openY));

              return (
                <g key={idx}>
                  {/* Wick */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                  {/* Body */}
                  <rect
                    x={x - 3}
                    y={topY}
                    width="6"
                    height={height}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          )}
        </svg>

        {/* Current price marker tooltip */}
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-lg">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>High: {maxPrice.toFixed(4)} | Low: {minPrice.toFixed(4)}</span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">24h Volume ({fromToken.symbol})</span>
          <span className="text-white font-semibold font-mono">
            ${(fromToken.volume24hUsd / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Current USD Value</span>
          <span className="text-white font-semibold font-mono">${fromToken.priceUsd.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Target Asset USD</span>
          <span className="text-white font-semibold font-mono">${toToken.priceUsd.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Liquidity Route</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Deep Aggregate
          </span>
        </div>
      </div>
    </div>
  );
};
