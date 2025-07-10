'use client'

import { useState } from 'react'
import { saveProject, loadProject, createProjectId, listProjects } from '../utils/storage'
import ReactMarkdown from 'react-markdown'

interface ProjectActionsProps {
  projectId?: string
  projectData?: any
  wizardData?: any // Toegevoegd voor directe toegang tot wizard data
  className?: string
}

export default function ProjectActions({ projectId, projectData, wizardData, className = '' }: ProjectActionsProps) {
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [fullReport, setFullReport] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Helper functie om project data te formatteren voor export
  const getFormattedProjectData = () => {
    if (!wizardData) return null

    // Stappen definitie (moet consistent zijn met StepWizard)
    const STEPS = [
      { id: 'strategy', title: 'Strategy' },
      { id: 'structure', title: 'Structure' },
      { id: 'systems', title: 'Systems' },
      { id: 'shared-values', title: 'Shared Values' },
      { id: 'skills', title: 'Skills' },
      { id: 'style', title: 'Style' },
      { id: 'staff', title: 'Staff' },
      { id: 'finances', title: 'Financiën' }
    ]

    const data: Record<string, string> = {}
    const feedback: Record<string, string> = {}

    STEPS.forEach(step => {
      const stepData = wizardData[step.id]
      if (stepData) {
        // Combineer current en desired situatie
        let content = ''
        if (stepData.current) {
          content += `**Huidige situatie:**\n${stepData.current}\n\n`
        }
        if (stepData.desired) {
          content += `**Gewenste situatie:**\n${stepData.desired}`
        }
        
        if (content) {
          data[step.title] = content
        }
        
        if (stepData.feedback) {
          feedback[step.title] = stepData.feedback
        }
      }
    })

    return {
      title: `Interne Analyse ${new Date().toLocaleDateString('nl-NL')}`,
      data,
      feedback
    }
  }

  // Genereer volledig rapport
  const generateFullReport = async () => {
    setIsGeneratingReport(true)
    try {
      console.log('📊 Start rapport generatie...', {
        projectId,
        hasWizardData: !!wizardData
      })

      if (!wizardData) {
        throw new Error('Geen wizard data beschikbaar voor rapport generatie')
      }

      // Stappen definitie
      const STEPS = [
        { id: 'strategy', title: 'Strategy', subtitle: 'Strategie & Richting', icon: '🎯', description: 'De langetermijnvisie, missie en strategische doelstellingen van de organisatie.' },
        { id: 'structure', title: 'Structure', subtitle: 'Organisatiestructuur', icon: '🏗️', description: 'De manier waarop de organisatie is georganiseerd, rapportagelijnen en besluitvorming.' },
        { id: 'systems', title: 'Systems', subtitle: 'Systemen & Processen', icon: '⚙️', description: 'De procedures, processen en systemen die het dagelijkse werk ondersteunen.' },
        { id: 'shared-values', title: 'Shared Values', subtitle: 'Gedeelde Waarden', icon: '💎', description: 'De kernwaarden, cultuur en normen die de organisatie definiëren.' },
        { id: 'skills', title: 'Skills', subtitle: 'Vaardigheden & Competenties', icon: '🎓', description: 'De kennis, vaardigheden en competenties die aanwezig zijn in de organisatie.' },
        { id: 'style', title: 'Style', subtitle: 'Leiderschapsstijl', icon: '👑', description: 'De leiderschapsstijl en managementaanpak binnen de organisatie.' },
        { id: 'staff', title: 'Staff', subtitle: 'Personeel & Mensen', icon: '👥', description: 'De mensen in de organisatie, hun rollen en hoe ze worden ontwikkeld.' },
        { id: 'finances', title: 'Financiën', subtitle: 'Financiële Situatie', icon: '💰', description: 'De financiële gezondheid, budgetten en economische aspecten van de organisatie.' }
      ]

      // Maak een markdown rapport van alle stappen
      let markdown = `# ${getFormattedProjectData()?.title || 'Interne Analyse'}\n\n`
      markdown += `*Gegenereerd op: ${new Date().toLocaleString('nl-NL')}*\n\n`
      markdown += `---\n\n`

      STEPS.forEach(step => {
        const stepData = wizardData[step.id]
        if (stepData && (stepData.current || stepData.desired)) {
          markdown += `## ${step.icon} ${step.title}\n\n`
          markdown += `*${step.description}*\n\n`
          
          if (stepData.current) {
            markdown += `### 📊 Huidige Situatie\n\n${stepData.current}\n\n`
          }
          
          if (stepData.desired) {
            markdown += `### 🎯 Gewenste Situatie\n\n${stepData.desired}\n\n`
          }
          
          if (stepData.feedback) {
            markdown += `### 🤖 Coach Feedback\n\n${stepData.feedback}\n\n`
          }
          
          if (stepData.completed) {
            markdown += `*✅ Status: Voltooid*\n\n`
          }
          
          markdown += `---\n\n`
        }
      })

      // Voeg samenvatting toe
      const completedSteps = Object.values(wizardData).filter((step: any) => step.completed).length
      markdown += `## 📈 Samenvatting\n\n`
      markdown += `- **Voltooide stappen:** ${completedSteps} van ${STEPS.length}\n`
      markdown += `- **Voortgang:** ${Math.round((completedSteps / STEPS.length) * 100)}%\n`
      markdown += `- **Type analyse:** ${projectData?.flow === 'start' ? 'Nieuwe interne analyse' : 'Verbeter bestaand concept'}\n\n`
      
      if (completedSteps === STEPS.length) {
        markdown += `🎉 **Gefeliciteerd!** Je hebt alle stappen van de interne analyse voltooid.\n\n`
      } else {
        markdown += `💡 **Tip:** Voltooi de resterende ${STEPS.length - completedSteps} stappen voor een complete analyse.\n\n`
      }

      setFullReport(markdown)
      console.log('✅ Rapport gegenereerd:', {
        markdownLength: markdown.length,
        completedSteps
      })
    } catch (error) {
      console.error('❌ Rapport generatie fout:', error)
      alert(`Fout bij rapport generatie: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Download als Word document
  const downloadWord = async () => {
    if (!wizardData) {
      alert('Geen wizard data beschikbaar voor Word export')
      return
    }

    setIsExportingWord(true)
    try {
      console.log('📄 Start Word export...', { projectId, hasWizardData: !!wizardData })

      const exportData = getFormattedProjectData()
      if (!exportData) {
        throw new Error('Geen project data gevonden voor export')
      }

      const response = await fetch('/api/export-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Export mislukt')
      }

      // Download het bestand
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Genereer bestandsnaam
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')
      link.download = `InterneAnalyse_${timestamp}.docx`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ Word export voltooid')

    } catch (error) {
      console.error('❌ Word export fout:', error)
      alert('Fout bij Word export: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
    } finally {
      setIsExportingWord(false)
    }
  }

  // Download project als JSON
  const downloadProject = () => {
    if (!projectData && !projectId) {
      alert('Geen project data beschikbaar voor export')
      return
    }

    setIsExportingJson(true)
    try {
      console.log('📦 Start JSON export...', { projectId, hasData: !!projectData })

      // Haal project data op
      const exportData = projectData || (projectId ? loadProject(projectId) : null)
      
      if (!exportData) {
        throw new Error('Geen project data gevonden')
      }

      // Voeg metadata toe
      const fullExportData = {
        ...exportData,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        source: 'Interne Analyse Coach - Hogeschool Leiden'
      }

      // Maak JSON blob
      const jsonString = JSON.stringify(fullExportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      
      // Download
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')
      const projectTitle = exportData.title || 'Project'
      link.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ JSON export voltooid')

    } catch (error) {
      console.error('❌ JSON export fout:', error)
      alert('Fout bij JSON export: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
    } finally {
      setIsExportingJson(false)
    }
  }

  // Importeer project van JSON bestand
  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(null)

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const importedData = JSON.parse(jsonString)

        console.log('📥 Start project import...', {
          fileName: file.name,
          hasWizardData: !!importedData.wizardData,
          flow: importedData.flow
        })

        // Valideer import data
        if (!importedData.flow || !importedData.data) {
          throw new Error('Ongeldig project bestand - ontbrekende vereiste velden')
        }

        // Genereer nieuw project ID
        const newProjectId = createProjectId()
        
        // Bereid project data voor opslag
        const projectForStorage = {
          ...importedData.data,
          title: importedData.title || `Geïmporteerd Project - ${new Date().toLocaleDateString()}`,
          flow: importedData.flow,
          importedAt: new Date().toISOString(),
          originalId: importedData.id
        }

        // Sla op in localStorage
        const success = saveProject(newProjectId, projectForStorage)
        
        if (success) {
          setImportSuccess(`Project succesvol geïmporteerd! ID: ${newProjectId.slice(0, 8)}...`)
          console.log('✅ Project import voltooid:', {
            newProjectId,
            originalTitle: importedData.title
          })

          // Optioneel: redirect naar het geïmporteerde project
          setTimeout(() => {
            if (confirm('Wil je naar het geïmporteerde project gaan?')) {
              window.location.href = `/${importedData.flow}?project=${newProjectId}`
            }
          }, 2000)
        } else {
          throw new Error('Fout bij opslaan van geïmporteerd project')
        }

      } catch (error) {
        console.error('❌ Import fout:', error)
        setImportError(error instanceof Error ? error.message : 'Onbekende fout bij import')
      } finally {
        setIsImporting(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      setImportError('Fout bij het lezen van het bestand')
      setIsImporting(false)
      event.target.value = ''
    }

    reader.readAsText(file)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export & Rapporten sectie */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📄</span>
          Export & Rapporten
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Download Word */}
          <button
            onClick={downloadWord}
            disabled={isExportingWord || !wizardData}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExportingWord ? (
              <>
                <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
                <span>Downloaden...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Download Word</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <strong>Tip:</strong> Word export bevat professionele opmaak met HL-logo en alle ingevulde stappen met coach feedback.
        </p>
      </div>

      {/* Volledig rapport weergave */}
      {fullReport && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              Volledig Rapport
            </h3>
            <button
              onClick={() => setFullReport('')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Sluiten
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <div className="prose max-w-none">
              <ReactMarkdown>{fullReport}</ReactMarkdown>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500">
              {fullReport.split('\n').length} regels • {fullReport.length} karakters
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(fullReport)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📋 Kopieer naar clipboard
            </button>
          </div>
        </div>
      )}

      {/* Project Beheer sectie */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">💾</span>
          Project Beheer
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download JSON */}
          <button
            onClick={downloadProject}
            disabled={isExportingJson || (!projectData && !projectId)}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              isExportingJson
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
            }`}
          >
            {isExportingJson ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>Exporteren...</span>
              </>
            ) : (
              <>
                <span>📦</span>
                <span>Opslaan Project</span>
              </>
            )}
          </button>

          {/* Import Project */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importProject}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="project-import"
            />
            <label
              htmlFor="project-import"
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                isImporting
                  ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
              }`}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span>Importeren...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Project Importeren</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Status messages */}
        {importError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm font-medium">Import Fout</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{importError}</p>
          </div>
        )}

        {importSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 text-sm font-medium">Import Succesvol</span>
            </div>
            <p className="text-green-600 text-sm mt-1">{importSuccess}</p>
          </div>
        )}
      </div>

      {/* Instructies */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Instructies</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>📄 Download Word:</strong> Exporteert je analyse als professioneel Word document met HL-logo</p>
          <p><strong>📦 Opslaan Project:</strong> Slaat je volledige project op als JSON bestand voor backup of delen</p>
          <p><strong>📥 Project Importeren:</strong> Laadt een eerder geëxporteerd JSON project bestand in</p>
        </div>
      </div>
    </div>
  )
}