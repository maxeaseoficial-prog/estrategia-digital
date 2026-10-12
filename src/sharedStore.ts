const SHARED_STATE_ENDPOINT =
  'https://penyfgluluxlhsghntdj.supabase.co/functions/v1/strategy-shared-state'

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

function normalizePayload(value: unknown): SharedStrategyPayload {
  const payload = (value ?? {}) as Partial<SharedStrategyPayload>

  return {
    events: Array.isArray(payload.events) ? payload.events : [],
    campaigns: Array.isArray(payload.campaigns) ? payload.campaigns : [],
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    initialized: payload.initialized === true,
  }
}

async function requestSharedState(
  method: 'GET' | 'POST',
  payload?: SharedStrategyPayload,
) {
  const response = await fetch(SHARED_STATE_ENDPOINT, {
    method,
    cache: 'no-store',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify({ payload }) : undefined,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      `Falha na sincronização (${response.status})${message ? `: ${message}` : ''}`,
    )
  }

  const result = (await response.json()) as { payload?: unknown }
  return normalizePayload(result.payload)
}

export async function loadSharedStrategyState() {
  return requestSharedState('GET')
}

export async function saveSharedStrategyState(payload: SharedStrategyPayload) {
  return requestSharedState(
    'POST',
    normalizePayload({
      ...payload,
      initialized: true,
    }),
  )
}

export function subscribeSharedStrategyState(
  onChange: (payload: SharedStrategyPayload) => void,
) {
  let stopped = false
  let lastValue = ''

  async function refresh() {
    if (stopped) return

    try {
      const payload = await loadSharedStrategyState()
      const serialized = JSON.stringify(payload)

      if (serialized !== lastValue) {
        lastValue = serialized
        onChange(payload)
      }
    } catch (error) {
      console.error('Falha ao atualizar dados compartilhados:', error)
    }
  }

  const timer = window.setInterval(() => {
    void refresh()
  }, 5000)

  const handleFocus = () => {
    void refresh()
  }

  window.addEventListener('focus', handleFocus)
  document.addEventListener('visibilitychange', handleFocus)

  return () => {
    stopped = true
    window.clearInterval(timer)
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleFocus)
  }
}
