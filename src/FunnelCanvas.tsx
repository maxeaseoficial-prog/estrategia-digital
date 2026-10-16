// @ts-nocheck — temporary compatibility shim for conflicting React JSX types in @xyflow/react.
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, ConnectionMode, BaseEdge, getStraightPath, getSmoothStepPath, type Connection, type Edge, type Node, type NodeProps, type OnNodesChange, applyNodeChanges } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GitBranch, MessageSquareText, UserRound, Video, Megaphone, FileText, ClipboardList, CreditCard, BadgeCheck, RefreshCw, Search, Users, UserX, CircleHelp, ChartNoAxesCombined, MessageCircle, Bell, ShoppingCart, MousePointerClick, Mail, CalendarDays, LayoutTemplate } from 'lucide-react'

export type CanvasStep = { id:string; title:string; detail:string; kind:string; color:string; messages:{id:string}[]; owner?:string; executionType?:string; resource?:string; status?:string; livePlatform?:string; position?:{x:number;y:number} }
export type CanvasLink = { id:string; source:string; target:string; label?:string; sourceHandle?:string|null; targetHandle?:string|null }
function MetaBrandIcon(){return <span className="fc-stage-brand fc-meta" title="Meta Ads"><svg viewBox="0 0 32 32" width="23" height="23" fill="none" aria-hidden="true"><path d="M4 20c1.3-7 4.5-11 8.2-11 3.2 0 5.6 4.2 8.3 9.2 1.2 2.2 2.2 4.1 3.6 4.1 1.7 0 2.5-2.3 2.5-5.5 0-3.1-.9-5.1-2.8-5.1-2.7 0-5.1 3.8-7.5 8.1-2.4 4.4-4.8 7.8-7.8 7.8C4.4 27.6 2 24.5 4 20Z" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
function WhatsAppBrandIcon(){return <span className="fc-stage-brand fc-whatsapp" title="WhatsApp"><svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><path d="M16 4.2a11.7 11.7 0 0 0-10 17.8l-1.7 5.7 5.9-1.6a11.7 11.7 0 1 0 5.8-21.9Z" stroke="white" strokeWidth="2.3" fill="none" strokeLinejoin="round"/><path fill="white" d="M11.2 10.1c-.5.1-1.5 1.5-1.5 3.1 0 2 2.6 5.2 4.1 6.4 1.6 1.3 4.3 2.9 6.5 2.6 1.6-.2 2.6-1.7 2.6-2.7 0-.4-2.8-1.6-3.1-1.6-.3 0-1.1 1.4-1.5 1.4-.6 0-3.6-2.2-4.1-3-.3-.5 1.1-1.2 1-1.7-.1-.5-1.2-3-1.7-3.1Z"/></svg></span>}
function StageIcon({kind,platform,color}:{kind:string;platform?:string;color:string}){
 const k=(kind||'').toLowerCase()
 const p=(platform||'').toLowerCase()
 if(k.includes('live')){
  if(p.includes('zoom'))return <span className="fc-stage-brand fc-zoom" title="Zoom"><Video size={18} strokeWidth={2.5}/></span>
  if(p.includes('meet'))return <span className="fc-stage-brand fc-meet" title="Google Meet"><svg viewBox="0 0 32 32" width="24" height="24"><path fill="#4285F4" d="M3 9h13v14H3z"/><path fill="#00AC47" d="M16 9h6v14h-6z"/><path fill="#FBBC04" d="M16 9l6-5 5 5-5 5z"/><path fill="#34A853" d="M22 13l7-5v16l-7-5z"/><path fill="#EA4335" d="M3 9l5-5h14l-6 5z"/></svg></span>
  if(p.includes('instagram'))return <span className="fc-stage-brand fc-instagram" title="Instagram"><svg viewBox="0 0 32 32" width="23" height="23" fill="none"><rect x="6" y="6" width="20" height="20" rx="6" stroke="white" strokeWidth="2.8"/><circle cx="16" cy="16" r="5" stroke="white" strokeWidth="2.8"/><circle cx="22.5" cy="9.5" r="1.7" fill="white"/></svg></span>
  return <span className="fc-stage-brand" style={{background:color}} title="Live"><Video size={18}/></span>
 }
 if(k.includes('meta ads'))return <MetaBrandIcon/>
 if(k.includes('whatsapp'))return <WhatsAppBrandIcon/>
 const entry:[string,any][]=[['meta ads',Megaphone],['anúncio',Megaphone],['conteúdo',FileText],['pitch',MousePointerClick],['cta',MousePointerClick],['landing',LayoutTemplate],['formulário',ClipboardList],['diagnóstico',ClipboardList],['checkout',ShoppingCart],['página',FileText],['whatsapp',MessageCircle],['aquecimento',Users],['nutrição',Users],['lembrete',Bell],['ausente',UserX],['remarketing',RefreshCw],['confirmação',BadgeCheck],['pós-venda',BadgeCheck],['pesquisa',ChartNoAxesCombined],['feedback',ChartNoAxesCombined],['decisão',CircleHelp],['oferta',CreditCard],['e-mail',Mail],['evento',CalendarDays],['recuperação',RefreshCw]]
 const Icon=entry.find(([text])=>k.includes(text))?.[1]||CircleHelp
 return <span className="fc-stage-brand" style={{background:color}}><Icon size={18} strokeWidth={2.3}/></span>
}
function StageNode({data,selected}:NodeProps) {
 const s=data as { title:string; detail:string; kind:string; color:string; owner?:string; executionType?:string; resource?:string; status?:string; count:number; index:number; livePlatform?:string }
 return <div className={'fc-node '+(selected?'fc-selected':'')} style={{borderTopColor:s.color}}>
  <FlowHandle id="input" type="source" position={Position.Left} className="fc-handle" isConnectable={true}/>
  <div className="fc-node-meta"><StageIcon kind={s.kind} platform={s.livePlatform} color={s.color}/><span>{s.kind}</span></div>
  <strong>{s.title}</strong><p>{s.detail}</p>
  <div className="fc-node-footer"><span><MessageSquareText size={13}/> {s.count}</span><span><UserRound size={13}/> {s.owner||'Sem responsável'}</span></div>{(s.resource||s.executionType)&&<div className="fc-node-execution">{s.executionType||'Humano'}{s.resource?' · '+s.resource:''}</div>}
  <div className="fc-node-status">{s.status||'Planejada'}</div>
  <FlowHandle id="output" type="source" position={Position.Right} className="fc-handle" isConnectable={true}/>
  <FlowHandle id="top" type="source" position={Position.Top} className="fc-handle" isConnectable={true}/>
  <FlowHandle id="bottom" type="source" position={Position.Bottom} className="fc-handle" isConnectable={true}/>
 </div>
}
const nodeTypes={stage:StageNode}
// Connect aligned handles with a direct segment. Route offset handles orthogonally.
function AdaptiveEdge({id,sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,style}:any){
 const aligned=Math.abs(sourceY-targetY)<=16
 const [path]=aligned
  ? getStraightPath({sourceX,sourceY,targetX,targetY})
  : getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,borderRadius:9,offset:18})
 return <BaseEdge id={id} path={path} style={style} interactionWidth={22}/>
}
const edgeTypes={adaptive:AdaptiveEdge}

