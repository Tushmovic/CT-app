
import { _subscribe } from '../../backend/api';

// Define event types for clarity
export enum RealtimeEvent {
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  PAYMENT_UPDATED = 'PAYMENT_UPDATED',
  LOAN_UPDATED = 'LOAN_UPDATED',
  NOTIFICATION_DISPATCHED = 'NOTIFICATION_DISPATCHED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
}

// Function to subscribe to all relevant real-time updates
export const subscribeToUpdates = (callback: (event: RealtimeEvent, payload?: any) => void) => {
  const unsubscribeUser = _subscribe(RealtimeEvent.USER_UPDATED, (event, payload) => callback(event as RealtimeEvent, payload));
  const unsubscribeUserDeleted = _subscribe(RealtimeEvent.USER_DELETED, (event, payload) => callback(event as RealtimeEvent, payload));
  const unsubscribePayment = _subscribe(RealtimeEvent.PAYMENT_UPDATED, (event, payload) => callback(event as RealtimeEvent, payload));
  const unsubscribeLoan = _subscribe(RealtimeEvent.LOAN_UPDATED, (event, payload) => callback(event as RealtimeEvent, payload));
  const unsubscribeNotification = _subscribe(RealtimeEvent.NOTIFICATION_DISPATCHED, (event, payload) => callback(event as RealtimeEvent, payload));
  const unsubscribeSettings = _subscribe(RealtimeEvent.SETTINGS_UPDATED, (event, payload) => callback(event as RealtimeEvent, payload));

  // Return a cleanup function that unsubscribes from all events
  return () => {
    unsubscribeUser();
    unsubscribeUserDeleted();
    unsubscribePayment();
    unsubscribeLoan();
    unsubscribeNotification();
    unsubscribeSettings();
  };
};