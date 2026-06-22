// src/types/index.ts

export type UserRole = 'admin' | 'operacional'

export interface Usuario {
  id: string
  nome: string
  npm: string
  posto_graduacao: string
  unidade: string
  perfil: UserRole
  ativo: boolean
  primeiro_acesso: boolean
  created_at: string
  updated_at: string
}

export interface Militar {
  id: string
  matricula: string
  posto_graduacao: string
  nome_completo: string
  unidade: string
  funcao: string
  ativo: boolean
}

export interface Alvo {
  id: string
  nome: string
  numero: string
  tipo: string
  municipio: string
  observacoes?: string
  ativo: boolean
}

export type TituloMinerario =
  | 'clandestino'
  | 'portaria_lavra'
  | 'permissao_lavra'
  | 'licenciamento'
  | 'registro_extracao'
  | 'alvara_pesquisa'
  | 'outro'

export type MetodoGarimpo =
  | 'dragagem_aiuruoca'
  | 'dragagem_verde'
  | 'dragagem_baependi'
  | 'dragagem_acumulo'
  | 'outro'

export interface Trabalhador {
  nome_completo: string
  cpf: string
  funcao: string
}

export interface Fiscalizacao {
  id?: string
  equipe_ids: string[]
  equipe_nomes?: string[]
  alvo_id?: string
  alvo_nome?: string
  municipio: string
  coordenadas_lat?: number
  coordenadas_lng?: number
  hora_abordagem?: string
  responsavel_local?: string
  responsavel_principal_nome?: string
  responsavel_principal_cpf?: string
  responsavel_principal_rg?: string
  responsavel_principal_endereco?: string
  responsavel_principal_telefones?: string[]
  qtd_trabalhadores: number
  trabalhadores: Trabalhador[]
  qtd_balsa_draga: number
  qtd_motores: number
  qtd_bombas_succao: number
  qtd_compressores: number
  qtd_geradores: number
  qtd_embarcacoes_apoio: number
  qtd_roupas_mergulho: number
  qtd_mascaras_mergulho: number
  qtd_bateias: number
  qtd_respiradores: number
  qtd_balancas: number
  qtd_frascos_mercurio: number
  horario_funcionamento?: string
  dias_operacao_semana?: number
  producao_diaria_estimada?: string
  data_inicio_operacao?: string
  metodo_garimpo: MetodoGarimpo
  metodo_garimpo_outro?: string
  qtd_ouro_gramas?: number
  titulo_minerario: TituloMinerario
  titulo_minerario_outro?: string
  numero_processo_minerario?: string
  informacoes_complementares?: string
  usuario_id?: string
  usuario_nome?: string
  usuario_npm?: string
  created_at?: string
  updated_at?: string
  status?: 'ativo' | 'arquivado'
}

export interface FiscalizacaoFiltros {
  data_inicio?: string
  data_fim?: string
  municipio?: string
  alvo_id?: string
  usuario_npm?: string
  titulo_minerario?: TituloMinerario
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
