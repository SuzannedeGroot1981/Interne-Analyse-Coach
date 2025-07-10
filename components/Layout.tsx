import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export default function Layout({ children, title = 'Interne Analyse Coach' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-hl-wit shadow-sm border-b border-hl-zand">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo en Titel */}
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <Image
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden Logo"
                  width={120}
                  height={30}
                  className="h-8 w-auto"
                  priority
                />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-hl-donkergroen font-gantari">
                    Interne-Analyse-Coach
                  </h1>
                  <p className="text-xs text-gray-600 font-gantari">
                    AI-gestuurde organisatie-ontwikkeling
                  </p>
                </div>
              </Link>

              {/* Mobile titel */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-hl-donkergroen font-gantari">
                  IAC
                </h1>
              </div>

              {/* Navigation (optioneel voor later) */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/start" 
                  className="hl-nav-link"
                >
                  Nieuwe Analyse
                </Link>
                <Link 
                  href="/improve" 
                  className="hl-nav-link"
                >
                  Verbeter Concept
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-hl-wit">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-hl-wit border-t border-hl-zand mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Image
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden"
                  width={80}
                  height={20}
                  className="h-5 w-auto opacity-60"
                />
                <span className="text-gray-500 text-sm font-gantari">
                  © 2024 Hogeschool Leiden
                </span>
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-gray-500 text-sm font-gantari">
                  Interne-Analyse-Coach • Powered by AI
                </p>
                <p className="text-gray-400 text-xs font-gantari">
                  Professionele organisatie-ontwikkeling
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}