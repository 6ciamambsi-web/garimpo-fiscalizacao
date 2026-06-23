// src/lib/pdf-generator.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Fiscalizacao } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TITULO_MINERARIO_LABELS: Record<string, string> = {
  clandestino: 'Clandestino',
  portaria_lavra: 'Portaria de Lavra',
  permissao_lavra: 'Permissão de Lavra Garimpeira',
  licenciamento: 'Licenciamento',
  registro_extracao: 'Registro de Extração',
  alvara_pesquisa: 'Alvará de Pesquisa',
  outro: 'Outro'
}

const METODO_LABELS: Record<string, string> = {
  dragagem_aiuruoca: 'Lavra em aluvião por dragagem no leito do Rio Aiuruoca',
  dragagem_verde: 'Lavra em aluvião por dragagem no leito do Rio Verde',
  dragagem_baependi: 'Lavra em aluvião por dragagem no leito do Rio Baependi',
  dragagem_acumulo: 'Lavra em aluvião por dragagem em área de acúmulo de água às margens do curso d\'água',
  outro: 'Outro'
}

// Ordem hierárquica dos postos
const ORDEM_POSTO: Record<string, number> = {
  'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
  '1º TEN': 5, '1 TEN': 5, '2º TEN': 6, '2 TEN': 6,
  'SUB TEN': 7, 'SUBTEN': 7,
  '1º SGT': 8, '1 SGT': 8, '1ºSGT': 8, '1ºSGT QPR': 8,
  '2º SGT': 9, '2 SGT': 9, '2ºSGT': 9,
  '3º SGT': 10, '3 SGT': 10, '3ºSGT': 10, '3º SGT QPR': 10,
  'CB': 11, 'SD': 12
}

function getOrdemPosto(posto: string): number {
  if (!posto) return 99
  const upper = posto.toUpperCase().trim()
  for (const key of Object.keys(ORDEM_POSTO)) {
    if (upper.includes(key.toUpperCase())) return ORDEM_POSTO[key]
  }
  return 99
}

