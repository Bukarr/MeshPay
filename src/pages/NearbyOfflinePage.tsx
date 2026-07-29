import React from 'react';
import { SendAndPayPage } from './SendAndPayPage';
import { UserProfile, Transaction } from '../types';
import { INITIAL_EXCHANGE_RATE } from '../data/mockData';

interface NearbyOfflinePageProps {
  user: UserProfile;
  isOnline: boolean;
  onTransactionComplete: (tx: Transaction) => void;
  triggerAutoSync: () => void;
  onOpenReceiveQr: () => void;
  onOpenSendQr: () => void;
}

export const NearbyOfflinePage: React.FC<NearbyOfflinePageProps> = (props) => {
  return (
    <SendAndPayPage
      user={props.user}
      exchangeRate={INITIAL_EXCHANGE_RATE}
      isOnline={props.isOnline}
      onTransactionComplete={props.onTransactionComplete}
      onCancel={() => {}}
      onOpenReceiveQr={props.onOpenReceiveQr}
      onOpenSendQr={props.onOpenSendQr}
      triggerAutoSync={props.triggerAutoSync}
      initialMode="mesh"
    />
  );
};