// Keep JSX component signatures on the application's React type instance.
const FlowView = ReactFlow as unknown as ComponentType<any>
const FlowBackground = Background as unknown as ComponentType<Record<string, unknown>>
const FlowMiniMap = MiniMap as unknown as ComponentType<Record<string, unknown>>
const FlowControls = Controls as unknown as ComponentType<Record<string, unknown>>
const FlowHandle = Handle as unknown as ComponentType<Record<string, unknown>>
export default function FunnelCanvas({steps,links,onChange,onSelect,activeId,fullscreen,onDelete}:{steps:CanvasStep[];links:CanvasLink[];onChange:(steps:CanvasStep[],links:CanvasLink[])=>void;onSelect:(id:string)=>void;onDelete:(id:string)=>void;activeId:string|null;fullscreen:boolean}){
 const initialNodes=useMemo<Node[]>(()=>steps.map((s,i)=>({id:s.id,type:'stage',position:s.position||{x:70+(i%4)*325,y:80+Math.floor(i/4)*255},selected:s.id===activeId,data:{title:s.title,detail:s.detail,kind:s.kind,color:s.color,owner:s.owner,executionType:s.executionType,resource:s.resource,status:s.status,count:s.messages.length,index:i+1,livePlatform:s.livePlatform}})),[steps,activeId])
 const [nodes,setNodes]=useState<Node[]>(initialNodes)
 const nodesRef=useRef<Node[]>(initialNodes)
 const [selectionModifier,setSelectionModifier]=useState(false)
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(e.key==='Meta'||e.key==='Control'||e.metaKey||e.ctrlKey)setSelectionModifier(true)};const up=(e:KeyboardEvent)=>{if(e.key==='Meta'||e.key==='Control'||(!e.metaKey&&!e.ctrlKey))setSelectionModifier(false)};const blur=()=>setSelectionModifier(false);window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}},[])
 const [contextMenu,setContextMenu]=useState<{id:string;title:string;x:number;y:number;kind:'node'|'edge'}|null>(null)
 useEffect(()=>{setNodes(previous=>{const previousById=new Map(previous.map(n=>[n.id,n]));const updated=initialNodes.map(n=>({...n,selected:previousById.get(n.id)?.selected??n.selected}));nodesRef.current=updated;return updated})},[initialNodes])
 const edges=useMemo<Edge[]>(()=>links.filter(e=>steps.some(s=>s.id===e.source)&&steps.some(s=>s.id===e.target)).map(e=>({id:e.id,source:e.source,target:e.target,sourceHandle:e.sourceHandle||'output',targetHandle:e.targetHandle||'input',label:e.label,type:'adaptive',animated:false,style:{stroke:'#9674c3',strokeWidth:2},labelStyle:{fontSize:11,fill:'#555'},labelBgStyle:{fill:'#fff',fillOpacity:.95}})),[links,steps])
 const handleNodesChange:OnNodesChange=useCallback(changes=>{setNodes(current=>{const next=applyNodeChanges(changes,current);nodesRef.current=next;return next})},[])
 const handleDragStop=useCallback((_:unknown,node:Node,draggedNodes?:Node[])=>{const moved=new Map((draggedNodes?.length?draggedNodes:[node]).map(n=>[n.id,n.position]));onChange(steps.map(s=>moved.has(s.id)?{...s,position:{...moved.get(s.id)!}}:s),links)},[steps,links,onChange])
 const handleContextMenu=useCallback((event:MouseEvent,node:Node)=>{event.preventDefault();setContextMenu({id:node.id,title:String(node.data.title||'Etapa'),x:Math.max(8,Math.min(event.clientX,window.innerWidth-220)),y:Math.max(8,Math.min(event.clientY,window.innerHeight-115)),kind:'node'})},[])
 const handleEdgeContextMenu=useCallback((event:MouseEvent,edge:Edge)=>{event.preventDefault();setContextMenu({id:edge.id,title:'Conexão entre etapas',x:Math.max(8,Math.min(event.clientX,window.innerWidth-220)),y:Math.max(8,Math.min(event.clientY,window.innerHeight-115)),kind:'edge'})},[])
 const connect=useCallback((c:Connection)=>{if(!c.source||!c.target||c.source===c.target)return;const next:CanvasLink={id:crypto.randomUUID(),source:c.source,target:c.target,sourceHandle:c.sourceHandle||'output',targetHandle:c.targetHandle||'input'};onChange(steps,[...links,next])},[steps,links,onChange])
 return <div className={'fc-canvas '+(fullscreen?'fc-canvas-full':'')}><FlowView nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={handleNodesChange} onNodeDragStop={handleDragStop} onNodeContextMenu={handleContextMenu} onEdgeContextMenu={handleEdgeContextMenu} onPaneClick={()=>setContextMenu(null)} onConnect={connect} connectionMode={ConnectionMode.Loose} connectionRadius={42} onNodeClick={(event: MouseEvent,node: Node)=>{if(!event.metaKey&&!event.ctrlKey)onSelect(node.id)}} onEdgesDelete={(deleted: Edge[])=>onChange(steps,links.filter(l=>!deleted.some(d=>d.id===l.id)))} nodesDraggable edgesReconnectable={false} edgesFocusable deleteKeyCode={['Backspace','Delete']} fitView fitViewOptions={{padding:.2,maxZoom:1.1}} minZoom={.15} maxZoom={2} panOnDrag={!selectionModifier} selectionOnDrag={selectionModifier} selectionKeyCode={null} multiSelectionKeyCode={['Meta','Control']} zoomOnScroll zoomOnPinch>
 <FlowBackground color="#e5e6ed" gap={22}/><FlowMiniMap pannable zoomable nodeColor={(n: Node)=>String(n.data.color||'#9674c3')} style={{border:'1px solid #e2e4e8',borderRadius:8}}/><FlowControls showInteractive={false}/>
 </FlowView>{contextMenu&&<div className="fc-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onContextMenu={event=>event.preventDefault()}><div className="fc-context-title">{contextMenu.title}</div><button type="button" onClick={()=>{if(contextMenu.kind==='edge'){onChange(steps,links.filter(link=>link.id!==contextMenu.id))}else{onDelete(contextMenu.id)}setContextMenu(null)}}>{contextMenu.kind==='edge'?'Excluir conexão':'Excluir etapa'}</button><button type="button" onClick={()=>setContextMenu(null)}>Cancelar</button></div>}<div className="fc-help"><GitBranch size={14}/> ⌘ + arrastar seleciona vários cards · Arraste um selecionado para mover o grupo · Conecte pelos pontos laterais · Use a roda para aproximar · Selecione uma linha e pressione Delete para remover</div></div>
}
