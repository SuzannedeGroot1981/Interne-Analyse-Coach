import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getActive, setActive, saveProject, loadProject } from '../utils/storage'
import { v4 as uuid } from 'uuid'

export default function Orientatie() {
  const router = useRouter()
  const { new: forceNew } = router.query
  const [orgName, setOrgName] = useState('')
  const [level, setLevel] = useState('Organisatie niveau')
  const [isLoading, setIsLoading] = useState(true)

  // a) Zoek bestaand project
  useEffect(() => {
    if (!forceNew) {
      const act = getActive()
      if (act) {
        // al actief project → ga meteen verder
        router.replace(`/sources?id=${act}`)
        return
      }
    }
    setIsLoading(false)
  }, [forceNew, router])

  // b) handleContinue maakt ALLEEN een nieuw id als er nog geen activeId
  function handleContinue() {
    if (!orgName.trim()) {
      alert('Vul een organisatienaam in om verder te gaan.')
      return
    }

    let id = getActive()
    if (!id) {
      id = uuid()
      setActive(id)
      saveProject(id, { 
        flow: "new", 
        meta: { orgName, level },
        title: `Interne Analyse - ${orgName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } else {
      // project bestond al → alleen meta bijwerken
      const existingProject = loadProject(id) || {}
      saveProject(id, { 
        ...existingProject, 
        meta: { orgName, level },
        title: `Interne Analyse - ${orgName}`,
        updatedAt: new Date().toISOString()
      })
    }
    router.push(`/sources?id=${id}`)
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Project Setup - Interne Analyse Coach</title>
          <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Project controleren...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Project Setup - Interne Analyse Coach</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Minimale header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <button 
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center text-primary hover:text-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </button>

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

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Project Setup
                </h1>
                
                <p className="text-gray-600">
                  Stel je nieuwe interne analyse project in. We beginnen met enkele basisgegevens 
                  over de organisatie die je gaat analyseren.
                </p>
              </div>

              {/* Formulier */}
              <div className="space-y-6">
                {/* Organisatienaam */}
                <div>
                  <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 mb-2">
                    🏢 Organisatienaam *
                  </label>
                  <input
                    type="text"
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Bijv. Ziekenhuis Leiden, Thuiszorg Noord, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    De naam van de organisatie die je gaat analyseren
                  </p>
                </div>

                {/* Analyseniveau */}
                <div>
                  <label htmlFor="level" className="block text-sm font-semibold text-gray-700 mb-2">
                    🎯 Analyseniveau
                  </label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Organisatie niveau">Organisatie niveau</option>
                    <option value="Afdeling niveau">Afdeling niveau</option>
                    <option value="Team niveau">Team niveau</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Op welk niveau voer je de interne analyse uit?
                  </p>
                </div>

                {/* Instructies */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Wat ga je doen?
                  </h3>
                  <div className="text-blue-700 text-sm space-y-1">
                    <p>• <strong>Stap 1:</strong> Bronneninventarisatie - welke documenten en data heb je?</p>
                    <p>• <strong>Stap 2:</strong> Evidence verzameling - upload interviews en enquêtes</p>
                    <p>• <strong>Stap 3:</strong> 7S-analyse - systematische interne analyse</p>
                    <p>• <strong>Stap 4:</strong> AI-feedback en rapportage</p>
                  </div>
                </div>

                {/* Continue knop */}
                <button
                  onClick={handleContinue}
                  disabled={!orgName.trim()}
                  className="w-full py-4 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Start Project</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>

                {/* Info over bestaand project */}
                {forceNew && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-800 text-sm font-medium">
                        Nieuw project starten
                      </span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Je start een nieuw project. Eventuele bestaande projecten blijven bewaard.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Je project wordt automatisch opgeslagen. Je kunt altijd later terugkeren om verder te werken.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}