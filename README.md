# Strategy — Eventos & Campanhas

MVP para gerenciamento simples de eventos e campanhas estratégicas.

## O que já funciona

- Dashboard com próximo evento, contagem regressiva, ingressos e campanhas ativas
- Calendário com visualização por mês, semana e dia
- Cadastro, edição, ativação, desativação e exclusão de eventos
- Cadastro, edição, ativação, desativação e exclusão de campanhas
- Vinculação opcional de campanha a um evento
- Eventos e campanhas exibidos diretamente no calendário
- Sidebar recolhível
- Persistência local no navegador via `localStorage`
- Interface responsiva com identidade em prata / grafite

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## MVP

Nesta primeira versão não há autenticação nem banco remoto. Os dados ficam salvos no navegador do dispositivo atual. A próxima evolução natural é adicionar Supabase para sincronização, usuários e acesso em múltiplos dispositivos.
