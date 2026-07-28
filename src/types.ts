export type Currency = 'USD' | 'NGN';

export type TransactionType = 'usd_to_ngn' | 'ngn_to_usd' | 'nearby_send' | 'nearby_receive' | 'top_up' | 'card_payment';

export type TransactionStatus = 'completed' | 'queued_offline' | 'syncing' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  sourceAmount: number;
  sourceCurrency: Currency;
  targetAmount: number;
  targetCurrency: Currency;
  exchangeRate: number;
  fee: number;
  recipientName: string;
  recipientDetail: string;
  timestamp: string;
  status: TransactionStatus;
  isOffline: boolean;
  offlineSignature?: string;
  offlineNonce?: string;
  syncTimestamp?: string;
  notes?: string;
  bankName?: string;
  accountNumber?: string;
}

export interface NearbyPeer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  distanceMeters: number;
  signalStrength: 'strong' | 'medium' | 'weak';
  connectionType: 'BLE Mesh' | 'Ultrasound' | 'Wi-Fi Direct';
  accountNumber: string;
  bankName: string;
  isVerified: boolean;
  publicKey: string;
}

export interface ExchangeRate {
  usdToNgn: number;
  ngnToUsd: number;
  officialRate: number;
  parallelRate: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  change24h: number;
}

export interface UserProfile {
  name: string;
  email: string;
  tag: string;
  avatar: string;
  usdBalance: number;
  ngnBalance: number;
  virtualAccountNgn: string;
  virtualAccountUsd: string;
  bankName: string;
  tier: string;
  pin: string;
  biometricEnabled: boolean;
  kycVerified: boolean;
  publicKey: string;
}

export interface NigerianBank {
  code: string;
  name: string;
  popular?: boolean;
}

export interface FxHistoryPoint {
  time: string;
  rate: number;
}
