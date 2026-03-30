import { analytics } from '../firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Log a custom event to Firebase Analytics.
 * @param {string} eventName - Name of the event (e.g., 'paywall_view')
 * @param {Object} eventParams - Optional parameters for the event
 */
export const logEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, {
        ...eventParams,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[Analytics] Failed to log event ${eventName}:`, error);
    }
  }
};

// Standardized Event Names
export const EVENTS = {
  PAGE_VIEW: 'page_view',
  AUTH_SUCCESS: 'auth_success',
  PAYWALL_VIEW: 'paywall_view',
  UPGRADE_CLICK: 'upgrade_click',
  STYLE_ANALYSIS_START: 'style_analysis_start',
  STYLE_ANALYSIS_SUCCESS: 'style_analysis_success',
  STYLE_ANALYSIS_ERROR: 'style_analysis_error',
  TOOL_USE: 'tool_use',
  FEED_INTERACTION: 'feed_interaction',
  GENDER_SELECT: 'gender_select',
};
