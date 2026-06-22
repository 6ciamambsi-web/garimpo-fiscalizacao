-- ============================================================
-- SCHEMA: Fiscalização de Garimpo/Draga — 3ª CIA PM MAmb
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── Extensões ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabela: usuarios ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  matricula   TEXT,
  unidade     TEXT DEFAULT '3ª CIA PM MAmb',
  perfil      TEXT NOT NULL DEFAULT 'operacional'
              CHECK (perfil IN ('admin_geral', 'admin', 'operacional')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: fiscalizacoes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fiscalizacoes (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Equipe
  equipe_ids                      TEXT[] DEFAULT '{}',
  equipe_nomes                    TEXT[] DEFAULT '{}',

  -- Alvo
  alvo_id                         TEXT,
  alvo_nome                       TEXT,

  -- Localização
  municipio                       TEXT NOT NULL,
  coordenadas_lat                 DOUBLE PRECISION,
  coordenadas_lng                 DOUBLE PRECISION,
  hora_abordagem                  TIME,

  -- Responsáveis
  responsavel_local               TEXT,
  responsavel_principal_nome      TEXT,
  responsavel_principal_cpf       TEXT,
  responsavel_principal_rg        TEXT,
  responsavel_principal_endereco  TEXT,
  responsavel_principal_telefones TEXT[] DEFAULT '{}',

  -- Trabalhadores
  qtd_trabalhadores               INTEGER DEFAULT 0,
  trabalhadores                   JSONB DEFAULT '[]',

  -- Estrutura operacional
  qtd_balsa_draga                 INTEGER DEFAULT 0,
  qtd_motores                     INTEGER DEFAULT 0,
  qtd_bombas_succao               INTEGER DEFAULT 0,
  qtd_compressores                INTEGER DEFAULT 0,
  qtd_geradores                   INTEGER DEFAULT 0,
  qtd_embarcacoes_apoio           INTEGER DEFAULT 0,
  qtd_roupas_mergulho             INTEGER DEFAULT 0,
  qtd_mascaras_mergulho           INTEGER DEFAULT 0,
  qtd_bateias                     INTEGER DEFAULT 0,
  qtd_respiradores                INTEGER DEFAULT 0,
  qtd_balancas                    INTEGER DEFAULT 0,
  qtd_frascos_mercurio            INTEGER DEFAULT 0,

  -- Características operacionais
  horario_funcionamento           TEXT,
  dias_operacao_semana            INTEGER,
  producao_diaria_estimada        TEXT,
  data_inicio_operacao            DATE,
  metodo_garimpo                  TEXT NOT NULL DEFAULT 'dragagem_aiuruoca'
                                  CHECK (metodo_garimpo IN (
                                    'dragagem_aiuruoca','dragagem_verde','dragagem_baependi',
                                    'dragagem_acumulo','outro'
                                  )),
  metodo_garimpo_outro            TEXT,
  qtd_ouro_gramas                 NUMERIC(10,3),

  -- Situação minerária
  titulo_minerario                TEXT NOT NULL DEFAULT 'clandestino'
                                  CHECK (titulo_minerario IN (
                                    'clandestino','portaria_lavra','permissao_lavra',
                                    'licenciamento','registro_extracao','alvara_pesquisa','outro'
                                  )),
  titulo_minerario_outro          TEXT,
  numero_processo_minerario       TEXT,
  informacoes_complementares      TEXT,

  -- Metadados
  usuario_id                      UUID REFERENCES public.usuarios(id),
  usuario_nome                    TEXT,
  status                          TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: audit_logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id       UUID,
  usuario_nome     TEXT,
  acao             TEXT NOT NULL CHECK (acao IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')),
  tabela           TEXT NOT NULL,
  registro_id      TEXT,
  dados_anteriores JSONB,
  dados_novos      JSONB,
  ip               TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_municipio    ON public.fiscalizacoes(municipio);
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_created_at   ON public.fiscalizacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_usuario_id   ON public.fiscalizacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_titulo       ON public.fiscalizacoes(titulo_minerario);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id      ON public.audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at      ON public.audit_logs(created_at DESC);

-- ── RLS: Row Level Security ─────────────────────────────────
ALTER TABLE public.usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscalizacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

-- Usuários: cada um vê o próprio perfil; admins veem todos
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('admin', 'admin_geral')
    )
  );

-- Fiscalizações: todos os usuários autenticados podem ler
CREATE POLICY "fiscalizacoes_select" ON public.fiscalizacoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fiscalizações: usuários autenticados podem inserir
CREATE POLICY "fiscalizacoes_insert" ON public.fiscalizacoes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fiscalizações: autor ou admin pode editar
CREATE POLICY "fiscalizacoes_update" ON public.fiscalizacoes
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('admin', 'admin_geral')
    )
  );

-- Fiscalizações: apenas admins podem excluir
CREATE POLICY "fiscalizacoes_delete" ON public.fiscalizacoes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('admin', 'admin_geral')
    )
  );

-- Audit logs: somente admin_geral lê
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil = 'admin_geral'
    )
  );

-- Audit logs: service role pode inserir (via API)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ── Trigger: atualizar updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fiscalizacoes_updated_at
  BEFORE UPDATE ON public.fiscalizacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Trigger: auto-criar usuário na tabela pública ──────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Exemplo: inserir usuário admin inicial ──────────────────
-- (Execute APÓS criar o usuário pelo Supabase Auth Dashboard)
-- UPDATE public.usuarios
-- SET perfil = 'admin_geral', nome = 'Administrador', matricula = '000000-0'
-- WHERE email = 'admin@pmmg.mg.gov.br';
