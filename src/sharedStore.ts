import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://penyfgluluxlhsghntdj.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GtEyhgXLc3x6KQeBkAEZCg_v_GLrp4b'

export type SharedStrategyPayload = {
  events: unknown[]
  campaigns: unknown[]
  tasks: unknown[]
  initialized: boolean
}

const emptyPayload: SharedStrategyPayload = {
  events: [],
  campaigns: [],
  tasks: [],
  initialized: false,
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

function normalizePayload(value: unknown): SharedStrategyPayload {
  const payload = (value ?? {}) as Partial<SharedStrategyPayload>

  return {
    events: Array.isArray(payload.events) ? payload.events : [],
    campaigns: Array.isArray(payload.campaigns) ? payload.campaigns : [],
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    initialized: payload.initialized === true,
  }
}

export async function loadSharedStrategyState() {
  const { data, error } = await supabase
    .from('strategy_shared_state')
    .select('payload')
    .eq('id', 'global')
    .maybeSingle()

  if (error) throw error
  if (!data) return emptyPayload

  return normalizePayload(data.payload)
}

export async function saveSharedStrategyState(payload: SharedStrategyPayload) {
  const normalized = normalizePayload({
    ...payload,
    initialized: true,
  })

  const { error } = await supabase
    .from('strategy_shared_state')
    .upsert({
      id: 'global',
      payload: normalized,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
  return normalized
}

export function subscribeSharedStrategyState(
  onChange: (payload: SharedStrategyPayload) => void,
) {
  const channel = supabase
    .channel('strategy-shared-state')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'strategy_shared_state',
        filter: 'id=eq.global',
      },
      (change) => {
        const next = (change.new as { payload?: unknown } | null)?.payload
        onChange(normalizePayload(next))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
