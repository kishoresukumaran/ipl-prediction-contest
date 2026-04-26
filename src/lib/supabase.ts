import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Fetch every row from a Supabase query, transparently paginating around
 * PostgREST's default 1000-row response cap.
 *
 * Pass a `buildQuery` callback that returns a fresh builder each time it's
 * invoked (so `.range()` can be applied per page). Returns the same
 * `{ data, error }` shape as a regular Supabase query so callers can keep
 * existing error handling.
 *
 * Example:
 *   const { data, error } = await fetchAllRows<Prediction>(
 *     () => admin.from('predictions').select('*')
 *   );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseBuilder = any;

export async function fetchAllRows<T = unknown>(
  buildQuery: () => SupabaseBuilder,
  pageSize = 1000
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  const out: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) {
      return { data: null, error };
    }
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return { data: out, error: null };
}
