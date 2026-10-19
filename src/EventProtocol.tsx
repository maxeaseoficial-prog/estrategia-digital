import {useEffect,useMemo,useState} from 'react'
import {BookOpen,CheckCircle2,CalendarClock,ChevronDown,ChevronRight,ClipboardCheck,Info,RotateCcw,Search,ArrowRight} from 'lucide-react'
import {manualChapters,ruleGroups,timeline} from './eventProtocolData'
import './eventProtocol.css'
type Event={id:string;name:string;date:string;time:string;location:string;description:string}
type Task={key:string;done:boolean}
const STORE='strategy-event-protocol-v1'
const getAll=():Record<string,Task[]>=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
const ISO=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?value:''
const shift=(date:string,days:number)=>{const d=new Date(date+'T12:00:00');if(isNaN(d.getTime()))return '';d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
const show=(date:string)=>date?date.split('-').reverse().join('/'):'Sem data'
export default function EventProtocol({events}:{events:Event[]}){
 const [eventId,setEventId]=useState('')
 const [checks,setChecks]=useState<Record<string,Task[]>>(getAll)
 const [tab,setTab]=useState<'execution'|'timeline'|'reference'>('execution')
 const [expanded,setExpanded]=useState<string[]>(['estrategia'])
 const [q,setQ]=useState('')
 const [manualOpen,setManualOpen]=useState(false)
 const event=events.find(e=>e.id===eventId)
 const due=ISO(event?.date||'')
 const records=checks[eventId]||[]
 const doneKeys=new Set(records.filter(r=>r.done).map(r=>r.key))
 const tasks=ruleGroups.flatMap(g=>g.items.map((text,i)=>({key:g.id+':'+i,text,group:g.id,due:due?shift(due,g.offset):''})))
 const total=tasks.length
 const done=tasks.filter(t=>doneKeys.has(t.key)).length
 const percent=Math.round((done/(total||1))*100)
 const today=new Date();const todayIso=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-')
 const urgent=tasks.filter(t=>!doneKeys.has(t.key)&&t.due&&t.due<=todayIso).length
 useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify(checks))}catch(err){console.warn('Falha ao salvar protocolo',err)}},[checks])
 const setDone=(key:string,checked:boolean)=>setChecks(prev=>({...prev,[eventId]:[...(prev[eventId]||[]).filter(t=>t.key!==key),{key,done:checked}]}))
 const toggleGroup=(id:string)=>setExpanded(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id])
 const suggestions=useMemo(()=>tasks.filter(t=>!doneKeys.has(t.key)&&(!t.due||t.due<=shift(todayIso,7))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).slice(0,8),[tasks,checks,eventId,todayIso])
 return <section className="pr-root">
  <div className="pr-head"><div><span className="pr-kicker">PADRÃO DE EXECUÇÃO · EVENTOS</span><h2>Protocolo</h2><p>Regras e checklists do Manual-Mestre de Eventos, organizados para cada edição.</p></div><button className="secondary-button" onClick={()=>setManualOpen(!manualOpen)}><BookOpen size={16}/> {manualOpen?'Ocultar':'Sobre o manual'}</button></div>
  {manualOpen&&<div className="pr-source"><strong>Manual-Mestre / Imersão AIM</strong><p>Referência: EVENTOS — Da promessa ao pós-evento (170 páginas, 31 capítulos, base 17/10/2026). Esta aba traz o índice dos 31 capítulos, a linha do tempo mestre e as tarefas do checklist operacional do capítulo 29. O PDF integral original permanece no arquivo enviado na conversa; ainda não está hospedado dentro da Strategy.</p><p>Os prazos relativos são recomendações operacionais, não prazos obrigatórios do método. Os exemplos comerciais da aula não são garantias de resultado.</p></div>}
  <div className="pr-choose"><label>Evento a organizar<select value={eventId} onChange={e=>setEventId(e.target.value)}><option value="">Selecione um evento</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}{e.date?' · '+show(e.date):''}</option>)}</select></label><div className="pr-small-tip"><Info size={16}/><span>O mesmo protocolo pode ser aplicado separadamente a cada evento. Seus checks não se misturam.</span></div></div>
  {!event?<div className="pr-welcome"><ClipboardCheck size={29}/><strong>Selecione um evento para iniciar o protocolo.</strong><p>O checklist mestre é carregado com fases, recomendações de prazo e acompanhamento de implantação. O manual também pode ser consultado abaixo.</p><button className="secondary-button" onClick={()=>setTab('reference')}>Consultar capítulos</button></div>:<><div className="pr-stats"><div><small>Execução do protocolo</small><strong>{percent}%</strong><span>{done}/{total} tarefas concluídas</span></div><div><small>Pendências com prazo vencido ou hoje</small><strong>{urgent}</strong><span>Demandam avaliação da equipe</span></div><div><small>Data de referência</small><strong className="pr-date-stat">{show(due)}</strong><span>{event.name}</span></div></div><div className="pr-progress"><div style={{width:percent+'%'}}/></div></>}
  <div className="pr-tabs"><button onClick={()=>setTab('execution')} className={tab==='execution'?'active':''}><ClipboardCheck size={15}/> Execução</button><button onClick={()=>setTab('timeline')} className={tab==='timeline'?'active':''}><CalendarClock size={15}/> Linha do tempo</button><button onClick={()=>setTab('reference')} className={tab==='reference'?'active':''}><BookOpen size={15}/> Manual e regras</button></div>
  {tab==='execution'&&event&&<><div className="pr-alert"><strong>Prioridades da semana</strong><p>Calculadas usando a data do evento e os itens que ainda não foram concluídos. Revise as datas antes de executá-las.</p>{suggestions.length? suggestions.map(t=><div className="pr-priority" key={t.key}><input type="checkbox" checked={doneKeys.has(t.key)} onChange={e=>setDone(t.key,e.target.checked)}/><span>{t.text}</span><small>{show(t.due)}</small></div>):<p>Não há tarefas sugeridas para os próximos sete dias.</p>}</div><div className="pr-groups">{ruleGroups.map(g=>{const completed=g.items.filter((_,i)=>doneKeys.has(g.id+':'+i)).length;return <div key={g.id} className="pr-group"><button className="pr-group-title" onClick={()=>toggleGroup(g.id)}>{expanded.includes(g.id)?<ChevronDown size={17}/>:<ChevronRight size={17}/>}<strong>{g.title}</strong><span>{completed}/{g.items.length}</span><small>{due?'Referência: '+show(shift(due,g.offset)):'Definir data do evento'}</small></button>{expanded.includes(g.id)&&<div className="pr-group-items">{g.items.filter(t=>t.toLowerCase().includes(q.toLowerCase())).map((t)=>{const index=g.items.indexOf(t),key=g.id+':'+index;return <label key={key}><input type="checkbox" checked={doneKeys.has(key)} onChange={e=>setDone(key,e.target.checked)}/><span className={doneKeys.has(key)?'pr-done':''}>{t}</span></label>})}</div>}</div>})}</div></>}
  {tab==='timeline'&&<div className="pr-timeline"><div className="pr-subhead"><h3>Linha do tempo mestre</h3><p>Marcos relativos à data do evento. Baseados no capítulo 9, com prazos reorganizados para planejamento.</p></div>{timeline.map(t=><div key={t.title} className="pr-time-row"><div><strong>{t.offset===0?'D0':'D'+t.offset}</strong><small>{due?show(shift(due,t.offset)):'Data a definir'}</small></div><div><b>{t.title}</b><p>{t.description}</p></div></div>)}</div>}
  {tab==='reference'&&<div className="pr-reference"><div className="pr-subhead"><h3>Manual de Eventos — 31 capítulos</h3><p>Índice de consulta do manual original, organizado para preservar sua estrutura. Consulte o PDF da conversa para o conteúdo integral, exemplos e os 38 prints.</p></div><div className="pr-chapters">{manualChapters.map((c,i)=><div key={c}><span>{String(i+1).padStart(2,'0')}</span><strong>{c}</strong><small>{i<28?'Manual de referência':i===28?'Checklist de execução':i===29?'Fontes':'Atlas visual'}</small></div>)}</div><div className="pr-guidelines"><h3>Travas de qualidade do manual</h3><p><b>Antes de vender:</b> promessa, valor, regras de ingresso e pagamento precisam estar claros.</p><p><b>Antes de abrir portas:</b> credenciamento, som, roteiro, responsáveis, acessibilidade e suporte precisam estar verificados.</p><p><b>Depois do evento:</b> não encerrar sem dados, follow-up, indicadores e debriefing.</p></div></div>}
 <p className="pr-foot">Adaptação operacional do capítulo 29 e capítulo 9 do manual. Os checks ficam salvos neste navegador por evento, separados dos checklists de campanha. Não há criação automática de tarefas ou disparo de mensagens.</p>
 </section>
}
