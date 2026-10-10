import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Power,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'

type Page = 'dashboard' | 'events' | 'campaigns'
type CalendarMode = 'month' | 'week' | 'day'

type EventItem = {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  ticketsSold: number
  ticketsCapacity: number
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
  active: boolean
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
  name: '',
  date: toISODate(new Date()),
  time: '19:00',
  location: '',
  description: '',
  ticketsSold: 0,
  ticketsCapacity: 0,
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
  active: true,
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [events, setEvents] = useStoredState<EventItem[]>('strategy-events', [])
  const [campaigns, setCampaigns] = useStoredState<CampaignItem[]>('strategy-campaigns', [])
  const [eventModal, setEventModal] = useState(false)
  const [campaignModal, setCampaignModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null)
  const [search, setSearch] = useState('')

  const activeEvents = useMemo(
    () => events.filter((item) => item.active).sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )
  const activeCampaigns = campaigns.filter((item) => item.active)

  const nearestEvent =
    activeEvents.find((item) => daysUntil(item.date) >= 0) ?? activeEvents[0] ?? null

  function openEvent(item?: EventItem) {
    setEditingEvent(item ?? null)
    setEventModal(true)
  }

  function openCampaign(item?: CampaignItem) {
    setEditingCampaign(item ?? null)
    setCampaignModal(true)
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
          <button
            className={page === 'events' ? 'active' : ''}
            onClick={() => setPage('events')}
          >
            <CalendarDays size={19} />
            {!collapsed && <span>Eventos</span>}
          </button>
          <button
            className={page === 'campaigns' ? 'active' : ''}
            onClick={() => setPage('campaigns')}
          >
            <Megaphone size={19} />
            {!collapsed && <span>Campanhas</span>}
          </button>
        </nav>

        {!collapsed && (
          <div className="sidebar-footer">
            <span>MVP</span>
            <p>Dados salvos neste navegador.</p>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">GESTÃO ESTRATÉGICA</span>
            <h1>
              {page === 'dashboard' && 'Calendário estratégico'}
              {page === 'events' && 'Eventos'}
              {page === 'campaigns' && 'Campanhas'}
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
          </div>
        </header>

        {page === 'dashboard' && (
          <Dashboard
            events={events}
            campaigns={campaigns}
            nearestEvent={nearestEvent}
            activeEvents={activeEvents}
            activeCampaigns={activeCampaigns}
            onCreateEvent={() => openEvent()}
            onCreateCampaign={() => openCampaign()}
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
    </div>
  )
}

function Dashboard({
  events,
  campaigns,
  nearestEvent,
  activeEvents,
  activeCampaigns,
  onCreateEvent,
  onCreateCampaign,
}: {
  events: EventItem[]
  campaigns: CampaignItem[]
  nearestEvent: EventItem | null
  activeEvents: EventItem[]
  activeCampaigns: CampaignItem[]
  onCreateEvent: () => void
  onCreateCampaign: () => void
}) {
  const [mode, setMode] = useState<CalendarMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const countdown = nearestEvent ? daysUntil(nearestEvent.date) : null

  return (
    <div className="dashboard-stack">
      <section className="stats-grid">
        <article className="stat-card featured">
          <span>Próximo evento</span>
          <strong>{nearestEvent?.name ?? 'Nenhum evento ativo'}</strong>
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
            <small>{nearestEvent ? formatDate(nearestEvent.date) : 'Crie o primeiro evento'}</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Ticket size={20} /></div>
          <span>Ingressos vendidos</span>
          <strong>
            {nearestEvent
              ? `${nearestEvent.ticketsSold}/${nearestEvent.ticketsCapacity || '—'}`
              : '—'}
          </strong>
          <small>{nearestEvent?.name ?? 'Sem evento ativo'}</small>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><Megaphone size={20} /></div>
          <span>Campanhas ativas</span>
          <strong>{activeCampaigns.length}</strong>
          <small>{campaigns.length} campanha(s) cadastrada(s)</small>
        </article>
      </section>

      {activeEvents.length > 0 && (
        <section className="event-strip">
          {activeEvents.slice(0, 4).map((event) => {
            const left = daysUntil(event.date)
            return (
              <article key={event.id}>
                <div>
                  <span className="status-dot" />
                  <strong>{event.name}</strong>
                </div>
                <p>{formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}</p>
                <b>{left === 0 ? 'Hoje' : left > 0 ? `Faltam ${left} dias` : 'Evento passado'}</b>
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
        mode={mode}
        setMode={setMode}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
      />
    </div>
  )
}

function CalendarPanel({
  events,
  campaigns,
  mode,
  setMode,
  currentDate,
  setCurrentDate,
}: {
  events: EventItem[]
  campaigns: CampaignItem[]
  mode: CalendarMode
  setMode: (mode: CalendarMode) => void
  currentDate: Date
  setCurrentDate: (date: Date) => void
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
        <MonthCalendar currentDate={currentDate} events={events} campaigns={campaigns} />
      )}
      {mode === 'week' && (
        <WeekCalendar currentDate={currentDate} events={events} campaigns={campaigns} />
      )}
      {mode === 'day' && (
        <DayCalendar currentDate={currentDate} events={events} campaigns={campaigns} />
      )}
    </section>
  )
}

function itemsForDate(date: Date, events: EventItem[], campaigns: CampaignItem[]) {
  const iso = toISODate(date)
  const eventItems = events
    .filter((item) => item.active && item.date === iso)
    .map((item) => ({ id: item.id, name: item.name, type: 'event' as const }))

  const campaignItems = campaigns
    .filter((item) => item.active && iso >= item.startDate && iso <= item.endDate)
    .map((item) => ({ id: item.id, name: item.name, type: 'campaign' as const }))

  return [...eventItems, ...campaignItems]
}

function MonthCalendar({
  currentDate,
  events,
  campaigns,
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
}) {
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  const todayIso = toISODate(new Date())

  return (
    <div className="month-calendar">
      <div className="week-header">
        {weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="month-grid">
        {days.map((date) => {
          const items = itemsForDate(date, events, campaigns)
          const isOutside = date.getMonth() !== currentDate.getMonth()
          const iso = toISODate(date)
          return (
            <div
              className={`day-cell ${isOutside ? 'outside' : ''} ${iso === todayIso ? 'today' : ''}`}
              key={iso}
            >
              <span className="day-number">{date.getDate()}</span>
              <div className="calendar-items">
                {items.slice(0, 3).map((item) => (
                  <div className={`calendar-chip ${item.type}`} key={`${item.type}-${item.id}`}>
                    {item.name}
                  </div>
                ))}
                {items.length > 3 && <small>+{items.length - 3} item(ns)</small>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekCalendar({
  currentDate,
  events,
  campaigns,
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
}) {
  const start = startOfWeek(currentDate)
  return (
    <div className="week-calendar">
      {Array.from({ length: 7 }, (_, index) => addDays(start, index)).map((date, index) => {
        const items = itemsForDate(date, events, campaigns)
        return (
          <div className="week-column" key={toISODate(date)}>
            <header>
              <span>{weekDays[index]}</span>
              <strong>{date.getDate()}</strong>
            </header>
            <div className="week-column-body">
              {items.length === 0 && <small>Sem itens</small>}
              {items.map((item) => (
                <div className={`calendar-chip large ${item.type}`} key={`${item.type}-${item.id}`}>
                  <span>{item.type === 'event' ? 'Evento' : 'Campanha'}</span>
                  {item.name}
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
}: {
  currentDate: Date
  events: EventItem[]
  campaigns: CampaignItem[]
}) {
  const items = itemsForDate(currentDate, events, campaigns)
  return (
    <div className="day-calendar">
      <div className="day-calendar-date">
        <strong>{currentDate.getDate()}</strong>
        <span>{months[currentDate.getMonth()]}</span>
      </div>
      <div className="day-list">
        {items.length === 0 && (
          <div className="empty-state compact">
            <CalendarDays size={24} />
            <p>Nenhum evento ou campanha neste dia.</p>
          </div>
        )}
        {items.map((item) => (
          <article key={`${item.type}-${item.id}`}>
            <span>{item.type === 'event' ? 'Evento' : 'Campanha'}</span>
            <strong>{item.name}</strong>
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
              <div className="date-tile">
                <strong>{parseDate(event.date).getDate()}</strong>
                <span>{months[parseDate(event.date).getMonth()].slice(0, 3)}</span>
              </div>
              <div className="entity-main">
                <div className="entity-heading">
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
            return (
              <article key={campaign.id} className={!campaign.active ? 'inactive' : ''}>
                <div className="campaign-icon"><Megaphone size={21} /></div>
                <div className="entity-main">
                  <div className="entity-heading">
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

function EventModal({
  value,
  onClose,
  onSave,
}: {
  value: EventItem | null
  onClose: () => void
  onSave: (data: Omit<EventItem, 'id'>) => void
}) {
  const [form, setForm] = useState<Omit<EventItem, 'id'>>(emptyEvent)

  useEffect(() => {
    if (value) {
      const { id: _id, ...rest } = value
      setForm(rest)
    } else {
      setForm(emptyEvent)
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
            onChange={(event) => setForm({ ...form, ticketsSold: Number(event.target.value) })}
          />
        </label>
        <label>
          Capacidade / meta
          <input
            type="number"
            min="0"
            value={form.ticketsCapacity}
            onChange={(event) => setForm({ ...form, ticketsCapacity: Number(event.target.value) })}
          />
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
      setForm(rest)
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

export default App
