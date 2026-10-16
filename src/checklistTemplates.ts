export type ChecklistItem = {id:string;title:string;done:boolean}
const templates:Record<string,string[]>={
 'Anúncio Meta Ads':['BM / portfólio empresarial configurado','Conta de anúncios e permissões verificadas','Forma de pagamento configurada','Pixel / dataset e eventos verificados','Público-alvo definido','Campanha e conjunto de anúncios criados','Criativos e copies inseridos','Links, UTMs e rastreamento testados','Campanha revisada e aprovada'],
 'Conteúdo orgânico':['Tema e objetivo definidos','Gancho e roteiro preparados','Gravação concluída','Edição e legendas concluídas','Capa e descrição aprovadas','Publicação agendada','Publicação conferida'],
 'Live':['Plataforma e link de acesso definidos','Data e horário confirmados','Tema e roteiro definidos','Responsável / apresentador confirmado','Convite e CTA revisados','Áudio, vídeo e conexão testados','Lembretes aos inscritos programados','Transmissão realizada'],
 'Pitch e CTA':['Oferta e objetivo definidos','Texto do pitch escrito','CTA e link validados','Apresentador orientado','Pitch revisado e aprovado'],
 'Landing page':['Objetivo e copy definidos','Layout aprovado','Formulário e integração configurados','Versão mobile testada','Links e rastreamento verificados','Página publicada'],
 'Formulário / diagnóstico':['Perguntas e campos definidos','Captura e consentimento configurados','Página de conclusão preparada','Integração e tags configuradas','Teste completo de envio realizado'],
 'Recuperação de formulário':['Evento de abandono identificado','Critério e prazo de abandono definidos','Público elegível e consentimento revisados','Mensagem inicial criada','Cadência e intervalos definidos','Parada após conclusão configurada','Sequência testada'],
 'Página de vendas':['Copy e oferta aprovadas','Benefícios e objeções revisados','CTA e checkout conectados','Preço e condições conferidos','Página mobile testada','Rastreamento testado'],
 'Checkout':['Produto e preço cadastrados','Formas de pagamento testadas','Dados de compra e acesso revisados','Evento de compra configurado','Página de obrigado validada','Compra teste concluída'],
 'Abandono de checkout':['Abandono detectado corretamente','Contatos elegíveis definidos','Mensagem inicial criada','Cadência de recuperação configurada','Parada ao comprar configurada','Teste do fluxo realizado'],
 'Follow-up WhatsApp':['Canal e ferramenta configurados','Público e consentimento verificados','Mensagem inicial criada','Intervalo da cadência definido','Responsável pela resposta definido','Regra de saída configurada','Fluxo testado'],
 'Boas-vindas WhatsApp':['WhatsApp Business configurado','Grupo ou comunidade criado','Administradores adicionados','Nome, foto e descrição adicionados','Permissão de mensagens definida','Link de convite criado e testado','Mensagem de boas-vindas criada','Entrada de participante testada'],
 'Aquecimento / nutrição':['Objetivo da sequência definido','Público e regras de entrada definidos','Cadência criada','Mensagem inicial criada','Mensagens intermediárias cadastradas','Ferramenta e responsável definidos','Condições de parada configuradas','Sequência revisada e testada'],
 'Lembrete de evento':['Data e horário confirmados','Mensagem de lembrete criada','Link de acesso validado','Horários de disparo configurados','Público e ferramenta definidos','Disparo de teste realizado'],
 'Lead ausente na live':['Critério de ausência definido','Lista de ausentes preparada','Mensagem pós-live criada','Replay ou resumo disponível','Cadência e regras de parada definidas','Follow-up testado'],
 'Remarketing':['Públicos de engajamento criados','Exclusões de convertidos configuradas','Criativos aprovados','Campanha e orçamento definidos','Eventos de conversão testados','Campanha revisada'],
 'Oferta / pitch de vendas':['Condições da oferta definidas','Pitch escrito e aprovado','Página e checkout testados','Prova social e objeções revisadas','CTA e prazo conferidos','Equipe orientada'],
 'Confirmação de compra':['Evento de compra identificado','Mensagem de confirmação criada','Acesso ou ingresso conferido','Dados do cliente registrados','Integração testada'],
 'Pós-venda':['Mensagem inicial criada','Entrega e acesso conferidos','Responsável pelo acompanhamento definido','Cadência de relacionamento preparada','Pedido de feedback configurado'],
 'Pesquisa / feedback':['Perguntas definidas','Formulário criado','Link testado','Mensagem de convite preparada','Responsável pela análise definido'],
 'Decisão / condição':['Condição de entrada documentada','Caminho positivo configurado','Caminho negativo configurado','Regras de saída verificadas','Ambos os caminhos testados'],
 'Etapa personalizada':['Objetivo definido','Responsável designado','Recursos configurados','Etapa revisada e validada']
}
export const createChecklist=(kind:string):ChecklistItem[] => (templates[kind]||templates['Etapa personalizada']).map(title=>({id:crypto.randomUUID(),title,done:false}))
