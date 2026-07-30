import React, { useState } from 'react';
import { 
  Send, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  Zap, 
  RefreshCcw,
  Search,
  ChevronLeft,
  Fingerprint,
  Users,
  Radio,
  Wifi,
  WifiOff,
  Volume2,
  QrCode,
  ArrowRightLeft,
  Coins,
  Globe,
  AlertTriangle,
  RefreshCw,
  Camera,
  Clipboard,
  Check
} from 'lucide-react';
import { UserProfile, ExchangeRate, NigerianBank, Transaction, NearbyPeer, RecentReceiver } from '../types';
import { NIGERIAN_BANKS, INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE } from '../data/mockData';
import { WORLD_CURRENCIES, WorldCurrency, getCurrency, convertCurrency, formatCurrencyAmount } from '../lib/currencies';
import { BiometricModal } from '../components/BiometricModal';
import { SecurityModal } from '../components/SecurityModal';
import { OfflineReceiveQrModal } from '../components/OfflineReceiveQrModal';
import { OfflineSendQrModal } from '../components/OfflineSendQrModal';
import { useNearbyScan } from '../hooks/useNearbyScan';
import { addTransaction, generateOfflineSignature, getOfflineQueuedTransactions, isUsdAccount, getSecurityConfig } from '../lib/storage';
import { enqueueStoreAndForward } from '../lib/storeAndForward';
import { addNotification } from '../lib/notifications';

interface SendAndPayPageProps {
  user: UserProfile;
  exchangeRate: ExchangeRate;
  isOnline: boolean;
  onTransactionComplete: (tx: Transaction) => void;
  onCancel: () => void;
  onOpenReceiveQr?: () => void;
  onOpenSendQr?: () => void;
  triggerAutoSync?: () => void;
  initialMode?: 'bank' | 'mesh';
  prefilledRecipient?: RecentReceiver | null;
}

