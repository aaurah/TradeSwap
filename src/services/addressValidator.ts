import { CHAINS } from '../data/chains';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  chainName: string;
  expectedFormat: string;
}

export function validateCryptoAddress(address: string, chainId: string): ValidationResult {
  const chain = CHAINS[chainId];
  if (!chain) {
    // If unknown chain, allow non-empty string as fallback
    return {
      isValid: address.trim().length > 10,
      errorMessage: address.trim().length <= 10 ? 'Address is too short' : undefined,
      chainName: chainId.toUpperCase(),
      expectedFormat: 'Valid crypto address',
    };
  }

  const cleanAddress = address.trim();
  if (!cleanAddress) {
    return {
      isValid: false,
      errorMessage: `Please enter a valid ${chain.name} (${chain.shortName}) address`,
      chainName: chain.name,
      expectedFormat: chain.addressExample,
    };
  }

  const matches = chain.addressRegex.test(cleanAddress);

  if (!matches) {
    return {
      isValid: false,
      errorMessage: `Invalid ${chain.name} format. Example: ${chain.addressExample}`,
      chainName: chain.name,
      expectedFormat: chain.addressExample,
    };
  }

  return {
    isValid: true,
    chainName: chain.name,
    expectedFormat: chain.addressExample,
  };
}
