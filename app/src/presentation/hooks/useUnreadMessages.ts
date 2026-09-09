import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from 'services/supabase/client';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';

/**
 * How many messages are waiting for me.
 *
 * `my_unread_counts()` already existed — the web app has used it since the
 * unread work — but nothing on mobile ever called it, so the Messages tab had
 * no badge at all. The count cannot be done client-side: the read marker lives
 * on conversation_members while the messages live in another table, and a
 * member cannot select rows in conversations they are not part of.
 *
 * Polled rather than subscribed, matching what the notification bell does. A
 * realtime subscription would be better and is worth doing when both move.
 */
const POLL_MS = 60_000;

export function useUnreadMessages() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!SUPABASE_ENABLED) return;
    try {
      const { data, error } = await supabase.rpc('my_unread_counts');
      if (error) throw error;
      setCount(Number((data as any)?.messages) || 0);
    } catch (error) {
      if (__DEV__) console.warn('unread counts error', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    // Coming back from the background is exactly when this is most likely to
    // be stale, and waiting out the poll makes the app look asleep.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  return { unreadMessages: count, refreshUnreadMessages: refresh };
}

export default useUnreadMessages;
