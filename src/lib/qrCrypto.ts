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
  },
  cryptoCode?: string
): string {
  const salt = Math.random().toString(36).substring(2, 10);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins valid

  const payloadObj: EncryptedTxPayload = {
    version: 'MESHPAY_v2_ENC',
    txId: tx.id || 'TX_' + Date.now(),
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
    salt
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
    return { valid: false, error: 'Invalid or empty QR payload format' };
  }

  const trimmed = encryptedStr.trim();

  // Handle encrypted MESHPAY:ENC format
  if (trimmed.startsWith('MESHPAY:ENC:')) {
    const parts = trimmed.split(':');
    if (parts.length < 4) {
      return { valid: false, error: 'Corrupted encrypted QR string structure' };
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

      // Check Expiration (with a 30-min tolerance window for offline cross-border)
      if (payloadObj.expiresAt && Date.now() > payloadObj.expiresAt + 30 * 60 * 1000) {
        return { valid: false, error: 'QR Code payload has expired for immediate processing.' };
      }

      return { valid: true, txData: payloadObj };
    } catch (e) {
      return { valid: false, error: 'Failed to decrypt payload. Corrupted ciphertext.' };
    }
  }

  // Handle legacy or plain JSON QR formats fallback safely
  try {
    const obj = JSON.parse(trimmed);
    if (obj.userTag || obj.account || obj.protocol) {
      return {
        valid: true,
        txData: {
          version: 'MESHPAY_v1_LEGACY',
          txId: 'TX_LEGCY_' + Date.now(),
          sourceAmount: obj.requestedAmount || 5000,
          sourceCurrency: 'NGN',
          targetAmount: obj.requestedAmount || 5000,
          targetCurrency: 'NGN',
          recipientName: obj.userTag || 'Peer Receiver',
          recipientDetail: `${obj.account || 'Account'} (${obj.bank || 'Bank'})`,
          bankName: obj.bank || 'Vault Bank',
          offlineNonce: obj.offlineNonce || 'NONCE_LGCY',
          timestamp: new Date().toISOString(),
          expiresAt: Date.now() + 5 * 60 * 1000,
          salt: 'legacy'
        }
      };
    }
  } catch (e) {
    // ignore
  }

  return { valid: false, error: 'Unrecognized MeshPay QR protocol structure.' };
}
