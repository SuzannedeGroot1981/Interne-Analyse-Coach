'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { saveProject, loadProject, createProjectId } from '../utils/storage'
import FinanceDropzone from './FinanceDropzone'
import ProjectActions from './ProjectActions'

// Types voor stap data
interface StepData {
  current: string
  desired: string
  feedback?: string
  completed: boolean
  financeData?: any // Voor financiële data uit uploads
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
    description: 'De langetermijnvisie, missie en strategische doelstellingen van de zorgorganisatie. Focus op interne strategische keuzes en prioriteiten.',
    questions: {
      current: 'Beschrijf de huidige strategie van je zorgorganisatie. Wat zijn de belangrijkste interne doelstellingen en hoe worden deze nagestreefd? Gebruik concrete voorbeelden en citeer interview/enquête resultaten.'
    }
  },
  {
    id: 'structure',
    title: 'Structure',
    subtitle: 'Organisatiestructuur',
    icon: '🏗️',
    description: 'De interne organisatiestructuur: hiërarchie, afdelingen, rapportagelijnen en besluitvormingsprocessen binnen de zorgorganisatie.',
    questions: {
      current: 'Analyseer de huidige organisatiestructuur. Beschrijf hiërarchie, afdelingen, rapportagelijnen en besluitvorming. Ondersteun met organogram indien beschikbaar en interview bevindingen.'
    }
  },
  {
    id: 'systems',
    title: 'Systems',
    subtitle: 'Systemen & Processen',
    icon: '⚙️',
    description: 'Interne procedures, processen, IT-systemen en werkwijzen die het dagelijkse zorgwerk ondersteunen en faciliteren.',
    questions: {
      current: 'Beschrijf de belangrijkste interne systemen en processen. Hoe verlopen zorgprocessen, administratieve procedures en IT-ondersteuning? Analyseer effectiviteit op basis van medewerker feedback.'
    }
  },
  {
    id: 'shared-values',
    title: 'Shared Values',
    subtitle: 'Gedeelde Waarden',
    icon: '💎',
    description: 'De kernwaarden, organisatiecultuur en normen die de zorgorganisatie intern definiëren en verbinden.',
    questions: {
      current: 'Analyseer de gedeelde waarden en cultuur. Hoe leven medewerkers deze waarden na in de dagelijkse zorgverlening? Gebruik concrete voorbeelden uit interviews en observaties.'
    }
  },
  {
    id: 'skills',
    title: 'Skills',
    subtitle: 'Vaardigheden & Competenties',
    icon: '🎓',
    description: 'De interne kennis, vaardigheden en competenties van medewerkers en teams binnen de zorgorganisatie.',
    questions: {
      current: 'Inventariseer de aanwezige vaardigheden en competenties. Waar liggen de sterke punten van je zorgteams? Identificeer kennislacunes op basis van competentiematrix en medewerkergesprekken.'
    }
  },
  {
    id: 'style',
    title: 'Style',
    subtitle: 'Leiderschapsstijl',
    icon: '👑',
    description: 'De interne leiderschapsstijl en managementaanpak van leidinggevenden binnen de zorgorganisatie.',
    questions: {
      current: 'Analyseer de leiderschapsstijl van management en teamleiders. Hoe wordt er intern leiding gegeven? Ondersteun met voorbeelden uit leiderschapssessies en medewerkerfeedback.'
    }
  },
  {
    id: 'staff',
    title: 'Staff',
    subtitle: 'Personeel & Mensen',
    icon: '👥',
    description: 'Het interne personeelsbestand: rollen, ontwikkeling, motivatie en welzijn van medewerkers in de zorgorganisatie.',
    questions: {
      current: 'Beschrijf het personeelsbestand en teamsamenstelling. Hoe worden medewerkers ontwikkeld en gemotiveerd? Analyseer op basis van HR-data en medewerkertevredenheidsonderzoek.'
    }
  },
  {
    id: 'finances',
    title: 'Financiën',
    subtitle: 'Financiële Situatie',
    icon: '💰',
    description: 'De interne financiële gezondheid: rentabiliteit, liquiditeit, solvabiliteit en budgetbeheersing van de zorgorganisatie.',
    questions: {
      current: 'Analyseer de financiële gezondheid met focus op rentabiliteit, liquiditeit en solvabiliteit. Hoe verhouden kosten zich tot opbrengsten? Verbind financiële prestaties aan andere 7S-elementen.'
    },
    hasFileUpload: true // Speciale markering voor financiën stap
  }
]

