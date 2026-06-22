// src/lib/google-sheets.ts
import { google } from 'googleapis'
import type { Militar, Alvo, Fiscalizacao } from '@/types'

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!

// ── MILITARES ────────────────────────────────────────────────
export async function getMilitaresFromSheets(): Promise<Militar[]> {
  try {
    const sheets = getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MILITARES!A2:E'
    })
    const rows = res.data.values || []
    return rows
      .filter(r => r[0])
      .map((r, i) => ({
        id: `mil_${i}`,
        nome_completo: r[0] || '',
        matricula: r[1] || '',
        unidade: r[2] || '',
        funcao: r[3] || '',
        ativo: r[4] !== 'INATIVO'
      }))
  } catch (err) {
    console.error('Erro ao buscar militares do Sheets:', err)
    return []
  }
}

// ── ALVOS ────────────────────────────────────────────────────
export async function getAlvosFromSheets(): Promise<Alvo[]> {
  try {
    const sheets = getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ALVOS!A2:E'
    })
    const rows = res.data.values || []
    return rows
      .filter(r => r[0])
      .map((r, i) => ({
        id: `alvo_${i}`,
        nome: r[0] || '',
        tipo: r[1] || '',
        municipio: r[2] || '',
        observacoes: r[3] || '',
        ativo: r[4] !== 'INATIVO'
      }))
  } catch (err) {
    console.error('Erro ao buscar alvos do Sheets:', err)
    return []
  }
}

// ── GRAVAR FISCALIZAÇÃO ──────────────────────────────────────
export async function gravarFiscalizacaoSheets(f: Fiscalizacao): Promise<boolean> {
  try {
    const sheets = getSheetsClient()
    const row = [
      f.id || '',
      new Date().toLocaleString('pt-BR'),
      f.usuario_nome || '',
      f.municipio,
      f.coordenadas_lat || '',
      f.coordenadas_lng || '',
      f.hora_abordagem || '',
      (f.equipe_nomes || []).join('; '),
      f.alvo_nome || '',
      f.responsavel_local || '',
      f.responsavel_principal_nome || '',
      f.responsavel_principal_cpf || '',
      f.responsavel_principal_rg || '',
      f.responsavel_principal_endereco || '',
      (f.responsavel_principal_telefones || []).join('; '),
      f.qtd_trabalhadores,
      f.trabalhadores.map(t => `${t.nome_completo}/${t.cpf}/${t.funcao}`).join(' | '),
      f.qtd_balsa_draga,
      f.qtd_motores,
      f.qtd_bombas_succao,
      f.qtd_compressores,
      f.qtd_geradores,
      f.qtd_embarcacoes_apoio,
      f.qtd_roupas_mergulho,
      f.qtd_mascaras_mergulho,
      f.qtd_bateias,
      f.qtd_respiradores,
      f.qtd_balancas,
      f.qtd_frascos_mercurio,
      f.horario_funcionamento || '',
      f.dias_operacao_semana || '',
      f.producao_diaria_estimada || '',
      f.data_inicio_operacao || '',
      f.metodo_garimpo,
      f.metodo_garimpo_outro || '',
      f.qtd_ouro_gramas || '',
      f.titulo_minerario,
      f.titulo_minerario_outro || '',
      f.numero_processo_minerario || '',
      f.informacoes_complementares || ''
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FISCALIZAÇÕES!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    })
    return true
  } catch (err) {
    console.error('Erro ao gravar fiscalização no Sheets:', err)
    return false
  }
}

// ── INICIALIZAR ABAS ─────────────────────────────────────────
export async function inicializarAbas(): Promise<void> {
  try {
    const sheets = getSheetsClient()
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const abasExistentes = (spreadsheet.data.sheets || []).map(s => s.properties?.title)

    const abasNecessarias = [
      { title: 'MILITARES', headers: ['Nome Completo', 'Matrícula', 'Unidade', 'Função', 'Status'] },
      { title: 'ALVOS', headers: ['Nome do Alvo', 'Tipo', 'Município', 'Observações', 'Status'] },
      { title: 'FISCALIZAÇÕES', headers: [
        'ID', 'Data/Hora Cadastro', 'Usuário', 'Município', 'Latitude', 'Longitude',
        'Hora Abordagem', 'Equipe', 'Alvo', 'Resp. Local', 'Resp. Principal',
        'CPF Resp.', 'RG Resp.', 'Endereço Resp.', 'Telefones', 'Qtd Trabalhadores',
        'Trabalhadores', 'Balsas/Dragas', 'Motores', 'Bombas Sucção', 'Compressores',
        'Geradores', 'Embarcações Apoio', 'Roupas Mergulho', 'Máscaras Mergulho',
        'Bateias', 'Respiradores', 'Balanças', 'Frascos Mercúrio',
        'Horário Funcionamento', 'Dias/Semana', 'Produção Diária', 'Data Início',
        'Método Garimpo', 'Método Outro', 'Ouro (g)', 'Título Minerário',
        'Título Outro', 'Nº Processo', 'Informações Complementares'
      ]}
    ]

    for (const aba of abasNecessarias) {
      if (!abasExistentes.includes(aba.title)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: aba.title } } }] }
        })
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${aba.title}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [aba.headers] }
        })
      }
    }
  } catch (err) {
    console.error('Erro ao inicializar abas:', err)
  }
}
