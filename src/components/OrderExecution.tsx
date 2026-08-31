import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  QrCode,
  AlertCircle,
  ArrowRight,
  Terminal,
  Zap,
  Play,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Activity,
} from 'lucide-react';
import { SwapOrder, OrderStatus } from '../types';
import { getExplorerTxLink } from '../services/swapEngine';
import { saveOrder } from '../services/orderStorage';
import { fetchExchangeTxStatus } from '../services/exchangeApi';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface OrderExecutionProps {
  order: SwapOrder;
  onOrderUpdated: (order: SwapOrder) => void;
  onNewSwap: () => void;
}

export const OrderExecution: React.FC<OrderExecutionProps> = ({
  order,
  onOrderUpdated,
  onNewSwap,
}) => {
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    const rem = Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000));
    return rem || 1200;
  });
  const [autoSimulate, setAutoSimulate] = useState<boolean>(!order.isLiveApiOrder);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(false);
  const [lastApiStatus, setLastApiStatus] = useState<string | null>(null);

  // Generate QR Code for deposit address
  useEffect(() => {
    if (order.depositAddress) {
      QRCode.toDataURL(order.depositAddress, {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation failed', err));
    }
  }, [order.depositAddress]);

  // Countdown timer for fixed rate lock
  useEffect(() => {
    if (order.status === 'completed' || order.status === 'failed') return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000));
      setTimeLeftSec(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [order.expiresAt, order.status]);

  // Trigger celebration confetti on success
  useEffect(() => {
    if (order.status === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [order.status]);

  // Real-time Exchange API Status Poller
  useEffect(() => {
    const txId = order.exchangeTxId || order.letsexchangeTxId;
    if (!txId || order.status === 'completed' || order.status === 'failed') {
      return;
    }

    const pollLiveStatus = async () => {
      try {
        setIsLivePolling(true);
        const liveData = await fetchExchangeTxStatus(txId);
        if (!liveData) return;

        setLastApiStatus(liveData.status || 'active');

        // Map Exchange status to app OrderStatus
        const apiStatus = (liveData.status || '').toLowerCase();
        let newStatus: OrderStatus = order.status;

        if (['wait', 'created', 'new', 'waiting'].includes(apiStatus)) {
          newStatus = 'awaiting_deposit';
        } else if (['confirming', 'confirmation', 'confirmed', 'verifying'].includes(apiStatus)) {
          newStatus = 'confirming';
        } else if (['exchanging', 'exchange', 'processing'].includes(apiStatus)) {
          newStatus = 'exchanging';
        } else if (['sending', 'sending_to_user', 'sending_to_recipient'].includes(apiStatus)) {
          newStatus = 'sending';
        } else if (['finished', 'completed', 'success', 'done'].includes(apiStatus)) {
          newStatus = 'completed';
        } else if (['failed', 'expired', 'refunded', 'overdue'].includes(apiStatus)) {
          newStatus = 'failed';
        }

        const isChanged =
          newStatus !== order.status ||
          (liveData.confirmations !== undefined && liveData.confirmations !== order.currentConfirmations) ||
          (liveData.hash_out && liveData.hash_out !== order.payoutTxHash);

        if (isChanged) {
          const updatedLogs = [...order.logs];
          if (newStatus !== order.status) {
            updatedLogs.push({
              timestamp: Date.now(),
              message: `Exchange API status updated: [${apiStatus.toUpperCase()}] -> ${newStatus}`,
              type: newStatus === 'completed' ? 'success' : 'info',
            });
          }

          const updated: SwapOrder = {
            ...order,
            status: newStatus,
            currentConfirmations: liveData.confirmations ?? order.currentConfirmations,
            requiredConfirmations: liveData.need_confirmations ?? order.requiredConfirmations,
            depositTxHash: liveData.hash_in || order.depositTxHash,
            payoutTxHash: liveData.hash_out || order.payoutTxHash,
            coinFromExplorerUrl: liveData.coin_from_explorer_url || order.coinFromExplorerUrl,
            coinToExplorerUrl: liveData.coin_to_explorer_url || order.coinToExplorerUrl,
            logs: updatedLogs,
          };

          saveOrder(updated);
          onOrderUpdated(updated);
        }
      } catch (e) {
        console.warn('Exchange status poll failed:', e);
      } finally {
        setIsLivePolling(false);
      }
    };

    pollLiveStatus();
    const interval = setInterval(pollLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [order, onOrderUpdated]);

  // Sandbox simulation logic (for fallback demo or test progression)
  useEffect(() => {
    if (!autoSimulate || order.status === 'completed' || order.status === 'failed') return;

    const timeout = setTimeout(() => {
      if (order.status === 'awaiting_deposit') {
        triggerDepositReceived();
      } else if (order.status === 'confirming') {
        if (order.currentConfirmations < order.requiredConfirmations) {
          const nextConf = Math.min(
            order.requiredConfirmations,
            order.currentConfirmations + Math.floor(Math.random() * 3 + 2)
          );
          const updated: SwapOrder = {
            ...order,
            currentConfirmations: nextConf,
            logs: [
              ...order.logs,
              {
                timestamp: Date.now(),
                message: `Blockchain confirmation ${nextConf}/${order.requiredConfirmations} validated on ${order.fromToken.chainName}.`,
                type: 'info',
              },
            ],
          };
          if (nextConf >= order.requiredConfirmations) {
            updated.status = 'exchanging';
            updated.logs.push({
              timestamp: Date.now() + 200,
              message: `Deposit verified. Initiating routing through ${order.provider.name}...`,
              type: 'info',
            });
          }
          saveOrder(updated);
          onOrderUpdated(updated);
        }
      } else if (order.status === 'exchanging') {
        const payoutHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const updated: SwapOrder = {
          ...order,
          status: 'sending',
          payoutTxHash: payoutHash,
          logs: [
            ...order.logs,
            {
              timestamp: Date.now(),
              message: `Exchange settlement completed. Broadcasting payout to destination wallet...`,
              type: 'info',
            },
            {
              timestamp: Date.now() + 300,
              message: `Outbound tx hash generated: ${payoutHash.substring(0, 16)}...`,
              type: 'success',
            },
          ],
        };
        saveOrder(updated);
        onOrderUpdated(updated);
      } else if (order.status === 'sending') {
        const updated: SwapOrder = {
          ...order,
          status: 'completed',
          logs: [
            ...order.logs,
            {
              timestamp: Date.now(),
              message: `Transaction settled successfully! ${order.toAmount} ${order.toToken.symbol} delivered to ${order.recipientAddress.substring(0, 10)}...`,
              type: 'success',
            },
          ],
        };
        saveOrder(updated);
        onOrderUpdated(updated);
      }
    }, 4500);

    return () => clearTimeout(timeout);
  }, [order, autoSimulate]);

  // User manually triggers deposit
  const triggerDepositReceived = () => {
    const mockDepositHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const updated: SwapOrder = {
      ...order,
      status: 'confirming',
      depositTxHash: mockDepositHash,
      currentConfirmations: 2,
      logs: [
        ...order.logs,
        {
          timestamp: Date.now(),
          message: `Incoming transfer of ${order.fromAmount} ${order.fromToken.symbol} detected in mempool!`,
          type: 'success',
        },
        {
          timestamp: Date.now() + 200,
          message: `Deposit TX: ${mockDepositHash.substring(0, 20)}... (Confirmations: 2/${order.requiredConfirmations})`,
          type: 'info',
        },
      ],
    };
    saveOrder(updated);
    onOrderUpdated(updated);
  };

  // User fast forwards to complete
  const triggerFastForward = () => {
    const payoutHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const updated: SwapOrder = {
      ...order,
      status: 'completed',
      currentConfirmations: order.requiredConfirmations,
      payoutTxHash: payoutHash,
      logs: [
        ...order.logs,
        {
          timestamp: Date.now(),
          message: `Simulation fast-forward triggered. Order marked as completed!`,
          type: 'success',
        },
        {
          timestamp: Date.now() + 200,
          message: `Payout of ${order.toAmount} ${order.toToken.symbol} confirmed!`,
          type: 'success',
        },
      ],
    };
    saveOrder(updated);
    onOrderUpdated(updated);
  };

  // Helper copy function
  const copyToClipboard = (text: string, type: 'deposit' | 'memo' | 'orderId') => {
    navigator.clipboard.writeText(text);
    if (type === 'deposit') {
      setCopiedDeposit(true);
      setTimeout(() => setCopiedDeposit(false), 2000);
    } else if (type === 'memo') {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;

  // Stages
  const steps: { key: OrderStatus; title: string; desc: string }[] = [
    { key: 'awaiting_deposit', title: '1. Awaiting Deposit', desc: 'Send crypto to deposit address' },
    { key: 'confirming', title: '2. Confirming', desc: `Waiting for ${order.requiredConfirmations} block confirmations` },
    { key: 'exchanging', title: '3. Exchanging', desc: `Routing via ${order.provider.name}` },
    { key: 'sending', title: '4. Sending', desc: 'Broadcasting payout to recipient' },
    { key: 'completed', title: '5. Success', desc: 'Tokens delivered to wallet' },
  ];

  const getStepIndex = (st: OrderStatus) => {
    switch (st) {
      case 'awaiting_deposit':
        return 0;
      case 'confirming':
        return 1;
      case 'exchanging':
        return 2;
      case 'sending':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner with Order ID & Status */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <RefreshCw className={`w-6 h-6 ${order.status !== 'completed' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order ID</span>
                <span className="font-mono text-white font-bold">{order.id}</span>
                <button
                  onClick={() => copyToClipboard(order.id, 'orderId')}
                  className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {order.isLiveApiOrder && (
                  <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE API
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Created {new Date(order.createdAt).toLocaleTimeString()}</span>
                <span>•</span>
                <span className="capitalize text-emerald-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {order.mode} Rate
                </span>
                <span>•</span>
                <span>Provider: <strong className="text-slate-200">{order.provider.name}</strong></span>
                {isLivePolling && (
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-spin" /> Syncing...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {order.status === 'awaiting_deposit' && order.mode === 'fixed' && (
              <div className="bg-amber-950/40 border border-amber-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <div>
                  <span className="text-[10px] text-amber-400/80 block uppercase font-bold">Rate Guaranteed For</span>
                  <span className="text-sm font-mono font-bold text-amber-300">
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </span>
                </div>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">Order Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* 5-Step Visual Progress Bar */}
        <div className="py-6 border-b border-slate-800">
          <div className="grid grid-cols-5 gap-2 relative">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center relative group">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 ring-4 ring-emerald-500/10 animate-pulse'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>

                  <span
                    className={`text-xs font-bold mt-2.5 transition-colors ${
                      isCurrent ? 'text-emerald-400' : isPast ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.title.split('. ')[1]}
                  </span>

                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5 line-clamp-1">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-6">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700 ease-out"
              style={{ width: `${((currentStepIdx + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Action / Deposit Box */}
        {order.status === 'awaiting_deposit' && (
          <div className="mt-6 p-6 bg-[#0a0d14] border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center gap-6">
            {/* Left: Instructions & Address */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Please Send Exactly
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Network: <strong className="text-white">{order.fromToken.chainName} ({order.fromToken.networkBadge})</strong>
                </span>
              </div>

              <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
                <span>{order.fromAmount}</span>
                <span className="text-emerald-400 text-xl">{order.fromToken.symbol}</span>
                <span className="text-xs text-slate-400 font-normal font-sans">
                  (≈ ${(order.fromAmount * order.fromToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD)
                </span>
              </div>

              {/* Deposit Address Box */}
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">
                  To this official deposit address:
                </label>
                <div className="flex items-center gap-2 p-3 bg-[#121722] border border-slate-700 rounded-xl">
                  <span className="font-mono text-xs text-emerald-300 break-all select-all flex-1">
                    {order.depositAddress}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.depositAddress, 'deposit')}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedDeposit ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDeposit ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Deposit Memo / Tag if required */}
              {order.depositMemo && (
                <div>
                  <label className="text-xs text-amber-400 block mb-1 font-semibold">
                    Mandatory Destination Memo / Tag:
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-500/40 rounded-xl">
                    <span className="font-mono text-xs text-amber-300 break-all font-bold flex-1">
                      {order.depositMemo}
                    </span>
                    <button
                      onClick={() => copyToClipboard(order.depositMemo!, 'memo')}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMemo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMemo ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Send only <strong className="text-slate-200">{order.fromToken.symbol}</strong> via the{' '}
                  <strong className="text-slate-200">{order.fromToken.networkBadge}</strong> network. Funds will automatically swap upon arrival.
                </span>
              </div>
            </div>

            {/* Right: Deposit QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#121722] border border-slate-800 rounded-2xl shrink-0">
              {qrDataUrl ? (
                <div
                  onClick={() => setShowQrModal(true)}
                  className="cursor-pointer group relative p-2 bg-white rounded-xl shadow-lg"
                  title="Click to expand QR Code"
                >
                  <img src={qrDataUrl} alt="Deposit QR Code" className="w-36 h-36 object-contain" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    <QrCode className="w-5 h-5 mr-1" /> Expand
                  </div>
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-800 animate-pulse rounded-xl" />
              )}
              <span className="text-xs text-slate-400 mt-2 font-medium">Scan with Mobile Wallet</span>
              <span className="text-[11px] text-slate-500">Auto-fills address and exact amount</span>
            </div>
          </div>
        )}

        {/* Confirming & Exchanging Banner */}
        {(order.status === 'confirming' || order.status === 'exchanging' || order.status === 'sending') && (
          <div className="mt-6 p-6 bg-[#0a0d14] border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {order.status === 'confirming' && 'Deposit Detected • Validating Block Confirmations'}
                    {order.status === 'exchanging' && `Executing Liquidity Route via ${order.provider.name}`}
                    {order.status === 'sending' && 'Broadcasting Output to Recipient Wallet'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {order.status === 'confirming' &&
                      `Confirmations: ${order.currentConfirmations} / ${order.requiredConfirmations} on ${order.fromToken.chainName}`}
                    {order.status === 'exchanging' &&
                      `Swapping ${order.fromAmount} ${order.fromToken.symbol} ➔ ${order.toAmount} ${order.toToken.symbol}`}
                    {order.status === 'sending' && `Delivering to ${order.recipientAddress}`}
                  </p>
                </div>
              </div>

              {order.coinFromExplorerUrl && (
                <a
                  href={order.coinFromExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Deposit Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {order.status === 'confirming' && (
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, (order.currentConfirmations / order.requiredConfirmations) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Completed Receipt Card */}
        {order.status === 'completed' && (
          <div className="mt-6 p-6 bg-gradient-to-b from-emerald-950/30 to-[#0e1420] border border-emerald-500/40 rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Delivered Output</span>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  +{order.toAmount} {order.toToken.symbol}
                </div>
                <span className="text-xs text-slate-400">
                  ≈ ${(order.toAmount * order.toToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              <button
                onClick={onNewSwap}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Swap Another Pair
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Recipient Wallet ({order.toToken.chainName}):</span>
                <span className="font-mono text-slate-200 break-all">{order.recipientAddress}</span>
              </div>

              {(order.payoutTxHash || order.coinToExplorerUrl) && (
                <div>
                  <span className="text-slate-500 block mb-0.5">Blockchain Payout Explorer:</span>
                  <a
                    href={order.coinToExplorerUrl || getExplorerTxLink(order.toToken.chainId, order.payoutTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:underline break-all flex items-center gap-1"
                  >
                    {order.payoutTxHash ? `${order.payoutTxHash.substring(0, 24)}...` : 'View on Explorer'}{' '}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details Accordion / Summary */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Exchange Rate:</span>
            <span className="font-mono text-slate-200 font-semibold">
              1 {order.fromToken.symbol} ≈ {order.expectedRate} {order.toToken.symbol}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Network Gas Fee:</span>
            <span className="font-mono text-slate-200 font-semibold">${order.networkFeeUsd} USD</span>
          </div>
          <div>
            <span className="text-slate-500 block">Provider Liquidity:</span>
            <span className="font-semibold text-emerald-400">{order.provider.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Recipient Address:</span>
            <span className="font-mono text-slate-200 truncate block" title={order.recipientAddress}>
              {order.recipientAddress.substring(0, 8)}...{order.recipientAddress.slice(-6)}
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Control Panel & Live Logs */}
      <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Live Execution Terminal & Logs</h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>
        </div>

        {/* Simulation Controls (Available for fast testing) */}
        <div className="mt-3 p-3 bg-[#0d1117] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">Sandbox Fast-Forward:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoSimulate}
                onChange={(e) => setAutoSimulate(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Auto-Progress Simulation</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'awaiting_deposit' && (
              <button
                id="sim-deposit-btn"
                onClick={triggerDepositReceived}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" /> Simulate Deposit Received
              </button>
            )}

            {order.status !== 'completed' && (
              <button
                id="sim-fast-forward-btn"
                onClick={triggerFastForward}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Fast-Forward to Success
              </button>
            )}

            <button
              onClick={onNewSwap}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset / New Swap
            </button>
          </div>
        </div>

        {/* Live Logs Terminal */}
        {showLogs && (
          <div className="mt-3 bg-[#080a0f] rounded-xl p-3 border border-slate-800 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5">
            {order.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 text-[11px] shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : log.type === 'warning'
                      ? 'text-amber-400'
                      : log.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-[#121722] border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Deposit Address QR</h3>
            <p className="text-xs text-slate-400">
              Send exactly <strong className="text-emerald-400">{order.fromAmount} {order.fromToken.symbol}</strong> ({order.fromToken.networkBadge})
            </p>
            {qrDataUrl && (
              <div className="p-3 bg-white rounded-xl inline-block shadow-2xl">
                <img src={qrDataUrl} alt="Deposit QR Code" className="w-56 h-56 object-contain" />
              </div>
            )}
            <div className="p-2 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 break-all select-all">
              {order.depositAddress}
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
