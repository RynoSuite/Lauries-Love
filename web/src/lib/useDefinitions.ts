import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

// The taxonomy behind roles, diagnoses and stages.
//
// value_definitions stores a code in `value` and the human label in
// `description`, keyed by definition_type. Profiles reference these by id, so
// almost every screen that shows a profile needs the lookup — hence one shared
// query rather than a copy per page.
export type Definition = {
  id: string;
  definition_type: string;
  value: string;
  description: string;
  sort: number;
};

export const DEF_TYPES = {
  role: 'USER_ROLE',
  diagnosis: 'DIAGNOSIS_TYPE',
  subtype: 'DIAGNOSIS_SUB_TYPE',
  designation: 'USER_DESIGNATION',
} as const;

export function useDefinitions() {
  const query = useQuery<Definition[]>({
    queryKey: ['value-definitions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('value_definitions')
        .select('id, definition_type, value, description, sort')
        .eq('active', true)
        .order('sort');
      return (data ?? []) as Definition[];
    },
    // The taxonomy changes when an admin edits it, which is rare.
    staleTime: 10 * 60 * 1000,
  });

  const all = query.data ?? [];
  const byType = (t: string) => all.filter((d) => d.definition_type === t);
  const label = (id: string | null | undefined) =>
    id ? (all.find((d) => d.id === id)?.description ?? null) : null;
  const labels = (ids: string[] | null | undefined) =>
    (ids ?? []).map(label).filter(Boolean) as string[];

  return {
    ...query,
    roles: byType(DEF_TYPES.role),
    diagnoses: byType(DEF_TYPES.diagnosis),
    subtypes: byType(DEF_TYPES.subtype),
    label,
    labels,
  };
}
