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
                    Interne-Analyse-Coach
                  </h1>
                  <p className="text-xs text-gray-600">
                    AI-gestuurde organisatie-ontwikkeling
                  </p>
                </div>
              </div>

              {/* Navigatie */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/sources" 
                  className="text-gray-600 hover:text-primary transition-colors text-sm font-medium"
                >
                  Nieuwe Analyse
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* StepWizard Component */}
          <StepWizard 
            projectId={projectId || undefined}
            flow="improve"
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  )
}