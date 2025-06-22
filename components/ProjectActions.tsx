'use client'

import { useState } from 'react'
import { saveProject, loadProject, createProjectId, listProjects } from '../utils/storage'

interface ProjectActionsProps {
  projectId?: string
  projectData?: any
  className?: string
}

export default function ProjectActions({ projectId, projectData, className = '' }: ProjectActionsProps) {
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  // Download als Word document
  const downloadWord = async () => {
    if (!projectData && !projectId) {
      alert('Geen project data beschikbaar voor export')
      return
    }

    setIsExportingWord(true)
    try {
      console.log('📄 Start Word export...', { projectId, hasData: !!projectData })

      // Bereid data voor (verstuur via hidden textarea concept)
      const exportData = {
        projectId,
        projectData: projectData || (projectId ? loadProject(projectId)?.data : null)
      }

      if (!exportData.projectData) {
        throw new Error('Geen project data gevonden')
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
        throw new Error(errorData.error || 'Export mislukt')
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
    <div className={`space-y-4 ${className}`}>
      {/* Action buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">💾</span>
          Project Acties
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Download Word */}
          <button
            onClick={downloadWord}
            disabled={isExportingWord || (!projectData && !projectId)}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              isExportingWord
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isExportingWord ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Exporteren...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Download Word</span>
              </>
            )}
          </button>

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
                <span>Download Project</span>
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
          <p><strong>📄 Download Word:</strong> Exporteert je analyse als professioneel Word document met HL-logo en paginanummering</p>
          <p><strong>📦 Download Project:</strong> Slaat je volledige project op als JSON bestand voor backup of delen</p>
          <p><strong>📥 Project Importeren:</strong> Laadt een eerder geëxporteerd JSON project bestand in</p>
        </div>
      </div>
    </div>
  )
}