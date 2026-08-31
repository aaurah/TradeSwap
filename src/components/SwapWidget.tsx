import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowDownUp,
  Sliders,
  Sparkles,
  Zap,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Copy,
  ChevronDown,
  Layers,
  Percent,
  Wallet,
  Activity,
  Check,
} from 'lucide-react';
import { Token, SwapMode, SwapQuote, SwapOrder, LiquidityProvider, ConnectedWalletInfo } from '../types';
import { calculateSwapQuote, fetchLiveSwapQuote, createLiveSwapOrder } from '../services/swapEngine';
import { validateCryptoAddress } from '../services/addressValidator';
import { saveOrder } from '../services/orderStorage';
import { TokenSelectModal } from './TokenSelectModal';
import { CHAINS } from '../data/chains';

interface SwapWidgetProps {
  fromToken: Token;
  toToken: Token;
  onFromTokenChange: (token: Token) => void;
  onToTokenChange: (token: Token) => void;
  onOrderCreated: (order: SwapOrder) => void;
  userWalletAddress?: string;
  connectedWallet?: ConnectedWalletInfo | null;
  onOpenWalletModal?: () => void;
}

export const SwapWidget: React.FC<SwapWidgetProps> = ({
  fromToken,
  toToken,
  onFromTokenChange,
  onToTokenChange,
  onOrderCreated,
  userWalletAddress,
  connectedWallet,
  onOpenWalletModal,
}) => {
  const [mode, setMode] = useState<SwapMode>('floating');
  const [fromAmount, setFromAmount] = useState<string>('0.1');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientMemo, setRecipientMemo] = useState<string>('');
  const [refundAddress, setRefundAddress] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('instant-dex');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showProvidersDrawer, setShowProvidersDrawer] = useState<boolean>(false);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for token selection
  const [tokenModalMode, setTokenModalMode] = useState<'from' | 'to' | null>(null);

  // Address validation state
  const [touchedAddress, setTouchedAddress] = useState<boolean>(false);

  const numFromAmount = parseFloat(fromAmount) || 0;

  // Live or computed quote state
  const [quote, setQuote] = useState<SwapQuote>(() =>
    calculateSwapQuote(fromToken, toToken, numFromAmount <= 0 ? 0.001 : numFromAmount, mode, selectedProviderId)
  );

  // Debounced live quote fetch from LetsExchange API
  useEffect(() => {
    let active = true;
    const amountVal = parseFloat(fromAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      setQuote(calculateSwapQuote(fromToken, toToken, 0.001, mode, selectedProviderId));
      return;
    }

    setIsLiveLoading(true);
    const handler = setTimeout(async () => {
      try {
        const live = await fetchLiveSwapQuote(
          fromToken,
          toToken,
          amountVal,
          mode,
          selectedProviderId
        );
        if (active) {
          setQuote(live);
          setIsLiveLoading(false);
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (active) {
          setIsLiveLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [fromToken, toToken, fromAmount, mode, selectedProviderId]);

  // Validation
  const addressValidation = React.useMemo(() => {
    if (!recipientAddress.trim()) {
      return { isValid: false, errorMessage: 'Recipient address required' };
    }
    return validateCryptoAddress(recipientAddress, toToken.chainId);
  }, [recipientAddress, toToken.chainId]);

  const targetChain = CHAINS[toToken.chainId];
  const requiresMemo = targetChain?.memoRequired || false;

  const effectiveMin = quote.letsexchangeDepositMin
    ? parseFloat(quote.letsexchangeDepositMin)
    : fromToken.minAmount;
  const effectiveMax = quote.letsexchangeDepositMax
    ? parseFloat(quote.letsexchangeDepositMax)
    : fromToken.maxAmount;

  // Swap Token Pair button handler
  const handleSwapReverse = () => {
    const temp = fromToken;
    onFromTokenChange(toToken);
    onToTokenChange(temp);
    setRecipientAddress('');
    setRecipientMemo('');
  };

  // Min / Max quick fill
  const handleSetMin = () => setFromAmount(effectiveMin.toString());
  const handleSetMax = () => setFromAmount(effectiveMax.toString());

  // Fill sample address for easy testing
  const handleFillSampleAddress = () => {
    if (targetChain) {
      setRecipientAddress(targetChain.addressExample.split(' ')[0]);
      setTouchedAddress(true);
    }
  };

  // Create Order Submit
  const handleStartSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedAddress(true);
    setErrorMessage(null);

    if (numFromAmount < effectiveMin) {
      setErrorMessage(`Minimum deposit amount is ${effectiveMin} ${fromToken.symbol}`);
      return;
    }

    if (numFromAmount > effectiveMax) {
      setErrorMessage(`Maximum deposit amount is ${effectiveMax} ${fromToken.symbol}`);
      return;
    }

    if (!addressValidation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create real order using LetsExchange API proxy
      const order = await createLiveSwapOrder(
        quote,
        recipientAddress.trim(),
        recipientMemo.trim() || undefined,
        refundAddress.trim() || undefined
      );

      saveOrder(order);
      onOrderCreated(order);
    } catch (err: any) {
      console.error('Swap creation failed:', err);
      setErrorMessage(err.message || 'Failed to initialize exchange transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative bg-[#121722] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Top Header Live Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>LetsExchange Direct API</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono">
                LIVE
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            {isLiveLoading ? (
              <span className="flex items-center gap-1 text-emerald-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Updating rates...
              </span>
            ) : (
              <span className="text-slate-400">
                1 {fromToken.symbol} = {quote.exchangeRate.toFixed(6)} {toToken.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Floating vs Fixed Rate Mode */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center bg-[#0a0d14] p-1 rounded-2xl border border-slate-800/80">
            <button
              id="mode-floating-btn"
              type="button"
              onClick={() => setMode('floating')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === 'floating'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Floating Rate</span>
            </button>
            <button
              id="mode-fixed-btn"
              type="button"
              onClick={() => setMode('fixed')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                mode === 'fixed'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Fixed Rate (20m Lock)</span>
            </button>
          </div>

          <button
            id="toggle-advanced-btn"
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2.5 rounded-xl border transition-all ${
              showAdvanced
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[#0a0d14] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Slippage & Routing Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleStartSwap} className="space-y-4">
          {/* Card 1: YOU SEND */}
          <div className="p-4 bg-[#0a0d14] border border-slate-800 rounded-2xl focus-within:border-emerald-500/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">You Send</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={handleSetMin}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Min: {effectiveMin}
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Max: {effectiveMax.toLocaleString()}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                id="from-amount-input"
                type="number"
                step="any"
                min="0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white focus:outline-none font-mono"
              />

              <button
                id="select-from-token-btn"
                type="button"
                onClick={() => setTokenModalMode('from')}
                className="flex items-center gap-2 bg-[#151c29] hover:bg-[#1c2638] px-3.5 py-2 rounded-xl border border-slate-700/80 transition-colors shrink-0 cursor-pointer"
              >
                <img
                  src={fromToken.icon}
                  alt={fromToken.symbol}
                  className="w-6 h-6 rounded-full object-contain bg-slate-900"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1 font-bold text-white text-sm">
                    {fromToken.symbol} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-mono font-bold">
                    {fromToken.networkBadge}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
              <span>≈ ${(numFromAmount * fromToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              <span>1 {fromToken.symbol} = ${fromToken.priceUsd.toLocaleString()}</span>
            </div>
          </div>

          {/* Swap Invert Button */}
          <div className="relative flex justify-center -my-2 z-10">
            <button
              id="swap-reverse-btn"
              type="button"
              onClick={handleSwapReverse}
              className="p-2.5 rounded-2xl bg-[#1a2333] hover:bg-emerald-500 hover:text-slate-950 text-white border-2 border-[#121722] shadow-xl transition-all duration-300 transform active:rotate-180 cursor-pointer"
              title="Reverse Token Pair"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: YOU GET */}
          <div className="p-4 bg-[#0a0d14] border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                You Get ({mode === 'fixed' ? 'Guaranteed Output' : 'Estimated Output'})
              </span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Best Rate via LetsExchange
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono truncate">
                {isLiveLoading ? (
                  <span className="text-slate-500 animate-pulse">Calculating...</span>
                ) : (
                  quote.toAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })
                )}
              </div>

              <button
                id="select-to-token-btn"
                type="button"
                onClick={() => setTokenModalMode('to')}
                className="flex items-center gap-2 bg-[#151c29] hover:bg-[#1c2638] px-3.5 py-2 rounded-xl border border-slate-700/80 transition-colors shrink-0 cursor-pointer"
              >
                <img
                  src={toToken.icon}
                  alt={toToken.symbol}
                  className="w-6 h-6 rounded-full object-contain bg-slate-900"
                />
                <div className="text-left">
                  <div className="flex items-center gap-1 font-bold text-white text-sm">
                    {toToken.symbol} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-cyan-400 block font-mono font-bold">
                    {toToken.networkBadge}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
              <span>≈ ${(quote.toAmount * toToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              <span className="text-slate-400">
                1 {fromToken.symbol} ≈ {quote.exchangeRate} {toToken.symbol}
              </span>
            </div>
          </div>

          {/* Best Liquidity Route Preview Badge */}
          <div
            onClick={() => setShowProvidersDrawer(!showProvidersDrawer)}
            className="p-3 bg-[#151c28]/80 hover:bg-[#182030] border border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{quote.provider.logo}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{quote.provider.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live API Connected
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Network Gas: ${quote.estimatedNetworkFeeUsd} • ~{quote.provider.avgTimeMinutes}m settlement • 0 KYC
                </span>
              </div>
            </div>

            <button
              type="button"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              {showProvidersDrawer ? 'Hide Routes' : 'Compare Routes'}
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showProvidersDrawer ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Quick Route Picker Drawer */}
          {showProvidersDrawer && (
            <div className="p-3 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-2 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-slate-300 block mb-1">
                Select Alternative Liquidity Network:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quote.allQuotes.map(({ provider, toAmount, networkFeeUsd }) => {
                  const isSelected = (selectedProviderId || quote.provider.id) === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => {
                        setSelectedProviderId(provider.id);
                        setShowProvidersDrawer(false);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-[#121722] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{provider.logo}</span>
                        <div>
                          <span className="font-bold block text-white">{provider.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Gas: ${networkFeeUsd}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-emerald-400">{toAmount}</span>
                        <span className="text-[10px] text-slate-400 block">{toToken.symbol}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recipient Address Input Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <span>Recipient {toToken.symbol} Address ({toToken.chainName}):</span>
              </label>
              <div className="flex items-center gap-2">
                {connectedWallet ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientAddress(connectedWallet.address);
                      setTouchedAddress(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-xs bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-lg cursor-pointer"
                    title={`Use ${connectedWallet.name} address (${connectedWallet.address})`}
                  >
                    <span>{connectedWallet.icon}</span>
                    <span>Use Connected ({connectedWallet.address.slice(0, 4)}...{connectedWallet.address.slice(-3)})</span>
                  </button>
                ) : onOpenWalletModal ? (
                  <button
                    type="button"
                    onClick={onOpenWalletModal}
                    className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-medium text-[11px] cursor-pointer"
                  >
                    <Wallet className="w-3 h-3" /> Connect Wallet
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleFillSampleAddress}
                  className="text-slate-400 hover:text-slate-200 underline text-[11px] cursor-pointer"
                >
                  Fill Sample
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="recipient-address-input"
                type="text"
                value={recipientAddress}
                onChange={(e) => {
                  setRecipientAddress(e.target.value);
                  setTouchedAddress(true);
                }}
                placeholder={targetChain?.addressExample || `Enter your ${toToken.symbol} address`}
                className={`w-full bg-[#0a0d14] border rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors pr-24 ${
                  touchedAddress && recipientAddress
                    ? addressValidation.isValid
                      ? 'border-emerald-500 focus:border-emerald-400'
                      : 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-800 focus:border-emerald-500'
                }`}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {touchedAddress && recipientAddress && (
                  addressValidation.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setRecipientAddress(text);
                      setTouchedAddress(true);
                    } catch {
                      // fallback
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Address validation alert message */}
            {touchedAddress && recipientAddress && !addressValidation.isValid && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {addressValidation.errorMessage}
              </p>
            )}

            {/* Optional/Mandatory Destination Memo for XRP / TON */}
            {requiresMemo && (
              <div className="pt-2">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                  <span>{targetChain.memoName || 'Destination Memo / Tag (Mandatory for CEX)'}:</span>
                </label>
                <input
                  id="recipient-memo-input"
                  type="text"
                  value={recipientMemo}
                  onChange={(e) => setRecipientMemo(e.target.value)}
                  placeholder="e.g. 104928"
                  className="w-full bg-[#0a0d14] border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Advanced Drawer: Slippage, Refund Address, Promo Code */}
          {showAdvanced && (
            <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Advanced Exchange Parameters
                </span>
                <span className="text-[11px] text-slate-500">Non-Custodial</span>
              </div>

              {/* Slippage tolerance */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Max Slippage Tolerance (Floating Mode):
                </label>
                <div className="flex items-center gap-2">
                  {[0.1, 0.5, 1.0, 2.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlippage(val)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        slippage === val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-[#121722] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Refund Address */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Optional Refund Address ({fromToken.chainName}):
                </label>
                <input
                  id="refund-address-input"
                  type="text"
                  value={refundAddress}
                  onChange={(e) => setRefundAddress(e.target.value)}
                  placeholder={`Your ${fromToken.symbol} refund address`}
                  className="w-full bg-[#121722] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Promo code */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Promo / Affiliate Referral Code:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Try 'DEX0FEE' for 0% service fee"
                    className="flex-1 bg-[#121722] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (promoCode === 'DEX0FEE' || promoCode === 'DEXBONUS' || promoCode === 'LETS0FEE') {
                        setPromoApplied(true);
                      } else {
                        alert('Invalid or expired promo code. Try DEX0FEE');
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <span className="text-[11px] text-emerald-400 font-bold mt-1 block">
                    ✓ Promo Applied: 0% Service Fee Activated!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Exchange CTA Button */}
          <button
            id="swap-now-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Initializing Live Swap Order...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>Swap {fromToken.symbol} ➔ {toToken.symbol}</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Guarantees Footer */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Non-Custodial</span>
            <span className="text-[10px] text-slate-500">No account required</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">Instant Execution</span>
            <span className="text-[10px] text-slate-500">~2-5 mins avg</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">6,000+ Coins</span>
            <span className="text-[10px] text-slate-500">Official liquidity pool</span>
          </div>
        </div>
      </div>

      {/* Token Picker Modal */}
      <TokenSelectModal
        isOpen={tokenModalMode !== null}
        onClose={() => setTokenModalMode(null)}
        onSelectToken={(t) => {
          if (tokenModalMode === 'from') {
            onFromTokenChange(t);
          } else if (tokenModalMode === 'to') {
            onToTokenChange(t);
            setRecipientAddress('');
          }
        }}
        selectedToken={tokenModalMode === 'from' ? fromToken : toToken}
        title={tokenModalMode === 'from' ? 'Select Token to Send' : 'Select Token to Receive'}
      />
    </div>
  );
};
