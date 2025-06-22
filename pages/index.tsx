import Link from 'next/link'
import { useEffect, useState } from 'react'
import { listProjects, getOrCreateUserId, deleteProject, type ProjectSummary } from '../utils/storage'

export default function Home() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [userId, setUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Laad projecten bij component mount
  useEffect(() => {
    const loadUserProjects = () => {
      try {
        const userIdFromStorage = getOrCreateUserId()
        setUserId(userIdFromStorage)
        
        const userProjects = listProjects()
        setProjects(userProjects)
        
        console.log('📊 Dashboard geladen:', {
          userId: userIdFromStorage.slice(0, 8) + '...',
          projectCount: userProjects.length
        })
      } catch (error) {
        console.error('❌ Fout bij laden dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Kleine delay voor betere UX
    setTimeout(loadUserProjects, 100)
  }, [])

  // Verwijder project handler
  const handleDeleteProject = (projectId: string) => {
    if (confirm('Weet je zeker dat je dit project wilt verwijderen?')) {
      const success = deleteProject(projectId)
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
      }
    }
  }

  // Format datum voor weergave
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'Vandaag'
      } else if (diffDays === 1) {
        return 'Gisteren'
      } else if (diffDays < 7) {
        return `${diffDays} dagen geleden`
      } else {
        return date.toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
      }
    } catch {
      return 'Onbekend'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            Welkom bij de Interne Analyse Coach
          </h1>
          
          <p className="text-xl text-primary font-medium mb-8 max-w-2xl mx-auto">
            Jouw AI-gestuurde assistent voor diepgaande interne analyses en het verbeteren van concepten.
          </p>

          {/* User ID Display (voor debugging) */}
          {userId && (
            <div className="text-xs text-gray-400 mb-4">
              Gebruiker-ID: {userId.slice(0, 8)}...{userId.slice(-4)}
            </div>
          )}
        </div>

        {/* Recente Projecten Sectie */}
        {!isLoading && projects.length > 0 && (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
                  </svg>
                  Jouw Projecten
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {projects.length} project{projects.length !== 1 ? 'en' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          project.flow === 'start' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          project.flow === 'start' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {project.flow === 'start' ? 'Nieuwe Analyse' : 'Verbeter Concept'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all text-sm"
                        title="Verwijder project"
                      >
                        ×
                      </button>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {formatDate(project.updatedAt)}
                    </p>
                    
                    <Link href={`/${project.flow}?project=${project.id}`}>
                      <button className="w-full text-sm bg-gray-100 hover:bg-primary hover:text-white text-gray-700 py-2 px-3 rounded transition-colors">
                        Verder werken
                      </button>
                    </Link>
                  </div>
                ))}
              </div>

              {projects.length > 6 && (
                <div className="text-center mt-6">
                  <button className="text-primary hover:text-green-700 text-sm font-medium">
                    Bekijk alle {projects.length} projecten →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-gray-600">Projecten laden...</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Begin nieuwe analyse */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Nieuwe Interne Analyse
                </h2>
                <p className="text-gray-600 mb-6">
                  Start een volledig nieuwe analyse van je organisatie, processen of strategieën met AI-ondersteuning.
                </p>
              </div>
              
              <Link href="/start">
                <button className="btn-primary w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105">
                  Begin met een nieuwe interne analyse
                </button>
              </Link>
            </div>

            {/* Verbeter bestaand concept */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Verbeter Bestaand Concept
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload je bestaande analyse of concept en laat AI helpen bij het identificeren van verbeterpunten en optimalisaties.
                </p>
              </div>
              
              <Link href="/improve">
                <button className="btn-secondary w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105">
                  Verbeter een bestaand concept
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Wat kan de Interne Analyse Coach voor je doen?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">AI-Gedreven Analyse</h4>
              <p className="text-gray-600 text-sm">
                Gebruik geavanceerde AI om diepgaande inzichten te krijgen in je organisatie en processen.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Gestructureerde Aanpak</h4>
              <p className="text-gray-600 text-sm">
                Volg een bewezen methodologie voor effectieve interne analyses en verbeteringen.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Praktische Resultaten</h4>
              <p className="text-gray-600 text-sm">
                Krijg concrete aanbevelingen en actiepunten die direct toepasbaar zijn in je organisatie.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Powered by AI • Interne Analyse Coach • Professionele Organisatie-ontwikkeling
          </p>
        </div>
      </div>
    </div>
  )
}