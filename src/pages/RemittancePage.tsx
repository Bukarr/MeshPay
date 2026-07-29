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
  Users
} from 'lucide-react';
import { UserProfile, ExchangeRate, NigerianBank, Transaction } from '../types';
import { NIGERIAN_BANKS } from '../data/mockData';
import { BiometricModal } from '../components/BiometricModal';
import { addTransaction, generateOfflineSignature } from '../lib/storage';
import { enqueueStoreAndForward } from '../lib/storeAndForward';
import { addNotification } from '../lib/notifications';

interface RemittancePageProps {
  user: UserProfile;
  exchangeRate: ExchangeRate;
  isOnline: boolean;
  onTransactionComplete: (tx: Transaction) => void;
  onCancel: () => void;
}

const SAVED_BENEFICIARIES = [
  { name: 'Oluwaseun Lawson', bank: 'GTBank', account: '0239104920', tag: '@seun_l' },
  { name: 'Chinedu Okeke', bank: 'Moniepoint MFB', account: '7039102938', tag: '@chinedu_tech' },
  { name: 'Amina Bello', bank: 'Zenith Bank', account: '2019482019', tag: '@amina_b' },
  { name: 'David Kalu', bank: 'OPay', account: '9012948102', tag: '@kalu_groceries' },
];

