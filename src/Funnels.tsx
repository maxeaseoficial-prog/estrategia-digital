import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Copy, GitBranch, MessageSquareText, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import './funnels.css'
import FunnelCanvas, { type CanvasLink, type CanvasStep } from './FunnelCanvas'

type Message = { id: string; title: string; channel: string; trigger: string; body: string }
type Step = { id: string; title: string; detail: string; kind: string; color: string; messages: Message[]; owner?:string; status?:string; dueDate?:string; url?:string; position?:{x:number;y:number} }
type Funnel = { id: string; name: string; description: string; status: string; campaignId: string; createdAt: string; steps: Step[]; links?:CanvasLink[] }
type Campaign = { id: string; name: string }
const STORAGE = 'strategy-campaign-funnels-v1'
const colors = ['#9674C3', '#7856A8', '#EAB308', '#3B82F6', '#16A34A', '#EF4444', '#64748B', '#111827']
const id = () => crypto.randomUUID()
function read(): Funnel[] { try { const value = JSON.parse(localStorage.getItem(STORAGE) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
const MODEL_TEMPLATES = [
  {title:'Anúncio Meta Ads',color:'#2563EB',detail:'Atrair novos leads com anúncios segmentados.'},
  {title:'Conteúdo orgânico',color:'#0891B2',detail:'Atrair a audiência por publicações e conteúdo.'},
  {title:'Live',color:'#7C3AED',detail:'Gerar conexão, autoridade e apresentar o próximo passo ao vivo.'},
  {title:'Pitch e CTA',color:'#C026D3',detail:'Apresentar o convite e orientar o público para a próxima ação.'},
  {title:'Landing page',color:'#4F46E5',detail:'Apresentar a proposta e levar visitantes à conversão.'},
  {title:'Formulário / diagnóstico',color:'#D97706',detail:'Capturar e qualificar o contato com perguntas estratégicas.'},
  {title:'Recuperação de formulário',color:'#DC2626',detail:'Reengajar contatos identificados que não concluíram o formulário.'},
  {title:'Página de vendas',color:'#0D9488',detail:'Explicar a oferta, benefícios e condições da compra.'},
  {title:'Checkout',color:'#0284C7',detail:'Concluir a compra com formas de pagamento claras.'},
  {title:'Abandono de checkout',color:'#E11D48',detail:'Recuperar interessados que iniciaram o pagamento sem concluir.'},
  {title:'Follow-up WhatsApp',color:'#16A34A',detail:'Enviar acompanhamento contextualizado com prazo e gatilho.'},
  {title:'Boas-vindas WhatsApp',color:'#65A30D',detail:'Confirmar inscrição e orientar o contato sobre o próximo passo.'},
  {title:'Aquecimento / nutrição',color:'#CA8A04',detail:'Manter o interesse com conteúdos e preparação para o evento.'},
  {title:'Lembrete de evento',color:'#EA580C',detail:'Lembrar o participante da data, horário e link de acesso.'},
  {title:'Lead ausente na live',color:'#B45309',detail:'Reengajar inscritos que não participaram da transmissão.'},
  {title:'Remarketing',color:'#1D4ED8',detail:'Impactar novamente públicos que interagiram, mas não avançaram.'},
  {title:'Oferta / pitch de vendas',color:'#9333EA',detail:'Apresentar a oferta e levar o lead à decisão de compra.'},
  {title:'Confirmação de compra',color:'#059669',detail:'Confirmar pagamento e iniciar a jornada pós-venda.'},
  {title:'Pós-venda',color:'#475569',detail:'Organizar orientações, relacionamento e próximas entregas.'},
  {title:'Pesquisa / feedback',color:'#BE185D',detail:'Coletar avaliações e identificar oportunidades de melhoria.'},
  {title:'Decisão / condição',color:'#A16207',detail:'Separar caminhos conforme ações ou respostas do lead.'},
  {title:'Etapa personalizada',color:'#64748B',detail:'Descreva o objetivo e a ação desta etapa.'},
] as const
const templateByTitle = (title:string) => MODEL_TEMPLATES.find(t=>t.title===title)

const newStep = (): Step => ({ id:id(), title:'Nova etapa', detail:'Descreva o objetivo e a ação desta etapa.', kind:'Etapa personalizada', color:'#64748B', messages:[] })
const newMessage = (): Message => ({ id:id(), title:'Nova mensagem', channel:'WhatsApp', trigger:'Após a etapa', body:'' })

export default function Funnels({ campaigns }: { campaigns: Campaign[] }) {
  const [funnels, setFunnels] = useState<Funnel[]>(read)
  const undoStack = useRef<Record<string,Funnel[]>>({})
  const redoStack = useRef<Record<string,Funnel[]>>({})
  const [,setHistoryVersion] = useState(0)
  const [selected, setSelected] = useState<string | null>(() => {
    try { return window.sessionStorage.getItem('strategy-open-funnel') || null } catch { return null }
  })
  useEffect(() => {
    try {
      if (selected && funnels.some(f => f.id === selected)) window.sessionStorage.setItem('strategy-open-funnel',selected)
      else window.sessionStorage.removeItem('strategy-open-funnel')
    } catch { /* storage unavailable */ }
  }, [selected,funnels])
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [modelMenuOpen,setModelMenuOpen] = useState(false)
  const [modelSearch,setModelSearch] = useState('')
  const [messageId, setMessageId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [newFunnel, setNewFunnel] = useState(false)
  const [pendingDelete,setPendingDelete] = useState<{kind:'step'|'funnel';id:string;name:string}|null>(null)
  const [draft, setDraft] = useState({ name:'', description:'', campaignId:'' })
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(funnels)) }, [funnels])
  const funnel = funnels.find(f => f.id === selected)
  const step = funnel?.steps.find(s => s.id === activeStep)
  const message = step?.messages.find(m => m.id === messageId)
  const commitFunnel = (fn:(f:Funnel)=>Funnel) => {
    if(!selected)return
    setFunnels(previous=>previous.map(f=>{
      if(f.id!==selected)return f
      const next=fn(f)
      if(JSON.stringify(next)===JSON.stringify(f))return f
      undoStack.current[selected]=[...(undoStack.current[selected]||[]).slice(-49),structuredClone(f)]
      redoStack.current[selected]=[]
      setHistoryVersion(v=>v+1)
      return next
    }))
  }
  const patch = commitFunnel
  const undo = () => {
    if(!selected)return
    const stack=undoStack.current[selected]
    if(!stack?.length)return
    const previous=stack.pop()!
    setFunnels(items=>items.map(f=>{
      if(f.id!==selected)return f
      redoStack.current[selected]=[...(redoStack.current[selected]||[]),structuredClone(f)]
      return previous
    }))
    setHistoryVersion(v=>v+1)
  }
  const redo = () => {
    if(!selected)return
    const stack=redoStack.current[selected]
    if(!stack?.length)return
    const next=stack.pop()!
    setFunnels(items=>items.map(f=>{
      if(f.id!==selected)return f
      undoStack.current[selected]=[...(undoStack.current[selected]||[]),structuredClone(f)]
      return next
    }))
    setHistoryVersion(v=>v+1)
  }
  useEffect(()=>{
    if(!selected)return
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null
      if(target?.closest('input, textarea, select, [contenteditable="true"]'))return
      if(!(event.metaKey||event.ctrlKey)||event.altKey||event.key.toLowerCase()!=='z')return
      event.preventDefault()
      if(event.shiftKey)redo()
      else undo()
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  })
  const patchStep = (fn:(s:Step)=>Step) => patch(f => ({ ...f, steps:f.steps.map(s => s.id === activeStep ? fn(s) : s) }))
  const patchMessage = (fn:(m:Message)=>Message) => patchStep(s => ({ ...s, messages:s.messages.map(m => m.id === messageId ? fn(m) : m) }))
  const templates = MODEL_TEMPLATES
  const insertStep = (data?:{title:string;color:string;detail:string}) => { const last=funnel?.steps[funnel.steps.length-1];const index=funnel?.steps.length||0;const lastPosition=last?.position|| (last?{x:70+((index-1)%4)*325,y:80+Math.floor((index-1)/4)*255}:null);const position=lastPosition?{x:lastPosition.x+325,y:lastPosition.y}:{x:80,y:90};const s={...newStep(),...(data?{...data,kind:data.title}:{}),position};patch(f=>({...f,steps:[...f.steps,s]}));setActiveStep(s.id);setMessageId(null);setTemplatesOpen(false) }
  const updateMap = (positions:CanvasStep[], links:CanvasLink[]) => patch(f=>({...f,steps:f.steps.map(step=>({...step,position:positions.find(p=>p.id===step.id)?.position||step.position})),links}))
  const deleteCanvasStep = (stepId:string) => { const item=funnel?.steps.find(s=>s.id===stepId);if(item)setPendingDelete({kind:'step',id:stepId,name:item.title}) }
  const confirmDeletion = () => {
    if(!pendingDelete)return
    if(pendingDelete.kind==='funnel'){
      setFunnels(old=>old.filter(f=>f.id!==pendingDelete.id))
      if(selected===pendingDelete.id){setSelected(null);setActiveStep(null);setFullscreen(false)}
    }else{
      const deletedId=pendingDelete.id
      patch(f=>({...f,steps:f.steps.filter(s=>s.id!==deletedId),links:(f.links||[]).filter(l=>l.source!==deletedId&&l.target!==deletedId)}))
      if(activeStep===deletedId){setActiveStep(null);setMessageId(null)}
    }
    setPendingDelete(null)
  }
  const addFunnel = () => {
    if (!draft.name.trim()) return
    const f:Funnel = { id:id(), name:draft.name.trim(), description:draft.description, campaignId:draft.campaignId, status:'Planejamento', createdAt:new Date().toISOString(), steps:[], links:[] }
    setFunnels(old=>[f,...old]); setSelected(f.id); setDraft({name:'',description:'',campaignId:''});setNewFunnel(false)
  }
  const moveStep=(index:number, delta:number)=>{
    if (!funnel) return
    const target=index+delta;if(target<0||target>=funnel.steps.length)return
    patch(f=>{const steps=[...f.steps];[steps[index],steps[target]]=[steps[target],steps[index]];return {...f,steps}})
  }
  const duplicate= (f:Funnel) => { const ids=new Map(f.steps.map(s=>[s.id,id()]));setFunnels(old=>[{...f,id:id(),name:f.name+' — Cópia',createdAt:new Date().toISOString(),steps:f.steps.map(s=>({...s,id:ids.get(s.id)!,messages:s.messages.map(m=>({...m,id:id()}))})),links:(f.links||[]).map(l=>({...l,id:id(),source:ids.get(l.source)||'',target:ids.get(l.target)||''}))},...old]) }
  const copy = async (m:Message) => { try { await navigator.clipboard.writeText(m.body);setCopied(m.id);setTimeout(()=>setCopied(null),1800) } catch { setCopied(null) } }
  return <section className={'fn-root '+(fullscreen?'fn-fullscreen':'')}>
    {!funnel ? <>
      <div className="fn-intro"><div><span className="fn-kicker">ARQUITETURA DE CONVERSÃO</span><h2>Funis de campanha</h2><p>Desenhe a jornada, organize as etapas e centralize todos os pitches, mensagens e follow-ups.</p></div><button className="primary-button" onClick={()=>setNewFunnel(true)}><Plus size={17}/> Criar funil</button></div>
      <div className="fn-stats"><div><small>FUNIS CADASTRADOS</small><strong>{funnels.length}</strong></div><div><small>EM EXECUÇÃO</small><strong>{funnels.filter(f=>f.status==='Em execução').length}</strong></div><div><small>ETAPAS PLANEJADAS</small><strong>{funnels.reduce((a,f)=>a+f.steps.length,0)}</strong></div></div>
      <div className="fn-list-top"><div className="fn-search"><Search size={17}/><input placeholder="Buscar funis..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span>{funnels.length} funis</span></div>
      <div className="fn-cards">{funnels.filter(f=>(f.name+' '+f.description).toLowerCase().includes(query.toLowerCase())).map(f=><article className="fn-card" key={f.id}>
      <div className="fn-card-icon"><GitBranch size={23}/></div><div className="fn-card-body"><div className="fn-card-line"><h3>{f.name}</h3><span className="fn-status">{f.status}</span></div><p>{f.description||'Sem descrição'}</p><small>{f.steps.length} etapas · {f.steps.reduce((n,s)=>n+s.messages.length,0)} mensagens {campaigns.find(c=>c.id===f.campaignId)?' · '+campaigns.find(c=>c.id===f.campaignId)?.name:''}</small></div>
      <div className="fn-card-actions"><button className="secondary-button" onClick={()=>{setSelected(f.id);setActiveStep(null);setMessageId(null)}}>Abrir funil <ArrowRight size={16}/></button><button className="fn-icon" title="Duplicar funil" onClick={()=>duplicate(f)}><Copy size={16}/></button><button className="fn-icon" title="Excluir funil" onClick={()=>{setPendingDelete({kind:'funnel',id:f.id,name:f.name})}}><Trash2 size={16}/></button></div>
      </article>)}{funnels.length===0&&<div className="fn-empty"><GitBranch size={35}/><h3>Seu primeiro funil começa aqui</h3><p>Crie um funil para organizar a jornada de conversão de suas campanhas.</p><button className="primary-button" onClick={()=>setNewFunnel(true)}><Plus size={16}/> Criar primeiro funil</button></div>}</div>
    </> : <>
      <div className="fn-detail-head"><button className="fn-back" onClick={()=>{setFullscreen(false);setTemplatesOpen(false);setEditing(false);setSelected(null);setActiveStep(null);setMessageId(null)}}><ArrowLeft size={16}/> Todos os funis</button><div className="fn-detail-actions"><select aria-label="Status do funil" value={funnel.status} onChange={e=>patch(f=>({...f,status:e.target.value}))}><option>Planejamento</option><option>Em execução</option><option>Pausado</option><option>Concluído</option></select><button className="secondary-button" onClick={()=>setEditing(!editing)}><Pencil size={15}/> Editar funil</button></div></div>
      {editing?<div className="fn-edit-head"><label>Nome<input value={funnel.name} onChange={e=>patch(f=>({...f,name:e.target.value}))}/></label><label>Descrição<textarea value={funnel.description} onChange={e=>patch(f=>({...f,description:e.target.value}))}/></label><label>Campanha vinculada<select value={funnel.campaignId} onChange={e=>patch(f=>({...f,campaignId:e.target.value}))}><option value="">Sem campanha vinculada</option>{campaigns.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><button className="secondary-button" onClick={()=>setEditing(false)}>Concluir edição</button></div>:<div className="fn-detail-title"><span className="fn-kicker">MAPA ESTRATÉGICO</span><h2>{funnel.name}</h2><p>{funnel.description||'Organize as etapas e os materiais deste funil.'}</p></div>}
      <div className="fn-workspace">
       <div className="fn-map"><div className="fn-section-head"><div><h3>Mapa visual do funil</h3><p>Organize os blocos, conecte ramificações e defina o responsável por cada etapa.</p></div><div className="fn-toolbar"><button className="secondary-button" title="Desfazer (⌘Z / Ctrl+Z)" disabled={!selected||!(undoStack.current[selected]?.length)} onClick={undo}>↶ Desfazer</button><button className="secondary-button" title="Refazer (⌘⇧Z / Ctrl+Shift+Z)" disabled={!selected||!(redoStack.current[selected]?.length)} onClick={redo}>↷ Refazer</button><button className="secondary-button" onClick={()=>setFullscreen(v=>!v)}>{fullscreen?'Sair da tela cheia':'Expandir mapa'}</button><button className="secondary-button" onClick={()=>setTemplatesOpen(v=>!v)}>Catálogo de modelos</button><button className="primary-button" onClick={()=>insertStep()}><Plus size={16}/> Nova etapa</button></div></div>
       {templatesOpen&&<div className="fn-templates">{templates.map(t=><button key={t.title} onClick={()=>insertStep(t)}><span style={{background:t.color}}/>{t.title}<Plus size={14}/></button>)}</div>}
       <FunnelCanvas steps={funnel.steps} links={funnel.links||funnel.steps.slice(1).map((s,i)=>({id:'legacy-'+s.id,source:funnel.steps[i].id,target:s.id}))} activeId={activeStep} onSelect={id=>{setActiveStep(id);setMessageId(null);setModelMenuOpen(false)}} onChange={updateMap} onDelete={deleteCanvasStep} fullscreen={fullscreen}/>
       </div>
       {step&&<aside className="fn-inspector"><div className="fn-inspector-header"><div><span className="fn-kicker">CONFIGURAÇÃO DA ETAPA</span><h3>{step.title}</h3></div><button className="fn-icon" title="Fechar" onClick={()=>{setActiveStep(null);setMessageId(null)}}><X size={18}/></button></div>
         <label>Nome da etapa<input value={step.title} onChange={e=>patchStep(s=>({...s,title:e.target.value}))}/></label>
         <div className="fn-model-field"><div className="fn-label">Modelo de etapa</div><button type="button" className="fn-model-trigger" aria-expanded={modelMenuOpen} onClick={()=>{setModelMenuOpen(v=>!v);setModelSearch('')}}><span className="fn-model-dot" style={{background:templateByTitle(step.kind)?.color||step.color}}/><span>{templateByTitle(step.kind)?.title||`Legado: ${step.kind}`}</span><ChevronDown size={16}/></button>{modelMenuOpen&&<div className="fn-model-menu"><div className="fn-model-filter"><Search size={15}/><input autoFocus placeholder="Buscar modelo..." value={modelSearch} onChange={e=>setModelSearch(e.target.value)}/></div><div className="fn-model-options">{MODEL_TEMPLATES.filter(m=>m.title.toLowerCase().includes(modelSearch.toLowerCase())).map(m=><button type="button" key={m.title} className={step.kind===m.title?'chosen':''} onClick={()=>{patchStep(current=>({...current,kind:m.title,color:m.color,detail:m.detail,title:m.title}));setModelMenuOpen(false)}}><span className="fn-model-dot" style={{background:m.color}}/><span>{m.title}</span>{step.kind===m.title&&<Check size={15}/>}</button>)}{!MODEL_TEMPLATES.some(m=>m.title.toLowerCase().includes(modelSearch.toLowerCase()))&&<p>Nenhum modelo encontrado.</p>}</div></div>}</div>
         <label>Responsável pela etapa<input value={step.owner||''} placeholder="Ex.: Leonardo, Henrique, Comercial" onChange={e=>patchStep(s=>({...s,owner:e.target.value}))}/></label>
         <label>Status<select value={step.status||'Planejada'} onChange={e=>patchStep(s=>({...s,status:e.target.value}))}>{['Planejada','Em andamento','Pronta','Ativa','Pausada','Concluída'].map(v=><option key={v}>{v}</option>)}</select></label>
         <label>Prazo<input type="date" value={step.dueDate||''} onChange={e=>patchStep(s=>({...s,dueDate:e.target.value}))}/></label>
         <div className="fn-stage-link"><label>Link da etapa (WhatsApp, página, checkout ou material)<input type="url" placeholder="https://..." value={step.url||''} onChange={e=>patchStep(item=>({...item,url:e.target.value}))}/></label>{step.url&&<div className="fn-stage-link-actions"><button type="button" className="fn-compact" onClick={()=>{void navigator.clipboard.writeText(step.url||'')}}><Copy size={14}/> Copiar link</button>{/^https?:\/\/[^\s]+$/i.test(step.url)&&<a className="fn-compact" href={step.url} target="_blank" rel="noopener noreferrer">Abrir link ↗</a>}</div>}</div>
         <label>Descrição / objetivo<textarea rows={3} value={step.detail} onChange={e=>patchStep(s=>({...s,detail:e.target.value}))}/></label>
         <div className="fn-label">Cor da etapa</div><div className="fn-colors">{colors.map(c=><button aria-label={'Cor '+c} title={c} key={c} style={{background:c}} className={step.color===c?'selected':''} onClick={()=>patchStep(s=>({...s,color:c}))}>{step.color===c&&<Check size={14}/>}</button>)}<input title="Escolher cor personalizada" aria-label="Cor personalizada" type="color" value={/^#[0-9a-f]{6}$/i.test(step.color)?step.color:'#9674c3'} onChange={e=>patchStep(s=>({...s,color:e.target.value}))}/></div>
         <div className="fn-stage-actions"><button className="fn-compact" disabled={funnel.steps.findIndex(s=>s.id===step.id)===0} onClick={()=>moveStep(funnel.steps.findIndex(s=>s.id===step.id),-1)}><ChevronUp size={15}/> Voltar</button><button className="fn-compact" disabled={funnel.steps.findIndex(s=>s.id===step.id)===funnel.steps.length-1} onClick={()=>moveStep(funnel.steps.findIndex(s=>s.id===step.id),1)}><ChevronDown size={15}/> Avançar</button><button className="fn-compact fn-danger" onClick={()=>{deleteCanvasStep(step.id)}}><Trash2 size={15}/> Excluir</button></div>
         <div className="fn-messages-head"><h4>Mensagens e pitches <span>{step.messages.length}</span></h4><button className="fn-compact" onClick={()=>{const m=newMessage();patchStep(s=>({...s,messages:[...s.messages,m]}));setMessageId(m.id)}}><Plus size={15}/> Adicionar</button></div>
         <div className="fn-message-list">{step.messages.map(m=><button key={m.id} className={'fn-message-item '+(messageId===m.id?'active':'')} onClick={()=>setMessageId(m.id)}><span><MessageSquareText size={16}/><strong>{m.title||'Sem título'}</strong></span><small>{m.channel} · {m.trigger||'Sem gatilho'}</small></button>)}{step.messages.length===0&&<p className="fn-hint">Salve aqui os scripts, CTAs, mensagens de WhatsApp e follow-ups desta etapa.</p>}</div>
         {message&&<div className="fn-message-editor"><label>Título<input value={message.title} onChange={e=>patchMessage(m=>({...m,title:e.target.value}))}/></label><label>Canal<select value={message.channel} onChange={e=>patchMessage(m=>({...m,channel:e.target.value}))}>{['WhatsApp','Instagram Direct','Instagram Stories','Live / Pitch','E-mail','SMS','Outro'].map(c=><option key={c}>{c}</option>)}</select></label><label>Quando enviar / gatilho<input value={message.trigger} onChange={e=>patchMessage(m=>({...m,trigger:e.target.value}))} placeholder="Ex.: 24h após inscrição"/></label><label>Conteúdo da mensagem<textarea rows={8} value={message.body} onChange={e=>patchMessage(m=>({...m,body:e.target.value}))} placeholder="Escreva a mensagem. Use [NOME], [LINK]..."/></label><div className="fn-message-actions"><button className="secondary-button" onClick={()=>void copy(message)}>{copied===message.id?<Check size={15}/>:<Copy size={15}/>} {copied===message.id?'Copiado':'Copiar mensagem'}</button><button className="fn-compact fn-danger" onClick={()=>{patchStep(s=>({...s,messages:s.messages.filter(m=>m.id!==message.id)}));setMessageId(null)}}><Trash2 size={15}/></button></div></div>}
       </aside>}
      </div><div className="fn-save-notice">Alterações salvas automaticamente neste navegador. Os disparos são planejados, não enviados automaticamente.</div>
    </>}
    {newFunnel&&<div className="fn-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setNewFunnel(false)}}><div className="fn-modal" role="dialog" aria-modal="true" aria-label="Novo funil"><div className="fn-modal-top"><div><span className="fn-kicker">NOVO PROJETO</span><h2>Criar funil de campanha</h2></div><button className="fn-icon" onClick={()=>setNewFunnel(false)}><X size={19}/></button></div><label>Nome do funil<input autoFocus placeholder="Ex.: Live semanal → Lucro 2x → RPM" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label><label>Descrição<textarea placeholder="Qual é o objetivo principal desta jornada?" rows={3} value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label><label>Vincular a campanha (opcional)<select value={draft.campaignId} onChange={e=>setDraft(d=>({...d,campaignId:e.target.value}))}><option value="">Nenhuma campanha</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="fn-modal-actions"><button className="secondary-button" onClick={()=>setNewFunnel(false)}>Cancelar</button><button className="primary-button" disabled={!draft.name.trim()} onClick={addFunnel}><Plus size={16}/> Criar funil</button></div></div></div>}
    {pendingDelete&&<div className="fn-overlay fn-delete-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setPendingDelete(null)}}><div className="fn-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="fn-delete-title" aria-describedby="fn-delete-description"><div className="fn-confirm-icon"><Trash2 size={23}/></div><h2 id="fn-delete-title">Excluir {pendingDelete.kind==='step'?'etapa':'funil'}?</h2><p id="fn-delete-description">Tem certeza que deseja excluir <strong>{pendingDelete.name}</strong>? {pendingDelete.kind==='step'?'As mensagens e conexões desta etapa também serão excluídas.':'Todas as etapas e mensagens deste funil serão excluídas.'}</p><div className="fn-confirm-actions"><button className="secondary-button" onClick={()=>setPendingDelete(null)}>Cancelar</button><button className="fn-delete-button" onClick={confirmDeletion}><Trash2 size={15}/> Excluir {pendingDelete.kind==='step'?'etapa':'funil'}</button></div></div></div>}
  </section>
}
