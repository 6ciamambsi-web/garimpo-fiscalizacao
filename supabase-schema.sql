-- ============================================================
-- SCHEMA ATUALIZADO — 5ª CIA PM MAmb
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tabela: usuarios ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  npm              TEXT NOT NULL UNIQUE,
  posto_graduacao  TEXT DEFAULT '',
  unidade          TEXT DEFAULT '5ª CIA PM MAmb',
  perfil           TEXT NOT NULL DEFAULT 'operacional'
                   CHECK (perfil IN ('admin', 'operacional')),
  ativo            BOOLEAN NOT NULL DEFAULT true,
  primeiro_acesso  BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: fiscalizacoes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fiscalizacoes (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipe_ids                      TEXT[] DEFAULT '{}',
  equipe_nomes                    TEXT[] DEFAULT '{}',
  alvo_id                         TEXT,
  alvo_nome                       TEXT,
  municipio                       TEXT NOT NULL,
  coordenadas_lat                 DOUBLE PRECISION,
  coordenadas_lng                 DOUBLE PRECISION,
  hora_abordagem                  TEXT,
  responsavel_local               TEXT,
  responsavel_principal_nome      TEXT,
  responsavel_principal_cpf       TEXT,
  responsavel_principal_rg        TEXT,
  responsavel_principal_endereco  TEXT,
  responsavel_principal_telefones TEXT[] DEFAULT '{}',
  qtd_trabalhadores               INTEGER DEFAULT 0,
  trabalhadores                   JSONB DEFAULT '[]',
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
  horario_funcionamento           TEXT,
  dias_operacao_semana            INTEGER,
  producao_diaria_estimada        TEXT,
  data_inicio_operacao            DATE,
  metodo_garimpo                  TEXT NOT NULL DEFAULT 'dragagem_aiuruoca',
  metodo_garimpo_outro            TEXT,
  qtd_ouro_gramas                 NUMERIC(10,3),
  titulo_minerario                TEXT NOT NULL DEFAULT 'clandestino',
  titulo_minerario_outro          TEXT,
  numero_processo_minerario       TEXT,
  informacoes_complementares      TEXT,
  usuario_id                      UUID REFERENCES public.usuarios(id),
  usuario_nome                    TEXT,
  usuario_npm                     TEXT,
  status                          TEXT DEFAULT 'ativo',
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: audit_logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id       UUID,
  usuario_npm      TEXT,
  usuario_nome     TEXT,
  acao             TEXT NOT NULL,
  tabela           TEXT NOT NULL,
  registro_id      TEXT,
  dados_anteriores JSONB,
  dados_novos      JSONB,
  ip               TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_municipio  ON public.fiscalizacoes(municipio);
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_created_at ON public.fiscalizacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscalizacoes_usuario_id ON public.fiscalizacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_npm             ON public.usuarios(npm);

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscalizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs    ENABLE ROW LEVEL SECURITY;

-- Usuários: autenticados leem todos (para listar equipe)
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "usuarios_update_admin" ON public.usuarios
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
  );

CREATE POLICY "usuarios_insert_admin" ON public.usuarios
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
  );

-- Fiscalizações
CREATE POLICY "fiscalizacoes_select" ON public.fiscalizacoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "fiscalizacoes_insert" ON public.fiscalizacoes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "fiscalizacoes_update" ON public.fiscalizacoes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "fiscalizacoes_delete" ON public.fiscalizacoes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
  );

-- Audit logs
CREATE POLICY "audit_select_admin" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
  );
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ── Triggers ──────────────────────────────────────────────
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
