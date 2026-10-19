import {useEffect,useMemo,useState} from 'react'
import {ArrowRight} from 'lucide-react'
import {ruleGroups} from './eventProtocolData'
type Event={id:string;name:string;date:string;eventType?:string}
type Check={key:string;done:boolean}
const KEY='strategy-event-protocol-v1'
const eventsRead=():Event[]=>{try{const x=JSON.parse(localStorage.getItem('strategy-events')||'[]');return Array.isArray(x)?x:[]}catch{return []}}
const checksRead=():Record<string,Check[]>=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
const shift=(date:string,days:number)=>{const d=new Date(date+'T12:00:00');if(isNaN(d.getTime()))return '';d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
export default function ProtocolTasks({onOpen}:{onOpen:()=>void}){
 const [events,setEvents]=useState<Event[]>(eventsRead)
 const [checks,setChecks]=useState<Record<string,Check[]>>(checksRead)
 const [showAll,setShowAll]=useState(false)
 const today=new Date(),now=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-')
 useEffect(()=>{const refresh=()=>{setEvents(eventsRead());setChecks(checksRead())};window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener('strategy-protocol-updated',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);window.removeEventListener('strategy-protocol-updated',refresh)}},[])
 const rows=useMemo(()=>events.filter(e=>e.eventType==='presencial').flatMap(event=>ruleGroups.flatMap(g=>g.items.map((title,index)=>{const key=g.id+':'+index;const done=!!checks[event.id]?.find(x=>x.key===key)?.done;const due=event.date?shift(event.date,g.offset):'';return {event,key,title,group:g.title,done,due}}))).filter(r=>!r.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')),[events,checks])
 const visible=showAll?rows:rows.filter(r=>!r.due||r.due<=shift(now,7)).slice(0,20)
 const toggle=(eventId:string,key:string)=>{const next={...checks,[eventId]:[...(checks[eventId]||[]).filter(x=>x.key!==key),{key,done:true}]};setChecks(next);try{localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event('strategy-protocol-updated'))}catch{}}
 if(!events.some(e=>e.eventType==='presencial'))return null
 return <section className="tk-protocol"><div className="tk-protocol-head"><div><span className="tk-kicker">PROTOCOLO DE EVENTOS PRESENCIAIS</span><h3>Preparação dos eventos</h3><p>Checklist mestre da aba Protocolo, distribuído conforme a data cadastrada de cada evento presencial.</p></div><button className="secondary-button" onClick={onOpen}>Abrir Protocolo <ArrowRight size={15}/></button></div><div className="tk-protocol-list">{visible.map(t=><label key={t.event.id+':'+t.key}><input type="checkbox" checked={false} onChange={()=>toggle(t.event.id,t.key)}/><span><strong>{t.title}</strong><small>{t.event.name} · {t.group}</small></span><small>{t.due?t.due.split('-').reverse().join('/'):'Sem data'}</small></label>)}</div>{rows.length>20&&<button className="secondary-button" onClick={()=>setShowAll(!showAll)}>{showAll?'Mostrar prioridades':'Mostrar todas as pendências ('+rows.length+')'}</button>}{!rows.length&&<p className="tk-note">Todas as tarefas do protocolo presencial foram concluídas.</p>}</section>
}
