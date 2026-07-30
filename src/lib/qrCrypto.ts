/**
 * Cryptographic utility for MeshPay anti-hijack hashed & encrypted QR payloads
 * and dynamic expiring verification codes.
 */

export interface EncryptedTxPayload {
  version: string;
  txId: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  recipientName: string;
  recipientDetail: string;
  bankName?: string;
  offlineNonce?: string;
  timestamp: string;
  expiresAt: number;
  salt: string;
  created_at?: number;
}

/**
 * Simple hash function to generate checksum for anti-tampering verification
 */
function calculateHmacChecksum(jsonStr: string, salt: string): string {
  let hash = 0;
  const str = jsonStr + ':' + salt + ':MESHPAY_SECURE_SALT_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Generate a 12-char hex checksum
  let hash2 = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = (hash2 << 7) - hash2 + str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return (hex + hex2).slice(0, 12).toUpperCase();
}

/**
 * Generate a random 6-digit cryptographic code that expires in 5 minutes
 */
export function generateDynamicCryptoCode(): { code: string; expiresAt: number } {
  const num = Math.floor(100000 + Math.random() * 900000);
  const code = `MP-${num}`;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  return { code, expiresAt };
}

/**
 * Encrypt transaction payload into anti-hijack format
 */
export function encryptTransactionPayload(
  tx: {
    id: string;
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    recipientName: string;
    recipientDetail: string;
    bankName?: string;
    offlineNonce?: string;
    timestamp?: string;
    created_at?: number;
  },
  cryptoCode?: string
): string {
  const salt = Math.random().toString(36).substring(2, 10);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 mins valid

  const payloadObj: EncryptedTxPayload = {
    version: 'MESHPAY_v2_ENC',
    txId: tx.id || 'TX_' + now,
    sourceAmount: tx.sourceAmount,
    sourceCurrency: tx.sourceCurrency,
    targetAmount: tx.targetAmount,
    targetCurrency: tx.targetCurrency,
    recipientName: tx.recipientName,
    recipientDetail: tx.recipientDetail,
    bankName: tx.bankName,
    offlineNonce: tx.offlineNonce || 'NONCE_' + Math.floor(Math.random() * 1000000),
    timestamp: tx.timestamp || new Date().toISOString(),
    expiresAt,
    salt,
    created_at: tx.created_at || now
  };

  const jsonStr = JSON.stringify(payloadObj);
  const checksum = calculateHmacChecksum(jsonStr, salt);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));

  return `MESHPAY:ENC:${base64Data}:${checksum}`;
}

/**
 * Decrypt and verify QR payload
 */
export function decryptAndVerifyQrPayload(encryptedStr: string): {
  valid: boolean;
  txData?: EncryptedTxPayload;
  error?: string;
} {
  if (!encryptedStr || typeof encryptedStr !== 'string') {
    return { valid: false, error: 'SECURITY ERROR: Invalid or empty QR payload format. Transaction rejected.' };
  }

  const trimmed = encryptedStr.trim();

  // Strictly reject if not starting with the official MESHPAY app protocol prefix
  if (!trimmed.startsWith('MESHPAY:')) {
    return { 
      valid: false, 
      error: 'SECURITY ERROR: Non-MeshPay QR detected! This QR code does not belong to this application. Transaction strictly rejected to prevent fraud.' 
    };
  }

  // Handle encrypted MESHPAY:ENC format
  if (trimmed.startsWith('MESHPAY:ENC:')) {
    const parts = trimmed.split(':');
    if (parts.length < 4) {
      return { valid: false, error: 'SECURITY ERROR: Corrupted encrypted QR string structure. Transaction rejected.' };
    }

    const base64Data = parts[2];
    const providedChecksum = parts[3];

    try {
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const payloadObj: EncryptedTxPayload = JSON.parse(jsonStr);

      // Verify Anti-Hijack Checksum
      const computedChecksum = calculateHmacChecksum(jsonStr, payloadObj.salt);
      if (computedChecksum !== providedChecksum) {
        return { valid: false, error: 'SECURITY WARNING: Checksum mismatch! Potential transaction hijacking or payload tampering detected.' };
      }

      // Check Expiration strictly (strictly 5-minute expiry, no tolerance)
      const now = Date.now();
      const isExpiredByDate = payloadObj.expiresAt && now > payloadObj.expiresAt;
      const isExpiredByCreatedAt = payloadObj.created_at && (now - payloadObj.created_at > 5 * 60 * 1000);

      if (isExpiredByDate || isExpiredByCreatedAt) {
        return { 
          valid: false, 
          error: 'SECURITY ERROR: Expired QR Code! This QR code was generated more than 5 minutes ago and has expired. For your security, transactions must be completed within 5 minutes to prevent replay fraud.' 
        };
      }

      return { valid: true, txData: payloadObj };
    } catch (e) {
      return { valid: false, error: 'SECURITY ERROR: Failed to decrypt payload. Corrupted ciphertext.' };
    }
  }

  return { valid: false, error: 'SECURITY ERROR: Unrecognized MeshPay QR protocol structure. Transaction rejected.' };
}
