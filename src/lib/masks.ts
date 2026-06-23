// src/lib/masks.ts

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

// Permite digitar coordenadas decimais: -21.123456
export function maskCoord(value: string): string {
  // Permite: números, ponto, vírgula, hífen/menos
  // Remove tudo que não for dígito, ponto, vírgula ou sinal de menos
  return value.replace(/[^0-9.,-]/g, '')
}

export function validateCPF(cpf: string): boolean {
  const stripped = cpf.replace(/\D/g, '')
  if (stripped.length !== 11 || /^(\d)\1+$/.test(stripped)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(stripped[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(stripped[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(stripped[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(stripped[10])
}

export function validateCoordinates(lat: string, lng: string): boolean {
  const latN = parseFloat(lat.replace(',', '.'))
  const lngN = parseFloat(lng.replace(',', '.'))
  return !isNaN(latN) && !isNaN(lngN) &&
    latN >= -90 && latN <= 90 &&
    lngN >= -180 && lngN <= 180
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR')
}
