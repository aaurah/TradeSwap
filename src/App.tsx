import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LiveTickerTape } from './components/LiveTickerTape';
import { SwapWidget } from './components/SwapWidget';
import { OrderExecution } from './components/OrderExecution';
import { MarketsCatalog } from './components/MarketsCatalog';
import { AllCryptosCatalog } from './components/AllCryptosCatalog';
import { LiquidityMatrix } from './components/LiquidityMatrix';
import { PriceChart } from './components/PriceChart';
import { WidgetCustomizer } from './components/WidgetCustomizer';
import { TrackOrderModal } from './components/TrackOrderModal';
import { HistoryModal } from './components/HistoryModal';
import { WalletModal } from './components/WalletModal';
import { WalletDetailsModal } from './components/WalletDetailsModal';
import { Footer } from './components/Footer';
import { Token, SwapOrder, SwapQuote, LiquidityProvider, ConnectedWalletInfo } from './types';
import { POPULAR_TOKENS } from './data/tokens';
import { calculateSwapQuote } from './services/swapEngine';
import { getOrderById, getActiveOrderId, clearActiveOrderId } from './services/orderStorage';
import { getSavedWallet, saveConnectedWallet, setupWeb3EventListeners, EVM_CHAIN_MAP } from './services/web3Wallet';
import { Zap, Layers, Sparkles, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('exchange');

  // Selected Tokens for Swapping
  const [fromToken, setFromToken] = useState<Token>(POPULAR_TOKENS[0]); // BTC
  const [toToken, setToToken] = useState<Token>(POPULAR_TOKENS[5]); // USDT TRC20

  // Active Order being executed/tracked
  const [activeOrder, setActiveOrder] = useState<SwapOrder | null>(null);

  // Selected Liquidity Provider override
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // Modals state
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showWalletDetailsModal, setShowWalletDetailsModal] = useState<boolean>(false);

  // Connected Wallet state
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWalletInfo | null>(() => getSavedWallet());

  // Check if there was an active order on startup
  useEffect(() => {
    const activeId = getActiveOrderId();
    if (activeId) {
      const order = getOrderById(activeId);
      if (order && order.status !== 'completed' && order.status !== 'failed') {
        setActiveOrder(order);
      }
    }
  }, []);

  // Web3 Provider account & chain listeners
  useEffect(() => {
    const unsubscribe = setupWeb3EventListeners(
      (newAccount) => {
        if (!newAccount) {
          setConnectedWallet(null);
          saveConnectedWallet(null);
        } else {
          setConnectedWallet((prev) => {
            if (!prev) return null;
            const updated: ConnectedWalletInfo = { ...prev, address: newAccount };
            saveConnectedWallet(updated);
            return updated;
          });
        }
      },
      (newChainIdHex) => {
        setConnectedWallet((prev) => {
          if (!prev) return null;
          const chainMeta = EVM_CHAIN_MAP[newChainIdHex.toLowerCase()];
          const updated: ConnectedWalletInfo = {
            ...prev,
            chainId: newChainIdHex,
            networkName: chainMeta?.name || `Chain ${newChainIdHex}`,
          };
          saveConnectedWallet(updated);
          return updated;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Handler for connecting wallet
  const handleConnectWallet = (walletInfo: ConnectedWalletInfo) => {
    setConnectedWallet(walletInfo);
    saveConnectedWallet(walletInfo);
  };

  // Handler for disconnecting wallet
  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    saveConnectedWallet(null);
  };

  // Compute live quote for current pair
  const currentQuote: SwapQuote = React.useMemo(() => {
    return calculateSwapQuote(fromToken, toToken, 1.0, 'floating', selectedProviderId);
  }, [fromToken, toToken, selectedProviderId]);

  // Handler when user creates an order from widget
  const handleOrderCreated = (order: SwapOrder) => {
    setActiveOrder(order);
    setActiveTab('exchange');
  };

  // Handler when user starts a new swap
  const handleNewSwap = () => {
    setActiveOrder(null);
    clearActiveOrderId();
  };

  // Handler for pair selection from markets catalog
  const handleSelectPairForSwap = (newFrom: Token, newTo: Token) => {
    setFromToken(newFrom);
    setToToken(newTo);
    setActiveOrder(null);
    setActiveTab('exchange');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onOpenTrackModal={() => setShowTrackModal(true)}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
        onOpenWalletModal={() => setShowWalletModal(true)}
        onOpenWalletDetailsModal={() => setShowWalletDetailsModal(true)}
        connectedWallet={connectedWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      {/* Live Market & Recent Swaps Ticker Tape */}
      <LiveTickerTape />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* VIEW 1: EXCHANGE SWAP VIEW */}
        {activeTab === 'exchange' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {activeOrder ? (
              <OrderExecution
                order={activeOrder}
                onOrderUpdated={(updated) => setActiveOrder(updated)}
                onNewSwap={handleNewSwap}
              />
            ) : (
              <div className="space-y-12">
                {/* Hero Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> 22,400,000+ Liquidity Pairs Aggregated
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Instant Cross-Chain <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      Crypto Swapping
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400">
                    Non-custodial cryptocurrency exchange with no registration limits. Fixed & floating rates routed through THORChain, 1inch, and Uniswap.
                  </p>
                </div>

                {/* Primary Swap Widget */}
                <SwapWidget
                  fromToken={fromToken}
                  toToken={toToken}
                  onFromTokenChange={setFromToken}
                  onToTokenChange={setToToken}
                  onOrderCreated={handleOrderCreated}
                  userWalletAddress={connectedWallet?.address}
                  connectedWallet={connectedWallet}
                  onOpenWalletModal={() => setShowWalletModal(true)}
                />

                {/* Side-by-side: Liquidity Routing Matrix & Live Price Chart for the selected pair */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  <LiquidityMatrix
                    quote={currentQuote}
                    selectedProviderId={selectedProviderId || currentQuote.provider.id}
                    onSelectProvider={(p: LiquidityProvider) => setSelectedProviderId(p.id)}
                  />
                  <PriceChart fromToken={fromToken} toToken={toToken} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: ALL 5,638 CRYPTOCURRENCIES DIRECTORY */}
        {activeTab === 'all-cryptos' && (
          <div className="animate-in fade-in duration-300">
            <AllCryptosCatalog onSelectPairForSwap={handleSelectPairForSwap} />
          </div>
        )}

        {/* VIEW 2: 22M+ PAIRS CATALOG */}
        {activeTab === 'markets' && (
          <div className="animate-in fade-in duration-300">
            <MarketsCatalog onSelectPairForSwap={handleSelectPairForSwap} />
          </div>
        )}

        {/* VIEW 3: CROSS-CHAIN LIQUIDITY ROUTING ENGINE */}
        {activeTab === 'providers' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
            <div className="bg-[#121722] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Multi-Provider Cross-Chain Aggregator
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Our smart routing engine continuously queries order books and liquidity pools across 8+ decentralized and institutional partners to ensure optimal execution rates and minimal slippage.
              </p>
            </div>

            <LiquidityMatrix
              quote={currentQuote}
              selectedProviderId={selectedProviderId || currentQuote.provider.id}
              onSelectProvider={(p: LiquidityProvider) => {
                setSelectedProviderId(p.id);
                setActiveTab('exchange');
              }}
            />
          </div>
        )}

        {/* VIEW 4: LIVE PRICE CHART */}
        {activeTab === 'chart' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
            <div className="bg-[#121722] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Interactive Market Rates & Depth
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Real-time charting for <span className="text-emerald-400 font-bold">{fromToken.symbol} / {toToken.symbol}</span> with candlestick patterns and volume trends.
              </p>
            </div>

            <PriceChart fromToken={fromToken} toToken={toToken} />
          </div>
        )}

        {/* VIEW 5: B2B WIDGET & API INTEGRATION */}
        {activeTab === 'affiliate' && (
          <div className="animate-in fade-in duration-300">
            <WidgetCustomizer />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <TrackOrderModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        onSelectOrder={(order) => {
          setActiveOrder(order);
          setActiveTab('exchange');
        }}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectOrder={(order) => {
          setActiveOrder(order);
          setActiveTab('exchange');
        }}
      />

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnectWallet={handleConnectWallet}
      />

      {connectedWallet && (
        <WalletDetailsModal
          isOpen={showWalletDetailsModal}
          onClose={() => setShowWalletDetailsModal(false)}
          wallet={connectedWallet}
          onDisconnect={handleDisconnectWallet}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

