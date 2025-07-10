'use client'

import { useState } from 'react'
import DocumentDropzone from './DocumentDropzone'

interface DocumentReviewStepProps {
  className?: string
}

interface SevenSData {
  [key: string]: {
    content: string
    feedback?: string
  }
}

// 7S Model definitie met harde en zachte elementen
const HARD_ELEMENTS = [
  {
    id: 'strategy',
    title: 'Strategy',
    subtitle: 'Strategie & Richting',
    icon: '🎯',
    description: 'De langetermijnvisie, missie en strategische doelstellingen van de zorgorganisatie.',
    placeholder: 'Beschrijf de huidige strategie, visie en missie van de organisatie...'
  },
  {
    id: 'structure',
    title: 'Structure', 
    subtitle: 'Organisatiestructuur',
    icon: '🏗️',
    description: 'De manier waarop de organisatie is georganiseerd, rapportagelijnen en besluitvorming.',
    placeholder: 'Beschrijf de organisatiestructuur, hiërarchie en rapportagelijnen...'
  },
  {
    id: 'systems',
    title: 'Systems',
    subtitle: 'Systemen & Processen', 
    icon: '⚙️',
    description: 'De procedures, processen en systemen die het dagelijkse zorgwerk ondersteunen.',
    placeholder: 'Beschrijf de belangrijkste systemen, processen en werkwijzen...'
  }
]

const SOFT_ELEMENTS = [
  {
    id: 'shared-values',
    title: 'Shared Values',
    subtitle: 'Gedeelde Waarden',
    icon: '💎', 
    description: 'De kernwaarden, organisatiecultuur en normen die de zorgorganisatie definiëren.',
    placeholder: 'Beschrijf de waarden, cultuur en normen binnen de organisatie...'
  },
  {
    id: 'skills',
    title: 'Skills',
    subtitle: 'Vaardigheden & Competenties',
    icon: '🎓',
    description: 'De kennis, vaardigheden en competenties die aanwezig zijn in de organisatie.',
    placeholder: 'Beschrijf de aanwezige vaardigheden, competenties en kennis...'
  },
  {
    id: 'style', 
    title: 'Style',
    subtitle: 'Leiderschapsstijl',
    icon: '👑',
    description: 'De leiderschapsstijl en managementaanpak binnen de zorgorganisatie.',
    placeholder: 'Beschrijf de leiderschapsstijl en managementaanpak...'
  },
  {
    id: 'staff',
    title: 'Staff', 
    subtitle: 'Personeel & Mensen',
    icon: '👥',
    description: 'De mensen in de organisatie, hun rollen en hoe ze worden ontwikkeld.',
    placeholder: 'Beschrijf het personeel, rollen en personeelsontwikkeling...'
  }
]

