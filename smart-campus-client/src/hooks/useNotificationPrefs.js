import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Default preferences ──────────────────────────────────────────────────────
export const DEFAULT_PREFS = {
  bookingRequests : true,  // Admin/Tech: "New booking request from..."
  bookingStatus   : true,  // User: booking approved / rejected / cancelled
  ticketAlerts    : true,  // Admin/Tech: "New X priority ticket for..."
  ticketStatus    : true,  // User: ticket in-progress / resolved
  inAppToasts     : true,  // Show popup toasts in the bottom-right corner
  browserNotifs   : true,  // Native browser push notifications
};

// ── Notification categories ───────────────────────────────────────────────────
export const NOTIF_CAT = {
  BOOKING_REQUESTS : 'bookingRequests',
  BOOKING_STATUS   : 'bookingStatus',
  TICKET_ALERTS    : 'ticketAlerts',
  TICKET_STATUS    : 'ticketStatus',
};

/**
 * Determine which preference category a notification message belongs to.
 * Matches against the emoji / keyword patterns used in the backend controllers.
 */
export const categorizeNotif = (message = '') => {
  const m = message.toLowerCase();
  if (m.includes('new booking request'))                          return NOTIF_CAT.BOOKING_REQUESTS;
  if (m.includes('approved') || m.includes('rejected') ||
      m.includes('cancelled'))                                    return NOTIF_CAT.BOOKING_STATUS;
  if (m.includes('priority') && m.includes('ticket') &&
      m.includes('new'))                                          return NOTIF_CAT.TICKET_ALERTS;
  if (m.includes('in progress') || m.includes('resolved') ||
      m.includes('ticket'))                                       return NOTIF_CAT.TICKET_STATUS;
  return null; // uncategorised → always shown
};

/**
 * Hook: reads and writes notification preferences for the current user.
 *
 * FIX: Start with DEFAULT_PREFS (all ON) immediately, then load the saved
 * preferences only once the userId is available via useEffect. This prevents
 * the bug where useState(load) runs before auth resolves (user = null),
 * reading from the wrong key and showing all toggles as OFF for new users.
 */
export const useNotificationPrefs = () => {
  const { user } = useAuth();

  // Always start with defaults (all ON) — prevents flash of "all off" state
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS });

  // Load the user-specific stored preferences once userId is known
  useEffect(() => {
    if (!user?.userId) return;
    try {
      const key = `notif_prefs_${user.userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        // Merge stored values with defaults so any newly added pref keys default to ON
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      }
      // If no stored prefs exist yet → keep the DEFAULT_PREFS already in state (all ON)
    } catch {
      setPrefs({ ...DEFAULT_PREFS });
    }
  }, [user?.userId]);

  const setPref = (key, value) => {
    if (!user?.userId) return;
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(`notif_prefs_${user.userId}`, JSON.stringify(next));
      return next;
    });
  };

  const resetPrefs = () => {
    if (!user?.userId) return;
    localStorage.setItem(`notif_prefs_${user.userId}`, JSON.stringify(DEFAULT_PREFS));
    setPrefs({ ...DEFAULT_PREFS });
  };

  return { prefs, setPref, resetPrefs };
};
