import React from 'react';
import { SendAndPayPage } from './SendAndPayPage';
import { UserProfile, ExchangeRate, Transaction, RecentReceiver } from '../types';

interface RemittancePageProps {
  user: UserProfile;
  exchangeRate: ExchangeRate;
  isOnline: boolean;
  onTransactionComplete: (tx: Transaction) => void;
  onCancel: () => void;
  onOpenReceiveQr?: () => void;
  onOpenSendQr?: () => void;
  triggerAutoSync?: () => void;
  prefilledRecipient?: RecentReceiver | null;
}

export const RemittancePage: React.FC<RemittancePageProps> = (props) => {
  return <SendAndPayPage {...props} initialMode="bank" />;
};
