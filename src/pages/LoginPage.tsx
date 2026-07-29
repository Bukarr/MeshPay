import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  ChevronRight,
  ChevronLeft,
  User,
  Wallet,
  Check,
  AlertCircle,
  Smartphone,
  Cpu
} from 'lucide-react';
import { saveUserProfile, setUserLoggedIn } from '../lib/storage';
import { UserProfile } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Profile & Funding, 2: KYC Details, 3: Face Liveness Scan
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('');
  const [pin, setPin] = useState('');
  const [initialFundNgn, setInitialFundNgn] = useState<number>(1000000);
  const [initialFundUsd, setInitialFundUsd] = useState<number>(2500);

  // KYC details
  const [docType, setDocType] = useState<'bvn' | 'nin'>('bvn');
  const [docNumber, setDocNumber] = useState('');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);
  const [docVerified, setDocVerified] = useState(false);

  // Liveness check states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [livenessInstruction, setLivenessInstruction] = useState('Position your face in the circle');
  const [scanComplete, setScanComplete] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (val && !tag) {
      // Auto suggest a tag based on name
      const cleanName = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setTag('$' + cleanName);
    }
  };

  const handleNextToKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !tag || !pin) {
      alert('Please fill out all profile fields.');
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      alert('PIN must be exactly 4 digits.');
      return;
    }
    setStep(2);
  };

  const handleVerifyDoc = () => {
    if (docNumber.length < 10) {
      alert('Please enter a valid 10 or 11-digit registration number.');
      return;
    }
    setIsVerifyingDoc(true);
    setTimeout(() => {
      setIsVerifyingDoc(false);
      setDocVerified(true);
    }, 1500);
  };

  const startCamera = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setCameraError(false);
    setLivenessInstruction('Aligning biometric markers...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable, showing high-fidelity mesh simulation instead.');
      setCameraError(true);
    }

    // Interactive liveness simulation sequence
    setTimeout(() => {
      setLivenessInstruction('Instruction: Blink twice to confirm liveness');
      setScanProgress(25);
    }, 1500);

    setTimeout(() => {
      setLivenessInstruction('Instruction: Smile slightly for facial geometry');
      setScanProgress(60);
    }, 3200);

    setTimeout(() => {
      setLivenessInstruction('Instruction: Look straight. Encrypting keys...');
      setScanProgress(90);
    }, 4800);

    setTimeout(() => {
      setScanProgress(100);
      setLivenessInstruction('KYC Face Verification Complete!');
      setScanComplete(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    }, 6000);
  };

  const finalizeOnboarding = () => {
    const generatedNgnAccount = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const generatedUsdAccount = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const finalProfile: UserProfile = {
      name,
      email,
      tag: tag.startsWith('$') ? tag : '$' + tag,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      usdBalance: initialFundUsd,
      ngnBalance: initialFundNgn,
      virtualAccountNgn: generatedNgnAccount,
      virtualAccountUsd: generatedUsdAccount,
      bankName: 'Wema Bank / MeshPay Vault',
      tier: 'Tier 3 (Verified)',
      pin,
      biometricEnabled: true,
      kycVerified: true,
      publicKey: 'mp_sec_0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };

    saveUserProfile(finalProfile);
    setUserLoggedIn(true);
    onLoginSuccess();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-4 py-8 max-w-md mx-auto relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto border border-indigo-400/30">
            <Zap className="w-7 h-7 fill-white" />
          </div>
          <h1 className="font-black text-xl tracking-tight text-white mt-2">MeshPay</h1>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Cross-Border Offline Peer-to-Peer Settlement Ledger
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</div>
            <span className="text-[10px] font-bold text-slate-300">Profile</span>
          </div>
          <div className="h-0.5 w-10 bg-slate-800 flex-1 mx-2" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</div>
            <span className="text-[10px] font-bold text-slate-300">KYC</span>
          </div>
          <div className="h-0.5 w-10 bg-slate-800 flex-1 mx-2" />
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</div>
            <span className="text-[10px] font-bold text-slate-300">Liveness</span>
          </div>
        </div>

        {/* STEP 1: Profile Creation & Initial Testing Funds */}
        {step === 1 && (
          <form onSubmit={handleNextToKyc} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">Create Custom Account</h3>
              </div>
              <p className="text-[11px] text-slate-400">Initialize your offline master vault with your details</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Adewale Lawson"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. adewale@mail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">MeshTag Handle</label>
                  <input
                    type="text"
                    required
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. $adewale_l"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex justify-between">
                  <span>4-Digit Secure PIN</span>
                  <span className="text-[9px] text-indigo-400 lowercase font-medium">Used to authorize transactions</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black tracking-widest text-center text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Initial testing funds configuration */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Setup Starter Testing Funds (MVP Sandbox)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[9px] font-extrabold text-slate-400 block uppercase">Naira (NGN) Balance</label>
                    <select
                      value={initialFundNgn}
                      onChange={(e) => setInitialFundNgn(Number(e.target.value))}
                      className="w-full bg-transparent font-mono text-xs font-black text-emerald-400 focus:outline-none mt-1"
                    >
                      <option value={200000} className="bg-slate-950">₦200,000 NGN</option>
                      <option value={1000000} className="bg-slate-950">₦1,000,000 NGN</option>
                      <option value={3000000} className="bg-slate-950">₦3,000,000 NGN</option>
                    </select>
                  </div>

                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[9px] font-extrabold text-slate-400 block uppercase">Dollar (USD) Balance</label>
                    <select
                      value={initialFundUsd}
                      onChange={(e) => setInitialFundUsd(Number(e.target.value))}
                      className="w-full bg-transparent font-mono text-xs font-black text-indigo-400 focus:outline-none mt-1"
                    >
                      <option value={500} className="bg-slate-950">$500 USD</option>
                      <option value={2500} className="bg-slate-950">$2,500 USD</option>
                      <option value={10000} className="bg-slate-950">$10,000 USD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 mt-2"
            >
              <span>Continue to KYC Check</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Mini KYC Document Registry Verification */}
        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">KYC Document Registration</h3>
              </div>
              <p className="text-[11px] text-slate-400">Verifying bank database or identification records</p>
            </div>

            <div className="space-y-3.5">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setDocType('bvn'); setDocNumber(''); setDocVerified(false); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${docType === 'bvn' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Bank Verification Number (BVN)
                </button>
                <button
                  type="button"
                  onClick={() => { setDocType('nin'); setDocNumber(''); setDocVerified(false); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${docType === 'nin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  National ID Number (NIN)
                </button>
              </div>

              <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">
                  Enter {docType === 'bvn' ? '11-Digit BVN' : '11-Digit NIMC NIN'}
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder={docType === 'bvn' ? 'e.g. 22194830192' : 'e.g. 90123412938'}
                    disabled={docVerified}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono font-bold text-white tracking-widest focus:outline-none"
                  />
                  {docVerified && (
                    <span className="absolute right-3 top-2.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  )}
                </div>

                {!docVerified && (
                  <p className="text-[9px] text-slate-500 mt-2">
                    Enter any 11 digits to test real-time validation via simulation API.
                  </p>
                )}
              </div>

              {isVerifyingDoc ? (
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center justify-center gap-2 animate-pulse text-indigo-300 text-[11px] font-bold">
                  <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Pinging Government Identity Database...</span>
                </div>
              ) : docVerified ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Document verified! Matching name confirmed.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyDoc}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span>Verify Document Registry</span>
                </button>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!docVerified}
                onClick={() => setStep(3)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                  docVerified 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Face Liveness Check</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Selfie / Biometric Face Scan Liveness Simulation */}
        {step === 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Liveness Selfie Verification</h3>
              </div>
              <p className="text-[11px] text-slate-400">Verifying presence through face geometry and gestures</p>
            </div>

            {/* Simulated Live Viewfinder Frame */}
            <div className="relative w-48 h-48 rounded-full border-4 border-dashed border-indigo-500/50 mx-auto overflow-hidden flex items-center justify-center bg-slate-950">
              {isScanning ? (
                <>
                  {!cameraError ? (
                    <video ref={videoRef} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    /* High fidelity vector mesh mockup */
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-24 h-24 rounded-full border border-indigo-500/40 animate-pulse flex items-center justify-center bg-indigo-950/20 relative">
                        <User className="w-12 h-12 text-indigo-400" />
                        {/* Dynamic node scan mapping circles */}
                        <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-ping" />
                        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping delay-75" />
                        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping delay-150" />
                      </div>
                    </div>
                  )}

                  {/* Tech visual scan lines overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-indigo-400/20 to-indigo-500/0 animate-scan pointer-events-none" />
                </>
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 block font-bold">Webcam Ready</span>
                </div>
              )}
            </div>

            {/* Interactive instructions and progress display */}
            {isScanning && (
              <div className="space-y-2.5 text-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 block tracking-wide uppercase">
                  {livenessInstruction}
                </span>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
                  <span>ECDSA ENCRYPTING</span>
                  <span>{scanProgress}%</span>
                </div>
              </div>
            )}

            {!isScanning && (
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Start Selfie Liveness Test</span>
              </button>
            )}

            {scanComplete && (
              <button
                type="button"
                onClick={finalizeOnboarding}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 animate-bounce transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Onboarding Complete! Open Vault</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isScanning && !scanComplete}
                onClick={() => setStep(2)}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
