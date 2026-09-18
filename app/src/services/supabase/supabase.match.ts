// Member matching: the swipe deck and its decisions.
//
// Same two functions the web app uses, so the two surfaces rank people
// identically — the scoring lives in match_deck() in the database rather than
// in either client, which is the only way to keep them from drifting. See
// supabase/migrations/20260918140000_member_matching_v1.sql.
//
// A like is private: nobody is told they were passed over. A MUTUAL like
// creates an accepted friendship immediately, so the pair can message each
// other straight away with no request to approve.

import { supabase } from './client';
import { publicUrlFor } from './supabase.storage';

export type DeckCandidate = {
  id: string;
  displayName: string;
  avatarUrl: string;
  city: string | null;
  state: string | null;
  description: string | null;
  ageRange: string | null;
  diagnosisYear: string | null;
  diagnosisTypeIds: string[];
  sharedDiagnosisIds: string[];
  sameState: boolean;
  distanceMiles: number | null;
  score: number;
};

export type SwipeOutcome = {
  matched: boolean;
  friendshipId: string | null;
};

const toCandidate = (row: any): DeckCandidate => ({
  id: row.id,
  displayName: row.display_name || row.first_name || 'Member',
  // The web app resolves the storage key the same way; an empty string rather
  // than null so the card can fall through to its initial without a branch.
  avatarUrl: publicUrlFor('avatars', row.avatar_path) ?? '',
  city: row.city ?? null,
  state: row.state ?? null,
  description: row.description ?? null,
  ageRange: row.age_range ?? null,
  diagnosisYear: row.diagnosis_year ?? null,
  diagnosisTypeIds: row.diagnosis_type_ids ?? [],
  sharedDiagnosisIds: row.shared_diagnosis_ids ?? [],
  sameState: Boolean(row.same_state),
  distanceMiles: row.distance_miles ?? null,
  score: row.score ?? 0,
});

/** The deck, best match first. Excludes anyone already decided on or connected to. */
export async function fetchMatchDeck(limit = 20): Promise<DeckCandidate[]> {
  const { data, error } = await supabase.rpc('match_deck', { limit_count: limit });
  if (error) throw error;
  return (data ?? []).map(toCandidate);
}

/**
 * Record a like or a pass.
 *
 * Repeating a swipe updates the decision rather than failing, so changing your
 * mind is not an error — and a pass that could never be undone would be a
 * permanent exclusion the member did not know they were choosing.
 */
export async function recordSwipe(
  targetId: string,
  direction: 'like' | 'pass',
): Promise<SwipeOutcome> {
  const { data, error } = await supabase.rpc('record_swipe', {
    target: targetId,
    dir: direction,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    matched: Boolean(row?.matched),
    friendshipId: row?.friendship_id ?? null,
  };
}
