export interface TrustReport {
  id: string;
  reporterName: string;
  reason: string;
  category: 'impersonation' | 'non_payment' | 'phishing' | 'fake_proof' | 'suspicious_activity';
  timestamp: string;
}

export interface UserTrustProfile {
  identifier: string; // tag ($handle), account number, or name
  name: string;
  trustScore: number; // 0 - 100
  riskLevel: 'VERY_SAFE' | 'SAFE' | 'MODERATE' | 'HIGH_RISK' | 'FRAUD_FLAGGED';
  kycTier: string;
  accountAgeMonths: number;
  completedTxCount: number;
  fraudReportsCount: number;
  disputeRatePct: number;
  ecdsaHardwareVerified: boolean;
  biometricHardwareActive: boolean;
  meshReputationScore: number;
  fraudReports: TrustReport[];
  safetyFlags: string[];
  warningNote?: string;
}

const STORAGE_KEY_REPORTS = 'meshpay_fraud_reports_db';

// Known system profiles with initial baseline trust metrics
const BASELINE_PROFILES: Record<string, Omit<UserTrustProfile, 'identifier' | 'fraudReports'>> = {
  '$adewale_l': {
    name: 'Adewale Lawson',
    trustScore: 99,
    riskLevel: 'VERY_SAFE',
    kycTier: 'Tier 3 (BVN & NIN Verified)',
    accountAgeMonths: 28,
    completedTxCount: 142,
    fraudReportsCount: 0,
    disputeRatePct: 0.0,
    ecdsaHardwareVerified: true,
    biometricHardwareActive: true,
    meshReputationScore: 99,
    safetyFlags: [
      'Verified Hardware ECDSA Enclave',
      'Zero Disputed Transfers (0.0%)',
      'BVN & NIN National Identity Match',
      'Active Mesh P2P Node (28 Months)'
    ]
  },
  '$fatima_b': {
    name: 'Fatima Bello',
    trustScore: 98,
    riskLevel: 'VERY_SAFE',
    kycTier: 'Tier 3 (BVN & NIN Verified)',
    accountAgeMonths: 22,
    completedTxCount: 98,
    fraudReportsCount: 0,
    disputeRatePct: 0.0,
    ecdsaHardwareVerified: true,
    biometricHardwareActive: true,
    meshReputationScore: 98,
    safetyFlags: [
      'Verified GTBank Vault Integration',
      'Zero Disputed Transfers',
      'Biometric ECDSA Key Verified',
      'Mesh Ambassador Status'
    ]
  },
  '$chinedu_tech': {
    name: 'Chinedu Okeke',
    trustScore: 94,
    riskLevel: 'VERY_SAFE',
    kycTier: 'Tier 2 (ID Verified)',
    accountAgeMonths: 14,
    completedTxCount: 56,
    fraudReportsCount: 0,
    disputeRatePct: 0.2,
    ecdsaHardwareVerified: true,
    biometricHardwareActive: true,
    meshReputationScore: 93,
    safetyFlags: [
      'Moniepoint MFB Verified Account',
      'Verified Tech Peer Identity',
      'Biometric Secure Vault'
    ]
  },
  '$kalu_groceries': {
    name: 'David Kalu (Vendor)',
    trustScore: 88,
    riskLevel: 'SAFE',
    kycTier: 'Tier 2 (Merchant Verified)',
    accountAgeMonths: 9,
    completedTxCount: 210,
    fraudReportsCount: 0,
    disputeRatePct: 0.5,
    ecdsaHardwareVerified: true,
    biometricHardwareActive: false,
    meshReputationScore: 88,
    safetyFlags: [
      'Registered Merchant (OPay)',
      'High Volume P2P Vendor',
      'Soundwave POS Terminal'
    ]
  },
  '$suspicious_bot': {
    name: 'Suspicious / Unverified Account',
    trustScore: 28,
    riskLevel: 'FRAUD_FLAGGED',
    kycTier: 'Unverified (Tier 0)',
    accountAgeMonths: 0,
    completedTxCount: 1,
    fraudReportsCount: 4,
    disputeRatePct: 45.0,
    ecdsaHardwareVerified: false,
    biometricHardwareActive: false,
    meshReputationScore: 12,
    safetyFlags: [
      '⚠️ 4 Fraud Reports Filed by Community',
      '⚠️ Unverified ID / Mismatched Account Name',
      '⚠️ High Chargeback / Disputed Transfer Rate (45%)',
      '⚠️ Suspicious New Account Created < 24 Hours'
    ],
    warningNote: 'CRITICAL WARNING: This account has been flagged for multiple fraudulent payment disputes and unverified identity details.'
  }
};

