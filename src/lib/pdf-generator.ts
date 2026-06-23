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
  dragagem_acumulo: "Lavra em aluvião por dragagem em área de acúmulo de água às margens do curso d'água",
  outro: 'Outro'
}

const ORDEM_POSTO: Record<string, number> = {
  'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
  '1º TEN': 5, '1 TEN': 5, '2º TEN': 6, '2 TEN': 6,
  'SUB TEN': 7, 'SUBTEN': 7,
  '1º SGT': 8, '1ºSGT': 8, '1ºSGT QPR': 8,
  '2º SGT': 9, '2ºSGT': 9,
  '3º SGT': 10, '3ºSGT': 10, '3º SGT QPR': 10,
  'CB': 11, 'SD': 12
}

function getOrdem(posto: string): number {
  if (!posto) return 99
  const up = posto.toUpperCase().trim()
  for (const key of Object.keys(ORDEM_POSTO)) {
    if (up.includes(key.toUpperCase())) return ORDEM_POSTO[key]
  }
  return 99
}

// Formata NPM: 1463223 → 146.322-3
function formatarNPM(npm: string): string {
  if (!npm) return ''
  const n = npm.replace(/\D/g, '')
  if (n.length === 7) return `${n.slice(0,3)}.${n.slice(3,6)}-${n.slice(6)}`
  if (n.length === 6) return `${n.slice(0,3)}.${n.slice(3,5)}-${n.slice(5)}`
  return n
}

export function gerarPDF(fiscalizacao: Fiscalizacao, usuarioNome: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = margin

  const checkY = (needed = 20) => {
    if (y + needed > pageH - 16) {
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
    doc.rect(0, pageH - 11, pageW, 11, 'F')
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

  // Campo com label e valor na mesma linha
  const addField = (label: string, value: string | number | undefined) => {
    const val = (value !== undefined && value !== null && value !== '') ? String(value) : '—'
    checkY(8)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const labelW = doc.getTextWidth(`${label}: `) + 1
    const maxW = contentW - labelW
    const lines = doc.splitTextToSize(val, maxW)
    doc.text(lines, margin + labelW, y)
    y += Math.max(6, lines.length * 5.5)
  }

  // ── Início ────────────────────────────────────────────────
  drawHeader()
  y = 32

  // ID e data
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(`ID: ${fiscalizacao.id || 'N/A'}`, margin, y)
  if (fiscalizacao.created_at) {
    doc.text(
      `Cadastrado em: ${format(new Date(fiscalizacao.created_at), "dd/MM/yyyy 'às' HH:mm")}`,
      pageW - margin, y, { align: 'right' }
    )
  }
  doc.setTextColor(0, 0, 0)
  y += 7

  // ── 1. DADOS GERAIS ───────────────────────────────────────
  addSection('1. Dados Gerais')

  // Equipe ordenada por posto — tabela com Nº PM | Posto | Nome
  const equipeNomes = (fiscalizacao.equipe_nomes || [])
  const equipePostos = ((fiscalizacao as Record<string, unknown>).equipe_postos || []) as string[]
  const equipeNpms = ((fiscalizacao as Record<string, unknown>).equipe_npms || []) as string[]

  const equipe = equipeNomes
    .map((nome, i) => ({
      npm: equipeNpms[i] || '',
      posto: equipePostos[i] || '',
      nome
    }))
    .sort((a, b) => getOrdem(a.posto) - getOrdem(b.posto))

  if (equipe.length > 0) {
    checkY(12 + equipe.length * 6)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Equipe Responsável:', margin, y)
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    equipe.forEach(({ npm, posto, nome }) => {
      checkY(6)
      const npmFmt = npm ? `Nº PM ${formatarNPM(npm)}` : ''
      // Colunas: NPM | Posto | Nome
      const col1 = npmFmt.padEnd(18)
      const col2 = (posto || '').padEnd(14)
      doc.text(`${col1}${col2}${nome}`, margin + 3, y)
      y += 5.5
    })
    y += 2
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

  // ── 2. RESPONSÁVEL PRINCIPAL ──────────────────────────────
  addSection('2. Responsável Principal')
  addField('Nome', fiscalizacao.responsavel_principal_nome)
  addField('CPF', fiscalizacao.responsavel_principal_cpf)
  addField('RG', fiscalizacao.responsavel_principal_rg)
  addField('Endereço', fiscalizacao.responsavel_principal_endereco)
  addField('Telefone(s)', (fiscalizacao.responsavel_principal_telefones || []).filter(Boolean).join(', '))

  // ── 3. TRABALHADORES ──────────────────────────────────────
  addSection('3. Levantamento de Trabalhadores')
  // Quantidade em linha própria, sem sobreposição
  checkY(10)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('Quantidade no Momento da Abordagem:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(String(fiscalizacao.qtd_trabalhadores ?? 0), margin + 75, y)
  y += 7

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

  // ── 4. ESTRUTURA OPERACIONAL ──────────────────────────────
  addSection('4. Estrutura Operacional')
  checkY(70)
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
    columnStyles: {
      0: { cellWidth: 140 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 40 }
    },
    alternateRowStyles: { fillColor: [245, 252, 248] }
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── 5. CARACTERÍSTICAS OPERACIONAIS ──────────────────────
  addSection('5. Características Operacionais')
  addField('Horário de Funcionamento', fiscalizacao.horario_funcionamento)
  addField('Dias de Operação por Semana', fiscalizacao.dias_operacao_semana)
  addField('Produção Diária Estimada', fiscalizacao.producao_diaria_estimada)
  if (fiscalizacao.data_inicio_operacao) {
    addField('Data de Início da Operação',
      format(new Date(fiscalizacao.data_inicio_operacao + 'T12:00:00'), 'dd/MM/yyyy'))
  }
  addField('Método de Garimpo',
    fiscalizacao.metodo_garimpo === 'outro'
      ? fiscalizacao.metodo_garimpo_outro
      : METODO_LABELS[fiscalizacao.metodo_garimpo])
  if (fiscalizacao.qtd_ouro_gramas != null) {
    addField('Ouro Armazenado na Draga', `${fiscalizacao.qtd_ouro_gramas} g`)
  }

  // ── 6. SITUAÇÃO MINERÁRIA ─────────────────────────────────
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

  // ── Rodapés em todas as páginas ───────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(i, totalPages)
  }

  // ── Nome do arquivo: fiscalizacao-alvo-data-hora.pdf ──────
  const alvoNome = (fiscalizacao.alvo_nome || 'sem-alvo')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .toLowerCase()
  const dataHora = format(new Date(), 'ddMMyyyy-HHmm')
  const alvoLabel = (fiscalizacao.alvo_nome || 'sem-alvo').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
  const dataLabel = format(new Date(), 'dd-MM-yyyy')
  const horaLabel = format(new Date(), "HH'h'mm")
  doc.save(`fiscalizacao_${alvoLabel}_${dataLabel}_${horaLabel}.pdf`)
}
