import React, { useState } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Search, 
  UserCheck, 
  ArrowRight, 
  Check, 
  Zap, 
  Lock,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { discoverContactsFromHashes, SyncedContact, hashPhoneNumber } from '../lib/contacts';

interface SyncContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContactForTransfer: (contact: SyncedContact) => void;
  user: UserProfile;
}

// Demo device address book contacts to simulate native phone book import
const DEMO_PHONEBOOK = [
  { name: 'Adewale Lawson', phone: '08012345678' },
  { name: 'Fatima Bello', phone: '08098765432' },
  { name: 'Chinedu Okonkwo', phone: '07011223344' },
  { name: 'Bisi Adebayo', phone: '08123456789' },
  { name: 'Kemi Balogun', phone: '09087654321' },
  { name: 'Tunde Bakare', phone: '08033445566' }
];

export const SyncContactsModal: React.FC<SyncContactsModalProps> = ({
  isOpen,
  onClose,
  onSelectContactForTransfer,
  user
}) => {
  const [synced, setSynced] = useState<boolean>(false);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [syncedContacts, setSyncedContacts] = useState<SyncedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  if (!isOpen) return null;

  const handleStartSync = () => {
    setIsHashing(true);
    setTimeout(() => {
      const discovered = discoverContactsFromHashes(DEMO_PHONEBOOK);
      setSyncedContacts(discovered);
      setIsHashing(false);
      setSynced(true);
    }, 1200);
  };

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPhone) return;

    const newRaw = [{ name: customName, phone: customPhone }];
    const discovered = discoverContactsFromHashes(newRaw);
    setSyncedContacts(prev => [...discovered, ...prev]);

    setCustomName('');
    setCustomPhone('');
    setShowAddCustom(false);
  };

  const filtered = syncedContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-950 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Cryptographic Contact Sync</h3>
              <p className="text-[10px] text-slate-400">Zero-Knowledge SHA-256 Hashing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Privacy Security Notice */}
          <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-extrabold text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Knowledge Privacy Guaranteed</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-300">
              Phone numbers are converted into 256-bit cryptographic hashes locally on your device before matching. Raw contacts are never uploaded or stored in unencrypted format.
            </p>
          </div>

          {!synced ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white">Discover MeshPay Contacts</h4>
                <p className="text-xs text-slate-400 max-w-[260px] mx-auto mt-1">
                  Hash your device address book to find trusted friends and family on MeshPay.
                </p>
              </div>

              <button
                onClick={handleStartSync}
                disabled={isHashing}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isHashing ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Hashing & Matching Contacts...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Hash Phonebook & Sync Contacts</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search contacts by name, tag, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Add Custom Phone Number button */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Synced Contacts ({syncedContacts.length})
                </span>
                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="text-[10px] text-indigo-400 font-bold hover:underline"
                >
                  {showAddCustom ? 'Cancel' : '+ Add Custom Phone'}
                </button>
              </div>

              {/* Add Custom Form */}
              {showAddCustom && (
                <form onSubmit={handleAddCustomContact} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Samuel)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. 08012345678)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-white focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm"
                  >
                    Hash & Match Number
                  </button>
                </form>
              )}

              {/* Contact List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filtered.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.name} className="w-9 h-9 rounded-xl object-cover border border-indigo-500/40" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.isMeshPayUser && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono">
                              MeshPay Vault
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {contact.phone} • Hash: <span className="text-indigo-400 font-mono">{contact.hash.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </div>

                    {contact.isMeshPayUser ? (
                      <button
                        onClick={() => {
                          onSelectContactForTransfer(contact);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                      >
                        <span>Send</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Invite to MeshPay</span>
                    )}
                  </div>
                ))}

                {filtered.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No matching contacts found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
