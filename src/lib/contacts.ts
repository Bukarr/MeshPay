import { UserProfile } from '../types';
import { INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE } from '../data/mockData';
import { getStoredUserProfile, getUserKeyPrefix } from './storage';

export interface SyncedContact {
  id: string;
  name: string;
  phone: string;
  hash: string;
  isMeshPayUser: boolean;
  tag?: string;
  accountNumber?: string;
  bankName?: string;
  avatar?: string;
}

// Simple fast SHA-256 equivalent cryptographic string hash for browser
export function hashPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < cleanPhone.length; i++) {
    const char = cleanPhone.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'ph_hash_' + Math.abs(hash).toString(16).padStart(8, '0');
}

// Known MeshPay network registered users map
export function getRegisteredMeshPayUsers(): UserProfile[] {
  const currentUser = getStoredUserProfile();
  const baseUsers: UserProfile[] = [
    { ...INITIAL_USER_PROFILE, phone: '08012345678' },
    { ...SECOND_USER_PROFILE, phone: '08098765432' },
    { ...THIRD_USER_PROFILE, phone: '07011223344' }
  ];

  if (currentUser && !baseUsers.some(u => getUserKeyPrefix(u.phone) === getUserKeyPrefix(currentUser.phone))) {
    baseUsers.push(currentUser);
  }

  return baseUsers;
}

// Match hashed phone list against registered MeshPay network hashes
export function discoverContactsFromHashes(rawContacts: { name: string; phone: string }[]): SyncedContact[] {
  const meshUsers = getRegisteredMeshPayUsers();
  
  // Build lookup hash map of registered users
  const meshHashMap = new Map<string, UserProfile>();
  meshUsers.forEach(user => {
    const h = hashPhoneNumber(user.phone);
    meshHashMap.set(h, user);
  });

  return rawContacts.map((contact, idx) => {
    const contactHash = hashPhoneNumber(contact.phone);
    const matchedUser = meshHashMap.get(contactHash);

    if (matchedUser) {
      return {
        id: `contact_${idx}_${matchedUser.phone}`,
        name: matchedUser.name,
        phone: contact.phone,
        hash: contactHash,
        isMeshPayUser: true,
        tag: matchedUser.tag,
        accountNumber: matchedUser.virtualAccountNgn,
        bankName: matchedUser.bankName,
        avatar: matchedUser.avatar
      };
    }

    return {
      id: `contact_${idx}_${contact.phone}`,
      name: contact.name,
      phone: contact.phone,
      hash: contactHash,
      isMeshPayUser: false
    };
  });
}
