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

export function gerarPDF(fiscalizacao: Fiscalizacao, usuarioNome: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  const addPage = () => {
    doc.addPage()
    y = margin + 10
    addHeader()
  }

  const checkY = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) addPage()
  }

  // ── Cabeçalho ────────────────────────────────────────────
  const addHeader = () => {
    doc.setFillColor(10, 110, 62)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('POLÍCIA MILITAR DE MINAS GERAIS', pageW / 2, 10, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('3ª Companhia de Polícia Militar de Meio Ambiente', pageW / 2, 16, { align: 'center' })
    doc.text('RELATÓRIO DE FISCALIZAÇÃO DE GARIMPO/DRAGA', pageW / 2, 22, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  // ── Rodapé ───────────────────────────────────────────────
  const addFooter = (pageNum: number, totalPages: number) => {
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(245, 245, 245)
    doc.rect(0, pageH - 15, pageW, 15, 'F')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Usuário: ${usuarioNome}`,
      margin, pageH - 6
    )
    doc.text(`Página ${pageNum} de ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  // ── Seção ────────────────────────────────────────────────
  const addSection = (title: string) => {
    checkY(15)
    doc.setFillColor(220, 245, 233)
    doc.rect(margin, y, contentW, 8, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 110, 62)
    doc.text(title.toUpperCase(), margin + 3, y + 5.5)
    doc.setTextColor(0, 0, 0)
    y += 12
  }

  // ── Campo ────────────────────────────────────────────────
  const addField = (label: string, value: string | number | undefined, halfWidth = false) => {
    const val = value?.toString() || '—'
    const w = halfWidth ? contentW / 2 - 2 : contentW
    checkY(12)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(label + ':', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(val, w - 35)
    doc.text(lines, margin + 35, y)
    y += Math.max(6, lines.length * 5)
  }

  // ────────────────────────────────────────────────────────
  addHeader()
  y = 35

  // ID e datas
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`ID: ${fiscalizacao.id || 'N/A'}`, margin, y)
  doc.text(
    `Cadastrado em: ${fiscalizacao.created_at ? format(new Date(fiscalizacao.created_at), "dd/MM/yyyy HH:mm") : '—'}`,
    pageW - margin, y, { align: 'right' }
  )
  doc.setTextColor(0, 0, 0)
  y += 8

  // ── 1. Dados Gerais ──────────────────────────────────────
  addSection('1. Dados Gerais')
  addField('Equipe Responsável', (fiscalizacao.equipe_nomes || []).join(', '))
  addField('Alvo Fiscalizado', fiscalizacao.alvo_nome)
  addField('Município', fiscalizacao.municipio)
  addField('Coordenadas', fiscalizacao.coordenadas_lat
    ? `${fiscalizacao.coordenadas_lat}, ${fiscalizacao.coordenadas_lng}`
    : undefined)
  addField('Hora da Abordagem', fiscalizacao.hora_abordagem)
  addField('Resp. pela Exploração no Local', fiscalizacao.responsavel_local)

  // ── 2. Responsável Principal ─────────────────────────────
  addSection('2. Responsável Principal')
  addField('Nome', fiscalizacao.responsavel_principal_nome)
  addField('CPF', fiscalizacao.responsavel_principal_cpf)
  addField('RG', fiscalizacao.responsavel_principal_rg)
  addField('Endereço', fiscalizacao.responsavel_principal_endereco)
  addField('Telefone(s)', (fiscalizacao.responsavel_principal_telefones || []).join(', '))

  // ── 3. Trabalhadores ─────────────────────────────────────
  addSection('3. Levantamento de Trabalhadores')
  addField('Quantidade no Momento da Abordagem', fiscalizacao.qtd_trabalhadores)

  if (fiscalizacao.trabalhadores?.length > 0) {
    checkY(30)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Nome Completo', 'CPF', 'Função']],
      body: fiscalizacao.trabalhadores.map(t => [t.nome_completo, t.cpf, t.funcao]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [10, 110, 62], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 252, 248] },
      didDrawPage: (data) => { y = data.cursor?.y || y }
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  }

  // ── 4. Estrutura Operacional ─────────────────────────────
  addSection('4. Estrutura Operacional')
  checkY(40)
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
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  // ── 5. Características Operacionais ─────────────────────
  addSection('5. Características Operacionais')
  addField('Horário de Funcionamento', fiscalizacao.horario_funcionamento)
  addField('Dias de Operação por Semana', fiscalizacao.dias_operacao_semana)
  addField('Produção Diária Estimada', fiscalizacao.producao_diaria_estimada)
  addField('Data de Início da Operação', fiscalizacao.data_inicio_operacao
    ? format(new Date(fiscalizacao.data_inicio_operacao), 'dd/MM/yyyy')
    : undefined)
  addField('Método de Garimpo', METODO_LABELS[fiscalizacao.metodo_garimpo] || fiscalizacao.metodo_garimpo_outro)
  if (fiscalizacao.metodo_garimpo === 'outro') {
    addField('Descrição do Método', fiscalizacao.metodo_garimpo_outro)
  }
  addField('Ouro Armazenado na Draga', fiscalizacao.qtd_ouro_gramas != null
    ? `${fiscalizacao.qtd_ouro_gramas} g`
    : undefined)

  // ── 6. Situação Minerária ────────────────────────────────
  addSection('6. Situação Minerária')
  addField('Título Minerário', TITULO_MINERARIO_LABELS[fiscalizacao.titulo_minerario])
  if (fiscalizacao.titulo_minerario === 'outro') {
    addField('Descrição do Título', fiscalizacao.titulo_minerario_outro)
  }
  addField('Nº do Processo Minerário', fiscalizacao.numero_processo_minerario)
  addField('Informações Complementares', fiscalizacao.informacoes_complementares)

  // ── Área de Assinatura ───────────────────────────────────
  checkY(40)
  y += 10
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y + 15, margin + 70, y + 15)
  doc.line(pageW / 2 + 5, y + 15, pageW - margin, y + 15)
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('Responsável pela Fiscalização', margin, y + 20)
  doc.text('Visto / Testemunha', pageW / 2 + 5, y + 20)

  // ── Rodapés ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  doc.save(`fiscalizacao-${fiscalizacao.id || 'novo'}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`)
}