export const RemittancePage: React.FC<RemittancePageProps> = ({
  user,
  exchangeRate,
  isOnline,
  onTransactionComplete,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [usdAmount, setUsdAmount] = useState<number>(100);
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('0239104920');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Oluwaseun Lawson');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState<boolean>(false);
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('Family upkeep & support');

  // Calculation details
  const rate = exchangeRate.usdToNgn;
  const ngnCalculated = Math.round(usdAmount * rate);
  const feeUsd = 0.00;

  const handleUsdChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setUsdAmount(num);
  };

  const handleSelectSavedBeneficiary = (b: typeof SAVED_BENEFICIARIES[0]) => {
    setBeneficiaryName(b.name);
    setAccountNumber(b.account);
    const foundBank = NIGERIAN_BANKS.find(bank => bank.name.toLowerCase().includes(b.bank.toLowerCase())) || NIGERIAN_BANKS[0];
    setSelectedBank(foundBank);
  };

  const handleAccountChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(digitsOnly);

    if (digitsOnly.length === 10) {
      setIsVerifyingAccount(true);
      setTimeout(() => {
        setIsVerifyingAccount(false);
        const names = [
          'Oluwaseun Lawson',
          'Chinedu Okonkwo',
          'Amina Abubakar',
          'Emeka Nnamdi',
          'Funke Adebayo'
        ];
        const randomName = names[Math.floor(Math.random() * names.length)];
        setBeneficiaryName(`${randomName}`);
      }, 600);
    }
  };

  const handleInitiateSend = () => {
    if (usdAmount <= 0) return alert('Please enter a valid amount');
    if (usdAmount > user.usdBalance) return alert(`Insufficient USD balance. Max available: $${user.usdBalance}`);
    if (accountNumber.length < 10) return alert('Please enter a valid 10-digit NGN account number');

    setShowBiometricModal(true);
  };

  const handleAuthorizationSuccess = () => {
    setShowBiometricModal(false);
    setStep(4); // Settlement phase

    if (!isOnline) {
      // Use Store & Forward Architecture: Instant Local Balance Deduction & Root-Proof Encrypted Vault Storage
      const { transaction } = enqueueStoreAndForward({
        type: 'usd_to_ngn',
        sourceAmount: usdAmount,
        sourceCurrency: 'USD',
        targetAmount: ngnCalculated,
        targetCurrency: 'NGN',
        exchangeRate: rate,
        fee: feeUsd,
        recipientName: beneficiaryName,
        recipientDetail: `${selectedBank.name} (${accountNumber})`,
        bankName: selectedBank.name,
        accountNumber: accountNumber,
        notes: notes,
        isCrossBorder: true
      });

      setTimeout(() => {
        onTransactionComplete(transaction);
      }, 2000);
      return;
    }

    const { signature, nonce } = generateOfflineSignature();

    const newTx: Transaction = {
      id: 'remit_' + Date.now(),
      type: 'usd_to_ngn',
      sourceAmount: usdAmount,
      sourceCurrency: 'USD',
      targetAmount: ngnCalculated,
      targetCurrency: 'NGN',
      exchangeRate: rate,
      fee: feeUsd,
      recipientName: beneficiaryName,
      recipientDetail: `${selectedBank.name} (${accountNumber})`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      isOffline: false,
      offlineSignature: signature,
      offlineNonce: nonce,
      bankName: selectedBank.name,
      accountNumber: accountNumber,
      notes: notes
    };

    addTransaction(newTx);

    // Create Notification
    addNotification({
      type: 'transaction_success',
      title: 'USD Cross-Border Remittance Sent',
      message: `Transferred $${usdAmount}.00 USD (₦${ngnCalculated.toLocaleString()} NGN) to ${beneficiaryName}.`,
      txId: newTx.id,
      amountDisplay: `$${usdAmount}.00 USD`
    });

    setTimeout(() => {
      onTransactionComplete(newTx);
    }, 2000);
  };

  return (
    <div className="space-y-4 pb-20 pt-2 px-4 max-w-md mx-auto text-slate-800">
      {/* Wizard Header Progress */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="p-1 rounded-xl hover:bg-slate-100 text-slate-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-sm text-slate-900">Send Money (USD → NGN)</h2>
          </div>
          <span className="text-xs font-mono text-indigo-700 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Step {step} of 3
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 pt-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Store & Forward Active Banner */}
      {!isOnline && (
        <div className="bg-slate-900 border border-amber-500/40 text-white p-4 rounded-3xl shadow-md text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-400 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Store & Forward Architecture Active
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Root Anti-Tamper Vault
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
            Sending while offline or on low connectivity? Your USD balance will be <strong>deducted locally immediately</strong>. The encrypted remittance packet is sealed with AES-256 MAC and will <strong>silently auto-sync</strong> when connectivity returns.
          </p>
        </div>
      )}

      {/* STEP 1: AMOUNT & RATE CALCULATOR */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">1. Transfer Amount</h3>
            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Locked Rate: $1 = ₦{rate.toLocaleString()}
            </span>
          </div>

          {/* You Send (USD) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-600 focus-within:bg-white transition-all space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>You Send (USD)</span>
              <span>Available: <strong className="text-indigo-600">${user.usdBalance.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                value={usdAmount || ''}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="100"
                className="w-full bg-transparent text-3xl font-black text-slate-900 focus:outline-none"
              />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white shrink-0 font-bold text-xs">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  $
                </span>
                <span>USD</span>
              </div>
            </div>
          </div>

          {/* Exchange Indicator Icon */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          {/* Recipient Gets (NGN) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>Beneficiary Receives (NGN)</span>
              <span className="text-emerald-700 font-extrabold">Zero Transfer Fee</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-3xl font-black text-emerald-700">
                ₦{ngnCalculated.toLocaleString('en-NG')}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white shrink-0 font-bold text-xs">
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
                  ₦
                </span>
                <span>NGN</span>
              </div>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-2 pt-1">
            {[50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setUsdAmount(amt)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  usdAmount === amt
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setStep(2)}
            disabled={usdAmount <= 0 || usdAmount > user.usdBalance}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Continue to Beneficiary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: BENEFICIARY DETAILS */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-sm text-slate-900">2. Beneficiary & Nigerian Bank</h3>

          {/* Quick Frequent Contacts */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Recent Frequent Beneficiaries</span>
            <div className="grid grid-cols-2 gap-2">
              {SAVED_BENEFICIARIES.map((b) => (
                <button
                  key={b.account}
                  type="button"
                  onClick={() => handleSelectSavedBeneficiary(b)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    accountNumber === b.account
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {b.name[0]}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold block truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{b.bank}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bank Selector Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">Select Nigerian Bank</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-indigo-600 absolute left-3 top-3" />
              <input
                type="text"
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
                placeholder="Search bank name (GTBank, Kuda, Zenith...)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Account Number Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">10-Digit NGN Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => handleAccountChange(e.target.value)}
              placeholder="0239104920"
              maxLength={10}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-base tracking-wider font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Account Verification Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Name</span>
                <div className="font-extrabold text-xs text-indigo-600 flex items-center gap-1">
                  {isVerifyingAccount ? (
                    <span className="text-slate-400 animate-pulse">Resolving Interbank Name...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>{beneficiaryName}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full font-mono">
                {selectedBank.name}
              </span>
            </div>

            {/* Trust Score & Fraud Check Card */}
            {!isVerifyingAccount && beneficiaryName && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-extrabold text-slate-700">Recipient Trust Score:</span>
                </div>
                <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  98/100 (Very Safe • 0 Reports)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Payment Reference / Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Family support"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-4 rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              Back
            </button>

            <button
              onClick={() => setStep(3)}
              disabled={accountNumber.length < 10 || isVerifyingAccount}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Review Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & AUTHORIZE */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-sm text-slate-900">3. Review & Authorize Transfer</h3>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs font-medium">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Sending Amount</span>
              <span className="font-extrabold text-base text-slate-900">${usdAmount.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Exchange Rate</span>
              <span className="font-mono text-indigo-600 font-bold">$1 = ₦{rate.toLocaleString()} NGN</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Transfer Fee</span>
              <span className="font-bold text-emerald-600">₦0.00 (Zero Fee)</span>
            </div>

            <div className="flex justify-between items-start pt-1">
              <span className="text-slate-500">Beneficiary Receives</span>
              <div className="text-right">
                <div className="font-black text-xl text-emerald-700">₦{ngnCalculated.toLocaleString('en-NG')}</div>
                <div className="text-xs text-slate-800 font-bold">{beneficiaryName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{selectedBank.name} • {accountNumber}</div>
              </div>
            </div>
          </div>

          {usdAmount >= 100 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 text-xs flex items-center gap-2 font-medium">
              <Fingerprint className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>High-Value Transfer (&ge; $100): Triggers Biometric Face ID / Touch ID verification overlay.</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-3.5 px-4 rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              Edit
            </button>

            <button
              onClick={handleInitiateSend}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Authorize & Send Now</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SETTLEMENT TRACKER */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 text-center space-y-5 animate-fadeIn shadow-xl">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-emerald-500/20 border-2 border-emerald-400 animate-ping opacity-30" />
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg text-white">Settling Interbank Remittance</h3>
            <p className="text-xs text-slate-400">Debiting USD Vault → Clearing NGN Core</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>USD Vault Debited: ${usdAmount}</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>FX Rate Locked @ $1 = ₦{rate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-indigo-300 font-medium animate-pulse">
              <RefreshCcw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Crediting {beneficiaryName} ({selectedBank.name})...</span>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Multi-Method Overlay Modal */}
      <BiometricModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleAuthorizationSuccess}
        amountDisplay={`$${usdAmount}.00 USD (₦${ngnCalculated.toLocaleString()} NGN)`}
        recipientDisplay={`${beneficiaryName} (${selectedBank.name})`}
      />
    </div>
  );
};

