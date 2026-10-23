import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Creatives from './Creatives'
import Funnels from './Funnels'
import Tasks from './Tasks'
import EventProtocol from './EventProtocol'
import ContentCalendar from './ContentCalendar'
import {
  CalendarDays,
  Clapperboard,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  Megaphone,
  Package2,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Power,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import {
  loadSharedStrategyState,
  saveSharedStrategyState,
  subscribeSharedStrategyState,
} from './sharedStore'

type Page = 'dashboard' | 'content-calendar' | 'events' | 'tasks' | 'campaigns' | 'funnels' | 'creatives' | 'products' | 'protocol'
type CalendarMode = 'month' | 'week' | 'day'

type ProductType = 'digital' | 'live' | 'event'

type ProductLot = {
  id: string
  name: string
  price: number
}

type ProductItem = {
  id: string
  name: string
  type: ProductType
  image: string
  value: number
  hasLots: boolean
  lots: ProductLot[]
}

type EventItem = {
  id: string
  eventType?: 'presencial' | 'online'
  name: string
  date: string
  time: string
  location: string
  description: string
  ticketsSold: number
  ticketsCapacity: number
  color: string
  active: boolean
}

type CampaignItem = {
  id: string
  name: string
  startDate: string
  endDate: string
  description: string
  channel: string
  goal: string
  eventId: string
  color: string
  active: boolean
}

type TaskItem = {
  id: string
  title: string
  date: string
  description: string
  color: string
  completed: boolean
}

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date) {
  const day = date.getDay()
  const diff = (day + 6) % 7
  const result = new Date(date)
  result.setDate(result.getDate() - diff)
  return startOfDay(result)
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function daysUntil(dateValue: string) {
  const today = startOfDay(new Date())
  const target = startOfDay(parseDate(dateValue))
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = parseDate(value)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function useStoredState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    if (!saved) return initial
    try {
      return JSON.parse(saved) as T
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState] as const
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

const emptyEvent: Omit<EventItem, 'id'> = {
  eventType: 'online',
  name: '',
  date: toISODate(new Date()),
  time: '19:00',
  location: '',
  description: '',
  ticketsSold: 0,
  ticketsCapacity: 0,
  color: '#8C919A',
  active: true,
}

const emptyCampaign: Omit<CampaignItem, 'id'> = {
  name: '',
  startDate: toISODate(new Date()),
  endDate: toISODate(new Date()),
  description: '',
  channel: 'Instagram',
  goal: '',
  eventId: '',
  color: '#8C919A',
  active: true,
}

const emptyTask: Omit<TaskItem, 'id'> = {
  title: '',
  date: toISODate(new Date()),
  description: '',
  color: '#6B7280',
  completed: false,
}

const emptyProduct: Omit<ProductItem, 'id'> = {
  name: '',
  type: 'event',
  image: '',
  value: 0,
  hasLots: false,
  lots: [],
}

function App() {
  const [page, setPage] = useState<Page>(() => {
    try {
      const saved = window.sessionStorage.getItem('strategy-current-page')
      return saved && (['dashboard','content-calendar','events','tasks','campaigns','funnels','creatives','products','protocol'] as string[]).includes(saved) ? saved as Page : 'dashboard'
    } catch { return 'dashboard' }
  })
  useEffect(() => {
    try { window.sessionStorage.setItem('strategy-current-page',page) } catch { /* storage unavailable */ }
  }, [page])
  const [collapsed, setCollapsed] = useState(false)
  const [events, setEvents] = useStoredState<EventItem[]>('strategy-events', [])
  const [campaigns, setCampaigns] = useStoredState<CampaignItem[]>('strategy-campaigns', [])
  const [tasks, setTasks] = useStoredState<TaskItem[]>('strategy-tasks', [])
  const [products, setProducts] = useStoredState<ProductItem[]>('strategy-products', [])
  const [eventModal, setEventModal] = useState(false)
  const [campaignModal, setCampaignModal] = useState(false)
  const [taskModal, setTaskModal] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [taskDate, setTaskDate] = useState(toISODate(new Date()))
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [search, setSearch] = useState('')
  const [sharedReady, setSharedReady] = useState(false)
  const [sharedInitialized, setSharedInitialized] = useState(false)
  const [sharedStatus, setSharedStatus] = useState<'loading' | 'synced' | 'error'>('loading')
  const lastSyncedStateRef = useRef('')
  const saveTimerRef = useRef<number | null>(null)

  const activeEvents = useMemo(
    () => events.filter((item) => item.active).sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )
  const activeCampaigns = campaigns.filter((item) => item.active)

  const nearestEvent =
    activeEvents.find((item) => daysUntil(item.date) >= 0) ?? activeEvents[0] ?? null

  useEffect(() => {
    let cancelled = false

    function readStoredArray<T>(key: string): T[] {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    async function bootstrapSharedState() {
      setSharedStatus('loading')

      try {
        const remote = await loadSharedStrategyState()
        if (cancelled) return

        if (remote.initialized) {
          const remoteState = {
            events: remote.events as EventItem[],
            campaigns: remote.campaigns as CampaignItem[],
            tasks: remote.tasks as TaskItem[],
            products: remote.products as ProductItem[],
          }

          lastSyncedStateRef.current = JSON.stringify(remoteState)
          setEvents(remoteState.events)
          setCampaigns(remoteState.campaigns)
          setTasks(remoteState.tasks)
          setProducts(remoteState.products)
          setSharedInitialized(true)
          setSharedReady(true)
          setSharedStatus('synced')
          return
        }

        // Migração do conteúdo antigo salvo somente neste navegador.
        // Lemos diretamente do localStorage para não depender do timing do React.
        const legacyState = {
          events: readStoredArray<EventItem>('strategy-events'),
          campaigns: readStoredArray<CampaignItem>('strategy-campaigns'),
          tasks: readStoredArray<TaskItem>('strategy-tasks'),
          products: readStoredArray<ProductItem>('strategy-products'),
        }

        const hasLegacyData =
          legacyState.events.length > 0 ||
          legacyState.campaigns.length > 0 ||
          legacyState.tasks.length > 0 ||
          legacyState.products.length > 0

        if (hasLegacyData) {
          await saveSharedStrategyState({
            ...legacyState,
            initialized: true,
          })

          if (cancelled) return

          const verified = await loadSharedStrategyState()
          if (cancelled) return

          const verifiedState = {
            events: verified.events as EventItem[],
            campaigns: verified.campaigns as CampaignItem[],
            tasks: verified.tasks as TaskItem[],
            products: verified.products as ProductItem[],
          }

          lastSyncedStateRef.current = JSON.stringify(verifiedState)
          setEvents(verifiedState.events)
          setCampaigns(verifiedState.campaigns)
          setTasks(verifiedState.tasks)
          setProducts(verifiedState.products)
          setSharedInitialized(verified.initialized)
          setSharedReady(true)
          setSharedStatus(verified.initialized ? 'synced' : 'error')
          return
        }

        setSharedReady(true)
        setSharedStatus('synced')
      } catch (error) {
        console.error('Falha ao carregar/migrar dados compartilhados:', error)
        if (!cancelled) {
          setSharedReady(true)
          setSharedStatus('error')
        }
      }
    }

    void bootstrapSharedState()

    return () => {
      cancelled = true
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
    // Executa uma única vez para carregar a nuvem ou migrar o localStorage legado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sharedReady) return

    const unsubscribe = subscribeSharedStrategyState((remote) => {
      if (!remote.initialized) return

      const remoteState = {
        events: remote.events as EventItem[],
        campaigns: remote.campaigns as CampaignItem[],
        tasks: remote.tasks as TaskItem[],
        products: remote.products as ProductItem[],
      }
      const remoteSerialized = JSON.stringify(remoteState)

      if (remoteSerialized === lastSyncedStateRef.current) return

      lastSyncedStateRef.current = remoteSerialized
      setEvents(remoteState.events)
      setCampaigns(remoteState.campaigns)
      setTasks(remoteState.tasks)
      setProducts(remoteState.products)
      setSharedInitialized(true)
      setSharedStatus('synced')
    })

    return unsubscribe
  }, [sharedReady, setEvents, setCampaigns, setTasks, setProducts])

  useEffect(() => {
    if (!sharedReady) return

    const hasData =
      events.length > 0 ||
      campaigns.length > 0 ||
      tasks.length > 0 ||
      products.length > 0
    if (!sharedInitialized && !hasData) return

    const serialized = JSON.stringify({ events, campaigns, tasks, products })
    if (serialized === lastSyncedStateRef.current) return

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }

    setSharedStatus('loading')

    saveTimerRef.current = window.setTimeout(() => {
      void saveSharedStrategyState({
        events,
        campaigns,
        tasks,
        products,
        initialized: true,
      })
        .then(async () => {
          const verified = await loadSharedStrategyState()
          const verifiedSerialized = JSON.stringify({
            events: verified.events,
            campaigns: verified.campaigns,
            tasks: verified.tasks,
            products: verified.products,
          })

          lastSyncedStateRef.current = verifiedSerialized
          setSharedInitialized(verified.initialized)
          setSharedStatus(verified.initialized ? 'synced' : 'error')
        })
        .catch((error) => {
          console.error('Falha ao salvar dados compartilhados:', error)
          setSharedStatus('error')
        })
    }, 250)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [events, campaigns, tasks, products, sharedReady, sharedInitialized])

  function openEvent(item?: EventItem) {
    setEditingEvent(item ?? null)
    setEventModal(true)
  }

  function openCampaign(item?: CampaignItem) {
    setEditingCampaign(item ?? null)
    setCampaignModal(true)
  }

  function openTask(date: string, item?: TaskItem) {
    setTaskDate(item?.date ?? date)
    setEditingTask(item ?? null)
    setTaskModal(true)
  }

  function openProduct(item?: ProductItem) {
    setEditingProduct(item ?? null)
    setProductModal(true)
  }

  function saveEvent(data: Omit<EventItem, 'id'>) {
    if (editingEvent) {
      setEvents((current) =>
        current.map((item) => (item.id === editingEvent.id ? { ...data, id: item.id } : item)),
      )
    } else {
      setEvents((current) => [...current, { ...data, id: uid() }])
    }
    setEventModal(false)
    setEditingEvent(null)
  }

  function saveCampaign(data: Omit<CampaignItem, 'id'>) {
    if (editingCampaign) {
      setCampaigns((current) =>
        current.map((item) =>
          item.id === editingCampaign.id ? { ...data, id: item.id } : item,
        ),
      )
    } else {
      setCampaigns((current) => [...current, { ...data, id: uid() }])
    }
    setCampaignModal(false)
    setEditingCampaign(null)
  }

  function saveTask(data: Omit<TaskItem, 'id'>) {
    if (editingTask) {
      setTasks((current) =>
        current.map((item) => (item.id === editingTask.id ? { ...data, id: item.id } : item)),
      )
    } else {
      setTasks((current) => [...current, { ...data, id: uid() }])
    }
    setTaskModal(false)
    setEditingTask(null)
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((item) => item.id !== id))
    setTaskModal(false)
    setEditingTask(null)
  }

  function saveProduct(data: Omit<ProductItem, 'id'>) {
    if (editingProduct) {
      setProducts((current) =>
        current.map((item) => (item.id === editingProduct.id ? { ...data, id: item.id } : item)),
      )
    } else {
      setProducts((current) => [...current, { ...data, id: uid() }])
    }
    setProductModal(false)
    setEditingProduct(null)
  }

  function removeProduct(id: string) {
    if (!window.confirm('Excluir este produto?')) return
    setProducts((current) => current.filter((item) => item.id !== id))
  }

  function removeEvent(id: string) {
    if (!window.confirm('Excluir este evento?')) return
    setEvents((current) => current.filter((item) => item.id !== id))
    setCampaigns((current) => current.map((item) => (item.eventId === id ? { ...item, eventId: '' } : item)))
  }

  function removeCampaign(id: string) {
    if (!window.confirm('Excluir esta campanha?')) return
    setCampaigns((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">S</div>
          {!collapsed && (
            <div>
              <strong>Strategy</strong>
              <span>eventos & campanhas</span>
            </div>
          )}
          <button
            className="icon-button sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Mostrar menu' : 'Ocultar menu'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={page === 'dashboard' ? 'active' : ''}
            onClick={() => setPage('dashboard')}
          >
            <LayoutDashboard size={19} />
            {!collapsed && <span>Visão geral</span>}
          </button>
          <button className={page === 'content-calendar' ? 'active' : ''} onClick={() => setPage('content-calendar')}><CalendarDays size={19}/>{!collapsed&&<span>Calendário de conteúdo</span>}</button>
          <button
            className={page === 'events' ? 'active' : ''}
            onClick={() => setPage('events')}
          >
            <CalendarDays size={19} />
            {!collapsed && <span>Eventos</span>}
          </button>
          <button className={page === 'tasks' ? 'active' : ''} onClick={() => setPage('tasks')}><CheckSquare2 size={19}/>{!collapsed&&<span>Tarefas</span>}</button>
          <button
            className={page === 'campaigns' ? 'active' : ''}
            onClick={() => setPage('campaigns')}
          >
            <Megaphone size={19} />
            {!collapsed && <span>Campanhas</span>}
          </button>
          <button className={page === 'funnels' ? 'active fn-sidebar-child' : 'fn-sidebar-child'} onClick={() => setPage('funnels')} title="Funis de campanha"><Megaphone size={17} />{!collapsed && <span>Funis de campanha</span>}</button>
          <button className={page === 'creatives' ? 'active' : ''} onClick={() => setPage('creatives')}><Clapperboard size={19}/>{!collapsed&&<span>Criativos</span>}</button>
          <button
            className={page === 'products' ? 'active' : ''}
            onClick={() => setPage('products')}
          >
            <Package2 size={19} />
            {!collapsed && <span>Produtos</span>}
          </button>
          <button className={page === 'protocol' ? 'active' : ''} onClick={() => setPage('protocol')}><BookOpen size={19}/>{!collapsed&&<span>Protocolo</span>}</button>
        </nav>

        {!collapsed && (
          <div className="sidebar-footer">
            <span>MVP</span>
            <p>
              {sharedStatus === 'loading' && 'Sincronizando dados...'}
              {sharedStatus === 'synced' && 'Nuvem sincronizada.'}
              {sharedStatus === 'error' && 'Falha na sincronização.'}
            </p>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">GESTÃO ESTRATÉGICA</span>
            <h1>
              {page === 'dashboard' && 'Calendário estratégico'}
              {page === 'content-calendar' && 'Calendário de conteúdo'}
              {page === 'events' && 'Eventos'}
              {page === 'tasks' && 'Tarefas'}
              {page === 'protocol' && 'Protocolo'}
              {page === 'campaigns' && 'Campanhas'}
              {page === 'funnels' && 'Funis de campanha'}
              {page === 'creatives' && 'Criativos'}
              {page === 'products' && 'Produtos'}
            </h1>
          </div>
          <div className="topbar-actions">
            {page === 'events' && (
              <button className="primary-button" onClick={() => openEvent()}>
                <CirclePlus size={18} /> Novo evento
              </button>
            )}
            {page === 'campaigns' && (
              <button className="primary-button" onClick={() => openCampaign()}>
                <CirclePlus size={18} /> Nova campanha
              </button>
            )}
            {page === 'products' && (
              <button className="primary-button" onClick={() => openProduct()}>
                <CirclePlus size={18} /> Novo produto
              </button>
            )}
          </div>
        </header>

        {page === 'dashboard' && (
          <Dashboard
            events={events}
            campaigns={campaigns}
            tasks={tasks}
            nearestEvent={nearestEvent}
            activeEvents={activeEvents}
            activeCampaigns={activeCampaigns}
            onCreateEvent={() => openEvent()}
            onCreateCampaign={() => openCampaign()}
            onCreateTask={(date) => openTask(date)}
            onEditTask={(task) => openTask(task.date, task)}
          />
        )}

        {page === 'events' && (
          <EventsPage
            events={events}
            search={search}
            setSearch={setSearch}
            onEdit={openEvent}
            onDelete={removeEvent}
            onToggle={(id) =>
              setEvents((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, active: !item.active } : item,
                ),
              )
            }
          />
        )}

        {page === 'funnels' && <Funnels campaigns={campaigns.map(c => ({ id:c.id, name:c.name }))} />}
        {page === 'content-calendar' && <ContentCalendar />}
        {page === 'protocol' && <EventProtocol events={events.map(e=>({id:e.id,name:e.name,date:e.date,time:e.time,location:e.location,description:e.description,eventType:e.eventType}))} />}
        {page === 'tasks' && <Tasks onOpenProtocol={()=>setPage('protocol')} onOpenFunnel={id=>{window.sessionStorage.setItem('strategy-open-funnel',id);setPage('funnels')}} />}
        {page === 'creatives' && <Creatives campaigns={campaigns.map(c=>({id:c.id,name:c.name}))} />}

        {page === 'campaigns' && (
          <CampaignsPage
            campaigns={campaigns}
            events={events}
            search={search}
            setSearch={setSearch}
            onEdit={openCampaign}
            onDelete={removeCampaign}
            onToggle={(id) =>
              setCampaigns((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, active: !item.active } : item,
                ),
              )
            }
          />
        )}

        {page === 'products' && (
          <ProductsPage
            products={products}
            search={search}
            setSearch={setSearch}
            onEdit={openProduct}
            onDelete={removeProduct}
          />
        )}
      </main>

      {eventModal && (
        <EventModal
          value={editingEvent}
          onClose={() => {
            setEventModal(false)
            setEditingEvent(null)
          }}
          onSave={saveEvent}
        />
      )}

      {campaignModal && (
        <CampaignModal
          value={editingCampaign}
          events={events}
          onClose={() => {
            setCampaignModal(false)
            setEditingCampaign(null)
          }}
          onSave={saveCampaign}
        />
      )}

      {productModal && (
        <ProductModal
          value={editingProduct}
          onClose={() => {
            setProductModal(false)
            setEditingProduct(null)
          }}
          onSave={saveProduct}
        />
      )}

      {taskModal && (
        <TaskModal
          value={editingTask}
          initialDate={taskDate}
          onClose={() => {
            setTaskModal(false)
            setEditingTask(null)
          }}
          onSave={saveTask}
          onDelete={editingTask ? () => removeTask(editingTask.id) : undefined}
        />
      )}
    </div>
  )
}

function Dashboard({
  events,
  campaigns,
  tasks,
  nearestEvent,
  activeEvents,
  activeCampaigns,
  onCreateEvent,
  onCreateCampaign,
  onCreateTask,
  onEditTask,
}: {
  events: EventItem[]
  campaigns: CampaignItem[]
  tasks: TaskItem[]
  nearestEvent: EventItem | null
  activeEvents: EventItem[]
  activeCampaigns: CampaignItem[]
  onCreateEvent: () => void
  onCreateCampaign: () => void
  onCreateTask: (date: string) => void
  onEditTask: (task: TaskItem) => void
}) {
  const [mode, setMode] = useState<CalendarMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEventId, setSelectedEventId] = useState<string | null>(nearestEvent?.id ?? null)

  useEffect(() => {
    const selectedStillActive = activeEvents.some((event) => event.id === selectedEventId)

    if (!selectedStillActive) {
      setSelectedEventId(nearestEvent?.id ?? activeEvents[0]?.id ?? null)
    }
  }, [activeEvents, nearestEvent, selectedEventId])

  const selectedEvent =
    activeEvents.find((event) => event.id === selectedEventId) ?? nearestEvent ?? null

  const countdown = selectedEvent ? daysUntil(selectedEvent.date) : null

  const selectedEventCampaigns = selectedEvent
    ? activeCampaigns.filter((campaign) => campaign.eventId === selectedEvent.id)
    : activeCampaigns

  return (
    <div className="dashboard-stack">
      <section className="stats-grid">
        <article
          className="stat-card featured"
          style={{ borderTop: `3px solid ${selectedEvent?.color || '#8C919A'}` }}
        >
          <span>Evento selecionado</span>
          <strong>{selectedEvent?.name ?? 'Nenhum evento ativo'}</strong>
          <div className="stat-inline">
            <b>
              {countdown === null
                ? '—'
                : countdown === 0
                  ? 'Hoje'
                  : countdown > 0
                    ? `${countdown} dias`
                    : 'Encerrado'}
            </b>
            <small>{selectedEvent ? formatDate(selectedEvent.date) : 'Crie o primeiro evento'}</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Ticket size={20} /></div>
          <span>Ingressos vendidos</span>
          <strong>
            {selectedEvent
              ? `${selectedEvent.ticketsSold}/${selectedEvent.ticketsCapacity || '—'}`
              : '—'}
          </strong>
          <small>{selectedEvent?.name ?? 'Sem evento ativo'}</small>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Megaphone size={20} /></div>
          <span>Campanhas ativas</span>
          <strong>{selectedEventCampaigns.length}</strong>
          <small>
            {selectedEvent
              ? `vinculada(s) a ${selectedEvent.name}`
              : `${campaigns.length} campanha(s) cadastrada(s)`}
          </small>
        </article>
      </section>

      {activeEvents.length > 0 && (
        <section className="event-strip" aria-label="Filtrar painel por evento">
          {activeEvents.slice(0, 4).map((event) => {
            const left = daysUntil(event.date)
            const isSelected = event.id === selectedEvent?.id

            return (
              <article
                key={event.id}
                className={isSelected ? 'selected' : ''}
                style={{ borderTop: `3px solid ${event.color || '#8C919A'}` }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedEventId(event.id)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                    keyboardEvent.preventDefault()
                    setSelectedEventId(event.id)
                  }
                }}
              >
                <div>
                  <span
                    className="status-dot"
                    style={{ background: event.color || '#8C919A', boxShadow: `0 0 0 3px ${event.color || '#8C919A'}22` }}
                  />
                  <strong>{event.name}</strong>
                </div>
                <p>{formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}</p>
                <b>{left === 0 ? 'Hoje' : left > 0 ? `Faltam ${left} dias` : 'Evento passado'}</b>
                {isSelected && <span className="selected-event-label">Selecionado</span>}
              </article>
            )
          })}
        </section>
      )}

      {events.length === 0 && campaigns.length === 0 && (
        <section className="welcome-panel">
          <div>
            <span className="eyebrow">COMECE POR AQUI</span>
            <h2>Organize seu primeiro evento e as campanhas ligadas a ele.</h2>
            <p>O calendário centraliza prazos, eventos e janelas de campanha sem complicar o MVP.</p>
          </div>
          <div className="welcome-actions">
            <button className="primary-button" onClick={onCreateEvent}>
              <CirclePlus size={18} /> Criar evento
            </button>
            <button className="secondary-button" onClick={onCreateCampaign}>
              <Megaphone size={18} /> Criar campanha
            </button>
          </div>
        </section>
      )}

      <CalendarPanel
        events={events}
        campaigns={campaigns}
        tasks={tasks}
        mode={mode}
        setMode={setMode}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        onCreateTask={onCreateTask}
        onEditTask={onEditTask}
      />
    </div>
  )
}

function CalendarPanel({
  events,
  campaigns,
  tasks,
  mode,
  setMode,
  currentDate,
  setCurrentDate,
  onCreateTask,
  onEditTask,
}: {
  events: EventItem[]
  campaigns: CampaignItem[]
  tasks: TaskItem[]
  mode: CalendarMode
  setMode: (mode: CalendarMode) => void
  currentDate: Date
  setCurrentDate: (date: Date) => void
  onCreateTask: (date: string) => void
  onEditTask: (task: TaskItem) => void
}) {
  function move(direction: number) {
    const next = new Date(currentDate)
    if (mode === 'month') next.setMonth(next.getMonth() + direction)
    if (mode === 'week') next.setDate(next.getDate() + direction * 7)
    if (mode === 'day') next.setDate(next.getDate() + direction)
    setCurrentDate(next)
  }

  const title =
    mode === 'month'
      ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : mode === 'week'
        ? `${pad(startOfWeek(currentDate).getDate())}/${pad(startOfWeek(currentDate).getMonth() + 1)} — ${pad(addDays(startOfWeek(currentDate), 6).getDate())}/${pad(addDays(startOfWeek(currentDate), 6).getMonth() + 1)}`
        : `${pad(currentDate.getDate())} de ${months[currentDate.getMonth()].toLowerCase()}`

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <div>
          <span className="eyebrow">CALENDÁRIO</span>
          <h2>{title}</h2>
        </div>
        <div className="calendar-controls">
          <div className="segmented">
            {(['month', 'week', 'day'] as CalendarMode[]).map((item) => (
              <button
                key={item}
                className={mode === item ? 'active' : ''}
                onClick={() => setMode(item)}
              >
                {item === 'month' ? 'Mês' : item === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          <button className="icon-button" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
          <button className="today-button" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          <button className="icon-button" onClick={() => move(1)}><ChevronRight size={18} /></button>
        </div>
      </div>

      {mode === 'month' && (
        <MonthCalendar
          currentDate={currentDate}
          events={events}
          campaigns={campaigns}
          tasks={tasks}
          onCreateTask={onCreateTask}
          onEditTask={onEditTask}
        />
      )}
      {mode === 'week' && (
        <WeekCalendar
          currentDate={currentDate}
          events={events}
          campaigns={campaigns}
          tasks={tasks}
          onCreateTask={onCreateTask}
          onEditTask={onEditTask}
        />
      )}
      {mode === 'day' && (
        <DayCalendar
          currentDate={currentDate}
          events={events}
          campaigns={campaigns}
          tasks={tasks}
          onCreateTask={onCreateTask}
          onEditTask={onEditTask}
        />
      )}
    </section>
  )
}

function effectiveCampaignColor(campaign: CampaignItem, events: EventItem[]) {
  const linkedEvent = events.find((event) => event.id === campaign.eventId)
  return linkedEvent?.color || campaign.color || '#8C919A'
}

function readableTextColor(hexColor: string) {
  const normalized = hexColor.replace('#', '')
  if (normalized.length !== 6) return '#ffffff'

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.64 ? '#202328' : '#ffffff'
}

function itemsForDate(
  date: Date,
  events: EventItem[],
  campaigns: CampaignItem[],
  tasks: TaskItem[],
) {
  const iso = toISODate(date)
  const eventItems = events
    .filter((item) => item.active && item.date === iso)
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: 'event' as const,
      color: item.color || '#8C919A',
      textColor: '#33373d',
    }))

  const campaignItems = campaigns
    .filter((item) => item.active && iso >= item.startDate && iso <= item.endDate)
    .map((item) => {
      const color = effectiveCampaignColor(item, events)

      return {
        id: item.id,
        name: item.name,
        type: 'campaign' as const,
        color,
        textColor: readableTextColor(color),
      }
    })

  const taskItems = tasks
    .filter((item) => item.date === iso)
    .map((item) => ({
      id: item.id,
      name: item.title,
      type: 'task' as const,
      color: item.color || '#6B7280',
      textColor: readableTextColor(item.color || '#6B7280'),
      completed: item.completed,
      task: item,
    }))

  return [...eventItems, ...campaignItems, ...taskItems]
}

function MonthCalendar({
  currentDate,
  events,
  campaigns,
  tasks,
  onCreateTask,
  onEditTask,
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
  tasks: TaskItem[]
  onCreateTask: (date: string) => void
  onEditTask: (task: TaskItem) => void
}) {
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const todayIso = toISODate(new Date())
  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(gridStart, weekIndex * 7 + dayIndex)),
  )

  return (
    <div className="month-calendar">
      <div className="month-calendar-inner">
        <div className="week-header">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="month-weeks">
          {weeks.map((weekDaysList, weekIndex) => {
            const weekStartDate = weekDaysList[0]
            const weekEndDate = weekDaysList[6]

            const campaignRanges = campaigns
              .filter((campaign) => {
                if (!campaign.active || campaign.startDate === campaign.endDate) return false

                const campaignStart = parseDate(campaign.startDate)
                const campaignEnd = parseDate(campaign.endDate)

                return campaignStart <= weekEndDate && campaignEnd >= weekStartDate
              })
              .map((campaign) => {
                const campaignStart = parseDate(campaign.startDate)
                const campaignEnd = parseDate(campaign.endDate)
                const clippedStart = campaignStart < weekStartDate ? weekStartDate : campaignStart
                const clippedEnd = campaignEnd > weekEndDate ? weekEndDate : campaignEnd

                const startCol = Math.round(
                  (startOfDay(clippedStart).getTime() - startOfDay(weekStartDate).getTime()) / 86400000,
                )
                const endCol = Math.round(
                  (startOfDay(clippedEnd).getTime() - startOfDay(weekStartDate).getTime()) / 86400000,
                )

                const color = effectiveCampaignColor(campaign, events)

                return {
                  ...campaign,
                  color,
                  textColor: readableTextColor(color),
                  startCol,
                  endCol,
                  startsBefore: campaignStart < weekStartDate,
                  continuesAfter: campaignEnd > weekEndDate,
                }
              })
              .sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol)

            const laneEnds: number[] = []
            const campaignSegments = campaignRanges.map((campaign) => {
              let lane = laneEnds.findIndex((endCol) => campaign.startCol > endCol)

              if (lane === -1) {
                lane = laneEnds.length
                laneEnds.push(campaign.endCol)
              } else {
                laneEnds[lane] = campaign.endCol
              }

              return { ...campaign, lane }
            })

            const laneCount = laneEnds.length
            const rowHeight = Math.max(112, 112 + Math.max(0, laneCount - 1) * 25)

            return (
              <div
                className="month-week"
                key={`week-${weekIndex}`}
                style={{ minHeight: `${rowHeight}px` }}
              >
                {weekDaysList.map((date) => {
                  const iso = toISODate(date)
                  const isOutside = date.getMonth() !== currentDate.getMonth()

                  const eventItems = events
                    .filter((item) => item.active && item.date === iso)
                    .map((item) => ({
                      id: item.id,
                      name: item.name,
                      type: 'event' as const,
                      color: item.color || '#8C919A',
                      textColor: '#33373d',
                    }))

                  const singleDayCampaignItems = campaigns
                    .filter(
                      (item) =>
                        item.active &&
                        item.startDate === item.endDate &&
                        item.startDate === iso,
                    )
                    .map((item) => {
                      const color = effectiveCampaignColor(item, events)

                      return {
                        id: item.id,
                        name: item.name,
                        type: 'campaign' as const,
                        color,
                        textColor: readableTextColor(color),
                      }
                    })

                  const taskItems = tasks
                    .filter((item) => item.date === iso)
                    .map((item) => ({
                      id: item.id,
                      name: item.title,
                      type: 'task' as const,
                      color: item.color || '#6B7280',
                      textColor: readableTextColor(item.color || '#6B7280'),
                      completed: item.completed,
                      task: item,
                    }))

                  const items = [...eventItems, ...singleDayCampaignItems, ...taskItems]

                  return (
                    <div
                      className={`day-cell ${isOutside ? 'outside' : ''} ${iso === todayIso ? 'today' : ''}`}
                      key={iso}
                    >
                      <div className="day-cell-header">
                        <span className="day-number">{date.getDate()}</span>
                        <button
                          className="day-add-task"
                          type="button"
                          title={`Criar tarefa em ${formatDate(iso)}`}
                          aria-label={`Criar tarefa em ${formatDate(iso)}`}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            onCreateTask(iso)
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div
                        className="calendar-items"
                        style={{ marginTop: laneCount > 0 ? `${8 + laneCount * 25}px` : '5px' }}
                      >
                        {items.slice(0, 3).map((item) => (
                          <div
                            className={`calendar-chip ${item.type}`}
                            key={`${item.type}-${item.id}`}
                            style={
                              item.type === 'campaign'
                                ? {
                                    borderLeftColor: item.color,
                                    background: item.color,
                                    color: item.textColor,
                                  }
                                : item.type === 'task'
                                  ? {
                                      borderLeftColor: item.color,
                                      background: item.color,
                                      color: item.textColor,
                                    }
                                  : { borderLeftColor: item.color }
                            }
                            onClick={
                              item.type === 'task'
                                ? (clickEvent) => {
                                    clickEvent.stopPropagation()
                                    onEditTask(item.task)
                                  }
                                : undefined
                            }
                            role={item.type === 'task' ? 'button' : undefined}
                            title={item.type === 'task' ? 'Editar tarefa' : item.name}
                          >
                            {item.type === 'task' && <CheckSquare2 size={11} />}
                            <span className={item.type === 'task' && item.completed ? 'task-completed' : ''}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                        {items.length > 3 && <small>+{items.length - 3} item(ns)</small>}
                      </div>
                    </div>
                  )
                })}

                {campaignSegments.length > 0 && (
                  <div className="campaign-span-layer" aria-label="Campanhas contínuas">
                    {campaignSegments.map((campaign) => (
                      <div
                        key={`${campaign.id}-${weekIndex}`}
                        className={`campaign-span ${campaign.startsBefore ? 'continues-left' : ''} ${campaign.continuesAfter ? 'continues-right' : ''}`}
                        style={{
                          gridColumn: `${campaign.startCol + 1} / span ${campaign.endCol - campaign.startCol + 1}`,
                          gridRow: campaign.lane + 1,
                          background: campaign.color,
                          borderColor: campaign.color,
                          color: campaign.textColor,
                        }}
                        title={campaign.name}
                      >
                        <span>{campaign.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekCalendar({
  currentDate,
  events,
  campaigns,
  tasks,
  onCreateTask,
  onEditTask,
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
  tasks: TaskItem[]
  onCreateTask: (date: string) => void
  onEditTask: (task: TaskItem) => void
}) {
  const start = startOfWeek(currentDate)
  return (
    <div className="week-calendar">
      {Array.from({ length: 7 }, (_, index) => addDays(start, index)).map((date, index) => {
        const items = itemsForDate(date, events, campaigns, tasks)
        return (
          <div className="week-column" key={toISODate(date)}>
            <header>
              <div>
                <span>{weekDays[index]}</span>
                <strong>{date.getDate()}</strong>
              </div>
              <button
                className="day-add-task"
                type="button"
                title={`Criar tarefa em ${formatDate(toISODate(date))}`}
                onClick={() => onCreateTask(toISODate(date))}
              >
                <Plus size={13} />
              </button>
            </header>
            <div className="week-column-body">
              {items.length === 0 && <small>Sem itens</small>}
              {items.map((item) => (
                <div
                  className={`calendar-chip large ${item.type}`}
                  key={`${item.type}-${item.id}`}
                  style={
                    item.type === 'campaign'
                      ? {
                          borderLeftColor: item.color,
                          background: item.color,
                          color: item.textColor,
                        }
                      : item.type === 'task'
                        ? {
                            borderLeftColor: item.color,
                            background: item.color,
                            color: item.textColor,
                          }
                        : { borderLeftColor: item.color }
                  }
                  onClick={item.type === 'task' ? () => onEditTask(item.task) : undefined}
                  role={item.type === 'task' ? 'button' : undefined}
                >
                  <span
                    style={
                      item.type === 'campaign' || item.type === 'task'
                        ? { color: item.textColor, opacity: 0.82 }
                        : undefined
                    }
                  >
                    {item.type === 'event' ? 'Evento' : item.type === 'campaign' ? 'Campanha' : 'Tarefa'}
                  </span>
                  <span className={item.type === 'task' && item.completed ? 'task-completed' : ''}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayCalendar({
  currentDate,
  events,
  campaigns,
  tasks,
  onCreateTask,
  onEditTask,
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
  tasks: TaskItem[]
  onCreateTask: (date: string) => void
  onEditTask: (task: TaskItem) => void
}) {
  const items = itemsForDate(currentDate, events, campaigns, tasks)
  return (
    <div className="day-calendar">
      <div className="day-calendar-date">
        <button
          className="day-view-add-task"
          type="button"
          onClick={() => onCreateTask(toISODate(currentDate))}
          title="Criar tarefa neste dia"
        >
          <Plus size={16} /> Tarefa
        </button>
        <strong>{currentDate.getDate()}</strong>
        <span>{months[currentDate.getMonth()]}</span>
      </div>
      <div className="day-list">
        {items.length === 0 && (
          <div className="empty-state compact">
            <CalendarDays size={24} />
            <p>Nenhum evento, campanha ou tarefa neste dia.</p>
          </div>
        )}
        {items.map((item) => (
          <article
            key={`${item.type}-${item.id}`}
            style={
              item.type === 'campaign'
                ? {
                    borderLeft: `4px solid ${item.color}`,
                    background: item.color,
                    color: item.textColor,
                  }
                : item.type === 'task'
                  ? {
                      borderLeft: `4px solid ${item.color}`,
                      background: item.color,
                      color: item.textColor,
                    }
                  : { borderLeft: `4px solid ${item.color}` }
            }
            onClick={item.type === 'task' ? () => onEditTask(item.task) : undefined}
            role={item.type === 'task' ? 'button' : undefined}
          >
            <span
              style={
                item.type === 'campaign' || item.type === 'task'
                  ? { color: item.textColor, opacity: 0.82 }
                  : undefined
              }
            >
              {item.type === 'event' ? 'Evento' : item.type === 'campaign' ? 'Campanha' : 'Tarefa'}
            </span>
            <strong className={item.type === 'task' && item.completed ? 'task-completed' : ''}>
              {item.name}
            </strong>
          </article>
        ))}
      </div>
    </div>
  )
}

function EventsPage({
  events,
  search,
  setSearch,
  onEdit,
  onDelete,
  onToggle,
}: {
  events: EventItem[]
  search: string
  setSearch: (value: string) => void
  onEdit: (item: EventItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const filtered = events.filter((item) =>
    `${item.name} ${item.location} ${item.description}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <section className="content-card">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span>{events.filter((item) => item.active).length} ativos</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={30} />
          <h3>Nenhum evento encontrado</h3>
          <p>Crie um evento para começar a alimentar o calendário.</p>
        </div>
      ) : (
        <div className="entity-list">
          {filtered.map((event) => (
            <article key={event.id} className={!event.active ? 'inactive' : ''}>
              <div
                className="date-tile"
                style={{ borderColor: event.color || '#8C919A' }}
              >
                <strong>{parseDate(event.date).getDate()}</strong>
                <span>{months[parseDate(event.date).getMonth()].slice(0, 3)}</span>
              </div>
              <div className="entity-main">
                <div className="entity-heading">
                  <span
                    className="event-color-dot"
                    style={{ background: event.color || '#8C919A' }}
                    title="Cor do evento"
                  />
                  <h3>{event.name}</h3>
                  <span className={`status-pill ${event.active ? 'active' : ''}`}>
                    {event.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p>{event.description || 'Sem descrição.'}</p>
                <div className="entity-meta">
                  <span>{formatDate(event.date)} • {event.time || 'Sem horário'}</span>
                  <span>{event.location || 'Local não informado'}</span>
                  <span>{event.ticketsSold}/{event.ticketsCapacity || '—'} ingressos</span>
                </div>
              </div>
              <div className="entity-actions">
                <button className="icon-button" title="Ativar/desativar" onClick={() => onToggle(event.id)}>
                  <Power size={17} />
                </button>
                <button className="icon-button" title="Editar" onClick={() => onEdit(event)}>
                  <Pencil size={17} />
                </button>
                <button className="icon-button danger" title="Excluir" onClick={() => onDelete(event.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function CampaignsPage({
  campaigns,
  events,
  search,
  setSearch,
  onEdit,
  onDelete,
  onToggle,
}: {
  campaigns: CampaignItem[]
  events: EventItem[]
  search: string
  setSearch: (value: string) => void
  onEdit: (item: CampaignItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const filtered = campaigns.filter((item) =>
    `${item.name} ${item.channel} ${item.goal} ${item.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <section className="content-card">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar campanhas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span>{campaigns.filter((item) => item.active).length} ativas</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Megaphone size={30} />
          <h3>Nenhuma campanha encontrada</h3>
          <p>Cadastre campanhas com início, fim, objetivo e canal.</p>
        </div>
      ) : (
        <div className="entity-list campaign-list">
          {filtered.map((campaign) => {
            const linkedEvent = events.find((item) => item.id === campaign.eventId)
            const displayColor = linkedEvent?.color || campaign.color || '#8C919A'

            return (
              <article
                key={campaign.id}
                className={!campaign.active ? 'inactive' : ''}
                style={{ borderLeft: `4px solid ${displayColor}` }}
              >
                <div
                  className="campaign-icon"
                  style={{
                    borderColor: displayColor,
                    color: displayColor,
                    background: `${displayColor}12`,
                  }}
                >
                  <Megaphone size={21} />
                </div>
                <div className="entity-main">
                  <div className="entity-heading">
                    <span
                      className="campaign-color-dot"
                      style={{ background: displayColor }}
                      title={linkedEvent ? `Cor herdada de ${linkedEvent.name}` : 'Cor da campanha'}
                    />
                    <h3>{campaign.name}</h3>
                    <span className={`status-pill ${campaign.active ? 'active' : ''}`}>
                      {campaign.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p>{campaign.description || 'Sem descrição.'}</p>
                  <div className="entity-meta">
                    <span>{formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}</span>
                    <span>{campaign.channel || 'Canal não informado'}</span>
                    <span>{linkedEvent ? `Evento: ${linkedEvent.name}` : 'Sem evento vinculado'}</span>
                  </div>
                  {campaign.goal && <div className="goal-line"><b>Objetivo:</b> {campaign.goal}</div>}
                </div>
                <div className="entity-actions">
                  <button className="icon-button" title="Ativar/desativar" onClick={() => onToggle(campaign.id)}>
                    <Power size={17} />
                  </button>
                  <button className="icon-button" title="Editar" onClick={() => onEdit(campaign)}>
                    <Pencil size={17} />
                  </button>
                  <button className="icon-button danger" title="Excluir" onClick={() => onDelete(campaign.id)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}


function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0)
}

function productTypeLabel(type: ProductType) {
  if (type === 'digital') return 'Produto digital'
  if (type === 'live') return 'Live'
  return 'Evento'
}

function ProductsPage({
  products,
  search,
  setSearch,
  onEdit,
  onDelete,
}: {
  products: ProductItem[]
  search: string
  setSearch: (value: string) => void
  onEdit: (item: ProductItem) => void
  onDelete: (id: string) => void
}) {
  const filtered = products.filter((item) =>
    `${item.name} ${productTypeLabel(item.type)}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <section className="content-card products-section">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span>{products.length} produto(s)</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package2 size={30} />
          <h3>Nenhum produto cadastrado</h3>
          <p>Cadastre eventos, lives e produtos digitais para manter sua oferta organizada.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <Package2 size={30} />
                )}
              </div>

              <div className="product-card-body">
                <span className="product-type-pill">{productTypeLabel(product.type)}</span>
                <h3>{product.name}</h3>

                {!product.hasLots ? (
                  <strong className="product-price">{formatCurrency(product.value)}</strong>
                ) : (
                  <div className="product-lots-preview">
                    {product.lots.length === 0 ? (
                      <small>Nenhum lote cadastrado.</small>
                    ) : (
                      product.lots.map((lot) => (
                        <div key={lot.id}>
                          <span>{lot.name}</span>
                          <b>{formatCurrency(lot.price)}</b>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="product-card-actions">
                <button className="icon-button" title="Editar produto" onClick={() => onEdit(product)}>
                  <Pencil size={17} />
                </button>
                <button className="icon-button danger" title="Excluir produto" onClick={() => onDelete(product.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">CADASTRO</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

type EventFormState = Omit<EventItem, 'id' | 'ticketsSold' | 'ticketsCapacity'> & {
  ticketsSold: number | ''
  ticketsCapacity: number | ''
}

function EventModal({
  value,
  onClose,
  onSave,
}: {
  value: EventItem | null
  onClose: () => void
  onSave: (data: Omit<EventItem, 'id'>) => void
}) {
  const [form, setForm] = useState<EventFormState>({
    ...emptyEvent,
    ticketsSold: '',
    ticketsCapacity: '',
  })

  useEffect(() => {
    if (value) {
      const { id: _id, ...rest } = value
      setForm({
        ...rest,
        color: rest.color || '#8C919A',
      })
    } else {
      setForm({
        ...emptyEvent,
        ticketsSold: '',
        ticketsCapacity: '',
      })
    }
  }, [value])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim() || !form.date) return
    onSave({
      ...form,
      ticketsSold: Math.max(0, Number(form.ticketsSold) || 0),
      ticketsCapacity: Math.max(0, Number(form.ticketsCapacity) || 0),
    })
  }

  return (
    <Modal
      title={value ? 'Editar evento' : 'Novo evento'}
      subtitle="Cadastre o evento e os números que aparecem na visão geral."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="full">
          Nome do evento
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: Summit de Dezembro"
          />
        </label>
        <label>
          Data
          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </label>
        <label>
          Horário
          <input
            type="time"
            value={form.time}
            onChange={(event) => setForm({ ...form, time: event.target.value })}
          />
        </label>
        <label>
          Formato do evento
          <select value={form.eventType||'online'} onChange={(event) => setForm({...form,eventType:event.target.value as 'online' | 'presencial'})}>
            <option value="online">Online / Live</option>
            <option value="presencial">Presencial</option>
          </select>
        </label>
        <label className="full">
          Local
          <input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="Ex.: Cuiabá - MT"
          />
        </label>
        <label>
          Ingressos vendidos
          <input
            type="number"
            min="0"
            value={form.ticketsSold}
            onChange={(event) =>
              setForm({
                ...form,
                ticketsSold: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          Capacidade / meta
          <input
            type="number"
            min="0"
            value={form.ticketsCapacity}
            onChange={(event) =>
              setForm({
                ...form,
                ticketsCapacity: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
        </label>
        <label className="full">
          Cor do evento
          <div className="color-picker-row">
            <input
              className="color-input"
              type="color"
              value={form.color || '#8C919A'}
              onChange={(event) => setForm({ ...form, color: event.target.value })}
              aria-label="Escolher cor do evento"
            />
            <div className="color-presets">
              {['#8C919A', '#3B82F6', '#D97945', '#9674C3', '#2E8B57', '#D94B4B'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm({ ...form, color })}
                  title={color}
                  aria-label={`Usar cor ${color}`}
                />
              ))}
            </div>
            <span className="color-value">{(form.color || '#8C919A').toUpperCase()}</span>
          </div>
        </label>
        <label className="full">
          Descrição
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Objetivo, público, observações..."
          />
        </label>
        <label className="switch-row full">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          <span>Evento ativo</span>
        </label>
        <div className="modal-actions full">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button">Salvar evento</button>
        </div>
      </form>
    </Modal>
  )
}

function CampaignModal({
  value,
  events,
  onClose,
  onSave,
}: {
  value: CampaignItem | null
  events: EventItem[]
  onClose: () => void
  onSave: (data: Omit<CampaignItem, 'id'>) => void
}) {
  const [form, setForm] = useState<Omit<CampaignItem, 'id'>>(emptyCampaign)

  useEffect(() => {
    if (value) {
      const { id: _id, ...rest } = value
      setForm({
        ...rest,
        color: rest.color || '#8C919A',
      })
    } else {
      setForm(emptyCampaign)
    }
  }, [value])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim() || !form.startDate || !form.endDate) return
    onSave(form)
  }

  return (
    <Modal
      title={value ? 'Editar campanha' : 'Nova campanha'}
      subtitle="Organize o período, objetivo, canal e vínculo com um evento."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="full">
          Nome da campanha
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: Aquecimento RPM"
          />
        </label>
        <label>
          Início
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />
        </label>
        <label>
          Prazo final
          <input
            type="date"
            required
            min={form.startDate}
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
        </label>
        <label>
          Canal
          <select
            value={form.channel}
            onChange={(event) => setForm({ ...form, channel: event.target.value })}
          >
            <option>Instagram</option>
            <option>Meta Ads</option>
            <option>WhatsApp</option>
            <option>E-mail</option>
            <option>Presencial</option>
            <option>Outro</option>
          </select>
        </label>
        <label>
          Evento vinculado
          <select
            value={form.eventId}
            onChange={(event) => setForm({ ...form, eventId: event.target.value })}
          >
            <option value="">Nenhum</option>
            {events.map((event) => (
              <option value={event.id} key={event.id}>{event.name}</option>
            ))}
          </select>
        </label>

        {form.eventId ? (
          <div className="campaign-color-inherited full">
            {(() => {
              const linkedEvent = events.find((event) => event.id === form.eventId)
              const inheritedColor = linkedEvent?.color || '#8C919A'

              return (
                <>
                  <span
                    className="campaign-color-preview"
                    style={{ background: inheritedColor }}
                  />
                  <div>
                    <strong>Cor herdada do evento</strong>
                    <small>
                      Esta campanha seguirá automaticamente a cor de {linkedEvent?.name || 'evento selecionado'}.
                    </small>
                  </div>
                </>
              )
            })()}
          </div>
        ) : (
          <label className="full">
            Cor da campanha
            <div className="color-picker-row">
              <input
                className="color-input"
                type="color"
                value={form.color || '#8C919A'}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                aria-label="Escolher cor da campanha"
              />
              <div className="color-presets">
                {['#8C919A', '#3B82F6', '#D97945', '#9674C3', '#2E8B57', '#D94B4B'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-preset ${form.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setForm({ ...form, color })}
                    title={color}
                    aria-label={`Usar cor ${color}`}
                  />
                ))}
              </div>
              <span className="color-value">{(form.color || '#8C919A').toUpperCase()}</span>
            </div>
          </label>
        )}

        <label className="full">
          Objetivo
          <input
            value={form.goal}
            onChange={(event) => setForm({ ...form, goal: event.target.value })}
            placeholder="Ex.: gerar 50 vendas até o evento"
          />
        </label>
        <label className="full">
          Descrição
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Estratégia, peças, responsáveis, observações..."
          />
        </label>
        <label className="switch-row full">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          <span>Campanha ativa</span>
        </label>
        <div className="modal-actions full">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button">Salvar campanha</button>
        </div>
      </form>
    </Modal>
  )
}


type ProductFormState = Omit<ProductItem, 'id' | 'value' | 'lots'> & {
  value: number | ''
  lots: Array<Omit<ProductLot, 'price'> & { price: number | '' }>
}

async function prepareProductImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })

  const maxSize = 900
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))

  const context = canvas.getContext('2d')
  if (!context) return dataUrl

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

function ProductModal({
  value,
  onClose,
  onSave,
}: {
  value: ProductItem | null
  onClose: () => void
  onSave: (data: Omit<ProductItem, 'id'>) => void
}) {
  const [form, setForm] = useState<ProductFormState>({
    ...emptyProduct,
    value: '',
    lots: [],
  })
  const [imageLoading, setImageLoading] = useState(false)

  useEffect(() => {
    if (value) {
      const { id: _id, ...rest } = value
      setForm({
        ...rest,
        value: rest.value,
        lots: (rest.lots || []).map((lot) => ({ ...lot, price: lot.price })),
      })
    } else {
      setForm({
        ...emptyProduct,
        value: '',
        lots: [],
      })
    }
  }, [value])

  function addLot() {
    setForm((current) => ({
      ...current,
      lots: [
        ...current.lots,
        {
          id: uid(),
          name: `Lote ${current.lots.length + 1}`,
          price: '',
        },
      ],
    }))
  }

  function updateLot(id: string, patch: Partial<{ name: string; price: number | '' }>) {
    setForm((current) => ({
      ...current,
      lots: current.lots.map((lot) => (lot.id === id ? { ...lot, ...patch } : lot)),
    }))
  }

  function removeLot(id: string) {
    setForm((current) => ({
      ...current,
      lots: current.lots.filter((lot) => lot.id !== id),
    }))
  }

  async function handleImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) return

    setImageLoading(true)
    try {
      const image = await prepareProductImage(file)
      setForm((current) => ({ ...current, image }))
    } finally {
      setImageLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) return

    onSave({
      ...form,
      value: Math.max(0, Number(form.value) || 0),
      lots: form.lots.map((lot, index) => ({
        id: lot.id || uid(),
        name: lot.name.trim() || `Lote ${index + 1}`,
        price: Math.max(0, Number(lot.price) || 0),
      })),
    })
  }

  return (
    <Modal
      title={value ? 'Editar produto' : 'Novo produto'}
      subtitle="Cadastre a oferta, o tipo, a imagem e os valores."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="full">
          Foto
          <div className="product-upload-row">
            <div className="product-upload-preview">
              {form.image ? <img src={form.image} alt="Prévia do produto" /> : <Package2 size={25} />}
            </div>
            <div className="product-upload-controls">
              <label className="secondary-button product-upload-button">
                {imageLoading ? 'Processando...' : form.image ? 'Trocar foto' : 'Adicionar foto'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={imageLoading}
                  onChange={(event) => void handleImage(event.target.files?.[0])}
                />
              </label>
              {form.image && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setForm({ ...form, image: '' })}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </label>

        <label className="full">
          Nome do produto
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: RPM Summit"
          />
        </label>

        <label>
          Tipo
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as ProductType })}
          >
            <option value="event">Evento</option>
            <option value="live">Live</option>
            <option value="digital">Produto digital</option>
          </select>
        </label>

        <label>
          Valor
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.value}
            onChange={(event) =>
              setForm({
                ...form,
                value: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
            placeholder="0,00"
          />
        </label>

        <label className="switch-row full product-lot-switch">
          <input
            type="checkbox"
            checked={form.hasLots}
            onChange={(event) => {
              const enabled = event.target.checked
              setForm({
                ...form,
                hasLots: enabled,
                lots:
                  enabled && form.lots.length === 0
                    ? [{ id: uid(), name: 'Lote 1', price: '' }]
                    : form.lots,
              })
            }}
          />
          <span>Este produto possui lotes</span>
        </label>

        {form.hasLots && (
          <div className="full product-lots-editor">
            <div className="product-lots-header">
              <div>
                <strong>Lotes e preços</strong>
                <small>Defina os valores de cada lote deste produto.</small>
              </div>
              <button type="button" className="secondary-button" onClick={addLot}>
                <Plus size={15} /> Adicionar lote
              </button>
            </div>

            <div className="product-lot-rows">
              {form.lots.map((lot, index) => (
                <div className="product-lot-row" key={lot.id}>
                  <input
                    value={lot.name}
                    onChange={(event) => updateLot(lot.id, { name: event.target.value })}
                    placeholder={`Lote ${index + 1}`}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lot.price}
                    onChange={(event) =>
                      updateLot(lot.id, {
                        price: event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                    placeholder="Preço"
                  />
                  <button
                    type="button"
                    className="icon-button danger"
                    title="Remover lote"
                    onClick={() => removeLot(lot.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions full">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={imageLoading}>Salvar produto</button>
        </div>
      </form>
    </Modal>
  )
}

function TaskModal({
  value,
  initialDate,
  onClose,
  onSave,
  onDelete,
}: {
  value: TaskItem | null
  initialDate: string
  onClose: () => void
  onSave: (data: Omit<TaskItem, 'id'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<Omit<TaskItem, 'id'>>({
    ...emptyTask,
    date: initialDate,
  })

  useEffect(() => {
    if (value) {
      const { id: _id, ...rest } = value
      setForm({
        ...rest,
        color: rest.color || '#6B7280',
      })
    } else {
      setForm({
        ...emptyTask,
        date: initialDate,
      })
    }
  }, [value, initialDate])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSave(form)
  }

  return (
    <Modal
      title={value ? 'Editar tarefa' : 'Nova tarefa'}
      subtitle={`Tarefa do dia ${formatDate(form.date || initialDate)}.`}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="full">
          Tarefa
          <input
            required
            autoFocus
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Ex.: revisar criativos da campanha"
          />
        </label>

        <label>
          Data
          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </label>

        <label className="task-status-field">
          Status
          <label className="switch-row task-complete-toggle">
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(event) => setForm({ ...form, completed: event.target.checked })}
            />
            <span>Concluída</span>
          </label>
        </label>

        <label className="full">
          Cor da tarefa
          <div className="color-picker-row">
            <input
              className="color-input"
              type="color"
              value={form.color || '#6B7280'}
              onChange={(event) => setForm({ ...form, color: event.target.value })}
              aria-label="Escolher cor da tarefa"
            />
            <div className="color-presets">
              {['#6B7280', '#3B82F6', '#D97945', '#9674C3', '#2E8B57', '#D94B4B', '#D4A24C', '#19A7AE'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm({ ...form, color })}
                  title={color}
                  aria-label={`Usar cor ${color}`}
                />
              ))}
            </div>
            <span className="color-value">{(form.color || '#6B7280').toUpperCase()}</span>
          </div>
        </label>

        <label className="full">
          Descrição
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Detalhes, contexto ou observações da tarefa..."
          />
        </label>

        <div className="modal-actions full task-modal-actions">
          {onDelete && (
            <button type="button" className="secondary-button task-delete-button" onClick={onDelete}>
              <Trash2 size={16} /> Excluir
            </button>
          )}
          <span className="task-actions-spacer" />
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button">Salvar tarefa</button>
        </div>
      </form>
    </Modal>
  )
}

export default App
