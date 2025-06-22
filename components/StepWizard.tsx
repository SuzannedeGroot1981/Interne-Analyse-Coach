'use client'

import { useState, useEffect } from 'react'
import { saveProject, loadProject, createProjectId } from '../utils/storage'

// Types voor stap data
interface StepData {
  current: string
  desired: string
  feedback?: string
  completed: boolean
}

interface WizardData {
  [key: string]: StepData
}

interface StepWizardProps {
  projectId?: string
  flow: 'start' | 'improve'
  onSave?: (data: any) => void
}

// Definitie van de 8 stappen (7S + Financiën)
const STEPS = [
  {
    id: 'strategy',
    title: 'Strategy',
    subtitle: 'Strategie & Richting',
    icon: '🎯',
    description: 'De langetermijnvisie, missie en strategische doelstellingen van de organisatie.',
    questions: {
      current: 'Beschrijf de huidige strategie van je organisatie. Wat zijn de belangrijkste doelstellingen en hoe worden deze nagestreefd?',
      desired: 'Wat zou de ideale strategie zijn? Welke strategische veranderingen zijn nodig om succesvol te zijn?'
    }
  },
  {
    id: 'structure',
    title: 'Structure',
    subtitle: 'Organisatiestructuur',
    icon: '🏗️',
    description: 'De manier waarop de organisatie is georganiseerd, rapportagelijnen en besluitvorming.',
    questions: {
      current: 'Hoe is je organisatie momenteel gestructureerd? Beschrijf de hiërarchie, afdelingen en rapportagelijnen.',
      desired: 'Hoe zou de organisatiestructuur er ideaal uit moeten zien? Welke structurele aanpassingen zijn gewenst?'
    }
  },
  {
    id: 'systems',
    title: 'Systems',
    subtitle: 'Systemen & Processen',
    icon: '⚙️',
    description: 'De procedures, processen en systemen die het dagelijkse werk ondersteunen.',
    questions: {
      current: 'Welke systemen en processen gebruikt je organisatie nu? Hoe verlopen de belangrijkste werkprocessen?',
      desired: 'Welke systemen en processen zouden ideaal zijn? Waar liggen de grootste verbeterkansen?'
    }
  },
  {
    id: 'shared-values',
    title: 'Shared Values',
    subtitle: 'Gedeelde Waarden',
    icon: '💎',
    description: 'De kernwaarden, cultuur en normen die de organisatie definiëren.',
    questions: {
      current: 'Wat zijn de huidige waarden en cultuur van je organisatie? Hoe uit zich dit in het dagelijkse gedrag?',
      desired: 'Welke waarden en cultuur streef je na? Hoe zou de ideale organisatiecultuur eruit zien?'
    }
  },
  {
    id: 'skills',
    title: 'Skills',
    subtitle: 'Vaardigheden & Competenties',
    icon: '🎓',
    description: 'De kennis, vaardigheden en competenties die aanwezig zijn in de organisatie.',
    questions: {
      current: 'Welke vaardigheden en competenties zijn er momenteel aanwezig? Waar ligt de expertise van je team?',
      desired: 'Welke vaardigheden zijn nodig voor de toekomst? Waar liggen de grootste ontwikkelbehoeften?'
    }
  },
  {
    id: 'style',
    title: 'Style',
    subtitle: 'Leiderschapsstijl',
    icon: '👑',
    description: 'De leiderschapsstijl en managementaanpak binnen de organisatie.',
    questions: {
      current: 'Hoe wordt er momenteel leiding gegeven? Wat kenmerkt de huidige managementstijl?',
      desired: 'Welke leiderschapsstijl zou het beste passen? Hoe zou ideaal management eruit zien?'
    }
  },
  {
    id: 'staff',
    title: 'Staff',
    subtitle: 'Personeel & Mensen',
    icon: '👥',
    description: 'De mensen in de organisatie, hun rollen en hoe ze worden ontwikkeld.',
    questions: {
      current: 'Hoe ziet je huidige personeelsbestand eruit? Wat kenmerkt je team en medewerkers?',
      desired: 'Welk type personeel heb je ideaal nodig? Hoe zou je team er in de toekomst uit moeten zien?'
    }
  },
  {
    id: 'finances',
    title: 'Financiën',
    subtitle: 'Financiële Situatie',
    icon: '💰',
    description: 'De financiële gezondheid, budgetten en economische aspecten van de organisatie.',
    questions: {
      current: 'Hoe is de huidige financiële situatie? Beschrijf budgetten, kosten en inkomsten.',
      desired: 'Wat zou de ideale financiële situatie zijn? Welke financiële doelen streef je na?'
    }
  }
]

