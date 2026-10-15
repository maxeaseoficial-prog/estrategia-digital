// @ts-nocheck — temporary compatibility shim for conflicting React JSX types in @xyflow/react.
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, addEdge, type Connection, type Edge, type Node, type NodeProps, type OnNodesChange, applyNodeChanges } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GitBranch, MessageSquareText, UserRound } from 'lucide-react'

export type CanvasStep = { id:string; title:string; detail:string; kind:string; color:string; messages:{id:string}[]; owner?:string; status?:string; position?:{x:number;y:number} }
export type CanvasLink = { id:string; source:string; target:string; label?:string }
function StageNode({data,selected}:NodeProps) {
 const s=data as { title:string; detail:string; kind:string; color:string; owner?:string; status?:string; count:number; index:number }
 return <div className={'fc-node '+(selected?'fc-selected':'')} style={{borderTopColor:s.color}}>
  <FlowHandle type="target" position={Position.Left} className="fc-handle"/>
  <div className="fc-node-meta"><span className="fc-index" style={{background:s.color}}>{s.index}</span><span>{s.kind}</span></div>
  <strong>{s.title}</strong><p>{s.detail}</p>
  <div className="fc-node-footer"><span><MessageSquareText size={13}/> {s.count}</span><span><UserRound size={13}/> {s.owner||'Sem responsável'}</span></div>
  <div className="fc-node-status">{s.status||'Planejada'}</div>
  <FlowHandle type="source" position={Position.Right} className="fc-handle"/>
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
 const [contextMenu,setContextMenu]=useState<{id:string;title:string;x:number;y:number}|null>(null)
 useEffect(()=>{setNodes(previous=>initialNodes.map(n=>({...n,position:previous.find(old=>old.id===n.id)?.position||n.position,selected:n.selected})))},[initialNodes])
 const edges=useMemo<Edge[]>(()=>links.filter(e=>steps.some(s=>s.id===e.source)&&steps.some(s=>s.id===e.target)).map(e=>({id:e.id,source:e.source,target:e.target,label:e.label,type:'smoothstep',animated:false,style:{stroke:'#9674c3',strokeWidth:2},labelStyle:{fontSize:11,fill:'#555'},labelBgStyle:{fill:'#fff',fillOpacity:.95}})),[links,steps])
 const handleNodesChange:OnNodesChange=useCallback(changes=>{setNodes(current=>applyNodeChanges(changes,current))},[])
 const handleDragStop=useCallback((_:unknown,node:Node)=>{onChange(steps.map(s=>s.id===node.id?{...s,position:{...node.position}}:s),links)},[steps,links,onChange])
 const handleContextMenu=useCallback((event:MouseEvent,node:Node)=>{event.preventDefault();setContextMenu({id:node.id,title:String(node.data.title||'Etapa'),x:Math.min(event.clientX,window.innerWidth-220),y:Math.min(event.clientY,window.innerHeight-100)})},[])
 const connect=useCallback((c:Connection)=>{if(!c.source||!c.target||c.source===c.target)return;const next=addEdge(c,edges);onChange(steps,next.map(e=>({id:e.id,source:e.source,target:e.target,label:typeof e.label==='string'?e.label:undefined})))},[steps,edges,onChange])
 return <div className={'fc-canvas '+(fullscreen?'fc-canvas-full':'')}><FlowView nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={handleNodesChange} onNodeDragStop={handleDragStop} onNodeContextMenu={handleContextMenu} onPaneClick={()=>setContextMenu(null)} onConnect={connect} onNodeClick={(_: unknown,node: Node)=>onSelect(node.id)} onEdgesDelete={(deleted: Edge[])=>onChange(steps,links.filter(l=>!deleted.some(d=>d.id===l.id)))} nodesDraggable edgesReconnectable={false} edgesFocusable deleteKeyCode={['Backspace','Delete']} fitView fitViewOptions={{padding:.2,maxZoom:1.1}} minZoom={.15} maxZoom={2} panOnDrag selectionOnDrag={false} zoomOnScroll zoomOnPinch>
 <FlowBackground color="#e5e6ed" gap={22}/><FlowMiniMap pannable zoomable nodeColor={(n: Node)=>String(n.data.color||'#9674c3')} style={{border:'1px solid #e2e4e8',borderRadius:8}}/><FlowControls showInteractive={false}/>
 </FlowView>{contextMenu&&<div className="fc-context-menu" style={{left:contextMenu.x,top:contextMenu.y}}><div className="fc-context-title">{contextMenu.title}</div><button type="button" onClick={()=>{if(window.confirm(`Excluir a etapa "${contextMenu.title}" e suas mensagens?`)){onDelete(contextMenu.id)}setContextMenu(null)}}>Excluir etapa</button><button type="button" onClick={()=>setContextMenu(null)}>Cancelar</button></div>}<div className="fc-help"><GitBranch size={14}/> Arraste etapas · Conecte pelos pontos laterais · Use a roda para aproximar · Selecione uma linha e pressione Delete para remover</div></div>
}
