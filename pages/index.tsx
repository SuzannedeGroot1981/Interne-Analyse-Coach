import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StepWizard from '../components/StepWizard'
import { v4 as uuid } from 'uuid'
import { saveProject, loadProject, setActive, getActive } from '../utils/storage'

export default function Home() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check voor project parameter in URL
    const { id } = router.query
    
    if (id && typeof id === 'string') {
      // Gebruik project ID uit URL
      setProjectId(id)
      setActive(id)
      setIsLoading(false)
    } else {
      // Zoek bestaand actief project of maak nieuw project
      let activeId = getActive()
      
      if (!activeId) {
        // Maak nieuw project
        activeId = uuid()
        setActive(activeId)
        
        // Initialiseer project met basis data
        saveProject(activeId, {
          flow: 'start',
          title: `Interne Analyse - ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          meta: {
            orgName: '',
            level: 'Organisatie niveau'
          }
        })
        
        console.log('🆕 Nieuw project aangemaakt:', activeId)
      }
      
      setProjectId(activeId)
      setIsLoading(false)
    }
  }, [router.query])

  const handleSave = (data: any) => {
    console.log('📊 Project data opgeslagen:', data)
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Interne Analyse Coach - Laden...</title>
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
        <title>Interne Analyse Coach - AI-gestuurde Organisatie Analyse</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Minimale header */}
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
                <div>
                  <h1 className="text-lg font-bold text-primary">
                    Interne Analyse Coach
                  </h1>
                  <p className="text-xs text-gray-600">
                    AI-gestuurde organisatie-ontwikkeling
                  </p>
                </div>
              </div>

              {/* Project info */}
              {projectId && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Project: {projectId.slice(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-500">
                    Automatisch opgeslagen
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* StepWizard als hoofdcontent */}
        <div className="container mx-auto px-4 py-8">
          <StepWizard 
            projectId={projectId || undefined}
            flow="start"
            onSave={handleSave}
          />
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden"
                  className="h-5 w-auto opacity-60"
                />
                <span className="text-gray-500 text-sm">
                  © 2024 Hogeschool Leiden
                </span>
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-gray-500 text-sm">
                  Interne Analyse Coach • Powered by AI
                </p>
                <p className="text-gray-400 text-xs">
                  Professionele organisatie-ontwikkeling
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}