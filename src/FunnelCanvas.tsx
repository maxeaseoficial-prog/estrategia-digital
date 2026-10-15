// @ts-nocheck — temporary compatibility shim for conflicting React JSX types in @xyflow/react.
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, type Connection, type Edge, type Node, type NodeProps, type OnNodesChange, applyNodeChanges } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GitBranch, MessageSquareText, UserRound } from 'lucide-react'

export type CanvasStep = { id:string; title:string; detail:string; kind:string; color:string; messages:{id:string}[]; owner?:string; status?:string; position?:{x:number;y:number} }
export type CanvasLink = { id:string; source:string; target:string; label?:string }
function StageNode({data,selected}:NodeProps) {
 const s=data as { title:string; detail:string; kind:string; color:string; owner?:string; status?:string; count:number; index:number }
 return <div className={'fc-node '+(selected?'fc-selected':'')} style={{borderTopColor:s.color}}>
  <FlowHandle id="input" type="target" position={Position.Left} className="fc-handle" isConnectable={true}/>
  <div className="fc-node-meta"><span className="fc-index" style={{background:s.color}}>{s.index}</span><span>{s.kind}</span></div>
  <strong>{s.title}</strong><p>{s.detail}</p>
  <div className="fc-node-footer"><span><MessageSquareText size={13}/> {s.count}</span><span><UserRound size={13}/> {s.owner||'Sem responsável'}</span></div>
  <div className="fc-node-status">{s.status||'Planejada'}</div>
  <FlowHandle id="output" type="source" position={Position.Right} className="fc-handle" isConnectable={true}/>
 </div>
}
const nodeTypes={stage:StageNode}
// Keep JSX component signatures on the application's React type instance.
const FlowView = ReactFlow as unknown as ComponentType<any>
const FlowBackground = Background as unknown as ComponentType<Record<string, unknown>>
const FlowMiniMap = MiniMap as unknown as ComponentType<Record<string, unknown>>
const FlowControls = Controls as unknown as ComponentType<Record<string, unknown>>
const FlowHandle = Handle as unknown as ComponentType<Record<string, unknown>>
export default function FunnelCanvas({steps,links,onChange,onSelect,activeId,fullscreen,onDelete}:{steps:CanvasStep[];links:CanvasLink[];onChange:(steps:CanvasStep[],links:CanvasLink[])=>void;onSelect:(id:string)=>void;onDelete:(id:string)=>void;activeId:string|null;fullscreen:boolean}){
 const initialNodes=useMemo<Node[]>(()=>steps.map((s,i)=>({id:s.id,type:'stage',position:s.position||{x:70+(i%4)*325,y:80+Math.floor(i/4)*255},selected:s.id===activeId,data:{title:s.title,detail:s.detail,kind:s.kind,color:s.color,owner:s.owner,status:s.status,count:s.messages.length,index:i+1}})),[steps,activeId])
 const [nodes,setNodes]=useState<Node[]>(initialNodes)
 const nodesRef=useRef<Node[]>(initialNodes)
 const [selectionModifier,setSelectionModifier]=useState(false)
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(e.key==='Meta'||e.key==='Control'||e.metaKey||e.ctrlKey)setSelectionModifier(true)};const up=(e:KeyboardEvent)=>{if(e.key==='Meta'||e.key==='Control'||(!e.metaKey&&!e.ctrlKey))setSelectionModifier(false)};const blur=()=>setSelectionModifier(false);window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}},[])
 const [contextMenu,setContextMenu]=useState<{id:string;title:string;x:number;y:number;kind:'node'|'edge'}|null>(null)
 useEffect(()=>{setNodes(previous=>{const previousById=new Map(previous.map(n=>[n.id,n]));const updated=initialNodes.map(n=>({...n,selected:previousById.get(n.id)?.selected??n.selected}));nodesRef.current=updated;return updated})},[initialNodes])
 const edges=useMemo<Edge[]>(()=>links.filter(e=>steps.some(s=>s.id===e.source)&&steps.some(s=>s.id===e.target)).map(e=>({id:e.id,source:e.source,target:e.target,label:e.label,type:'smoothstep',animated:false,style:{stroke:'#9674c3',strokeWidth:2},labelStyle:{fontSize:11,fill:'#555'},labelBgStyle:{fill:'#fff',fillOpacity:.95}})),[links,steps])
 const handleNodesChange:OnNodesChange=useCallback(changes=>{setNodes(current=>{const next=applyNodeChanges(changes,current);nodesRef.current=next;return next})},[])
 const handleDragStop=useCallback((_:unknown,node:Node,draggedNodes?:Node[])=>{const moved=new Map((draggedNodes?.length?draggedNodes:[node]).map(n=>[n.id,n.position]));onChange(steps.map(s=>moved.has(s.id)?{...s,position:{...moved.get(s.id)!}}:s),links)},[steps,links,onChange])
 const handleContextMenu=useCallback((event:MouseEvent,node:Node)=>{event.preventDefault();setContextMenu({id:node.id,title:String(node.data.title||'Etapa'),x:Math.max(8,Math.min(event.clientX,window.innerWidth-220)),y:Math.max(8,Math.min(event.clientY,window.innerHeight-115)),kind:'node'})},[])
 const handleEdgeContextMenu=useCallback((event:MouseEvent,edge:Edge)=>{event.preventDefault();setContextMenu({id:edge.id,title:'Conexão entre etapas',x:Math.max(8,Math.min(event.clientX,window.innerWidth-220)),y:Math.max(8,Math.min(event.clientY,window.innerHeight-115)),kind:'edge'})},[])
 const connect=useCallback((c:Connection)=>{if(!c.source||!c.target||c.source===c.target)return;const next:CanvasLink={id:crypto.randomUUID(),source:c.source,target:c.target};onChange(steps,[...links,next])},[steps,links,onChange])
 return <div className={'fc-canvas '+(fullscreen?'fc-canvas-full':'')}><FlowView nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={handleNodesChange} onNodeDragStop={handleDragStop} onNodeContextMenu={handleContextMenu} onEdgeContextMenu={handleEdgeContextMenu} onPaneClick={()=>setContextMenu(null)} onConnect={connect} onNodeClick={(event: MouseEvent,node: Node)=>{if(!event.metaKey&&!event.ctrlKey)onSelect(node.id)}} onEdgesDelete={(deleted: Edge[])=>onChange(steps,links.filter(l=>!deleted.some(d=>d.id===l.id)))} nodesDraggable edgesReconnectable={false} edgesFocusable deleteKeyCode={['Backspace','Delete']} fitView fitViewOptions={{padding:.2,maxZoom:1.1}} minZoom={.15} maxZoom={2} panOnDrag={!selectionModifier} selectionOnDrag={selectionModifier} selectionKeyCode={null} multiSelectionKeyCode={['Meta','Control']} zoomOnScroll zoomOnPinch>
 <FlowBackground color="#e5e6ed" gap={22}/><FlowMiniMap pannable zoomable nodeColor={(n: Node)=>String(n.data.color||'#9674c3')} style={{border:'1px solid #e2e4e8',borderRadius:8}}/><FlowControls showInteractive={false}/>
 </FlowView>{contextMenu&&<div className="fc-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onContextMenu={event=>event.preventDefault()}><div className="fc-context-title">{contextMenu.title}</div><button type="button" onClick={()=>{if(contextMenu.kind==='edge'){onChange(steps,links.filter(link=>link.id!==contextMenu.id))}else if(window.confirm(`Excluir a etapa "${contextMenu.title}" e suas mensagens?`)){onDelete(contextMenu.id)}setContextMenu(null)}}>{contextMenu.kind==='edge'?'Excluir conexão':'Excluir etapa'}</button><button type="button" onClick={()=>setContextMenu(null)}>Cancelar</button></div>}<div className="fc-help"><GitBranch size={14}/> ⌘ + arrastar seleciona vários cards · Arraste um selecionado para mover o grupo · Conecte pelos pontos laterais · Use a roda para aproximar · Selecione uma linha e pressione Delete para remover</div></div>
}
