import { useState, useCallback, useEffect } from 'react';
import { NearbyPeer, Transaction } from '../types';
import { INITIAL_NEARBY_PEERS } from '../data/mockData';
import { addTransaction, generateOfflineSignature } from '../lib/storage';

export function useNearbyScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPeers, setDiscoveredPeers] = useState<NearbyPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setDiscoveredPeers([]);
    
    // Simulate finding peers incrementally like radar scan
    setTimeout(() => {
      setDiscoveredPeers([INITIAL_NEARBY_PEERS[0]]);
    }, 800);

    setTimeout(() => {
      setDiscoveredPeers([INITIAL_NEARBY_PEERS[0], INITIAL_NEARBY_PEERS[1]]);
    }, 1800);

    setTimeout(() => {
      setDiscoveredPeers(INITIAL_NEARBY_PEERS);
      setIsScanning(false);
    }, 3000);
  }, []);

  useEffect(() => {
    // Auto start scan on mount
    startScan();
  }, [startScan]);

  const sendOfflineNearbyPayment = useCallback((
    peer: NearbyPeer,
    amountNgn: number,
    notes: string,
    isOfflineMode: boolean
  ): Transaction => {
    const { signature, nonce } = generateOfflineSignature();
    
    const tx: Transaction = {
      id: 'tx_offline_' + Date.now(),
      type: 'nearby_send',
      sourceAmount: amountNgn,
      sourceCurrency: 'NGN',
      targetAmount: amountNgn,
      targetCurrency: 'NGN',
      exchangeRate: 1.0,
      fee: 0.00,
      recipientName: peer.name,
      recipientDetail: `${peer.connectionType} • ${peer.bankName}`,
      timestamp: new Date().toISOString(),
      status: isOfflineMode ? 'queued_offline' : 'completed',
      isOffline: isOfflineMode,
      offlineSignature: signature,
      offlineNonce: nonce,
      bankName: peer.bankName,
      accountNumber: peer.accountNumber,
      notes: notes || `Offline nearby payment via ${peer.connectionType}`
    };

    addTransaction(tx);
    return tx;
  }, []);

  return {
    isScanning,
    discoveredPeers,
    selectedPeer,
    setSelectedPeer,
    startScan,
    sendOfflineNearbyPayment
  };
}
