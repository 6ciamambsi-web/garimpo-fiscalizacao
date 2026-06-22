# Fiscalização de Garimpo/Draga — 3ª CIA PM MAmb

Sistema web para cadastramento, consulta e geração de relatórios de fiscalizações de dragas e garimpos. Desenvolvido em **Next.js 15 + TypeScript + Supabase**, com deploy na **Vercel**.

---

## Sumário

1. [Arquitetura](#arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Supabase](#1-configuração-do-supabase)
4. [Configuração do Google Sheets](#2-configuração-do-google-sheets)
5. [Configuração local](#3-configuração-local)
6. [Deploy na Vercel](#4-deploy-na-vercel)
7. [Primeiro acesso](#5-primeiro-acesso)
8. [Estrutura do projeto](#estrutura-do-projeto)
9. [Funcionalidades](#funcionalidades)
10. [Perfis de acesso](#perfis-de-acesso)

---

## Arquitetura

```
Next.js 15 (App Router)
  ├── Supabase (banco + autenticação)
  ├── Google Sheets API (leitura de militares/alvos + espelho de registros)
  └── Vercel (hospedagem + serverless functions)
```

---

## Pré-requisitos

- Node.js ≥ 18
- Conta no [Supabase](https://supabase.com) (Free tier suficiente)
- Conta no [Vercel](https://vercel.com)
- Projeto no [Google Cloud Console](https://console.cloud.google.com) com a API Google Sheets ativada
- Git

---

## 1. Configuração do Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Anote: **Project URL** e **Anon Key** (em *Settings > API*)
3. Anote também a **Service Role Key** (mesma página — mantenha em segredo!)

### 1.2 Executar o schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo completo do arquivo `supabase-schema.sql`
3. Verifique que as tabelas `usuarios`, `fiscalizacoes` e `audit_logs` foram criadas

### 1.3 Criar o primeiro usuário Admin

1. Vá em **Authentication > Users > Invite user**
2. Digite o e-mail do administrador e clique em **Send invite**
3. O usuário receberá o e-mail e criará a senha
4. Após a criação, vá em **SQL Editor** e execute:
   ```sql
   UPDATE public.usuarios
   SET perfil = 'admin_geral',
       nome = 'Seu Nome Completo',
       matricula = 'XXX.XXX-X',
       unidade = '3ª CIA PM MAmb'
   WHERE email = 'admin@seudominio.com.br';
   ```

### 1.4 Criar usuários adicionais

Repita o processo do item 1.3 para cada militar. Por padrão, novos usuários recebem perfil `operacional`. Para promover:
```sql
UPDATE public.usuarios SET perfil = 'admin' WHERE email = 'fulano@pmmg.mg.gov.br';
```

---

## 2. Configuração do Google Sheets

### 2.1 Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto (ou use um existente)
3. Ative a **Google Sheets API**: *APIs & Services > Enable APIs > Google Sheets API*
4. Vá em *IAM & Admin > Service Accounts > Create Service Account*
5. Nomeie (ex: `fiscalizacao-sheets`) e clique em **Done**
6. Clique na service account criada → **Keys > Add Key > Create new key > JSON**
7. Salve o arquivo JSON gerado (contém `client_email` e `private_key`)

### 2.2 Criar a planilha

1. Crie uma nova planilha no Google Sheets
2. Anote o **ID** da planilha (parte da URL: `https://docs.google.com/spreadsheets/d/**ID**/edit`)
3. Compartilhe a planilha com o e-mail da service account (com permissão de **Editor**)

### 2.3 Configurar abas

O sistema criará automaticamente as abas **MILITARES**, **ALVOS** e **FISCALIZAÇÕES** no primeiro uso.

Você também pode criá-las manualmente e preencher com dados:

**Aba MILITARES** (colunas: Nome Completo | Matrícula | Unidade | Função | Status)
```
3º Sgt PM João Silva | 146.000-1 | 3ª CIA PM MAmb | Fiscal Ambiental | ATIVO
```

**Aba ALVOS** (colunas: Nome do Alvo | Tipo | Município | Observações | Status)
```
Draga do João | Draga de Sucção | Aiuruoca | Área de aluvião | ATIVO
```

---

## 3. Configuração local

### 3.1 Clonar e instalar

```bash
git clone https://github.com/seu-usuario/garimpo-fiscalizacao.git
cd garimpo-fiscalizacao
npm install
```

### 3.2 Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets (do arquivo JSON da service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=fiscalizacao@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

# App
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Dica para GOOGLE_PRIVATE_KEY:** No arquivo JSON da service account, copie o valor de `private_key` e substitua as quebras de linha `\n` reais pela string `\n`. A variável deve ficar toda em uma linha, com `"` no início e fim.

### 3.3 Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 4. Deploy na Vercel

### 4.1 Via GitHub (recomendado)

1. Suba o projeto para um repositório GitHub (pode ser privado)
2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório
4. Configure as variáveis de ambiente (mesmo conteúdo do `.env.local`)
5. Clique em **Deploy**

### 4.2 Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 4.3 Configurar variáveis na Vercel

Em *Project Settings > Environment Variables*, adicione todas as variáveis do `.env.example`:

| Variável | Ambiente |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Production, Preview |
| `GOOGLE_PRIVATE_KEY` | Production, Preview |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Production |

> **Atenção:** `SUPABASE_SERVICE_ROLE_KEY` e `GOOGLE_PRIVATE_KEY` **nunca** devem ser prefixadas com `NEXT_PUBLIC_` pois são segredos server-side.

---

## 5. Primeiro acesso

1. Acesse a URL do sistema (local ou Vercel)
2. Você será redirecionado para `/login`
3. Entre com o e-mail e senha criados no Supabase
4. O sistema estará pronto para uso

---

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx                  # Layout raiz
│   ├── page.tsx                    # Dashboard (Server Component)
│   ├── dashboard-client.tsx        # Dashboard (Client Component)
│   ├── globals.css                 # Estilos globais + Tailwind
│   ├── login/
│   │   └── page.tsx                # Tela de login
│   └── api/
│       ├── fiscalizacoes/
│       │   ├── route.ts            # GET (lista) + POST (criar)
│       │   └── [id]/route.ts       # GET + PUT + DELETE por ID
│       ├── militares/route.ts      # Lê militares do Google Sheets
│       ├── alvos/route.ts          # Lê alvos do Google Sheets
│       └── auth/signout/route.ts   # Logout
├── components/
│   ├── Navbar.tsx                  # Barra de navegação
│   ├── FiscalizacaoForm.tsx        # Formulário completo
│   ├── FiscalizacoesList.tsx       # Lista com filtros e paginação
│   ├── FiscalizacaoDetalhe.tsx     # Modal de visualização
│   └── form/
│       ├── SecaoDadosGerais.tsx
│       ├── SecaoResponsavel.tsx
│       ├── SecaoTrabalhadores.tsx
│       ├── SecaoEstrutura.tsx
│       └── SecaoCaracteristicas.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente browser
│   │   └── server.ts               # Cliente server + service role
│   ├── auth.ts                     # Helpers de autenticação e auditoria
│   ├── google-sheets.ts            # Integração Google Sheets API
│   ├── pdf-generator.ts            # Geração de PDF com jsPDF
│   └── masks.ts                    # Máscaras e validações
├── types/
│   └── index.ts                    # Tipos TypeScript
└── middleware.ts                   # Proteção de rotas
```

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Login seguro** | Supabase Auth com e-mail e senha |
| **Formulário completo** | 34 campos organizados em 6 seções |
| **Equipe responsável** | Seleção múltipla de militares (do Google Sheets) |
| **Alvo fiscalizado** | Lista carregada do Google Sheets |
| **Trabalhadores** | Tabela dinâmica com add/remove de linhas |
| **Estrutura operacional** | 12 campos numéricos com visual de cards |
| **Coordenadas** | Entrada decimal com validação |
| **Máscaras** | CPF (000.000.000-00), Telefone ((00) 00000-0000) |
| **Geração de PDF** | Relatório profissional com cabeçalho PMMG e assinaturas |
| **Filtros** | Por data, município, título minerário |
| **Paginação** | 15 registros por página com navegação |
| **Auditoria** | Log de todas as ações (INSERT, UPDATE, DELETE) |
| **Google Sheets** | Espelho automático de novos registros |
| **Responsivo** | Funciona em celular, tablet e desktop |

---

## Perfis de acesso

| Perfil | Cadastrar | Editar próprio | Editar todos | Excluir | Auditoria |
|---|---|---|---|---|---|
| `operacional` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `admin_geral` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Suporte

Em caso de dúvidas ou problemas, entre em contato com o administrador do sistema.
