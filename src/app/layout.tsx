// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fiscalização de Garimpo/Draga — 5ª CIA PM MAmb',
  description: 'Sistema de cadastro e gerenciamento de fiscalizações de garimpos e dragas',
  robots: 'noindex, nofollow'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
