'use client'
// src/components/FiscalizacaoDetalhe.tsx
import { X, FileDown, Edit2, MapPin, Clock, Users, Anchor } from 'lucide-react'
import type { Fiscalizacao, Usuario } from '@/types'
import { formatDateTime, formatDate } from '@/lib/masks'
import { gerarPDF } from '@/lib/pdf-generator'

interface Props {
  fiscalizacao: Fiscalizacao
  usuario: Usuario
  onFechar: () => void
  onEditar: () => void
}

const Section = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-pmmg-green-700 uppercase tracking-wider mb-3 pb-1 border-b border-pmmg-green-200">{titulo}</h3>
    {children}
  </div>
)

const Campo = ({ label, value }: { label: string; value?: string | number | null }) => (
  value != null && value !== '' ? (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 min-w-[140px] shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  ) : null
)

const TITULO_LABELS: Record<string, string> = {
  clandestino: 'Clandestino',
  portaria_lavra: 'Portaria de Lavra',
  permissao_lavra: 'Permissão de Lavra Garimpeira',
  licenciamento: 'Licenciamento',
  registro_extracao: 'Registro de Extração',
  alvara_pesquisa: 'Alvará de Pesquisa',
  outro: 'Outro'
}

const METODO_LABELS: Record<string, string> = {
  dragagem_aiuruoca: 'Dragagem — Rio Aiuruoca',
  dragagem_verde: 'Dragagem — Rio Verde',
  dragagem_baependi: 'Dragagem — Rio Baependi',
  dragagem_acumulo: 'Dragagem — área de acúmulo de água',
  outro: 'Outro'
}

export default function FiscalizacaoDetalhe({ fiscalizacao: f, usuario, onFechar, onEditar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pmmg-green-800 to-pmmg-green-600 px-6 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Fiscalização de Garimpo/Draga</h2>
            <p className="text-pmmg-green-200 text-xs mt-0.5">
              {f.municipio} · {f.created_at ? formatDateTime(f.created_at) : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => gerarPDF(f, usuario.nome)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <FileDown className="w-4 h-4" />
            </button>
            <button onClick={onEditar} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onFechar} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Dados Gerais */}
          <Section titulo="Dados Gerais">
            <Campo label="Equipe Responsável" value={(f.equipe_nomes || []).join(', ')} />
            <Campo label="Alvo Fiscalizado" value={f.alvo_nome} />
            <Campo label="Município" value={f.municipio} />
            <Campo label="Coordenadas" value={f.coordenadas_lat ? `${f.coordenadas_lat}, ${f.coordenadas_lng}` : undefined} />
            <Campo label="Hora da Abordagem" value={f.hora_abordagem} />
            <Campo label="Responsável no Local" value={f.responsavel_local} />
          </Section>

          {/* Responsável Principal */}
          {(f.responsavel_principal_nome || f.responsavel_principal_cpf) && (
            <Section titulo="Responsável Principal">
              <Campo label="Nome" value={f.responsavel_principal_nome} />
              <Campo label="CPF" value={f.responsavel_principal_cpf} />
              <Campo label="RG" value={f.responsavel_principal_rg} />
              <Campo label="Endereço" value={f.responsavel_principal_endereco} />
              <Campo label="Telefone(s)" value={(f.responsavel_principal_telefones || []).filter(Boolean).join(', ')} />
            </Section>
          )}

          {/* Trabalhadores */}
          <Section titulo="Trabalhadores">
            <Campo label="Qtd. no Momento da Abordagem" value={f.qtd_trabalhadores} />
            {f.trabalhadores?.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Nome</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">CPF</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Função</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.trabalhadores.map((t, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{t.nome_completo}</td>
                        <td className="px-3 py-2 font-mono text-xs">{t.cpf}</td>
                        <td className="px-3 py-2">{t.funcao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Estrutura */}
          <Section titulo="Estrutura Operacional">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Balsas/Dragas', value: f.qtd_balsa_draga },
                { label: 'Motores', value: f.qtd_motores },
                { label: 'Bombas de Sucção', value: f.qtd_bombas_succao },
                { label: 'Compressores', value: f.qtd_compressores },
                { label: 'Geradores', value: f.qtd_geradores },
                { label: 'Embarcações Apoio', value: f.qtd_embarcacoes_apoio },
                { label: 'Roupas Mergulho', value: f.qtd_roupas_mergulho },
                { label: 'Máscaras Mergulho', value: f.qtd_mascaras_mergulho },
                { label: 'Bateias', value: f.qtd_bateias },
                { label: 'Respiradores', value: f.qtd_respiradores },
                { label: 'Balanças', value: f.qtd_balancas },
                { label: 'Frascos de Mercúrio', value: f.qtd_frascos_mercurio }
              ].filter(item => item.value != null && item.value > 0).map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span className="font-bold text-pmmg-green-700">{item.value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Características */}
          <Section titulo="Características Operacionais">
            <Campo label="Horário de Funcionamento" value={f.horario_funcionamento} />
            <Campo label="Dias de Operação/Semana" value={f.dias_operacao_semana} />
            <Campo label="Produção Diária Estimada" value={f.producao_diaria_estimada} />
            <Campo label="Data de Início" value={f.data_inicio_operacao ? formatDate(f.data_inicio_operacao) : undefined} />
            <Campo label="Método de Garimpo" value={
              f.metodo_garimpo === 'outro'
                ? f.metodo_garimpo_outro
                : METODO_LABELS[f.metodo_garimpo]
            } />
            <Campo label="Ouro Armazenado" value={f.qtd_ouro_gramas != null ? `${f.qtd_ouro_gramas} g` : undefined} />
          </Section>

          {/* Situação Minerária */}
          <Section titulo="Situação Minerária">
            <div className="mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                ${f.titulo_minerario === 'clandestino' ? 'bg-red-100 text-red-700' : 'bg-pmmg-green-100 text-pmmg-green-700'}`}>
                {TITULO_LABELS[f.titulo_minerario] || f.titulo_minerario}
              </span>
              {f.titulo_minerario === 'outro' && f.titulo_minerario_outro && (
                <span className="ml-2 text-sm text-gray-600">{f.titulo_minerario_outro}</span>
              )}
            </div>
            <Campo label="Nº do Processo" value={f.numero_processo_minerario} />
            {f.informacoes_complementares && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {f.informacoes_complementares}
              </div>
            )}
          </Section>

          {/* Metadados */}
          <div className="border-t pt-4 text-xs text-gray-400 flex flex-wrap gap-4">
            <span>Criado por: <strong>{f.usuario_nome}</strong></span>
            <span>Em: <strong>{f.created_at ? formatDateTime(f.created_at) : '—'}</strong></span>
            {f.updated_at !== f.created_at && (
              <span>Atualizado: <strong>{formatDateTime(f.updated_at!)}</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
