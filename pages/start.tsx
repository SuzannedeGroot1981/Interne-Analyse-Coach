import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import StepWizard from '../components/StepWizard'
import { homeLink } from '../utils/nav'

export default function Start() {
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Project laden...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Nieuwe Interne Analyse - Interne Analyse Coach</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          {/* Terug knop */}
          <div className="mb-6">
            <Link href={homeLink()} className="inline-flex items-center text-primary hover:text-green-700 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug naar hoofdmenu
            </Link>
          </div>

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