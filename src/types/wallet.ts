/**
 * Wallet Address Types
 */

export type WalletType = 'whale' | 'institution' | 'exchange' | 'custom';

export interface WalletAddress {
  id: string;
  address: string;
  label: string;
  type: WalletType;
  notes?: string;
  arkhamsLink?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WalletExportData {
  version: string;
  exportDate: number;
  addresses: WalletAddress[];
}
