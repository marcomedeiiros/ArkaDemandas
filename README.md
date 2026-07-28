# ARKA TECNOLOGIA - Sistema de Gerenciamento de Demandas

Sistema web moderno para gerenciamento de demandas, otimizado para exibição em TVs de 43" ou maiores.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + dnd-kit
- **Backend:** Node.js + Express + SQLite + WebSocket
- **Exportação:** Excel, CSV, PDF

## Instalação

```bash
# Instalar dependências
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

## Executar

```bash
# Desenvolvimento (frontend + backend simultâneos)
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

## Identidade Visual

- Fundo: #0A0A0A
- Azul principal: #0066FF
- Logo branca
- Prioridades: Verde (Baixa), Amarelo (Média), Laranja (Alta), Vermelho (Urgente)

## Logo

Substitua `client/public/logo.svg` pela logo oficial da ARKA TECNOLOGIA.
# ArkaDemandas
