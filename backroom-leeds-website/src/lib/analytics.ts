import { initializeApp } from 'firebase/analytics';
import { getAnalytics, logEvent } from 'firebase/analytics';

export const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const app = initializeApp(firebaseConfig);
    return getAnalytics(app);
  }
  return null;
};

export const trackBookingEvent = (eventName: string, params?: Record<string, unknown>) => {
  const analytics = initAnalytics();
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

export const bookingEvents = {
  START_BOOKING: 'booking_start',
  COMPLETE_BOOKING: 'booking_complete',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILURE: 'payment_failure',
  VIEW_EVENT: 'view_event',
};