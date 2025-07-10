import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StepWizard from '../components/StepWizard'
import { homeLink } from '../utils/nav'

export default function Improve() {
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
          <title>Verbeter Bestaand Concept - Interne Analyse Coach</title>
          <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Project laden...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Verbeter je concept - Interne Analyse Coach</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Minimale header met alleen terug knop */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Terug knop */}
              <Link href={homeLink()} className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </Link>

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
            flow="improve"
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  )
}