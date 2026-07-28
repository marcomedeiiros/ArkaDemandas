# ARKA TECNOLOGIA - Sistema de Gerenciamento de Demandas

Sistema para gerenciamento de demandas

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + dnd-kit
- **Backend:** Node.js + Express + SQLite + WebSocket
- **Exportação:** Excel, CSV, PDF

## Instalação

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

## Executar

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Produção

```bash
npm run build
npm start
```

## Funcionalidades

- Splash Screen com logo ARKA (3 segundos)
- Kanban com 5 colunas e Drag & Drop
- Dashboard com estatísticas e gráficos
- Histórico completo de ações com filtros
- Modo TV (tela cheia, fontes grandes)
- Atualização automática a cada 10 segundos
- WebSocket para sincronização em tempo real
- Exportação CSV, Excel e PDF
- Sem autenticação (uso interno/TV)