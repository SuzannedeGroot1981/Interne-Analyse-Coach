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
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo en titel */}
              <div className="flex items-center space-x-3">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden Logo"
                  className="h-8 w-auto"
                />
                <h1 className="text-lg font-bold text-primary">
                  Interne-Analyse-Coach
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Sectie */}
        <div className="bg-gradient-to-r from-primary to-green-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Welkom bij de Interne Analyse Coach
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100">
                Jouw AI-coach bij het schrijven van interne analyses volgens het 7S-model van McKinsey
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Instructies sectie */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Hoe werkt de Interne Analyse Coach?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">1. Upload Document</h3>
                  <p className="text-sm text-gray-600">Upload je bestaande analyse of concept</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">2. AI Analyse</h3>
                  <p className="text-sm text-gray-600">Krijg gedetailleerde feedback per 7S-element</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">3. Verbeter</h3>
                  <p className="text-sm text-gray-600">Pas verbetervoorstellen toe</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">4. Exporteer</h3>
                  <p className="text-sm text-gray-600">Download je verbeterde analyse</p>
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
        <footer className="bg-white border-t border-gray-200 mt-16">
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
                <p className="text-gray-500 text-sm">
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