export default function DocumentReviewStep({ className = '' }: DocumentReviewStepProps) {
  const [sevenSData, setSevenSData] = useState<SevenSData>({})
  const [activeTab, setActiveTab] = useState<'document' | 'manual'>('manual')
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [overallFeedback, setOverallFeedback] = useState<string>('')

  const handleDocumentLoaded = (documentData: any) => {
    console.log('📄 Document geladen in review stap:', {
      fileName: documentData.fileName,
      wordCount: documentData.wordCount,
      fileType: documentData.fileType
    })
  }

  // Update 7S data
  const updateSevenSData = (elementId: string, value: string) => {
    setSevenSData(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        content: value
      }
    }))
  }

  // Genereer feedback voor handmatige invoer
  const generateManualFeedback = async () => {
    setIsGeneratingFeedback(true)
    try {
      // Combineer alle 7S teksten
      let combinedText = ''
      const allElements = [...HARD_ELEMENTS, ...SOFT_ELEMENTS]
      
      allElements.forEach(element => {
        const data = sevenSData[element.id]
        if (data?.content) {
          combinedText += `## ${element.title}\n\n${data.content}\n\n`
        }
      })

      if (!combinedText.trim()) {
        alert('Vul eerst enkele 7S-elementen in om feedback te krijgen.')
        return
      }

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: combinedText,
          fileName: '7S Handmatige Invoer',
          fileType: 'manual'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Review mislukt')
      }

      const result = await response.json()
      setOverallFeedback(result.overall_feedback || 'Feedback gegenereerd')

      console.log('✅ Handmatige 7S review voltooid')

    } catch (error) {
      console.error('❌ Fout bij handmatige review:', error)
      alert(`Fout bij feedback generatie: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  // Render 7S element
  const renderSevenSElement = (element: any) => (
    <div key={element.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="text-3xl mr-3">{element.icon}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{element.title}</h3>
          <p className="text-primary font-medium">{element.subtitle}</p>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">{element.description}</p>
      
      {/* Analyse tekstveld */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Analyse & Beschrijving
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Beschrijf de huidige situatie en eventueel de gewenste toekomstige situatie voor dit element
        </p>
        <textarea
          value={sevenSData[element.id]?.content || ''}
          onChange={(e) => updateSevenSData(element.id, e.target.value)}
          placeholder={`${element.placeholder}\n\nOptioneel: Beschrijf ook de gewenste toekomstige situatie...`}
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      {/* Individuele feedback knop en display */}
      <div className="mt-4">
        <button
          onClick={() => generateElementFeedback(element.id)}
          disabled={!sevenSData[element.id]?.content?.trim() || isGeneratingFeedback}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !sevenSData[element.id]?.content?.trim() || isGeneratingFeedback
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGeneratingFeedback ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Analyseren...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>Vraag Feedback</span>
            </div>
          )}
        </button>

        {/* Element feedback display */}
        {sevenSData[element.id]?.feedback && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                <span className="mr-2">💡</span>
                AI Feedback voor {element.title}
              </h4>
              <button
                onClick={() => hideElementFeedback(element.id)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Verberg
              </button>
            </div>
            <div className="text-blue-700 text-sm whitespace-pre-line">
              {sevenSData[element.id].feedback}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <span className="mr-3">📝</span>
          Interne Analyse Feedback
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload je bestaande document of vul handmatig de 7S-elementen in om gedetailleerde 
          AI-feedback te krijgen op je interne organisatie-analyse.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('document')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'document'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📄 Document Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ✍️ Handmatige Invoer
          </button>
        </div>
      </div>

      {/* Document Upload Tab */}
      {activeTab === 'document' && (
        <div>
          {/* Instructies voor document upload */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Document Upload Instructies
            </h3>
            <div className="space-y-2 text-blue-700">
              <p className="flex items-start">
                <span className="mr-2 mt-1">1️⃣</span>
                <span><strong>Upload</strong> je interne analyse document (.docx of .md bestand)</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 mt-1">2️⃣</span>
                <span><strong>Review</strong> krijg automatische AI-analyse van je tekst</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 mt-1">3️⃣</span>
                <span><strong>Verbeter</strong> implementeer de feedback in je document</span>
              </p>
            </div>
          </div>

          {/* Document Dropzone Component */}
          <DocumentDropzone 
            onDocumentLoaded={handleDocumentLoaded}
            className="mt-6"
          />
        </div>
      )}

      {/* Manual Input Tab */}
      {activeTab === 'manual' && (
        <div>
          {/* Instructies voor handmatige invoer */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <span className="mr-2">✍️</span>
              Handmatige 7S-Model Invoer
            </h3>
            <div className="space-y-2 text-green-700">
              <p className="flex items-start">
                <span className="mr-2 mt-1">📝</span>
                <span>Vul per 7S-element de huidige situatie in (verplicht) en eventueel de gewenste situatie</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 mt-1">🔄</span>
                <span>Je kunt elementen stap voor stap invullen en tussentijds feedback krijgen</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 mt-1">🤖</span>
                <span>Klik op "Genereer Feedback" voor AI-analyse van je ingevulde elementen</span>
              </p>
            </div>
          </div>

          {/* Harde Elementen */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="px-4 py-2 bg-gray-100 rounded-full">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="mr-2">🔧</span>
                  Harde Elementen
                </h3>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            <p className="text-gray-600 text-center mb-6">
              Tastbare, meetbare aspecten van de organisatie
            </p>
            {HARD_ELEMENTS.map(renderSevenSElement)}
          </div>

          {/* Zachte Elementen */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="px-4 py-2 bg-gray-100 rounded-full">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="mr-2">💫</span>
                  Zachte Elementen
                </h3>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            <p className="text-gray-600 text-center mb-6">
              Culturele en menselijke aspecten van de organisatie
            </p>
            {SOFT_ELEMENTS.map(renderSevenSElement)}
          </div>

          {/* Feedback Generatie */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">🤖</span>
                AI Feedback Generatie
              </h3>
              <button
                onClick={generateManualFeedback}
                disabled={isGeneratingFeedback}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isGeneratingFeedback
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGeneratingFeedback ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Analyseren...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Genereer Feedback</span>
                  </div>
                )}
              </button>
            </div>

            {/* Overall Feedback Display */}
            {overallFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="mr-2">📋</span>
                  AI Coach Feedback
                </h4>
                <div className="text-blue-700 text-sm whitespace-pre-line">
                  {overallFeedback}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips sectie */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Tips voor de beste feedback
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📄 Document Upload</h4>
            <ul className="space-y-1">
              <li>• Upload complete documenten (niet fragmenten)</li>
              <li>• Zorg voor duidelijke 7S-structuur</li>
              <li>• Minimaal 1000 woorden voor beste analyse</li>
              <li>• Gebruik APA-bronvermelding waar mogelijk</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">✍️ Handmatige Invoer</h4>
            <ul className="space-y-1">
              <li>• Vul minimaal 3-4 elementen in voor overall feedback</li>
              <li>• Gebruik concrete voorbeelden en data</li>
              <li>• Beschrijf huidige én gewenste situatie per element</li>
              <li>• Focus op interne organisatie-aspecten</li>
              <li>• Combineer element-feedback met overall feedback</li>
              <li>• Itereer: feedback → verbeteren → nieuwe feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}