export default function StepWizard({ projectId, flow, onSave }: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [actualProjectId, setActualProjectId] = useState<string>(projectId || '')

  // Initialiseer wizard data
  useEffect(() => {
    const initializeWizard = () => {
      let finalProjectId = projectId

      // Maak nieuw project ID als er geen is
      if (!finalProjectId) {
        finalProjectId = createProjectId()
        setActualProjectId(finalProjectId)
      }

      // Probeer bestaand project te laden
      if (finalProjectId) {
        const existingProject = loadProject(finalProjectId)
        if (existingProject && existingProject.data.wizardData) {
          setWizardData(existingProject.data.wizardData)
          console.log('📖 Bestaande wizard data geladen')
        } else {
          // Initialiseer lege wizard data
          const initialData: WizardData = {}
          STEPS.forEach(step => {
            initialData[step.id] = {
              current: '',
              desired: '',
              completed: false
            }
          })
          setWizardData(initialData)
          console.log('🆕 Nieuwe wizard data geïnitialiseerd')
        }
      }
    }

    initializeWizard()
  }, [projectId])

  // Auto-save functionaliteit
  const autoSave = async (data: WizardData) => {
    if (!actualProjectId) return

    setIsSaving(true)
    try {
      const projectData = {
        title: `${flow === 'start' ? 'Nieuwe Analyse' : 'Verbeter Concept'} - ${new Date().toLocaleDateString()}`,
        flow,
        wizardData: data,
        currentStep,
        lastModified: new Date().toISOString()
      }

      const success = saveProject(actualProjectId, projectData)
      if (success) {
        setLastSaved(new Date())
        if (onSave) {
          onSave(projectData)
        }
      }
    } catch (error) {
      console.error('❌ Auto-save fout:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Update stap data
  const updateStepData = (stepId: string, field: 'current' | 'desired', value: string) => {
    const newData = {
      ...wizardData,
      [stepId]: {
        ...wizardData[stepId],
        [field]: value,
        completed: false // Reset completed status when editing
      }
    }
    setWizardData(newData)
    
    // Auto-save na 2 seconden
    setTimeout(() => autoSave(newData), 2000)
  }

  // Markeer stap als voltooid
  const markStepCompleted = (stepId: string) => {
    const stepData = wizardData[stepId]
    if (stepData && stepData.current.trim() && stepData.desired.trim()) {
      const newData = {
        ...wizardData,
        [stepId]: {
          ...stepData,
          completed: true
        }
      }
      setWizardData(newData)
      autoSave(newData)
    }
  }

  // Vraag coach feedback (placeholder voor AI integratie)
  const requestCoachFeedback = async (stepId: string) => {
    setIsLoading(true)
    try {
      // TODO: Hier komt de AI coach integratie
      const stepData = wizardData[stepId]
      const step = STEPS.find(s => s.id === stepId)
      
      // Simuleer AI feedback (vervang later met echte AI call)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockFeedback = `Gebaseerd op je input voor ${step?.title}, zie ik interessante ontwikkelingen. De gap tussen je huidige en gewenste situatie biedt concrete verbeterkansen. Overweeg om specifieke actiestappen te definiëren en prioriteiten te stellen.`
      
      const newData = {
        ...wizardData,
        [stepId]: {
          ...stepData,
          feedback: mockFeedback
        }
      }
      setWizardData(newData)
      autoSave(newData)
    } catch (error) {
      console.error('❌ Fout bij ophalen feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Navigatie functies
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Bereken voortgang
  const completedSteps = Object.values(wizardData).filter(step => step.completed).length
  const progressPercentage = (completedSteps / STEPS.length) * 100

  const currentStepData = STEPS[currentStep]
  const currentWizardData = wizardData[currentStepData?.id] || { current: '', desired: '', completed: false }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header met voortgang */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {flow === 'start' ? '🆕 Nieuwe Interne Analyse' : '🔄 Verbeter Bestaand Concept'}
            </h1>
            <p className="text-gray-600">
              Systematische analyse volgens de 7S-methode + Financiën
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Stap {currentStep + 1} van {STEPS.length}
            </div>
            <div className="text-lg font-semibold text-primary">
              {Math.round(progressPercentage)}% voltooid
            </div>
          </div>
        </div>

        {/* Voortgangsbalk */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Stappen navigatie */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`p-2 rounded-lg text-center transition-all duration-200 ${
                index === currentStep
                  ? 'bg-primary text-white shadow-lg'
                  : wizardData[step.id]?.completed
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={step.title}
            >
              <div className="text-lg mb-1">{step.icon}</div>
              <div className="text-xs font-medium truncate">{step.title}</div>
            </button>
          ))}
        </div>

        {/* Auto-save status */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <div>
            Project ID: {actualProjectId.slice(0, 8)}...
          </div>
          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center space-x-1">
                <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                <span>Opslaan...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <span>
                Laatst opgeslagen: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Huidige stap content */}
      {currentStepData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Stap header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl">{currentStepData.icon}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentStepData.title}
                </h2>
                <p className="text-lg text-primary font-medium">
                  {currentStepData.subtitle}
                </p>
              </div>
            </div>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Tekstvelden */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Huidige situatie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📊 Feitelijke Situatie
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {currentStepData.questions.current}
              </p>
              <textarea
                value={currentWizardData.current}
                onChange={(e) => updateStepData(currentStepData.id, 'current', e.target.value)}
                placeholder="Beschrijf de huidige situatie..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Gewenste situatie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎯 Gewenste Situatie
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {currentStepData.questions.desired}
              </p>
              <textarea
                value={currentWizardData.desired}
                onChange={(e) => updateStepData(currentStepData.id, 'desired', e.target.value)}
                placeholder="Beschrijf de gewenste situatie..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Coach feedback sectie */}
          {currentWizardData.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">🤖</span>
                Coach Feedback
              </h3>
              <p className="text-blue-700 text-sm">
                {currentWizardData.feedback}
              </p>
            </div>
          )}

          {/* Actie knoppen */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Coach feedback knop */}
              <button
                onClick={() => requestCoachFeedback(currentStepData.id)}
                disabled={isLoading || !currentWizardData.current.trim() || !currentWizardData.desired.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
                    <span>Analyseren...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Vraag coach-feedback</span>
                  </>
                )}
              </button>

              {/* Markeer als voltooid */}
              <button
                onClick={() => markStepCompleted(currentStepData.id)}
                disabled={!currentWizardData.current.trim() || !currentWizardData.desired.trim()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentWizardData.completed
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 disabled:opacity-50'
                }`}
              >
                <span>{currentWizardData.completed ? '✅' : '☐'}</span>
                <span>{currentWizardData.completed ? 'Voltooid' : 'Markeer als voltooid'}</span>
              </button>
            </div>

            {/* Navigatie knoppen */}
            <div className="flex items-center space-x-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>←</span>
                <span>Vorige</span>
              </button>

              <button
                onClick={nextStep}
                disabled={currentStep === STEPS.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Volgende</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overzicht sectie (alleen tonen als alle stappen voltooid) */}
      {completedSteps === STEPS.length && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Analyse Voltooid!
            </h3>
            <p className="text-green-700 mb-4">
              Je hebt alle 8 stappen van de interne analyse doorlopen. 
              Je kunt nu een volledig rapport genereren of individuele stappen herzien.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                📄 Genereer Volledig Rapport
              </button>
              <button className="px-6 py-3 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                📤 Exporteer Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}