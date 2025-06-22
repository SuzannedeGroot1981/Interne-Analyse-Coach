import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StepWizard from '../components/StepWizard'
import { homeLink } from '../utils/nav'
import { loadProject } from '../utils/storage'

export default function Start() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check voor project parameter in URL
    const { id } = router.query
    if (id && typeof id === 'string') {
      // Controleer of project bestaat
      const project = loadProject(id)
      if (project) {
        setProjectId(id)
        console.log('📖 Start pagina - project geladen:', id)
      } else {
        console.warn('⚠️ Start pagina - project niet gevonden, redirect naar home:', id)
        window.location.href = homeLink()
        return
      }
    } else {
      console.warn('⚠️ Start pagina - geen project ID, redirect naar home')
      window.location.href = homeLink()
      return
    }
    setIsLoading(false)
  }, [router.query])

  const handleSave = (data: any) => {
    console.log('📊 Project data opgeslagen:', data)
  }

  const handleBack = () => {
    window.location.href = homeLink()
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Nieuwe Interne Analyse - Interne Analyse Coach</title>
          <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Project laden...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Nieuwe Interne Analyse - Interne Analyse Coach</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Minimale header met alleen terug knop */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Terug knop */}
              <button 
                onClick={handleBack}
                className="inline-flex items-center text-primary hover:text-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </button>

              {/* Logo (klein) */}
              <div className="flex items-center space-x-2">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden"
                  className="h-6 w-auto opacity-60"
                />
                <span className="text-sm text-gray-500 hidden sm:block">
                  Interne Analyse Coach
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* StepWizard Component */}
          <StepWizard 
            projectId={projectId || undefined}
            flow="start"
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  )
}