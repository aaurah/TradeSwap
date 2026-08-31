import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { ConnectedWalletInfo } from '../types';
import { EVM_CHAIN_MAP, switchEVMNetwork } from '../services/web3Wallet';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: ConnectedWalletInfo;
  onDisconnect: () => void;
  onRefreshBalance?: () => void;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onDisconnect,
  onRefreshBalance,
}) => {
  const [copied, setCopied] = useState(false);
  const [switchingChain, setSwitchingChain] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = async (chainIdHex: string) => {
    setSwitchingChain(chainIdHex);
    await switchEVMNetwork(chainIdHex);
    setSwitchingChain(null);
  };

  // Block explorer URL generator based on address & chain
  const getExplorerUrl = () => {
    if (wallet.address.startsWith('0x')) {
      if (wallet.chainId === '0x38') return `https://bscscan.com/address/${wallet.address}`;
      if (wallet.chainId === '0x89') return `https://polygonscan.com/address/${wallet.address}`;
      if (wallet.chainId === '0xa4b1') return `https://arbiscan.io/address/${wallet.address}`;
      if (wallet.chainId === '0x2105') return `https://basescan.org/address/${wallet.address}`;
      return `https://etherscan.io/address/${wallet.address}`;
    }
    if (wallet.chainId === 'solana-mainnet' || wallet.providerId === 'phantom') {
      return `https://solscan.io/account/${wallet.address}`;
    }
    if (wallet.chainId === 'bitcoin' || wallet.providerId === 'unisat') {
      return `https://mempool.space/address/${wallet.address}`;
    }
    if (wallet.chainId === 'tron' || wallet.providerId === 'tronlink') {
      return `https://tronscan.org/#/address/${wallet.address}`;
    }
    return `https://etherscan.io/address/${wallet.address}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121722] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{wallet.icon}</span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {wallet.name}
                {wallet.isRealExtension ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Live Web3
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                    Watch Address
                  </span>
                )}
              </h3>
              <span className="text-xs text-slate-400 block">{wallet.networkName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Card */}
        <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Connected Address</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
                title="View on Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="font-mono text-xs text-slate-200 bg-[#121722] p-2.5 rounded-xl border border-slate-800/80 break-all select-all">
            {wallet.address}
          </p>

          {/* Balance */}
          {wallet.balance && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Native Balance:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{wallet.balance}</span>
            </div>
          )}
        </div>

        {/* EVM Network Switcher (if connected via EVM provider) */}
        {wallet.isRealExtension && wallet.address.startsWith('0x') && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Switch EVM Blockchain
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '0x1', name: 'Ethereum' },
                { id: '0x38', name: 'BNB Chain' },
                { id: '0x89', name: 'Polygon' },
                { id: '0xa4b1', name: 'Arbitrum' },
                { id: '0x2105', name: 'Base' },
                { id: '0xa', name: 'Optimism' },
              ].map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleSwitchNetwork(chain.id)}
                  disabled={switchingChain !== null || wallet.chainId === chain.id}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between ${
                    wallet.chainId === chain.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span>{chain.name}</span>
                  {wallet.chainId === chain.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              onDisconnect();
              onClose();
            }}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
