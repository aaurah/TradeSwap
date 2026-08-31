import { ConnectedWalletInfo, Web3ProviderMeta } from '../types';

// Declared global extensions in browser window
declare global {
  interface Window {
    ethereum?: any;
    phantom?: {
      solana?: any;
      bitcoin?: any;
      ethereum?: any;
    };
    solana?: any;
    coinbaseWalletExtension?: any;
    trustwallet?: any;
    unisat?: any;
    tronWeb?: any;
    tronLink?: any;
    backpack?: any;
    okxwallet?: any;
  }
}

// EVM Chain ID mapping
export const EVM_CHAIN_MAP: Record<string, { name: string; symbol: string; explorer: string }> = {
  '0x1': { name: 'Ethereum Mainnet', symbol: 'ETH', explorer: 'https://etherscan.io' },
  '0x38': { name: 'BNB Smart Chain', symbol: 'BNB', explorer: 'https://bscscan.com' },
  '0x89': { name: 'Polygon', symbol: 'POL', explorer: 'https://polygonscan.com' },
  '0xa4b1': { name: 'Arbitrum One', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  '0x2105': { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' },
  '0xa': { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  '0xa86a': { name: 'Avalanche C-Chain', symbol: 'AVAX', explorer: 'https://snowtrace.io' },
  '0x5': { name: 'Goerli Testnet', symbol: 'ETH', explorer: 'https://goerli.etherscan.io' },
  '0xaa36a7': { name: 'Sepolia Testnet', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
};

// Supported Wallets Metadata
export const SUPPORTED_WALLETS: Web3ProviderMeta[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    category: 'evm',
    desc: 'Connect to Ethereum, EVM & Layer 2 networks',
    installUrl: 'https://metamask.io/download/',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.ethereum && (window.ethereum.isMetaMask || window.ethereum.providers?.some((p: any) => p.isMetaMask))),
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    category: 'solana',
    desc: 'Solana, Bitcoin & EVM multi-chain wallet',
    installUrl: 'https://phantom.app/download',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.phantom?.solana?.isPhantom || window.solana?.isPhantom),
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    category: 'evm',
    desc: 'Self-custody crypto wallet by Coinbase',
    installUrl: 'https://www.coinbase.com/wallet',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.coinbaseWalletExtension || window.ethereum?.isCoinbaseWallet),
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    category: 'multi',
    desc: 'Multi-chain mobile and browser extension',
    installUrl: 'https://trustwallet.com/browser-extension',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.trustwallet || window.ethereum?.isTrust),
  },
  {
    id: 'unisat',
    name: 'UniSat Wallet',
    icon: '🟧',
    category: 'bitcoin',
    desc: 'Bitcoin native ordinals & taproot wallet',
    installUrl: 'https://unisat.io/download',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.unisat),
  },
  {
    id: 'tronlink',
    name: 'TronLink',
    icon: '⚡',
    category: 'tron',
    desc: 'TRON TRC20 & decentralized ecosystem',
    installUrl: 'https://www.tronlink.org/',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.tronWeb || window.tronLink),
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: '⬛',
    category: 'multi',
    desc: 'Universal multi-chain Web3 portal',
    installUrl: 'https://www.okx.com/web3',
    checkInstalled: () => typeof window !== 'undefined' && Boolean(window.okxwallet),
  },
];

const STORAGE_KEY = 'dex_connected_wallet_v2';

export function getSavedWallet(): ConnectedWalletInfo | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('letsexchange_connected_wallet_v2');
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function saveConnectedWallet(info: ConnectedWalletInfo | null) {
  try {
    if (info) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save wallet info to localStorage', e);
  }
}

/**
 * Format balance from wei (hex string) to human readable string
 */
function formatWeiBalance(hexWei: string, symbol: string = 'ETH'): string {
  try {
    const wei = BigInt(hexWei);
    const divisor = BigInt(10 ** 18);
    const integerPart = wei / divisor;
    const remainder = wei % divisor;
    const fractionPart = remainder.toString().padStart(18, '0').slice(0, 4);
    return `${integerPart.toString()}.${fractionPart} ${symbol}`;
  } catch (e) {
    return `0.0000 ${symbol}`;
  }
}

/**
 * Connect to MetaMask or standard EVM provider
 */
export async function connectEVM(providerId: string = 'metamask'): Promise<ConnectedWalletInfo> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No EVM wallet extension detected. Please install MetaMask or another EVM wallet.');
  }

  // Find targeted provider if multiple injected
  let provider = window.ethereum;
  if (window.ethereum.providers?.length) {
    if (providerId === 'metamask') {
      provider = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
    } else if (providerId === 'coinbase') {
      provider = window.ethereum.providers.find((p: any) => p.isCoinbaseWallet) || window.ethereum;
    } else if (providerId === 'trust') {
      provider = window.ethereum.providers.find((p: any) => p.isTrust) || window.ethereum;
    }
  }

  // Request accounts from extension
  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection was rejected or no account was selected.');
  }

  const address = accounts[0];

  // Request chainId
  let chainIdHex = '0x1';
  try {
    chainIdHex = await provider.request({ method: 'eth_chainId' });
  } catch (e) {
    console.warn('Could not query chainId', e);
  }

  const chainMeta = EVM_CHAIN_MAP[chainIdHex.toLowerCase()] || {
    name: `EVM Chain (${chainIdHex})`,
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
  };

  // Request balance
  let balance = `0.0000 ${chainMeta.symbol}`;
  try {
    const rawBalance: string = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    if (rawBalance) {
      balance = formatWeiBalance(rawBalance, chainMeta.symbol);
    }
  } catch (e) {
    console.warn('Could not query balance', e);
  }

  const walletMeta = SUPPORTED_WALLETS.find((w) => w.id === providerId) || SUPPORTED_WALLETS[0];

  const info: ConnectedWalletInfo = {
    providerId,
    name: walletMeta.name,
    icon: walletMeta.icon,
    address,
    networkName: chainMeta.name,
    chainId: chainIdHex,
    balance,
    isRealExtension: true,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(info);
  return info;
}

