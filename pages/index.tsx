import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StepWizard from '../components/StepWizard'

export default function Home() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check voor project parameter in URL
    const { id } = router.query
    if (id && typeof id === 'string') {
      setProjectId(id)
    }
    setIsLoading(false)
  }, [router.query])

  const handleSave = (data: any) => {
    console.log('📊 Project data opgeslagen:', data)
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Interne Analyse Coach - Hogeschool Leiden</title>
          <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Interne Analyse Coach - Hogeschool Leiden</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-hl-wit shadow-sm border-b border-hl-zand">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo en titel */}
              <div className="flex items-center space-x-3">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden Logo"
                  className="h-8 w-auto"
                />
                <h1 className="text-lg font-bold text-hl-donkergroen font-gantari">
                  Interne-Analyse-Coach
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Sectie */}
        <div className="hl-gradient-bg text-hl-wit py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 font-gantari">
                Welkom bij de Interne Analyse Coach
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-hl-lichtgroen font-gantari font-medium">
                Jouw AI-coach bij het schrijven van interne analyses volgens het 7S-model van McKinsey
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 bg-hl-wit">
          <div className="max-w-6xl mx-auto">
            {/* Instructies sectie */}
            <div className="hl-card mb-8">
              <h2 className="text-2xl font-bold text-hl-donkergroen mb-6 text-center font-gantari">
                Hoe werkt het?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-hl-lichtgroen rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-sharp hl-icon-primary hl-icon-lg">description</span>
                  </div>
                  <h3 className="font-gantari font-semibold text-hl-donkergroen mb-2">Schrijf je analyse</h3>
                  <h3 className="font-gantari font-semibold text-hl-donkergroen mb-2">1. Schrijf je analyse</h3>
                  <p className="text-sm text-gray-600 font-gantari">Vul de 7S-secties in met je onderzoek</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-hl-geel rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-sharp hl-icon-primary hl-icon-lg">psychology</span>
                  </div>
                  <h3 className="font-gantari font-semibold text-hl-donkergroen mb-2">2. AI Analyse</h3>
                  <p className="text-sm text-gray-600 font-gantari">Krijg gedetailleerde feedback per 7S-element</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-hl-zand rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-sharp hl-icon-primary hl-icon-lg">download</span>
                  </div>
                  <h3 className="font-gantari font-semibold text-hl-donkergroen mb-2">3. Exporteer</h3>
                  <p className="text-sm text-gray-600 font-gantari">Download je verbeterde analyse</p>
                </div>
              </div>
            </div>

            {/* StepWizard Component */}
            <StepWizard 
              projectId={projectId || undefined}
              flow="improve"
              onSave={handleSave}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-hl-wit border-t border-hl-zand mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden"
                  className="h-6 w-auto opacity-60"
                />
                <span className="text-gray-500 text-sm">
                  © 2024 Hogeschool Leiden
                </span>
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-gray-500 text-sm font-gantari">
                  Interne-Analyse-Coach • Powered by AI
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}