export function getStoredFraudReports(): Record<string, TrustReport[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse trust fraud reports', e);
  }
  return {};
}

export function getTrustProfile(target: string): UserTrustProfile {
  if (!target) {
    return {
      identifier: 'Unknown',
      name: 'Unverified Recipient',
      trustScore: 50,
      riskLevel: 'MODERATE',
      kycTier: 'Tier 1 Basic',
      accountAgeMonths: 1,
      completedTxCount: 2,
      fraudReportsCount: 0,
      disputeRatePct: 0,
      ecdsaHardwareVerified: false,
      biometricHardwareActive: false,
      meshReputationScore: 50,
      fraudReports: [],
      safetyFlags: ['Basic Unverified Account', 'Low Transaction History']
    };
  }

  const normalized = target.trim().toLowerCase();
  const allReportsMap = getStoredFraudReports();

  // Find baseline if exists
  let baselineKey = Object.keys(BASELINE_PROFILES).find(key => 
    key.toLowerCase() === normalized || 
    key.replace('$', '').toLowerCase() === normalized.replace('$', '').replace('@', '') ||
    BASELINE_PROFILES[key].name.toLowerCase().includes(normalized)
  );

  let profile: Omit<UserTrustProfile, 'identifier' | 'fraudReports'>;

  if (baselineKey && BASELINE_PROFILES[baselineKey]) {
    profile = { ...BASELINE_PROFILES[baselineKey] };
  } else {
    // Generate a realistic dynamic profile based on identifier hash
    let hash = 0;
    for (let i = 0; i < target.length; i++) {
      hash = (hash << 5) - hash + target.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const calculatedScore = 75 + (absHash % 22); // score between 75 and 97

    profile = {
      name: target.startsWith('$') || target.startsWith('@') ? target : `Recipient (${target})`,
      trustScore: calculatedScore,
      riskLevel: calculatedScore >= 90 ? 'VERY_SAFE' : calculatedScore >= 75 ? 'SAFE' : 'MODERATE',
      kycTier: 'Tier 2 (Bank Verified)',
      accountAgeMonths: (absHash % 18) + 2,
      completedTxCount: (absHash % 80) + 12,
      fraudReportsCount: 0,
      disputeRatePct: (absHash % 10) / 10,
      ecdsaHardwareVerified: true,
      biometricHardwareActive: true,
      meshReputationScore: calculatedScore - 2,
      safetyFlags: [
        'Interbank Verified NIBSS Name Lookup',
        'ECDSA Vault Public Key Active',
        'Clean Dispute Record'
      ]
    };
  }

  // Adjust score based on user-submitted fraud reports in localStorage
  const userReports = allReportsMap[normalized] || allReportsMap[profile.name.toLowerCase()] || [];
  const totalFraudCount = profile.fraudReportsCount + userReports.length;

  let finalScore = profile.trustScore - (userReports.length * 25);
  if (finalScore < 10) finalScore = 10;

  let finalRiskLevel: UserTrustProfile['riskLevel'] = profile.riskLevel;
  if (finalScore < 40) finalRiskLevel = 'FRAUD_FLAGGED';
  else if (finalScore < 65) finalRiskLevel = 'HIGH_RISK';
  else if (finalScore < 85) finalRiskLevel = 'MODERATE';
  else if (finalScore < 95) finalRiskLevel = 'SAFE';

  const combinedFlags = [...profile.safetyFlags];
  if (userReports.length > 0) {
    combinedFlags.unshift(`⚠️ ${userReports.length} Fraud Report(s) Filed by MeshPay Community`);
  }

  return {
    ...profile,
    identifier: target,
    trustScore: finalScore,
    riskLevel: finalRiskLevel,
    fraudReportsCount: totalFraudCount,
    fraudReports: userReports,
    safetyFlags: combinedFlags,
    warningNote: userReports.length > 0 
      ? `WARNING: This account has been flagged by ${userReports.length} user(s) for suspicious payment activities.`
      : profile.warningNote
  };
}

export function reportAccountFraud(
  targetIdentifier: string,
  reporterName: string,
  reason: string,
  category: TrustReport['category']
): UserTrustProfile {
  const normalized = targetIdentifier.trim().toLowerCase();
  const allReports = getStoredFraudReports();

  const newReport: TrustReport = {
    id: 'report_' + Date.now(),
    reporterName: reporterName || 'Anonymous Mesh Node',
    reason,
    category,
    timestamp: new Date().toISOString()
  };

  const existingList = allReports[normalized] || [];
  allReports[normalized] = [newReport, ...existingList];

  localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(allReports));
  window.dispatchEvent(new Event('meshpay_trust_updated'));

  return getTrustProfile(targetIdentifier);
}