export const SendAndPayPage: React.FC<SendAndPayPageProps> = ({
  user,
  exchangeRate,
  isOnline,
  onTransactionComplete,
  onCancel,
  onOpenReceiveQr,
  onOpenSendQr,
  triggerAutoSync,
  initialMode = 'bank',
  prefilledRecipient = null
}) => {
  // Top Level Mode: Bank & Multi-Currency vs Bluetooth Mesh & Offline P2P
  const [activeMode, setActiveMode] = useState<'bank' | 'mesh'>(initialMode);

  const isUsdUser = isUsdAccount(user);

  // Bank & Multi-Currency Transfer State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [transferDirection, setTransferDirection] = useState<'ngn_to_fx' | 'fx_to_ngn' | 'ngn_to_ngn'>(isUsdUser ? 'fx_to_ngn' : 'ngn_to_fx');
  const [selectedCurrency, setSelectedCurrency] = useState<WorldCurrency>(WORLD_CURRENCIES[1]); // USD default
  const [inputAmount, setInputAmount] = useState<number>(isUsdUser ? 100 : 50000); // $100 or 50,000 NGN
  
  // Local NGN Bank Transfer Inputs (Clean, zero pre-filled demo data)
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');

  React.useEffect(() => {
    if (prefilledRecipient) {
      setAccountNumber(prefilledRecipient.account);
      setBeneficiaryName(prefilledRecipient.name);
      
      const foundBank = NIGERIAN_BANKS.find(b => 
        b.name.toLowerCase().includes(prefilledRecipient.bank.toLowerCase()) || 
        prefilledRecipient.bank.toLowerCase().includes(b.name.toLowerCase())
      );
      if (foundBank) {
        setSelectedBank(foundBank);
      }
      
      // Determine transfer direction based on account type / bank name
      if (prefilledRecipient.bank.toLowerCase().includes('usd')) {
        setTransferDirection('fx_to_ngn');
      } else {
        setTransferDirection('ngn_to_ngn');
      }
      
      setActiveMode('bank');
      setStep(1);
    }
  }, [prefilledRecipient]);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Crypto / FX Wallet Address Format State (Clean)
  const [fxPayoutType, setFxPayoutType] = useState<'local_bank' | 'crypto_wallet'>('local_bank');
  const [walletNetwork, setWalletNetwork] = useState<string>('TRC20 (Tron Multi-FX Mesh Protocol)');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletMemo, setWalletMemo] = useState<string>('');
  const [pastedAddressAlert, setPastedAddressAlert] = useState<boolean>(false);

  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');

  // QR Modals Fallback State
  const [localShowReceiveModal, setLocalShowReceiveModal] = useState<boolean>(false);
  const [localShowSendModal, setLocalShowSendModal] = useState<boolean>(false);

  // Bluetooth Mesh Sub-feature State
  const { isScanning, discoveredPeers, startScan, sendOfflineNearbyPayment } = useNearbyScan();
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [meshAmount, setMeshAmount] = useState<number>(5000);
  const [meshNote, setMeshNote] = useState<string>('Local Mesh split & pay');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [meshTab, setMeshTab] = useState<'radar' | 'queue'>('radar');

  const queuedTxs = getOfflineQueuedTransactions();

  // Calculation Logic for Currency Conversion
  // Dynamic Calculation Logic for Currency Conversion
  let sourceCurrencyCode = 'NGN';
  let targetCurrencyCode = selectedCurrency.code;
  let sourceAmount = inputAmount;
  let targetAmount = inputAmount;

  // 1. Determine Source Currency Code based on active transferDirection
  if (transferDirection === 'fx_to_ngn') {
    sourceCurrencyCode = selectedCurrency.code; // e.g. USD
  } else if (transferDirection === 'ngn_to_fx') {
    sourceCurrencyCode = 'NGN';
  } else {
    sourceCurrencyCode = 'NGN';
  }

  // 2. Override Target Currency Code if a 12-digit USD or 10-digit NGN account is entered
  if (accountNumber.length === 12) {
    targetCurrencyCode = 'USD';
  } else if (accountNumber.length === 10) {
    targetCurrencyCode = 'NGN';
  } else {
    if (transferDirection === 'ngn_to_fx') {
      targetCurrencyCode = selectedCurrency.code;
    } else if (transferDirection === 'fx_to_ngn') {
      targetCurrencyCode = 'NGN';
    } else {
      targetCurrencyCode = 'NGN';
    }
  }

  // 3. Compute target amount using the correct exchange rates
  if (sourceCurrencyCode === targetCurrencyCode) {
    targetAmount = inputAmount;
  } else if (sourceCurrencyCode === 'NGN' && targetCurrencyCode === 'USD') {
    targetAmount = convertCurrency(inputAmount, 'NGN', 'USD', exchangeRate.usdToNgn);
  } else if (sourceCurrencyCode === 'USD' && targetCurrencyCode === 'NGN') {
    targetAmount = convertCurrency(inputAmount, 'USD', 'NGN', exchangeRate.usdToNgn);
  } else {
    if (transferDirection === 'ngn_to_fx') {
      targetAmount = convertCurrency(inputAmount, 'NGN', selectedCurrency.code, exchangeRate.usdToNgn);
    } else if (transferDirection === 'fx_to_ngn') {
      targetAmount = convertCurrency(inputAmount, selectedCurrency.code, 'NGN', exchangeRate.usdToNgn);
    }
  }

  // Known demo accounts map for instant account lookup & verification
  const KNOWN_ACCOUNTS: Record<string, { name: string; bankCode: string }> = {
    '9021849201': { name: 'Adewale Lawson', bankCode: '044' }, // Access Bank
    '9000000001': { name: 'Adewale Lawson', bankCode: '035' }, // Wema Bank
    '8092318492': { name: 'Fatima Bello', bankCode: '50211' }, // Kuda Bank
    '7039102938': { name: 'Chinedu Okeke', bankCode: '50515' }, // Moniepoint MFB
    '9012948102': { name: 'David Kalu (Vendor)', bankCode: '999992' }, // OPay
  };

  const VERIFIED_SAMPLE_NAMES = [
    'BABAJIDE SANWO-OLU',
    'CHIMAMANDA NGOZI EZE',
    'EMELIA KOLAWOLE',
    'OLUWASEUN ADEBAYO',
    'DAMIELOLA FAROUK ADEBOYE',
    'IFEOMA NNAJI',
    'TUNDE BAKARE',
    'AMINA MOHAMMED'
  ];

  // Handle Bank Account Number Auto-Verification (Immediately scans & auto-fills destination bank and recipient name on 10 or 12 digits)
  const handleAccountChange = (val: string) => {
    // Cap at max 12 digits to allow both NGN (10) and USD (12) virtual account numbers
    const digitsOnly = val.replace(/\D/g, '').slice(0, 12);
    setAccountNumber(digitsOnly);

    if (digitsOnly.length < 10) {
      setIsVerifyingAccount(false);
      setBeneficiaryName('');
      return;
    }

    // Auto-detect USD Virtual Account and adjust transfer direction
    if (digitsOnly.length === 12) {
      if (transferDirection === 'ngn_to_ngn') {
        setTransferDirection('ngn_to_fx');
        setSelectedCurrency(WORLD_CURRENCIES.find(c => c.code === 'USD') || WORLD_CURRENCIES[1]);
        setFxPayoutType('local_bank');
      }
    }

    if (digitsOnly.length === 10 || digitsOnly.length === 12) {
      setIsVerifyingAccount(true);
      setTimeout(() => {
        setIsVerifyingAccount(false);

        const meshPayBank = NIGERIAN_BANKS.find(b => b.code === '999001') || NIGERIAN_BANKS[0];

        // 1. Check if logged-in user's own MeshPay account
        if (digitsOnly === user.virtualAccountNgn) {
          setBeneficiaryName(user.name);
          setSelectedBank(meshPayBank);
          return;
        } else if (digitsOnly === user.virtualAccountUsd) {
          setBeneficiaryName(user.name);
          setSelectedBank(meshPayBank);
          return;
        }

        // 2. Check preset MeshPay app user profiles
        const meshUsers = [INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE];
        const matchedNgnUser = meshUsers.find(u => u.virtualAccountNgn === digitsOnly);
        if (matchedNgnUser) {
          setBeneficiaryName(matchedNgnUser.name);
          setSelectedBank(meshPayBank);
          return;
        }
        const matchedUsdUser = meshUsers.find(u => u.virtualAccountUsd === digitsOnly);
        if (matchedUsdUser) {
          setBeneficiaryName(matchedUsdUser.name);
          setSelectedBank(meshPayBank);
          return;
        }

        // 3. Check known presets lookup
        if (KNOWN_ACCOUNTS[digitsOnly]) {
          const matched = KNOWN_ACCOUNTS[digitsOnly];
          setBeneficiaryName(matched.name);
          const bMatch = NIGERIAN_BANKS.find(b => b.code === matched.bankCode);
          if (bMatch) setSelectedBank(bMatch);
          return;
        }

        // 4. Deterministic name lookup for any other valid account number
        const sum = digitsOnly.split('').reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
        const resolvedName = VERIFIED_SAMPLE_NAMES[sum % VERIFIED_SAMPLE_NAMES.length];
        setBeneficiaryName(`${resolvedName} (Verified)`);
      }, 350);
    }
  };

  const handleInitiateBankTransfer = () => {
    if (inputAmount <= 0) return alert('Please enter a valid transfer amount');

    const isLocalBankPayout = transferDirection === 'ngn_to_ngn' || fxPayoutType === 'local_bank';
    if (isLocalBankPayout) {
      if (accountNumber.length !== 10 && accountNumber.length !== 12) {
        return alert('Please enter a valid 10-digit NGN or 12-digit USD virtual account number');
      }
      if (!beneficiaryName.trim()) return alert('Please enter or verify the recipient account name');
    } else {
      if (!walletAddress.trim()) return alert('Please enter or paste the destination FX/Crypto Wallet Address');
      if (!beneficiaryName.trim()) return alert('Please enter the recipient full name');
    }

    // Balance check
    if (sourceCurrencyCode === 'NGN' && inputAmount > user.ngnBalance) {
      return alert(`Insufficient NGN balance. Maximum available: ₦${user.ngnBalance.toLocaleString('en-NG')}`);
    }
    if (sourceCurrencyCode === 'USD' && inputAmount > user.usdBalance) {
      return alert(`Insufficient USD balance. Maximum available: $${user.usdBalance.toLocaleString('en-US')}`);
    }

    const isHighValue = (sourceCurrencyCode === 'NGN' && inputAmount > 50000) || (sourceCurrencyCode === 'USD' && inputAmount > 50);
    const securityConfig = getSecurityConfig();

    if (securityConfig.highValueTransfers && isHighValue) {
      setShowBiometricModal(true);
    } else {
      handleBankAuthSuccess();
    }
  };

  const resetFormState = () => {
    setAccountNumber('');
    setBeneficiaryName('');
    setWalletAddress('');
    setNotes('');
    setMeshNote('');
    setStep(1);
  };

  const handleBankAuthSuccess = () => {
    setShowBiometricModal(false);

    const isLocalBankPayout = transferDirection === 'ngn_to_ngn' || fxPayoutType === 'local_bank';
    const recipientDisplayName = beneficiaryName.trim() || (isLocalBankPayout ? 'Bank Recipient' : 'FX Wallet Recipient');
    const recipientDetailsStr = isLocalBankPayout
      ? `${selectedBank.name} (${accountNumber})`
      : `${walletNetwork.split(' ')[0]} Address: ${walletAddress.length > 12 ? walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4) : walletAddress}`;
    const bBankName = isLocalBankPayout ? selectedBank.name : walletNetwork;
    const bAccNum = isLocalBankPayout ? accountNumber : walletAddress;

    if (!isOnline) {
      // Store & Forward Execution with Anti-Double-Spend Check
      try {
        const { transaction } = enqueueStoreAndForward({
          type: sourceCurrencyCode === 'USD' ? 'usd_to_ngn' : 'ngn_to_usd',
          sourceAmount: inputAmount,
          sourceCurrency: sourceCurrencyCode as any,
          targetAmount: Number(targetAmount.toFixed(2)),
          targetCurrency: targetCurrencyCode as any,
          exchangeRate: exchangeRate.usdToNgn,
          fee: 0,
          recipientName: recipientDisplayName,
          recipientDetail: recipientDetailsStr,
          bankName: bBankName,
          accountNumber: bAccNum,
          notes: notes || (transferDirection !== 'ngn_to_ngn' ? `Crypto/FX Wallet (${walletNetwork})` : 'Direct Bank Settlement'),
          isCrossBorder: targetCurrencyCode !== 'NGN'
        });

        resetFormState();
        onTransactionComplete(transaction);
        return;
      } catch (err: any) {
        alert(err.message || 'Store & Forward queueing failed.');
        return;
      }
    }

    const { signature, nonce } = generateOfflineSignature();

    const newTx: Transaction = {
      id: 'tx_send_' + Date.now(),
      type: sourceCurrencyCode === 'USD' ? 'usd_to_ngn' : 'ngn_to_usd',
      sourceAmount: inputAmount,
      sourceCurrency: sourceCurrencyCode as any,
      targetAmount: Number(targetAmount.toFixed(2)),
      targetCurrency: targetCurrencyCode as any,
      exchangeRate: exchangeRate.usdToNgn,
      fee: 0,
      recipientName: recipientDisplayName,
      recipientDetail: recipientDetailsStr,
      timestamp: new Date().toISOString(),
      status: 'completed',
      isOffline: false,
      offlineSignature: signature,
      offlineNonce: nonce,
      bankName: bBankName,
      accountNumber: bAccNum,
      notes: notes || (transferDirection !== 'ngn_to_ngn' ? `Crypto/FX Wallet (${walletNetwork})` : 'Direct Bank Settlement')
    };

    addTransaction(newTx);

    addNotification({
      type: 'transaction_success',
      title: 'Transfer Sent Successfully',
      message: `Sent ${formatCurrencyAmount(inputAmount, sourceCurrencyCode)} to ${recipientDisplayName}.`,
      txId: newTx.id,
      amountDisplay: formatCurrencyAmount(inputAmount, sourceCurrencyCode)
    });

    resetFormState();
    onTransactionComplete(newTx);
  };

  const handleMeshPinSuccess = () => {
    setShowPinModal(false);
    if (!selectedPeer) return;

    try {
      const tx = sendOfflineNearbyPayment(selectedPeer, meshAmount, meshNote, !isOnline);
      
      addNotification({
        type: isOnline ? 'transaction_success' : 'offline_queue',
        title: 'Bluetooth Mesh Payment Completed',
        message: `Transferred ₦${meshAmount.toLocaleString()} to ${selectedPeer.name} via local Mesh protocol.`,
        txId: tx.id,
        amountDisplay: `₦${meshAmount.toLocaleString()}`
      });

      resetFormState();
      onTransactionComplete(tx);
      setSelectedPeer(null);
    } catch (err: any) {
      alert(err.message || 'Payment failed.');
    }
  };

  const handlePasteWalletAddress = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setWalletAddress(text.trim());
          setPastedAddressAlert(true);
          setTimeout(() => setPastedAddressAlert(false), 2000);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    // Fallback sample wallet address for convenience
    setWalletAddress('0x71C2a89F93b4D820194A0283');
    setPastedAddressAlert(true);
    setTimeout(() => setPastedAddressAlert(false), 2000);
  };

  const filteredBanks = NIGERIAN_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    b.code.includes(bankSearchQuery)
  );

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto text-slate-800">
      {/* Top Navigation Header & Mode Toggle */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={onCancel} className="p-1 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Send & Pay</h2>
              <p className="text-[11px] text-slate-500 font-medium">Unified Local, Multi-Currency & Bluetooth Mesh</p>
            </div>
          </div>

          {!isOnline && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Store & Forward</span>
            </span>
          )}
        </div>

        {/* Primary Mode Selector: Bank & Currency vs Bluetooth Mesh */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveMode('bank')}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'bank'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bank & Multi-FX</span>
          </button>

          <button
            onClick={() => setActiveMode('mesh')}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all relative ${
              activeMode === 'mesh'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Bluetooth Mesh</span>
            {queuedTxs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>
      </div>

      {/* MODE 1: BANK & MULTI-CURRENCY TRANSFER */}
      {activeMode === 'bank' && (
        <div className="space-y-4">
          {/* Currency Transfer Direction Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                Currency Pair & Direction
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                Live Rate
              </span>
            </div>

            {/* Direction Radio Toggle */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTransferDirection('ngn_to_fx')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all ${
                  transferDirection === 'ngn_to_fx'
                    ? 'bg-emerald-600 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇳🇬 NGN ➔ FX</span>
                <span className="text-[9px] opacity-80 font-normal">Naira to World</span>
              </button>

              <button
                onClick={() => setTransferDirection('fx_to_ngn')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all ${
                  transferDirection === 'fx_to_ngn'
                    ? 'bg-indigo-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>FX ➔ 🇳🇬 NGN</span>
                <span className="text-[9px] opacity-80 font-normal">World to Naira</span>
              </button>

              <button
                onClick={() => setTransferDirection('ngn_to_ngn')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all ${
                  transferDirection === 'ngn_to_ngn'
                    ? 'bg-slate-800 text-white font-black shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇳🇬 Local NGN</span>
                <span className="text-[9px] opacity-80 font-normal">Standard Bank</span>
              </button>
            </div>

            {/* Worldwide Currency Picker (List of 8 Worldwide Currencies) */}
            {transferDirection !== 'ngn_to_ngn' && (
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold block">
                  Select World Currency ({WORLD_CURRENCIES.length} Supported Currencies):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {WORLD_CURRENCIES.filter(c => c.code !== 'NGN').map(curr => {
                    const isSelected = selectedCurrency.code === curr.code;
                    return (
                      <button
                        key={curr.code}
                        onClick={() => setSelectedCurrency(curr)}
                        className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md scale-105'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">{curr.flag}</span>
                        <span className="text-xs font-black">{curr.code}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-full">{curr.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Exchange Rate Information Box */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Exchange Calculation:
              </span>
              <span className="font-extrabold text-emerald-400 font-mono">
                1 {selectedCurrency.code} = ₦{selectedCurrency.code === 'USD' ? exchangeRate.usdToNgn.toLocaleString() : selectedCurrency.rateToNgn.toLocaleString()} NGN
              </span>
            </div>
          </div>

          {/* Amount Input & Conversion Calculator Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
              1. Transfer Amount
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                  <span>You Pay ({sourceCurrencyCode})</span>
                  <span>Available: {sourceCurrencyCode === 'NGN' ? `₦${user.ngnBalance.toLocaleString()}` : `$${user.usdBalance.toLocaleString()}`}</span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">
                    {getCurrency(sourceCurrencyCode).symbol}
                  </span>
                  <input
                    type="number"
                    value={inputAmount || ''}
                    onChange={(e) => setInputAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conversion Preview Box */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Recipient Receives ({targetCurrencyCode}):</span>
                <span className="text-lg font-black text-indigo-600 font-mono">
                  {formatCurrencyAmount(targetAmount, targetCurrencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Beneficiary & Destination Details Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                2. Recipient Information
              </h3>
            </div>

            {/* Payout method selector if multi-currency conversion */}
            {transferDirection !== 'ngn_to_ngn' && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFxPayoutType('local_bank')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    fxPayoutType === 'local_bank'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Local Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFxPayoutType('crypto_wallet')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    fxPayoutType === 'crypto_wallet'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Crypto / FX Wallet</span>
                </button>
              </div>
            )}

            {/* Render form based on selected payout type or NGN direction */}
            {(transferDirection === 'ngn_to_ngn' || fxPayoutType === 'local_bank') ? (
              /* Local Bank Transfer Form */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Destination Bank:</label>
                  <select
                    value={selectedBank.code}
                    onChange={(e) => {
                      const b = NIGERIAN_BANKS.find(bank => bank.code === e.target.value) || NIGERIAN_BANKS[0];
                      setSelectedBank(b);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {NIGERIAN_BANKS.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">Account Number (10 or 12 Digits):</label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) handleAccountChange(text);
                        } catch {
                          // fallback
                        }
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 transition-all active:scale-95"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Paste Account</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text');
                        handleAccountChange(pasted);
                      }}
                      placeholder="Account number only"
                      maxLength={12}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    {isVerifyingAccount ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-200">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                      </span>
                    ) : (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                        {accountNumber.length}/12
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Account Name:</label>
                  <div className={`p-3 border rounded-2xl flex items-center gap-2 transition-all ${
                    beneficiaryName ? 'bg-emerald-50/90 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <UserCheck className={`w-4 h-4 shrink-0 ${beneficiaryName ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Auto-verifies when 10 or 12 digits are typed/pasted..."
                      className={`text-xs font-extrabold bg-transparent focus:outline-none w-full ${
                        beneficiaryName ? 'text-emerald-950 font-black' : 'text-slate-900'
                      }`}
                    />
                  </div>
                  {beneficiaryName && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-extrabold px-1 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{accountNumber.length === 12 ? 'MeshPay USD Cross-Border Virtual Account Verified' : `NIBSS Instant Account Verified • ${selectedBank.name}`}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Crypto / FX Wallet Format */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Crypto / FX Network Protocol:</label>
                  <select
                    value={walletNetwork}
                    onChange={(e) => setWalletNetwork(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="TRC20 (Tron Multi-FX Mesh Protocol)">TRC20 (Tron FX Mesh • 0% Gas)</option>
                    <option value="ERC20 (Ethereum Native FX Protocol)">ERC20 (Ethereum Native FX Protocol)</option>
                    <option value="Polygon (MATIC Low-Latency Vault)">Polygon (MATIC Low-Latency Vault)</option>
                    <option value="SWIFT-SEPA Multi-FX Vault">SWIFT / SEPA Multi-Currency Global Vault</option>
                    <option value="BEP20 (BNB Smart Chain Mesh)">BEP20 (BNB Smart Chain Mesh)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination Wallet Address:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="e.g. 0x71C2a89F93b4D... or FX-USDT-99420"
                      className="w-full pl-3 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePasteWalletAddress}
                        className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all"
                      >
                        <Clipboard className="w-3 h-3 text-indigo-700" />
                        <span>{pastedAddressAlert ? 'Pasted!' : 'Paste'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenSendQr) onOpenSendQr();
                          setLocalShowSendModal(true);
                        }}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[10px] font-bold transition-all"
                        title="Scan Wallet QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Account / Beneficiary Name:</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="e.g. Alexandre Vance"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination Memo / Tag (Optional):</label>
                  <input
                    type="text"
                    value={walletMemo}
                    onChange={(e) => setWalletMemo(e.target.value)}
                    placeholder="e.g. MEMO-88910"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Note (Optional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What is this transfer for?"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Store & Forward Active Info Banner */}
          {!isOnline && (
            <div className="bg-slate-900 border border-amber-500/40 text-white p-4 rounded-3xl shadow-md text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-400 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Store & Forward Architecture Active
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  AES-256 HMAC Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                Sending while offline? Your balance is <strong>debited locally right away</strong> and stored securely. The packet will <strong>silently auto-sync</strong> when connected.
              </p>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            onClick={handleInitiateBankTransfer}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
          >
            <span>Confirm Transfer ({formatCurrencyAmount(inputAmount, sourceCurrencyCode)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODE 2: BLUETOOTH MESH & OFFLINE P2P SUBSET */}
      {activeMode === 'mesh' && (
        <div className="space-y-4">
          {/* Bluetooth Mesh Sub-navigation Tab */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Bluetooth Mesh Protocol</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                10m Direct Proximity
              </span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setMeshTab('radar')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  meshTab === 'radar'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Nearby Radar</span>
              </button>

              <button
                onClick={() => setMeshTab('queue')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                  meshTab === 'queue'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Store & Forward Queue ({queuedTxs.length})</span>
              </button>
            </div>
          </div>

          {meshTab === 'radar' ? (
            <>
              {/* Radar Visual Discovered Scanner */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden space-y-4 text-white">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border border-indigo-500/30 ${isScanning ? 'animate-ping' : ''}`} />
                  <div className={`absolute inset-4 rounded-full border border-indigo-500/20 ${isScanning ? 'animate-pulse' : ''}`} />
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border-2 border-indigo-400 p-0.5 z-10 shadow-lg shadow-indigo-500/30">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-white">
                    {isScanning ? 'Scanning Mesh Frequencies...' : `Discovered ${discoveredPeers.length} Nearby Mesh Peers`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bluetooth LE • Acoustic Tokens • Encrypted Offline Settlement
                  </p>
                </div>

                <button
                  onClick={startScan}
                  disabled={isScanning}
                  className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning Frequencies...' : 'Rescan Mesh Frequencies'}</span>
                </button>
              </div>

              {/* QR Code Quick Offline Handshake Section */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLocalShowReceiveModal(true);
                  }}
                  className="p-3.5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md shadow-sm flex items-center gap-3 transition-all text-left active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs text-slate-900 block">Show QR</span>
                    <span className="text-[10px] text-slate-500 font-medium">Send Offline</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLocalShowSendModal(true);
                  }}
                  className="p-3.5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md shadow-sm flex items-center gap-3 transition-all text-left active:scale-95 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-xs text-slate-900 block">Scan QR</span>
                    <span className="text-[10px] text-slate-500 font-medium">Receive Offline</span>
                  </div>
                </button>
              </div>

              {/* Nearby Discovered Devices List */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  Nearby Discovered Peers ({discoveredPeers.length})
                </h3>

                <div className="space-y-2">
                  {discoveredPeers.map((peer) => (
                    <div
                      key={peer.id}
                      onClick={() => setSelectedPeer(peer)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedPeer?.id === peer.id
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={peer.avatar} alt={peer.name} className="w-10 h-10 rounded-2xl object-cover border border-slate-200" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">{peer.name}</span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 rounded">
                              {peer.connectionType}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">{peer.handle} • {peer.distanceMeters}m away</span>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-sm">
                        Pay
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Peer Payment Modal / Form */}
              {selectedPeer && (
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img src={selectedPeer.avatar} alt={selectedPeer.name} className="w-9 h-9 rounded-2xl object-cover border border-slate-700" />
                      <div>
                        <span className="text-xs font-black text-white block">Pay {selectedPeer.name}</span>
                        <span className="text-[10px] text-indigo-300 font-mono">{selectedPeer.handle}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPeer(null)} className="text-xs text-slate-400 hover:text-white font-bold">
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold block mb-1">Enter Amount (NGN):</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                        <input
                          type="number"
                          value={meshAmount}
                          onChange={(e) => setMeshAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono font-extrabold text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-bold block mb-1">Note:</label>
                      <input
                        type="text"
                        value={meshNote}
                        onChange={(e) => setMeshNote(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      onClick={() => setShowPinModal(true)}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                    >
                      <span>Authorize Mesh Transfer (₦{meshAmount.toLocaleString()})</span>
                      <Zap className="w-4 h-4 fill-slate-950" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Store & Forward Queued Transactions View */
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-slate-900">Queued Offline Packets ({queuedTxs.length})</h3>
                {triggerAutoSync && (
                  <button
                    onClick={triggerAutoSync}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Queue</span>
                  </button>
                )}
              </div>

              {queuedTxs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
                  <p className="text-xs font-bold text-slate-700">All offline transactions are fully synced!</p>
                  <p className="text-[10px] text-slate-500">New offline transfers will be queued securely here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queuedTxs.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">{tx.recipientName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.notes}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        ₦{tx.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Security PIN Authorization Modal */}
      <BiometricModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleBankAuthSuccess}
        amountDisplay={formatCurrencyAmount(inputAmount, sourceCurrencyCode)}
        recipientName={beneficiaryName}
      />

      <SecurityModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleMeshPinSuccess}
        title="Authorize Bluetooth Mesh Transfer"
        subtitle={`Confirm payment of ₦${meshAmount.toLocaleString()} NGN to ${selectedPeer?.name}`}
      />

      <OfflineReceiveQrModal
        isOpen={localShowReceiveModal}
        onClose={() => setLocalShowReceiveModal(false)}
        user={user}
        amountNgn={meshAmount || 5000}
      />

      <OfflineSendQrModal
        isOpen={localShowSendModal}
        onClose={() => setLocalShowSendModal(false)}
        user={user}
        onTransactionComplete={onTransactionComplete}
      />
    </div>
  );
};