export function gerarPDF(fiscalizacao: Fiscalizacao, usuarioNome: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = margin

  const checkY = (needed = 20) => {
    if (y + needed > pageH - 20) {
      doc.addPage()
      y = margin + 32
      drawHeader()
    }
  }

  const drawHeader = () => {
    doc.setFillColor(10, 110, 62)
    doc.rect(0, 0, pageW, 26, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('POLÍCIA MILITAR DE MINAS GERAIS', pageW / 2, 9, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('5ª Companhia de Polícia Militar de Meio Ambiente', pageW / 2, 15, { align: 'center' })
    doc.text('RELATÓRIO DE FISCALIZAÇÃO DE GARIMPO/DRAGA', pageW / 2, 21, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(245, 245, 245)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Usuário: ${usuarioNome}`,
      margin, pageH - 4
    )
    doc.text(`Página ${pageNum} de ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  const addSection = (title: string) => {
    checkY(14)
    doc.setFillColor(220, 245, 233)
    doc.rect(margin, y, contentW, 7, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 110, 62)
    doc.text(title.toUpperCase(), margin + 2, y + 5)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  const addField = (label: string, value: string | number | undefined) => {
    const val = (value !== undefined && value !== null && value !== '') ? String(value) : '—'
    checkY(8)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(val, contentW - 45)
    doc.text(lines, margin + 44, y)
    y += Math.max(6, lines.length * 5.5)
  }

  // ── Início ──────────────────────────────────────────────
  drawHeader()
  y = 32

  // ID e data
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  const idText = `ID: ${fiscalizacao.id || 'N/A'}`
  const dtText = fiscalizacao.created_at
    ? `Cadastrado em: ${format(new Date(fiscalizacao.created_at), "dd/MM/yyyy 'às' HH:mm")}`
    : ''
  doc.text(idText, margin, y)
  doc.text(dtText, pageW - margin, y, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  y += 7

  // ── 1. DADOS GERAIS ──────────────────────────────────────
  addSection('1. Dados Gerais')

  // Equipe ordenada por posto
  const equipeOrdenada = (fiscalizacao.equipe_ids || [])
    .map((id, i) => ({
      id,
      nome: (fiscalizacao.equipe_nomes || [])[i] || ''
    }))
    .sort((a, b) => getOrdemPosto('') - getOrdemPosto('')) // placeholder, ordenamos abaixo

  // Montar equipe com posto e npm, ordenada por hierarquia
  const equipeNomes = (fiscalizacao.equipe_nomes || [])
  const equipePostos = ((fiscalizacao as any).equipe_postos || []) as string[]
  const equipeNpms = ((fiscalizacao as any).equipe_npms || []) as string[]

  const ORDEM_PDF: Record<string, number> = {
    'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
    '1º TEN': 5, '2º TEN': 6, 'SUB TEN': 7,
    '1º SGT': 8, '1ºSGT': 8, '2º SGT': 9, '2ºSGT': 9,
    '3º SGT': 10, '3ºSGT': 10, 'CB': 11, 'SD': 12
  }
  const getOrd = (posto: string) => {
    const up = (posto || '').toUpperCase()
    for (const k of Object.keys(ORDEM_PDF)) {
      if (up.includes(k.toUpperCase())) return ORDEM_PDF[k]
    }
    return 99
  }

  const equipe = equipeNomes
    .map((nome, i) => ({ nome, posto: equipePostos[i] || '', npm: equipeNpms[i] || '' }))
    .sort((a, b) => getOrd(a.posto) - getOrd(b.posto))

  if (equipe.length > 0) {
    checkY(8 + equipe.length * 5.5)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Equipe Responsável:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    y += 5.5
    equipe.forEach(({ nome, posto, npm }) => {
      checkY(6)
      const linha = npm
        ? `• ${posto ? posto + ' ' : ''}${nome} (Nº ${npm})`
        : `• ${posto ? posto + ' ' : ''}${nome}`
      doc.text(linha, margin + 3, y)
      y += 5.5
    })
    y += 1
  } else {
    addField('Equipe Responsável', '—')
  }

  addField('Alvo Fiscalizado', fiscalizacao.alvo_nome)
  addField('Município', fiscalizacao.municipio)
  if (fiscalizacao.coordenadas_lat) {
    addField('Coordenadas', `${fiscalizacao.coordenadas_lat}, ${fiscalizacao.coordenadas_lng}`)
  }
  addField('Hora da Abordagem', fiscalizacao.hora_abordagem)
  addField('Resp. pela Exploração no Local', fiscalizacao.responsavel_local)

  // ── 2. RESPONSÁVEL PRINCIPAL ─────────────────────────────
  addSection('2. Responsável Principal')
  addField('Nome', fiscalizacao.responsavel_principal_nome)
  addField('CPF', fiscalizacao.responsavel_principal_cpf)
  addField('RG', fiscalizacao.responsavel_principal_rg)
  addField('Endereço', fiscalizacao.responsavel_principal_endereco)
  addField('Telefone(s)', (fiscalizacao.responsavel_principal_telefones || []).filter(Boolean).join(', '))

  // ── 3. TRABALHADORES ─────────────────────────────────────
  addSection('3. Levantamento de Trabalhadores')
  addField('Quantidade no Momento da Abordagem', fiscalizacao.qtd_trabalhadores)

  if (fiscalizacao.trabalhadores?.length > 0) {
    checkY(20)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Nome Completo', 'CPF', 'Função']],
      body: fiscalizacao.trabalhadores.map(t => [t.nome_completo, t.cpf, t.funcao]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [10, 110, 62], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 252, 248] },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // ── 4. ESTRUTURA OPERACIONAL ─────────────────────────────
  addSection('4. Estrutura Operacional')
  checkY(60)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Item', 'Quantidade']],
    body: [
      ['Balsas/Dragas', fiscalizacao.qtd_balsa_draga || 0],
      ['Motores', fiscalizacao.qtd_motores || 0],
      ['Bombas de Sucção', fiscalizacao.qtd_bombas_succao || 0],
      ['Compressores', fiscalizacao.qtd_compressores || 0],
      ['Geradores', fiscalizacao.qtd_geradores || 0],
      ['Embarcações de Apoio', fiscalizacao.qtd_embarcacoes_apoio || 0],
      ['Roupas de Mergulho', fiscalizacao.qtd_roupas_mergulho || 0],
      ['Máscaras de Mergulho', fiscalizacao.qtd_mascaras_mergulho || 0],
      ['Bateias', fiscalizacao.qtd_bateias || 0],
      ['Respiradores', fiscalizacao.qtd_respiradores || 0],
      ['Balanças', fiscalizacao.qtd_balancas || 0],
      ['Frascos de Mercúrio', fiscalizacao.qtd_frascos_mercurio || 0]
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [10, 110, 62], textColor: 255 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [245, 252, 248] }
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── 5. CARACTERÍSTICAS OPERACIONAIS ─────────────────────
  addSection('5. Características Operacionais')
  addField('Horário de Funcionamento', fiscalizacao.horario_funcionamento)
  addField('Dias de Operação por Semana', fiscalizacao.dias_operacao_semana)
  addField('Produção Diária Estimada', fiscalizacao.producao_diaria_estimada)
  addField('Data de Início da Operação', fiscalizacao.data_inicio_operacao
    ? format(new Date(fiscalizacao.data_inicio_operacao + 'T12:00:00'), 'dd/MM/yyyy')
    : undefined)
  addField('Método de Garimpo',
    fiscalizacao.metodo_garimpo === 'outro'
      ? fiscalizacao.metodo_garimpo_outro
      : METODO_LABELS[fiscalizacao.metodo_garimpo])
  if (fiscalizacao.qtd_ouro_gramas != null) {
    addField('Ouro Armazenado na Draga', `${fiscalizacao.qtd_ouro_gramas} g`)
  }

  // ── 6. SITUAÇÃO MINERÁRIA ────────────────────────────────
  addSection('6. Situação Minerária')
  addField('Título Minerário',
    fiscalizacao.titulo_minerario === 'outro'
      ? fiscalizacao.titulo_minerario_outro
      : TITULO_MINERARIO_LABELS[fiscalizacao.titulo_minerario])
  addField('Nº do Processo Minerário', fiscalizacao.numero_processo_minerario)
  if (fiscalizacao.informacoes_complementares) {
    checkY(15)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Informações Complementares:', margin, y)
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const linhas = doc.splitTextToSize(fiscalizacao.informacoes_complementares, contentW)
    linhas.forEach((linha: string) => {
      checkY(6)
      doc.text(linha, margin, y)
      y += 5.5
    })
  }

  // ── Rodapés ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(i, totalPages)
  }

  doc.save(`fiscalizacao-${fiscalizacao.id?.slice(0, 8) || 'novo'}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
}
