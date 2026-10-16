import {useEffect,useMemo,useState} from 'react'
import {Plus,Trash2,Copy,ArrowRight,MessageSquareText} from 'lucide-react'
import './salesCadence.css'
type SalesStep={id:string;title:string;delay:number;unit:'horas'|'dias';goal:string;message:string;status:'Rascunho'|'Pronto';channel:string;condition:string}
type SalesPlan={product:string;priceNote:string;steps:SalesStep[]}
const KEY='strategy-sales-cadences-v1'
const PRODUCT_KEY='strategy-sales-cadences-by-product-v1'
type Product='Lucro 2x'|'RPM Summit'
const PRODUCTS:Product[]=['Lucro 2x','RPM Summit']
const make=(title:string,delay:number,unit:'horas'|'dias',goal:string,message:string,condition:string):SalesStep=>({id:crypto.randomUUID(),title,delay,unit,goal,message,status:'Rascunho',channel:'WhatsApp X1',condition})
const base=():SalesPlan=>({product:'Lucro 2x',priceNote:'Live paga — informe o valor e as condições na página oficial de inscrição.',steps:[
 make('Abordagem consultiva',0,'horas','Conectar o Raio-X à necessidade do empresário','Olá, [NOME]! Aqui é da equipe do Leonardo Froese. Vi que no seu Raio-X você apontou [DIFICULDADE] como um desafio. No Lucro 2x vamos aprofundar esses vazamentos e mostrar como organizar um plano prático. Posso te explicar como funciona o encontro e as condições de participação?','Raio-X concluído + contato autorizado; ainda não comprou'),
 make('Reforço de valor',1,'dias','Mostrar o benefício sem insistir','[NOME], pensando no desafio que você relatou, o ponto não é apenas vender mais, mas entender o que está consumindo o lucro. No Lucro 2x, o Leonardo vai trabalhar prioridades e próximos passos. Você gostaria de conhecer os temas do encontro?','Não respondeu ou demonstrou interesse; ainda não comprou'),
 make('Material e prova contextualizada',3,'dias','Aprofundar a confiança','[NOME], separei um material sobre gestão e vazamentos de lucro que tem relação com [DIFICULDADE]. Posso te enviar? Depois, se fizer sentido, te explico como participar do Lucro 2x.','Contato elegível; material e exemplos reais disponíveis'),
 make('Esclarecer objeção',5,'dias','Entender o que impede a inscrição','[NOME], ficou alguma dúvida sobre o Lucro 2x — conteúdo, horário ou investimento? Posso esclarecer rapidamente para você decidir se vale a pena participar.','Demonstrou interesse, mas não realizou a compra'),
 make('Encerramento respeitoso',7,'dias','Encerrar o acompanhamento sem pressão','[NOME], vou encerrar por aqui meus lembretes sobre o Lucro 2x para não ocupar seu WhatsApp. Se quiser conhecer a proposta ou tirar uma dúvida depois, é só me chamar.','Sem resposta após os contatos anteriores; encerrar sequência')
 ]})