export default function StepWizard({ projectId, flow, onSave }: StepWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [actualProjectId, setActualProjectId] = useState<string>(projectId || '')
  const [currentProjectData, setCurrentProjectData] = useState<any>(null)
  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false)
  const [lastQuotaError, setLastQuotaError] = useState<Date | null>(null)
  const [projectMeta, setProjectMeta] = useState<{ orgName?: string, level?: string }>({})
  const [isCheckingAPA, setIsCheckingAPA] = useState(false)
  const [evidence, setEvidence] = useState<any>(null) // Voor evidence data
  const [sources, setSources] = useState<any>(null) // Voor sources data
  const [apaResults, setApaResults] = useState<any>(null) // Voor lokale APA resultaten

  // Initialiseer wizard data
  useEffect(() => {
    const initializeWizard = () => {
      // Haal project ID uit URL parameter als niet meegegeven
      let finalProjectId = projectId
      if (!finalProjectId) {
        const urlParams = new URLSearchParams(window.location.search)
        const idFromUrl = urlParams.get('id')
        if (idFromUrl) {
          finalProjectId = idFromUrl
          setActualProjectId(idFromUrl)
        } else {
          // Maak nieuw project ID als er geen is
          finalProjectId = createProjectId()
          setActualProjectId(finalProjectId)
        }
      }

      // Probeer bestaand project te laden
      if (finalProjectId) {
        const existingProject = loadProject(finalProjectId)
        if (existingProject && existingProject.wizardData) {
          setWizardData(existingProject.wizardData)
          setCurrentProjectData(existingProject)
          setProjectMeta(existingProject.meta || {})
          
          // Laad evidence data als beschikbaar
          if (existingProject.evidence) {
            setEvidence(existingProject.evidence)
            console.log('📋 Evidence data geladen:', {
              hasEvidence: !!existingProject.evidence,
              evidenceKeys: Object.keys(existingProject.evidence || {})
            })
          }

          // Laad sources data als beschikbaar
          if (existingProject.sources) {
            setSources(existingProject.sources)
            console.log('📚 Sources data geladen:', {
              hasSources: !!existingProject.sources,
              sourcesKeys: Object.keys(existingProject.sources || {})
            })
          }
          
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
        title: `${flow === 'start' ? 'Nieuwe Analyse' : 'Verbeter Concept'} - ${projectMeta.orgName || new Date().toLocaleDateString()}`,
        flow,
        wizardData: data,
        currentStep,
        meta: projectMeta,
        lastModified: new Date().toISOString()
      }

      const success = saveProject(actualProjectId, projectData)
      if (success) {
        setLastSaved(new Date())
        setCurrentProjectData({ id: actualProjectId, data: projectData })
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

  // Handle financiële data upload
  const handleFinanceDataUpload = (financeData: any) => {
    const stepId = 'finances'
    const newData = {
      ...wizardData,
      [stepId]: {
        ...wizardData[stepId],
        financeData: financeData,
        completed: false // Reset completed status when new data is uploaded
      }
    }
    setWizardData(newData)
    autoSave(newData)

    console.log('💰 Financiële data toegevoegd aan wizard:', {
      fileName: financeData.fileName,
      rows: financeData.summary.totalRows,
      columns: financeData.summary.totalColumns
    })
  }

  // Markeer stap als voltooid
  const markStepCompleted = (stepId: string) => {
    const stepData = wizardData[stepId]
    if (stepData && stepData.current.trim()) {
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

  // Check if quota error is recent (within last hour)
  const isQuotaErrorRecent = () => {
    if (!lastQuotaError) return false
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return lastQuotaError > oneHourAgo
  }

  // Lokale APA Self-check functie
  const checkAPA = async () => {
    setIsCheckingAPA(true)
    setApaResults(null)
    
    try {
      console.log('📝 Start APA self-check...', {
        projectId: actualProjectId,
        stepsWithContent: Object.keys(wizardData).filter(key => wizardData[key].current.trim()).length
      })

      // Verzamel alle S-teksten
      let allText = ''
      STEPS.forEach(step => {
        const stepData = wizardData[step.id]
        if (stepData && stepData.current.trim()) {
          allText += `## ${step.title}\n\n${stepData.current}\n\n`
          if (stepData.desired && stepData.desired.trim()) {
            allText += `### Gewenste situatie\n\n${stepData.desired}\n\n`
          }
        }
      })

      if (!allText.trim()) {
        alert('Geen tekst gevonden om te controleren. Vul eerst enkele stappen in.')
        return
      }

      // Gebruik lokale APA validator
      const { validateAPA, generateAPASummary } = await import('../utils/apaValidator')
      const result = validateAPA(allText)
      
      console.log('✅ APA check voltooid:', {
        textLength: allText.length,
        issuesFound: result.summary.totalIssues,
        errors: result.summary.errors,
        warnings: result.summary.warnings
      })

      // Sla resultaten op voor weergave
      setApaResults(result)
      
      // Toon korte samenvatting
      const summary = generateAPASummary(result)
      if (result.isValid) {
        alert(summary)
      } else {
        alert(`${summary}\n\n💡 Bekijk de gedetailleerde resultaten hieronder voor specifieke verbeterpunten.`)
      }

    } catch (error) {
      console.error('❌ APA check fout:', error)
      alert(`Fout bij APA controle: ${error instanceof Error ? error.message : 'Onbekende fout'}\n\nProbeer het later opnieuw.`)
    } finally {
      setIsCheckingAPA(false)
    }
  }

  // Vraag coach feedback (placeholder voor AI integratie)
  const requestCoachFeedback = async (stepId: string) => {
    // Check if we recently hit quota limit
    if (apiQuotaExceeded && isQuotaErrorRecent()) {
      const stepData = wizardData[stepId]
      const step = STEPS.find(s => s.id === stepId)
      
      const quotaFeedback = `⏰ **API Quota Tijdelijk Bereikt**

De AI coach kan momenteel geen nieuwe feedback geven omdat de dagelijkse API quota is overschreden.

**Wat kun je doen:**
• **Wacht enkele uren** - de quota reset automatisch na 24 uur
• **Ga handmatig verder** - je analyse is nog steeds waardevol zonder AI feedback
• **Upgrade je API plan** in [Google AI Studio](https://makersuite.google.com/app/apikey) voor hogere limieten

**Handmatige analyse tips voor ${step?.title}:**
• Vergelijk je huidige en gewenste situatie kritisch
• Identificeer de 3 grootste verschillen
• Bedenk concrete stappen om van huidig naar gewenst te komen
• Overweeg welke resources (tijd, geld, mensen) je nodig hebt

Je kunt altijd later terugkomen voor AI feedback wanneer de quota is gereset!`

      const newData = {
        ...wizardData,
        [stepId]: {
          ...stepData,
          feedback: quotaFeedback
        }
      }
      setWizardData(newData)
      autoSave(newData)
      return
    }

    setIsLoading(true)
    try {
      const stepData = wizardData[stepId]
      const step = STEPS.find(s => s.id === stepId)
      
      // Bereid data voor AI coach API - inclusief projectId voor evidence
      const requestBody = {
        userPrompt: `Geef feedback op mijn ${step?.title} analyse`,
        stepTitle: step?.title,
        currentSituation: stepData.current,
        desiredSituation: stepData.desired,
        projectId: actualProjectId
      }

      // Voeg financiële data toe als beschikbaar
      if (stepId === 'finances' && stepData.financeData) {
        requestBody.userPrompt += `\n\nIk heb ook financiële data geüpload: ${stepData.financeData.fileName} met ${stepData.financeData.summary.totalRows} rijen data.`
      }

      // Roep coach API aan
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fout bij ophalen feedback')
      }

      const data = await response.json()
      
      const newData = {
        ...wizardData,
        [stepId]: {
          ...stepData,
          feedback: data.feedback
        }
      }
      setWizardData(newData)
      autoSave(newData)

      // Reset quota error state on successful request
      setApiQuotaExceeded(false)
      setLastQuotaError(null)

      console.log('🤖 Coach feedback ontvangen:', {
        stepTitle: step?.title,
        feedbackLength: data.feedback.length,
        wordCount: data.wordCount
        evidenceUsed: data.evidenceUsed
      })

    } catch (error) {
      console.error('❌ Fout bij ophalen feedback:', error)
      
      // Check for quota exceeded error with proper type checking
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isQuotaError = errorMessage && (
        errorMessage.includes('API quota bereikt') || 
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('exceeded your current quota')
      )

      if (isQuotaError) {
        setApiQuotaExceeded(true)
        setLastQuotaError(new Date())
      }
      
      // Verbeterde error handling voor API quota problemen
      const stepData = wizardData[stepId]
      const step = STEPS.find(s => s.id === stepId)
      
      let fallbackFeedback = ''
      
      if (isQuotaError) {
        fallbackFeedback = `⚠️ **API Quota Bereikt**

De AI coach kan momenteel geen feedback geven omdat de dagelijkse API quota is overschreden.

**Wat kun je doen:**
• **Wacht enkele uren** - quota reset automatisch na 24 uur
• **Check je API key** in [Google AI Studio](https://makersuite.google.com/app/apikey)
• **Upgrade naar betaald plan** voor hogere limieten
• **Ga handmatig verder** - je analyse blijft waardevol!

**Handmatige analyse tips:**
• Vergelijk huidige vs gewenste situatie kritisch
• Identificeer de 3 grootste verschillen  
• Bedenk concrete actiestappen
• Overweeg benodigde resources (tijd, budget, mensen)

**Quota informatie:**
• Gratis tier: beperkt aantal requests per dag
• Betaald plan: veel hogere limieten beschikbaar
• Quota reset: elke 24 uur automatisch

Je kunt later terugkomen voor AI feedback wanneer de quota is gereset!`
      } else if (errorMessage && errorMessage.includes('network')) {
        fallbackFeedback = `🌐 **Netwerkfout**

Er is een probleem met de internetverbinding.

**Wat kun je doen:**
• Controleer je internetverbinding
• Probeer het over enkele seconden opnieuw
• Ga handmatig verder met de analyse

Je analyse wordt automatisch opgeslagen, dus je verliest geen werk.`
      } else {
        fallbackFeedback = `❌ **Tijdelijke Fout**

Er is een onverwachte fout opgetreden bij het ophalen van AI feedback voor ${step?.title}.

**Wat kun je doen:**
• Probeer het over enkele minuten opnieuw
• Controleer je internetverbinding
• Ga handmatig verder met de analyse

Je kunt ook zonder AI feedback een volledige analyse maken. De tool slaat je werk automatisch op.`
      }
      
      const newData = {
        ...wizardData,
        [stepId]: {
          ...stepData,
          feedback: fallbackFeedback
        }
      }
      setWizardData(newData)
      autoSave(newData)
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

  // Helper functie om evidence voor huidige stap te krijgen
  const getEvidenceForStep = (stepId: string) => {
    if (!evidence) return null
    
    // Map step IDs naar evidence keys
    const evidenceKeyMap: { [key: string]: string } = {
      'strategy': 'Strategy',
      'structure': 'Structure', 
      'systems': 'Systems',
      'shared-values': 'Shared Values',
      'skills': 'Skills',
      'style': 'Style',
      'staff': 'Staff',
      'finances': 'Financiën'
    }
    
    const evidenceKey = evidenceKeyMap[stepId]
    return evidenceKey ? evidence[evidenceKey] : null
  }

  // Helper functie om document samenvatting voor huidige stap te krijgen
  const getDocumentSummaryForStep = (stepId: string) => {
    if (!sources) return null
    
    // Map step IDs naar sources keys
    const sourcesKeyMap: { [key: string]: string } = {
      'strategy': 'Strategy',
      'structure': 'Structure', 
      'systems': 'Systems',
      'shared-values': 'Shared Values',
      'skills': 'Skills',
      'style': 'Style',
      'staff': 'Staff',
      'finances': 'Financiën'
    }
    
    const sourcesKey = sourcesKeyMap[stepId]
    return sourcesKey && sources[sourcesKey] ? sources[sourcesKey].summary : null
  }

  // Bereken voortgang
  const completedSteps = Object.values(wizardData).filter(step => step.completed).length
  const progressPercentage = (completedSteps / STEPS.length) * 100

  const currentStepData = STEPS[currentStep]
  const currentWizardData = wizardData[currentStepData?.id] || { current: '', desired: '', completed: false }
  const currentEvidence = getEvidenceForStep(currentStepData?.id)
  const currentDocumentSummary = getDocumentSummaryForStep(currentStepData?.id)

  // Helper functie voor stap-specifieke beschrijvingen
  const getStepDescription = (stepId: string): string => {
    const descriptions = {
      'strategy': 'Beschrijf de huidige strategische situatie van je zorgorganisatie. Wat zijn de belangrijkste interne doelstellingen en hoe worden deze nagestreefd? Gebruik concrete voorbeelden en citeer interview/enquête resultaten. Je kunt ook de gewenste toekomstige strategische richting beschrijven.',
      'structure': 'Analyseer de huidige organisatiestructuur. Beschrijf hiërarchie, afdelingen, rapportagelijnen en besluitvorming. Ondersteun met organogram indien beschikbaar en interview bevindingen. Je kunt ook gewenste structuurveranderingen beschrijven.',
      'systems': 'Beschrijf de belangrijkste interne systemen en processen. Hoe verlopen zorgprocessen, administratieve procedures en IT-ondersteuning? Analyseer effectiviteit op basis van medewerker feedback. Beschrijf ook gewenste systeemverbeteringen.',
      'shared-values': 'Analyseer de gedeelde waarden en cultuur. Hoe leven medewerkers deze waarden na in de dagelijkse zorgverlening? Gebruik concrete voorbeelden uit interviews en observaties. Beschrijf ook gewenste cultuurontwikkeling.',
      'skills': 'Inventariseer de aanwezige vaardigheden en competenties. Waar liggen de sterke punten van je zorgteams? Identificeer kennislacunes op basis van competentiematrix en medewerkergesprekken. Beschrijf ook gewenste competentieontwikkeling.',
      'style': 'Analyseer de leiderschapsstijl van management en teamleiders. Hoe wordt er intern leiding gegeven? Ondersteun met voorbeelden uit leiderschapssessies en medewerkerfeedback. Beschrijf ook gewenste leiderschapsontwikkeling.',
      'staff': 'Beschrijf het personeelsbestand en teamsamenstelling. Hoe worden medewerkers ontwikkeld en gemotiveerd? Analyseer op basis van HR-data en medewerkertevredenheidsonderzoek. Beschrijf ook gewenste personeelsontwikkeling.',
      'finances': 'Analyseer de financiële gezondheid met focus op rentabiliteit, liquiditeit en solvabiliteit. Hoe verhouden kosten zich tot opbrengsten? Verbind financiële prestaties aan andere 7S-elementen. Beschrijf ook gewenste financiële doelstellingen.'
    }
    return descriptions[stepId as keyof typeof descriptions] || 'Beschrijf de huidige situatie en eventueel de gewenste toekomstige situatie voor dit onderdeel.'
  }

  // Helper functie voor stap-specifieke placeholders
  const getStepPlaceholder = (stepId: string): string => {
    const placeholders = {
      'strategy': 'Beschrijf de huidige strategische situatie en eventueel de gewenste strategische richting...',
      'structure': 'Beschrijf de huidige organisatiestructuur en eventueel gewenste structuurveranderingen...',
      'systems': 'Beschrijf de huidige systemen en processen en eventueel gewenste verbeteringen...',
      'shared-values': 'Beschrijf de huidige waarden en cultuur en eventueel gewenste cultuurontwikkeling...',
      'skills': 'Beschrijf de huidige vaardigheden en competenties en eventueel gewenste ontwikkeling...',
      'style': 'Beschrijf de huidige leiderschapsstijl en eventueel gewenste leiderschapsontwikkeling...',
      'staff': 'Beschrijf het huidige personeelsbestand en eventueel gewenste personeelsontwikkeling...',
      'finances': 'Beschrijf de huidige financiële situatie en eventueel gewenste financiële doelstellingen...'
    }
    return placeholders[stepId as keyof typeof placeholders] || 'Beschrijf de huidige situatie en eventueel de gewenste toekomstige situatie...'
  }

// Helper functie om APA resultaten te formatteren voor tekstveld
function formatAPAResults(results: any): string {
  if (results.isValid) {
    return `✅ APA CHECK RESULTATEN - GEEN PROBLEMEN GEVONDEN

Je bronvermeldingen en citaten lijken correct te zijn volgens APA 7e editie richtlijnen.

📊 SAMENVATTING:
• Totaal gecontroleerd: ${results.summary.totalIssues === 0 ? 'Alle elementen OK' : '0 problemen'}
• Fouten: ${results.summary.errors}
• Waarschuwingen: ${results.summary.warnings}  
• Suggesties: ${results.summary.suggestions}

💡 TIP: Blijf consequent deze APA-stijl toepassen in je hele document.`
  }

  let output = `📝 APA CHECK RESULTATEN - ${results.summary.totalIssues} AANDACHTSPUNT(EN) GEVONDEN

📊 SAMENVATTING:
• Totaal problemen: ${results.summary.totalIssues}
• Fouten (rood): ${results.summary.errors}
• Waarschuwingen (geel): ${results.summary.warnings}
• Suggesties (blauw): ${results.summary.suggestions}

📋 GEDETAILLEERDE RESULTATEN:
`

  results.issues.forEach((issue: any, index: number) => {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡'
    const lineInfo = issue.line ? ` (regel ${issue.line})` : ''
    
    output += `
${index + 1}. ${icon} ${issue.message}${lineInfo}
`
    
    if (issue.suggestion) {
      output += `   💡 Suggestie: ${issue.suggestion}
`
    }
  })

  output += `

🎯 VOLGENDE STAPPEN:
1. Bekijk elk aandachtspunt hierboven
2. Pas de suggesties toe in je tekst
3. Run de check opnieuw om voortgang te zien
4. Herhaal tot alle problemen zijn opgelost

📚 HULP NODIG?
• APA 7e editie handleiding: https://apastyle.apa.org/
• Hogeschool Leiden APA-gids: Vraag je docent
• Citatie-tools: Mendeley, Zotero, EndNote`

  return output
}

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* API Quota Warning Banner */}
      {apiQuotaExceeded && isQuotaErrorRecent() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">
                API Quota Tijdelijk Bereikt
              </h3>
              <p className="text-yellow-700 text-sm mb-2">
                De AI coach functionaliteit is tijdelijk niet beschikbaar. Je kunt wel handmatig verder werken aan je analyse.
              </p>
              <div className="flex items-center space-x-4 text-xs text-yellow-600">
                <span>Quota reset: ~{Math.ceil((24 * 60 - (Date.now() - lastQuotaError!.getTime()) / (1000 * 60)) / 60)} uur</span>
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-800"
                >
                  Upgrade API Plan
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header met voortgang */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {flow === 'start' ? '🆕 Interne analyse' : '🔄 Verbeter Bestaand Concept'}
            </h1>
            {projectMeta.orgName && (
              <p className="text-gray-600">
                <strong>{projectMeta.orgName}</strong> • {projectMeta.level}
              </p>
            )}
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

          {/* Financiële data upload (alleen voor stap 8) */}
          {currentStepData.hasFileUpload && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Upload Financiële Data (Optioneel)
              </h3>
              <p className="text-gray-600 mb-4">
                Upload een CSV of Excel bestand met financiële gegevens zoals budgetten, kosten, inkomsten of andere financiële data om je analyse te verrijken.
              </p>
              <FinanceDropzone 
                onDataLoaded={handleFinanceDataUpload}
                className="mb-4"
              />
            </div>
          )}

          {/* Tekstvelden met evidence en document samenvatting - grid layout */}
          <div className="grid gap-6 mb-6 grid-cols-1">
            {/* Alle stappen: één gecombineerd veld */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {currentStepData.icon} {currentStepData.title} Analyse
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {getStepDescription(currentStepData.id)}
              </p>
              <textarea
                value={currentWizardData.current}
                onChange={(e) => updateStepData(currentStepData.id, 'current', e.target.value)}
                placeholder={getStepPlaceholder(currentStepData.id)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />

              {/* APA Self-check knop */}
              <div className="mt-6">
                <button
                  onClick={checkAPA}
                  disabled={isCheckingAPA}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    isCheckingAPA
                      ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  title="Hogeschool Leiden APA 7e editie controle voor zorgmanagement studenten"
                >
                  {isCheckingAPA ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-3 h-3 border border-gray-500 border-t-transparent rounded-full" />
                      <span>Controleren...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>📝</span>
                      <span>Lokale APA Check</span>
                    </div>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Lokale controle van APA 7e editie bronvermeldingen (werkt offline)
                </p>
              </div>
              
              {/* APA Resultaten Tekstveld */}
              {apaResults && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {apaResults.isValid ? '✅' : '📝'} APA Check Resultaten
                  </label>
                  <textarea
                    value={formatAPAResults(apaResults)}
                    readOnly
                    className={`w-full h-48 p-3 border rounded-lg text-sm font-mono resize-none ${
                      apaResults.isValid 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-orange-50 border-orange-300 text-orange-800'
                    }`}
                    placeholder="APA check resultaten verschijnen hier..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {apaResults.isValid 
                        ? 'Geen problemen gevonden - je APA-citaties zijn correct!' 
                        : `${apaResults.summary.totalIssues} aandachtspunt(en) gevonden`
                      }
                    </p>
                    <button
                      onClick={() => setApaResults(null)}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                    >
                      Resultaten wissen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evidence & Document Summary - nu onder het tekstveld */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Evidence sectie */}
            {currentEvidence ? (
              <aside className="bg-gray-50 p-4 text-sm border-l-4 border-primary/60 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">🎤</span>
                  <b className="text-gray-800">Evidence uit onderzoek:</b>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {currentEvidence}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    💡 <strong>Verplicht:</strong> Verwerk deze onderzoeksbevindingen in je analyse en citeer expliciet volgens APA-richtlijnen
                  </p>
                </div>
              </aside>
            ) : (
              <aside className="bg-blue-50 p-4 text-sm border-l-4 border-blue-300 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">💡</span>
                  <b className="text-blue-800">Geen onderzoeksevidence beschikbaar</b>
                </div>
                <div className="text-blue-700">
                  <p className="mb-2">
                    Voor dit 7S-element zijn nog geen interview- of enquête-bevindingen beschikbaar.
                  </p>
                  <p className="text-xs">
                    <strong>Aanbeveling:</strong> Upload interview-transcripten en enquête-data in de Evidence stap voor een complete analyse.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => window.location.href = `/evidence?id=${actualProjectId}`}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    → Upload onderzoeksmateriaal
                  </button>
                </div>
              </aside>
            )}

            {/* Document samenvatting sectie */}
            {currentDocumentSummary ? (
              <aside className="bg-green-50 p-4 text-sm border-l-4 border-green-500/60 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">📄</span>
                  <b className="text-gray-800">Document Samenvatting:</b>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {currentDocumentSummary}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    📚 Gebaseerd op geüploade documenten uit de bronneninventarisatie
                  </p>
                </div>
              </aside>
            ) : (
              <aside className="bg-gray-50 p-4 text-sm border-l-4 border-gray-300 rounded-lg">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">📄</span>
                  <b className="text-gray-800">Geen document samenvatting</b>
                </div>
                <div className="text-gray-700">
                  <p className="mb-2">
                    Voor dit onderdeel zijn nog geen documenten geüpload en samengevat.
                  </p>
                  <p className="text-xs">
                    Ga naar de <strong>Bronneninventarisatie</strong> om documenten te uploaden en samen te vatten.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => window.location.href = `/sources?id=${actualProjectId}`}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                  >
                    → Ga naar Bronneninventarisatie
                  </button>
                </div>
              </aside>
            )}
          </div>

          {/* Coach feedback sectie */}
          {currentWizardData.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">🤖</span>
                Coach Feedback
              </h3>
              <div className="text-blue-700 text-sm whitespace-pre-line">
                {currentWizardData.feedback}
              </div>
            </div>
          )}

          {/* Actie knoppen */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Coach feedback knop */}
              <button
                onClick={() => requestCoachFeedback(currentStepData.id)}
                disabled={isLoading || !currentWizardData.current.trim()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  apiQuotaExceeded && isQuotaErrorRecent()
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={apiQuotaExceeded && isQuotaErrorRecent() ? 'API quota bereikt - handmatige feedback beschikbaar' : 'Vraag AI coach feedback'}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
                    <span>Analyseren...</span>
                  </>
                ) : apiQuotaExceeded && isQuotaErrorRecent() ? (
                  <>
                    <span>⚠️</span>
                    <span>Handmatige feedback</span>
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
                disabled={!currentWizardData.current.trim()}
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

      {/* Project Actions - geïntegreerde export functionaliteiten */}
      <ProjectActions 
        projectId={actualProjectId}
        projectData={currentProjectData}
        wizardData={wizardData}
        className="mt-6"
      />

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
            </p>
            <p className="text-green-600 text-sm">
              Gebruik de "Export & Rapporten" sectie hieronder om je analyse te downloaden of te delen.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}