/**
 * Connect to Phantom Solana wallet
 */
export async function connectPhantom(): Promise<ConnectedWalletInfo> {
  const phantomSolana = window.phantom?.solana || window.solana;

  if (!phantomSolana || !phantomSolana.isPhantom) {
    throw new Error('Phantom wallet extension is not installed. Please install Phantom for Solana.');
  }

  const resp = await phantomSolana.connect();
  const address = resp.publicKey ? resp.publicKey.toString() : phantomSolana.publicKey?.toString();

  if (!address) {
    throw new Error('Failed to retrieve public key from Phantom wallet.');
  }

  const info: ConnectedWalletInfo = {
    providerId: 'phantom',
    name: 'Phantom',
    icon: '👻',
    address,
    networkName: 'Solana Mainnet-Beta',
    chainId: 'solana-mainnet',
    balance: 'SOL Ready',
    isRealExtension: true,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(info);
  return info;
}

/**
 * Connect to UniSat Bitcoin wallet
 */
export async function connectUniSat(): Promise<ConnectedWalletInfo> {
  if (typeof window === 'undefined' || !window.unisat) {
    throw new Error('UniSat Bitcoin wallet extension is not installed.');
  }

  const accounts: string[] = await window.unisat.requestAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No Bitcoin account authorized by UniSat.');
  }

  const address = accounts[0];
  let balance = 'BTC Ready';

  try {
    const res = await window.unisat.getBalance();
    if (res && res.total !== undefined) {
      const btc = (res.total / 100000000).toFixed(6);
      balance = `${btc} BTC`;
    }
  } catch (e) {
    console.warn('Could not query UniSat balance', e);
  }

  const info: ConnectedWalletInfo = {
    providerId: 'unisat',
    name: 'UniSat Wallet',
    icon: '🟧',
    address,
    networkName: 'Bitcoin Mainnet',
    chainId: 'bitcoin',
    balance,
    isRealExtension: true,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(info);
  return info;
}

/**
 * Connect to TronLink TRON wallet
 */
export async function connectTronLink(): Promise<ConnectedWalletInfo> {
  if (typeof window === 'undefined' || (!window.tronWeb && !window.tronLink)) {
    throw new Error('TronLink wallet extension is not installed. Please install TronLink for TRC20.');
  }

  if (window.tronLink && window.tronLink.request) {
    await window.tronLink.request({ method: 'tron_requestAccounts' });
  }

  const tronWeb = window.tronWeb;
  const address = tronWeb?.defaultAddress?.base58;

  if (!address) {
    throw new Error('TronLink wallet is locked or no TRON address is active. Please unlock TronLink.');
  }

  const info: ConnectedWalletInfo = {
    providerId: 'tronlink',
    name: 'TronLink',
    icon: '⚡',
    address,
    networkName: 'TRON Mainnet',
    chainId: 'tron',
    balance: 'TRX Ready',
    isRealExtension: true,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(info);
  return info;
}

/**
 * Connect a Watch / Manual Public Crypto Address
 */
export function connectManualAddress(
  address: string,
  chainName: string = 'Multi-Chain',
  label: string = 'Custom Watch Wallet'
): ConnectedWalletInfo {
  const cleanAddress = address.trim();
  const info: ConnectedWalletInfo = {
    providerId: 'manual',
    name: label,
    icon: '💼',
    address: cleanAddress,
    networkName: chainName,
    chainId: 'custom',
    balance: 'Watch Mode Active',
    isRealExtension: false,
    connectedAt: Date.now(),
  };

  saveConnectedWallet(info);
  return info;
}

/**
 * Switch EVM Network
 */
export async function switchEVMNetwork(targetChainIdHex: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    console.error('Failed to switch network', switchError);
    return false;
  }
}

/**
 * Setup Real Listeners for accounts and chain changes
 */
export function setupWeb3EventListeners(
  onAccountChange: (account: string | null) => void,
  onChainChange: (chainId: string) => void
) {
  if (typeof window === 'undefined') return () => {};

  // EVM Listeners
  if (window.ethereum && window.ethereum.on) {
    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        onAccountChange(null);
      } else {
        onAccountChange(accounts[0]);
      }
    };

    const handleChain = (chainId: string) => {
      onChainChange(chainId);
    };

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccounts);
        window.ethereum.removeListener('chainChanged', handleChain);
      }
    };
  }

  // Phantom Solana Listeners
  const phantomSolana = window.phantom?.solana || window.solana;
  if (phantomSolana && phantomSolana.on) {
    const handleSolanaAccount = (publicKey: any) => {
      if (publicKey) {
        onAccountChange(publicKey.toString());
      } else {
        onAccountChange(null);
      }
    };

    phantomSolana.on('accountChanged', handleSolanaAccount);
    phantomSolana.on('disconnect', () => onAccountChange(null));

    return () => {
      if (phantomSolana.removeListener) {
        phantomSolana.removeListener('accountChanged', handleSolanaAccount);
      }
    };
  }

  return () => {};
}