const rpmBase=():SalesPlan=>({product:'RPM Summit',priceNote:'Encontro presencial em Cuiabá · R$ 147 · 1 ingresso dá direito a 2 participantes',steps:[
 make('Convite após o Lucro 2x',0,'horas','Conectar o conteúdo à experiência presencial','Olá, [NOME]! Aqui é da equipe do Leonardo Froese. Obrigado pelo interesse no Lucro 2x. O próximo passo é o RPM Summit, um encontro presencial em Cuiabá para trabalhar Raiz, Prioridade e Métrica na gestão da empresa. O ingresso custa R$ 147 e dá direito a levar um convidado, sócio ou amigo. Posso te passar os detalhes do evento?','Participou ou demonstrou interesse no Lucro 2x; autorizou o contato; ainda não comprou'),
 make('Benefício do ingresso duplo',1,'dias','Mostrar o valor de levar outro decisor','[NOME], lembrei de um detalhe importante sobre o RPM Summit: o ingresso de R$ 147 é duplo. Você pode levar alguém que participe das decisões da sua empresa — por exemplo, seu sócio ou gestor — para os dois saírem alinhados sobre prioridades e métricas. Faz sentido para você participar acompanhado?','Lead interessado; sem compra confirmada'),
 make('Conteúdo e prova real',3,'dias','Aprofundar a confiança e esclarecer a proposta','[NOME], uma dificuldade que vários empresários enfrentam é saber o que precisa mudar, mas não conseguir priorizar. No RPM Summit vamos trabalhar isso presencialmente. Se quiser, posso encaminhar a programação e um depoimento real relacionado ao seu desafio. Gostaria de receber?','Contato elegível; usar somente programação e depoimentos reais disponíveis'),
 make('Entender a objeção',5,'dias','Identificar impedimentos sem pressão','[NOME], ficou alguma dúvida sobre o RPM Summit? Pode ser a data, o deslocamento até Cuiabá, o conteúdo ou o investimento. Se me disser qual ponto está pesando mais, eu consigo esclarecer e você avalia se faz sentido para sua empresa.','Demonstrou interesse; ainda não comprou'),
 make('Último acompanhamento',7,'dias','Encerrar o contato com respeito','[NOME], vou encerrar meus lembretes sobre o RPM Summit para não ocupar seu WhatsApp. Se quiser consultar os detalhes, o ingresso duplo de R$ 147 ou tirar alguma dúvida, pode falar comigo por aqui. Obrigado pelo contato!','Não respondeu à cadência; interromper tentativas após esta mensagem')
 ]})
