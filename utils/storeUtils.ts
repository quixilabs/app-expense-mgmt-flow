import { useTransactionStore } from '../store/transactionStore';

export function clearStoreOnce() {
  const { clearStore, hasBeenCleared } = useTransactionStore.getState();
  
  if (!hasBeenCleared) {
    clearStore();
    console.log('Store cleared for the first time');
  } else {
    console.log('Store has already been cleared once');
  }
}
