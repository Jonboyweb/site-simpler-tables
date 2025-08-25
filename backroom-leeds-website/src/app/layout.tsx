import type { Metadata } from 'next'
import { Inter, Bebas_Neue, Playfair_Display, Great_Vibes } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebas = Bebas_Neue({ 
  weight: '400', 
  subsets: ['latin'], 
  variable: '--font-bebas',
  display: 'swap'
})
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap'
})
const greatVibes = Great_Vibes({ 
  weight: '400', 
  subsets: ['latin'], 
  variable: '--font-great-vibes',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'The Backroom Leeds | Premium Speakeasy Experience',
  description: 'Step into Leeds\' most exclusive speakeasy. Premium cocktails, live jazz, and prohibition-era elegance beneath the railway bridges.',
  keywords: ['Leeds nightlife', 'speakeasy', 'cocktail bar', 'jazz club', 'prohibition', 'premium venue'],
  openGraph: {
    title: 'The Backroom Leeds | Premium Speakeasy',
    description: 'Leeds\' most exclusive prohibition-era inspired venue',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} ${playfair.variable} ${greatVibes.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}