function initialPlan(funnelId:string,product:Product):SalesPlan{
 try {
  const saved=JSON.parse(localStorage.getItem(PRODUCT_KEY)||'{}')
  const plan=saved[funnelId]?.[product]
  if(plan?.product===product&&Array.isArray(plan.steps))return plan
  if(product==='Lucro 2x'){
   const legacy=JSON.parse(localStorage.getItem(KEY)||'{}')[funnelId]
   if(legacy?.product==='Lucro 2x'&&Array.isArray(legacy.steps))return legacy
  }
 }catch{ /* storage unavailable or corrupt */ }
 return product==='RPM Summit'?rpmBase():base()
}
export default function SalesCadence({funnelId}:{funnelId:string}){
 const [product,setProduct]=useState<Product>('Lucro 2x')
 return <SalesProductCadence key={funnelId+'-'+product} funnelId={funnelId} product={product} onProduct={setProduct}/>
}
function SalesProductCadence({funnelId,product,onProduct}:{funnelId:string;product:Product;onProduct:(product:Product)=>void}){

 const [plan,setPlan]=useState<SalesPlan>(()=>initialPlan(funnelId,product))
 const [active,setActive]=useState<string|null>(null)
 const [mode,setMode]=useState<'sequence'|'list'>('sequence')
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(PRODUCT_KEY)||'{}');saved[funnelId]={...(saved[funnelId]||{}),[product]:plan};localStorage.setItem(PRODUCT_KEY,JSON.stringify(saved))}catch(err){console.error('Falha ao salvar o protocolo',err)}},[plan,funnelId,product])
 const sorted=useMemo(()=>[...plan.steps].sort((a,b)=>(a.unit==='dias'?a.delay*24:a.delay)-(b.unit==='dias'?b.delay*24:b.delay)),[plan.steps])
 const current=plan.steps.find(s=>s.id===active)
 const update=(id:string,part:Partial<SalesStep>)=>setPlan(p=>({...p,steps:p.steps.map(s=>s.id===id?{...s,...part}:s)}))
 return <div className="sc-root">
 <div className="sc-products"><span>Produto</span>{PRODUCTS.map(p=><button key={p} className={p===product?'active':''} onClick={()=>onProduct(p)}>{p}</button>)}</div>
 <div className="sc-head"><div><span className="fn-kicker">PROTOCOLO DE VENDAS POR PRODUTO</span><h3>{product} — Conversão pelo WhatsApp</h3><p>{product==='RPM Summit'?'Encontro presencial em Cuiabá · ingresso duplo por R$ 147.':'Sequência consultiva após o Raio-X para empresários que ainda não compraram.'}</p></div><button className="primary-button" onClick={()=>{const n=make('Novo contato',1,'dias','Definir objetivo','','Lead elegível');setPlan(p=>({...p,steps:[...p.steps,n]}));setActive(n.id)}}><Plus size={16}/> Adicionar contato</button></div>
 <div className="sc-rule"><strong>Condição de entrada</strong><p>{product==='RPM Summit'?'Participou ou demonstrou interesse no Lucro 2x, autorizou o contato e ainda não comprou ingresso do RPM Summit.':'Raio-X concluído, contato autorizado e inscrição paga ainda não confirmada.'}</p><strong>Regra de saída</strong><p>Interromper se o lead comprar, recusar, pedir para parar ou deixar de estar elegível. Respostas devem encaminhar para atendimento humano.</p><span>Cadência planejada — nenhum disparo automático está ativo.</span></div>
 <div className="sc-toolbar"><span>{plan.steps.length} contatos · {plan.priceNote}</span><div><button className={mode==='sequence'?'active':''} onClick={()=>setMode('sequence')}>Sequência</button><button className={mode==='list'?'active':''} onClick={()=>setMode('list')}>Lista</button></div></div>
 {mode==='sequence'?<div className="sc-track">{sorted.map((s,i)=><div className="sc-part" key={s.id}><button className="sc-card" onClick={()=>setActive(s.id)}><div className="sc-card-top"><MessageSquareText size={18}/><span>{s.delay===0?'D0':'+'+s.delay+(s.unit==='dias'?'d':'h')}</span></div><strong>{s.title}</strong><p>{s.goal}</p><small>{s.channel} · {s.status}</small></button>{i<sorted.length-1&&<ArrowRight size={19} color="#9674c3"/>}</div>)}</div>:<div className="sc-list">{sorted.map(s=><button key={s.id} onClick={()=>setActive(s.id)}><strong>{s.title}</strong><span>{s.delay===0?'D0':'+'+s.delay+(s.unit==='dias'?'d':'h')}</span><span>{s.goal}</span><span>{s.status}</span></button>)}</div>}
 <p className="sc-foot">Os intervalos são calculados desde a entrada do lead no protocolo. Todas as mensagens podem ser editadas.</p>
 {current&&<div className="sc-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><div className="sc-editor" role="dialog" aria-modal="true"><div className="sc-editor-head"><h3>Editar contato comercial</h3><button onClick={()=>setActive(null)}>×</button></div><div className="sc-editor-body"><label>Título<input value={current.title} onChange={e=>update(current.id,{title:e.target.value})}/></label><div className="sc-pair"><label>Enviar após<input type="number" min="0" value={current.delay} onChange={e=>update(current.id,{delay:Math.max(0,Number(e.target.value)||0)})}/></label><label>Unidade<select value={current.unit} onChange={e=>update(current.id,{unit:e.target.value as SalesStep['unit']})}><option value="horas">Horas</option><option value="dias">Dias</option></select></label></div><label>Objetivo<input value={current.goal} onChange={e=>update(current.id,{goal:e.target.value})}/></label><label>Gatilho / condição<input value={current.condition} onChange={e=>update(current.id,{condition:e.target.value})}/></label><label>Canal<input value={current.channel} onChange={e=>update(current.id,{channel:e.target.value})}/></label><label>Mensagem<textarea rows={9} value={current.message} onChange={e=>update(current.id,{message:e.target.value})}/></label><label>Status<select value={current.status} onChange={e=>update(current.id,{status:e.target.value as SalesStep['status']})}><option>Rascunho</option><option>Pronto</option></select></label></div><div className="sc-editor-actions"><button className="sc-danger" onClick={()=>{setPlan(p=>({...p,steps:p.steps.filter(x=>x.id!==current.id)}));setActive(null)}}><Trash2 size={15}/> Excluir</button><button className="secondary-button" onClick={()=>{setPlan(p=>({...p,steps:[...p.steps,{...current,id:crypto.randomUUID(),title:current.title+' (cópia)'}]}));setActive(null)}}><Copy size={15}/> Duplicar</button><button className="primary-button" onClick={()=>setActive(null)}>Concluir</button></div></div></div>}
 </div>
}
