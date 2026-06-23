// src/lib/google-sheets.ts
import { google } from 'googleapis'
import type { Fiscalizacao } from '@/types'

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

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!

// ── MILITARES ────────────────────────────────────────────────
// Colunas: A=Nº PM, B=POSTO GRADUAÇÃO, C=NOME
export async function getMilitaresFromSheets() {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'militares!A2:C'
    })
    const rows = res.data.values || []
    return rows
      .filter(r => r[0] && r[2])
      .map((r, i) => ({
        id: String(r[0] || '').trim() || `mil_${i}`,
        matricula: String(r[0] || '').trim(),
        posto_graduacao: String(r[1] || '').trim(),
        nome_completo: String(r[2] || '').trim(),
        unidade: '5ª CIA PM MAmb',
        funcao: String(r[1] || '').trim(),
        ativo: true
      }))
  } catch (err) {
    console.error('Erro ao buscar militares:', err)
    return []
  }
}

// ── ALVOS ────────────────────────────────────────────────────
// Coluna: A=Nº ALVO
export async function getAlvosFromSheets() {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'alvos!A2:A'
    })
    const rows = res.data.values || []
    return rows
      .filter(r => r[0])
      .map((r, i) => ({
        id: `alvo_${i}`,
        nome: `Alvo ${String(r[0]).trim()}`,
        numero: String(r[0]).trim(),
        tipo: '',
        municipio: '',
        observacoes: '',
        ativo: true
      }))
  } catch (err) {
    console.error('Erro ao buscar alvos:', err)
    return []
  }
}

// ── CABEÇALHO DA ABA DADOS ────────────────────────────────────
const CABECALHO_DADOS = [
  'ID', 'Data/Hora', 'Usuário (Nº PM)', 'Nome do Usuário',
  'Município', 'Latitude', 'Longitude', 'Hora Abordagem',
  'Equipe (Nº PM)', 'Equipe (Nomes)', 'Alvo',
  'Resp. Local', 'Resp. Principal', 'CPF', 'RG', 'Endereço', 'Telefones',
  'Qtd Trabalhadores', 'Trabalhadores',
  'Balsas/Dragas', 'Motores', 'Bombas Sucção', 'Compressores',
  'Geradores', 'Embarcações Apoio', 'Roupas Mergulho', 'Máscaras Mergulho',
  'Bateias', 'Respiradores', 'Balanças', 'Frascos Mercúrio',
  'Horário Funcionamento', 'Dias/Semana', 'Produção Diária', 'Data Início',
  'Método Garimpo', 'Método Outro', 'Ouro (g)',
  'Título Minerário', 'Título Outro', 'Nº Processo', 'Informações Complementares'
]

export async function garantirCabecalhoDados(): Promise<void> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'dados!A1:A1'
    })
    const primeiraCelula = res.data.values?.[0]?.[0]
    if (!primeiraCelula) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'dados!A1',
        valueInputOption: 'RAW',
        requestBody: { values: [CABECALHO_DADOS] }
      })
    }
  } catch (err) {
    console.error('Erro ao garantir cabeçalho:', err)
  }
}

// ── GRAVAR FISCALIZAÇÃO NA ABA DADOS ─────────────────────────
export async function gravarFiscalizacaoSheets(f: Fiscalizacao): Promise<boolean> {
  try {
    await garantirCabecalhoDados()
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const row = buildRow(f)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'dados!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    })
    return true
  } catch (err) {
    console.error('Erro ao gravar na planilha:', err)
    return false
  }
}

// ── ATUALIZAR FISCALIZAÇÃO NA ABA DADOS ──────────────────────
export async function atualizarFiscalizacaoSheets(f: Fiscalizacao): Promise<boolean> {
  try {
    await garantirCabecalhoDados()
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })

    // Buscar linha com o ID
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'dados!A:A'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === f.id)
    if (rowIndex === -1) {
      // Não encontrou — adicionar como nova linha
      return gravarFiscalizacaoSheets(f)
    }

    // Atualizar a linha encontrada (rowIndex + 1 porque Sheets é 1-indexed)
    const sheetRow = rowIndex + 1
    const row = buildRow(f)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `dados!A${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    })
    return true
  } catch (err) {
    console.error('Erro ao atualizar fiscalização no Sheets:', err)
    return false
  }
}

// ── EXCLUIR FISCALIZAÇÃO DA ABA DADOS ────────────────────────
export async function excluirFiscalizacaoSheets(id: string): Promise<boolean> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })

    // Buscar linha com o ID
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'dados!A:A'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return true // Já não existe

    // Pegar o ID da aba
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const dadosSheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'dados')
    const sheetId = dadosSheet?.properties?.sheetId

    if (sheetId === undefined) return false

    // Deletar a linha
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    })
    return true
  } catch (err) {
    console.error('Erro ao excluir fiscalização no Sheets:', err)
    return false
  }
}

// ── Função auxiliar para montar linha ────────────────────────
function buildRow(f: Fiscalizacao): unknown[] {
  return [
    f.id || '',
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    f.usuario_npm || '',
    f.usuario_nome || '',
    f.municipio,
    f.coordenadas_lat || '',
    f.coordenadas_lng || '',
    f.hora_abordagem || '',
    (f.equipe_ids || []).join('; '),
    (f.equipe_nomes || []).join('; '),
    f.alvo_nome || '',
    f.responsavel_local || '',
    f.responsavel_principal_nome || '',
    f.responsavel_principal_cpf || '',
    f.responsavel_principal_rg || '',
    f.responsavel_principal_endereco || '',
    (f.responsavel_principal_telefones || []).filter(Boolean).join('; '),
    f.qtd_trabalhadores || 0,
    (f.trabalhadores || []).map(t => `${t.nome_completo} (${t.cpf}) - ${t.funcao}`).join(' | '),
    f.qtd_balsa_draga || 0,
    f.qtd_motores || 0,
    f.qtd_bombas_succao || 0,
    f.qtd_compressores || 0,
    f.qtd_geradores || 0,
    f.qtd_embarcacoes_apoio || 0,
    f.qtd_roupas_mergulho || 0,
    f.qtd_mascaras_mergulho || 0,
    f.qtd_bateias || 0,
    f.qtd_respiradores || 0,
    f.qtd_balancas || 0,
    f.qtd_frascos_mercurio || 0,
    f.horario_funcionamento || '',
    f.dias_operacao_semana || '',
    f.producao_diaria_estimada || '',
    f.data_inicio_operacao || '',
    f.metodo_garimpo || '',
    f.metodo_garimpo_outro || '',
    f.qtd_ouro_gramas || '',
    f.titulo_minerario || '',
    f.titulo_minerario_outro || '',
    f.numero_processo_minerario || '',
    f.informacoes_complementares || ''
  ]
}
