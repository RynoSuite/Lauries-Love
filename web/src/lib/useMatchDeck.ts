import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

// The member matching deck.
//
// Kept as a hook rather than a react-query cache because a deck is consumed,
// not read: every swipe removes the top card, and a background refetch that
// reordered or reinserted cards mid-gesture would swipe the wrong person. The
// deck is fetched, spent, and fetched again — see `topUp`.

export type DeckCandidate = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  avatar_path: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  age_range: string | null;
  diagnosis_year: string | null;
  diagnosis_type_ids: string[] | null;
  diagnosis_subtype_ids: string[] | null;
  role_id: string | null;
  shared_diagnosis_ids: string[] | null;
  same_state: boolean | null;
  distance_miles: number | null;
  score: number;
};

export type SwipeResult = { matched: boolean; friendship_id: string | null };

const PAGE = 20;
// Fetch more before the pile runs out, so a swipe never waits on the network.
const TOP_UP_AT = 5;

export function deckName(c: DeckCandidate) {
  return c.display_name || c.first_name || 'Member';
}

export function useMatchDeck() {
  const [deck, setDeck] = useState<DeckCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  // Everyone acted on this session. The deck query already excludes them
  // server-side, but a top-up fetched mid-session would otherwise return
  // someone whose swipe has not landed yet.
  const decided = useRef(new Set<string>());
  const fetching = useRef(false);

  const fetchMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const { data, error: err } = await supabase.rpc('match_deck', { limit_count: PAGE });
      if (err) throw err;
      const rows = ((data ?? []) as DeckCandidate[]).filter((c) => !decided.current.has(c.id));
      setDeck((current) => {
        const seen = new Set(current.map((c) => c.id));
        const added = rows.filter((c) => !seen.has(c.id));
        // Nothing new came back and nothing is left to show: the deck is done
        // rather than merely empty for a moment.
        if (!added.length && current.length === 0) setExhausted(true);
        return [...current, ...added];
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load members.');
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMore();
  }, [fetchMore]);

  /**
   * Records a decision and removes the card.
   *
   * The card goes immediately rather than after the round trip: a swipe that
   * visibly hesitates feels broken, and there is nothing useful to do with a
   * failure anyway — the row either landed or the member sees them again next
   * time, which is the safe direction to fail in.
   */
  const swipe = useCallback(
    async (target: DeckCandidate, direction: 'like' | 'pass'): Promise<SwipeResult> => {
      decided.current.add(target.id);
      setDeck((current) => current.filter((c) => c.id !== target.id));

      try {
        const { data, error: err } = await supabase.rpc('record_swipe', {
          target: target.id,
          dir: direction,
        });
        if (err) throw err;
        const row = (Array.isArray(data) ? data[0] : data) as SwipeResult | undefined;
        return row ?? { matched: false, friendship_id: null };
      } catch {
        setError('That swipe did not save. It will come round again.');
        return { matched: false, friendship_id: null };
      }
    },
    [],
  );

  useEffect(() => {
    if (!loading && !exhausted && deck.length <= TOP_UP_AT) void fetchMore();
  }, [deck.length, loading, exhausted, fetchMore]);

  return { deck, loading, error, exhausted, swipe, refetch: fetchMore };
}
