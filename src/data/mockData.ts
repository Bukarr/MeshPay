import { UserProfile, NigerianBank, NearbyPeer, Transaction, ExchangeRate, FxHistoryPoint } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Adewale Lawson',
  email: 'adewale.lawson@meshpay.io',
  phone: '08012345678',
  tag: '$adewale_l',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  usdBalance: 2850.00,
  ngnBalance: 1420000.00,
  virtualAccountNgn: '9021849201',
  virtualAccountUsd: '409218294012',
  bankName: 'MeshPay Account',
  tier: 'Tier 3 (Verified)',
  pin: '1234',
  biometricEnabled: true,
  kycVerified: true,
  publicKey: 'mp_sec_0x9f8a3c...e42b'
};

export const SECOND_USER_PROFILE: UserProfile = {
  name: 'Fatima Bello',
  email: 'fatima.bello@meshpay.io',
  phone: '08098765432',
  tag: '$fatima_b',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  usdBalance: 1200.00,
  ngnBalance: 380000.00,
  virtualAccountNgn: '8092318492',
  virtualAccountUsd: '409218298811',
  bankName: 'GTBank / MeshPay Vault',
  tier: 'Tier 3 (Verified)',
  pin: '5678',
  biometricEnabled: true,
  kycVerified: true,
  publicKey: 'mp_sec_0x3a1b8c...f11d'
};

export const THIRD_USER_PROFILE: UserProfile = {
  name: 'Chinedu Okeke',
  email: 'chinedu.okeke@meshpay.io',
  phone: '07011223344',
  tag: '$chinedu_tech',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  usdBalance: 450.00,
  ngnBalance: 120000.00,
  virtualAccountNgn: '7039102938',
  virtualAccountUsd: '409218299900',
  bankName: 'Moniepoint MFB / MeshPay Vault',
  tier: 'Tier 2 (Verified)',
  pin: '9012',
  biometricEnabled: true,
  kycVerified: true,
  publicKey: 'mp_sec_0x9d44...12c8'
};

export const PRESET_ACCOUNTS = [
  {
    profile: INITIAL_USER_PROFILE,
    userId: 'user_1' as const,
    password: 'password123',
    roleLabel: 'Primary User (Account 1)',
    balanceText: '₦1,420,000 • $2,850'
  },
  {
    profile: SECOND_USER_PROFILE,
    userId: 'user_2' as const,
    password: 'fatima2026',
    roleLabel: 'Secondary User (Account 2)',
    balanceText: '₦380,000 • $1,200'
  },
  {
    profile: THIRD_USER_PROFILE,
    userId: 'user_3' as const,
    password: 'chinedu2026',
    roleLabel: 'Vendor / Tech Peer (Account 3)',
    balanceText: '₦120,000 • $450'
  }
];

export const NIGERIAN_BANKS: NigerianBank[] = [
  { code: '999001', name: 'MeshPay Digital Bank / Vault', popular: true },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)', popular: true },
  { code: '057', name: 'Zenith Bank', popular: true },
  { code: '044', name: 'Access Bank', popular: true },
  { code: '50211', name: 'Kuda Microfinance Bank', popular: true },
  { code: '50515', name: 'Moniepoint MFB', popular: true },
  { code: '999992', name: 'OPay Digital Services', popular: true },
  { code: '011', name: 'First Bank of Nigeria', popular: true },
  { code: '033', name: 'United Bank for Africa (UBA)', popular: true },
  { code: '232', name: 'Sterling Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
];

export const INITIAL_NEARBY_PEERS: NearbyPeer[] = [
  {
    id: 'peer_fatima',
    name: 'Fatima Bello',
    handle: '$fatima_b',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    distanceMeters: 1.2,
    signalStrength: 'strong',
    connectionType: 'BLE Mesh',
    accountNumber: '8092318492',
    bankName: 'GTBank / MeshPay Vault',
    isVerified: true,
    publicKey: 'mp_sec_0x3a1b8c...f11d'
  },
  {
    id: 'peer_adewale',
    name: 'Adewale Lawson',
    handle: '$adewale_l',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    distanceMeters: 0.8,
    signalStrength: 'strong',
    connectionType: 'BLE Mesh',
    accountNumber: '9021849201',
    bankName: 'MeshPay Account',
    isVerified: true,
    publicKey: 'mp_sec_0x9f8a3c...e42b'
  },
  {
    id: 'peer_1',
    name: 'Chinedu Okeke',
    handle: '$chinedu_tech',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    distanceMeters: 2.8,
    signalStrength: 'strong',
    connectionType: 'BLE Mesh',
    accountNumber: '7039102938',
    bankName: 'Moniepoint MFB',
    isVerified: true,
    publicKey: '0x3a82...91b0'
  },
  {
    id: 'peer_3',
    name: 'David Kalu (Vendor)',
    handle: '$kalu_groceries',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    distanceMeters: 4.5,
    signalStrength: 'medium',
    connectionType: 'Ultrasound',
    accountNumber: '9012948102',
    bankName: 'OPay',
    isVerified: true,
    publicKey: '0x9d44...12c8'
  }
];

export const INITIAL_EXCHANGE_RATE: ExchangeRate = {
  usdToNgn: 1525.50,
  ngnToUsd: 0.000655,
  officialRate: 1495.00,
  parallelRate: 1525.50,
  lastUpdated: new Date().toISOString(),
  trend: 'up',
  change24h: 1.45
};

export const FX_RATE_HISTORY: FxHistoryPoint[] = [
  { time: '09:00', rate: 1515.00 },
  { time: '11:00', rate: 1518.20 },
  { time: '13:00', rate: 1520.00 },
  { time: '15:00', rate: 1522.50 },
  { time: '17:00', rate: 1521.00 },
  { time: '19:00', rate: 1524.80 },
  { time: '21:00', rate: 1525.50 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
