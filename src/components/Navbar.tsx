import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  Clock,
  Search,
  Wallet,
  Check,
  ChevronDown,
  Globe,
  Sparkles,
  ShieldCheck,
  Code,
  BarChart3,
  Menu,
  X,
  Coins,
} from 'lucide-react';
import { SwapOrder, ConnectedWalletInfo } from '../types';
import { getSavedOrders } from '../services/orderStorage';

export type ActiveTab = 'exchange' | 'all-cryptos' | 'markets' | 'providers' | 'chart' | 'affiliate';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenTrackModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenWalletModal: () => void;
  onOpenWalletDetailsModal?: () => void;
  connectedWallet?: ConnectedWalletInfo | null;
  onDisconnectWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenTrackModal,
  onOpenHistoryModal,
  onOpenWalletModal,
  onOpenWalletDetailsModal,
  connectedWallet,
  onDisconnectWallet,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const savedOrders = getSavedOrders();
  const activeCount = savedOrders.filter((o) => o.status !== 'completed' && o.status !== 'failed').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'exchange', label: 'Exchange', icon: <Zap className="w-4 h-4" /> },
    { id: 'all-cryptos', label: '5,638 Coins', icon: <Coins className="w-4 h-4" />, badge: '5,638' },
    { id: 'markets', label: '22M+ Pairs', icon: <Layers className="w-4 h-4" />, badge: 'Hot' },
    { id: 'providers', label: 'Liquidity Matrix', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'chart', label: 'Price Chart', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'affiliate', label: 'API & Widget', icon: <Code className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0e14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('exchange')}>
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0e14] rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-white tracking-tight">TradeSwap</span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded">
                22M+
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
              Instant Multi-Chain Swaps
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#121722]/80 p-1.5 rounded-2xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Track Order Button */}
          <button
            id="nav-track-order-btn"
            onClick={onOpenTrackModal}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#121722] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Track Order Status"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Track Order</span>
          </button>

          {/* History Button */}
          <button
            id="nav-history-btn"
            onClick={onOpenHistoryModal}
            className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-[#121722] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Swap History"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">History</span>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                {activeCount}
              </span>
            )}
          </button>

          {/* Connect Wallet */}
          {connectedWallet ? (
            <button
              id="nav-wallet-details-btn"
              onClick={onOpenWalletDetailsModal}
              className="flex items-center gap-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left"
              title="Click to view wallet details & switch network"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm">{connectedWallet.icon}</span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white font-mono text-[11px] block leading-tight">
                    {connectedWallet.name}
                  </span>
                  {connectedWallet.isRealExtension && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-300 font-mono block leading-tight">
                  {connectedWallet.address.substring(0, 6)}...{connectedWallet.address.slice(-4)}
                </span>
              </div>
            </button>
          ) : (
            <button
              id="nav-connect-wallet-btn"
              onClick={onOpenWalletModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-[#121722] border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e121a] border-b border-slate-800 p-4 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full p-3 rounded-xl text-sm font-bold text-left flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
