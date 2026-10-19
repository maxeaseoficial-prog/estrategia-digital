import {useEffect,useMemo,useState} from 'react'
import {CheckCircle2,ClipboardList,CalendarClock,AlertTriangle,Search,ArrowRight,RefreshCw} from 'lucide-react'
import {createChecklist,type ChecklistItem} from './checklistTemplates'
import './tasks.css'
import ProtocolTasks from './ProtocolTasks'
type Stage={id:string;title:string;kind:string;owner?:string;dueDate?:string;checklist?:ChecklistItem[]}
type Funnel={id:string;name:string;steps:Stage[];status?:string}
type Task={funnelId:string;funnelName:string;step:Stage;item:ChecklistItem;due:string;inferred:boolean;days:number;score:number}
const STORE='strategy-campaign-funnels-v1'
const read=():Funnel[]=>{try{const data=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(data)?data:[]}catch{return []}}
const iso=(date:Date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')
const plusDays=(date:string,days:number)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return iso(d)}
const gap=(date:string,today:string)=>Math.round((new Date(date+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000)
const offset=(kind:string)=>{const k=kind.toLowerCase();if(k.includes('anúncio')||k.includes('meta')||k.includes('landing'))return -14;if(k.includes('conteúdo')||k.includes('formulário'))return -12;if(k.includes('whatsapp')||k.includes('boas-vindas'))return -10;if(k.includes('nutrição')||k.includes('aquecimento'))return -9;if(k.includes('checkout')||k.includes('oferta'))return -7;if(k.includes('recuperação')||k.includes('remarketing'))return -6;if(k.includes('lembrete'))return -3;if(k.includes('live')||k.includes('evento'))return 0;if(k.includes('pós-venda')||k.includes('feedback'))return 1;return -5}
const calc=(all:Funnel[],today:string):Task[]=>all.flatMap(f=>{
 const event=f.steps.filter(s=>(s.kind.toLowerCase().includes('live')||s.kind.toLowerCase().includes('evento'))&&s.dueDate).sort((a,b)=>a.dueDate!.localeCompare(b.dueDate!))[0]
 return f.steps.flatMap(step=>{
  const recommended=event?.dueDate?plusDays(event.dueDate,offset(step.kind)):''
  const due=step.dueDate||recommended
  const days=due?gap(due,today):999
  const items=step.checklist||createChecklist(step.kind)
  return items.map(item=>({funnelId:f.id,funnelName:f.name,step,item,due,inferred:!step.dueDate&&!!recommended,days,score:item.done?999:days<0?0:days===0?1:days<=2?2:days<=7?3:days<999?4:5}))
 })
}).sort((a,b)=>a.score-b.score||a.days-b.days||a.funnelName.localeCompare(b.funnelName))
export default function Tasks({onOpenFunnel,onOpenProtocol}:{onOpenFunnel:(id:string)=>void;onOpenProtocol:()=>void}){
 const [funnels,setFunnels]=useState<Funnel[]>(read)
 const [filter,setFilter]=useState('pending')
 const [search,setSearch]=useState('')
 const [chosen,setChosen]=useState('')
 const [today,setToday]=useState(()=>iso(new Date()))
 useEffect(()=>{const refresh=()=>{setFunnels(read());setToday(iso(new Date()))};window.addEventListener('strategy-funnels-updated',refresh);window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);return()=>{window.removeEventListener('strategy-funnels-updated',refresh);window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh)}},[])
 const tasks=useMemo(()=>calc(funnels,today),[funnels,today])
 const all=tasks.length,done=tasks.filter(t=>t.item.done).length,pending=all-done
 const urgent=tasks.filter(t=>!t.item.done&&t.days<=2).length
 const visible=tasks.filter(t=>(!chosen||t.funnelId===chosen)&&(filter==='all'||filter==='completed'&&t.item.done||filter==='pending'&&!t.item.done||filter==='urgent'&&!t.item.done&&t.days<=2)&&[t.item.title,t.step.title,t.funnelName,t.step.owner||''].join(' ').toLowerCase().includes(search.toLowerCase()))
 const toggle=(task:Task,checked:boolean)=>{
  const latest=read()
  const next=latest.map(f=>f.id!==task.funnelId?f:{...f,steps:f.steps.map(stage=>{
   if(stage.id!==task.step.id)return stage
   const checks=stage.checklist||createChecklist(stage.kind)
   return {...stage,checklist:checks.map(c=>c.id===task.item.id||(!stage.checklist&&c.title===task.item.title)?{...c,done:checked}:c)}
  })})
  try{localStorage.setItem(STORE,JSON.stringify(next));setFunnels(next);window.dispatchEvent(new Event('strategy-funnels-updated'))}
  catch{setFunnels(next)}
 }
 const dateLabel=(t:Task)=>!t.due?'Sem prazo':t.days<0?'Atrasada '+Math.abs(t.days)+'d':t.days===0?'Hoje':t.days===1?'Amanhã':'Em '+t.days+'d'
 return <section className="tk-root"><div className="tk-head"><div><span className="tk-kicker">CENTRAL DE EXECUÇÃO</span><h2>Tarefas</h2><p>Checklists dos funis, priorizados por prazo e prontidão para os eventos.</p></div><button className="secondary-button" onClick={()=>{setFunnels(read());setToday(iso(new Date()))}}><RefreshCw size={15}/> Atualizar</button></div>
 <div className="tk-stats">{[['Tarefas pendentes',pending],['Urgentes / atrasadas',urgent],['Concluídas',done],['Progresso',all?Math.round(done/all*100)+'%':'0%']].map(([name,value])=><div key={name}><small>{name}</small><strong>{value}</strong></div>)}</div>
 <div className="tk-toolbar"><div className="tk-search"><Search size={16}/><input placeholder="Buscar tarefa, etapa ou responsável" value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={chosen} onChange={e=>setChosen(e.target.value)}><option value="">Todos os funis</option>{funnels.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><div className="tk-filters">{[['pending','Pendentes'],['urgent','Urgentes'],['completed','Concluídas'],['all','Todas']].map(([key,name])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{name}</button>)}</div></div>
 <div className="tk-context"><CalendarClock size={18}/><div><strong>Planejamento inteligente</strong><p>Prazos informados nos cards têm prioridade. Se uma live ou evento tiver data, as etapas sem prazo recebem uma <b>data sugerida</b> baseada no tipo de atividade. Datas recomendadas não sobrescrevem os cards.</p></div></div>
 {visible.length===0?<div className="tk-empty"><CheckCircle2 size={28}/><strong>Nenhuma tarefa nesta visualização</strong><p>Cadastre etapas e checklists nos funis para começar.</p></div>:<div className="tk-list">{visible.map(t=><div className="tk-item" key={t.funnelId+':'+t.step.id+':'+t.item.id}><input type="checkbox" checked={t.item.done} onChange={e=>toggle(t,e.target.checked)} aria-label={'Concluir '+t.item.title}/><div className="tk-task"><strong className={t.item.done?'completed':''}>{t.item.title}</strong><small>{t.funnelName} <span>·</span> {t.step.title} <span>·</span> {t.step.owner||'Sem responsável'}</small></div><div className="tk-due"><span className={!t.item.done&&t.days<=2?'urgent':''}>{!t.item.done&&t.days<=2?<AlertTriangle size={13}/>:null}{dateLabel(t)}</span>{t.inferred&&<small>Data sugerida: {t.due.split('-').reverse().join('/')}</small>}{!t.inferred&&t.due&&<small>Prazo: {t.due.split('-').reverse().join('/')}</small>}</div><button className="tk-open" onClick={()=>onOpenFunnel(t.funnelId)} title="Abrir funil"><ArrowRight size={17}/></button></div>)}</div>}
 <ProtocolTasks onOpen={onOpenProtocol}/>
 <p className="tk-note">As marcações são compartilhadas com o checklist do funil neste navegador. O sistema apenas sugere prioridades; não agenda tarefas nem envia mensagens automaticamente.</p>
 </section>
}
