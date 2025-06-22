// Storage utilities voor localStorage projectbeheer
import { v4 as uuidv4 } from 'uuid'

// Types voor project data
export interface ProjectSummary {
  id: string
  title: string
  flow: 'start' | 'improve'
  updatedAt: string
}

export interface ProjectData {
  id: string
  title: string
  flow: 'start' | 'improve'
  data: any
  createdAt: string
  updatedAt: string
}

// Genereer of haal gebruiker-ID op
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return dummy ID
    return 'server-side'
  }

  const storageKey = 'iac_user'
  let userId = localStorage.getItem(storageKey)
  
  if (!userId) {
    // Genereer nieuwe UUID voor gebruiker
    userId = uuidv4()
    localStorage.setItem(storageKey, userId)
    console.log('🆔 Nieuwe gebruiker-ID gegenereerd:', userId)
  }
  
  return userId
}

// Sla project op in localStorage
export function saveProject(id: string, data: any): boolean {
  try {
    if (typeof window === 'undefined') {
      console.warn('saveProject: localStorage niet beschikbaar op server-side')
      return false
    }

    const userId = getOrCreateUserId()
    const storageKey = `iac_project_${id}`
    
    const projectData: ProjectData = {
      id,
      title: data.title || `Project ${id.slice(0, 8)}`,
      flow: data.flow || 'start',
      data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(storageKey, JSON.stringify(projectData))
    
    // Update project index
    updateProjectIndex(id, projectData)
    
    console.log('💾 Project opgeslagen:', id, projectData.title)
    return true
  } catch (error) {
    console.error('❌ Fout bij opslaan project:', error)
    return false
  }
}

// Laad project uit localStorage
export function loadProject(id: string): ProjectData | null {
  try {
    if (typeof window === 'undefined') {
      console.warn('loadProject: localStorage niet beschikbaar op server-side')
      return null
    }

    const storageKey = `iac_project_${id}`
    const stored = localStorage.getItem(storageKey)
    
    if (!stored) {
      console.warn('📂 Project niet gevonden:', id)
      return null
    }

    const projectData: ProjectData = JSON.parse(stored)
    console.log('📖 Project geladen:', id, projectData.title)
    return projectData
  } catch (error) {
    console.error('❌ Fout bij laden project:', error)
    return null
  }
}

// Haal lijst van alle projecten op
export function listProjects(): ProjectSummary[] {
  try {
    if (typeof window === 'undefined') {
      console.warn('listProjects: localStorage niet beschikbaar op server-side')
      return []
    }

    const indexKey = 'iac_project_index'
    const stored = localStorage.getItem(indexKey)
    
    if (!stored) {
      console.log('📋 Geen projecten gevonden')
      return []
    }

    const projectIndex: ProjectSummary[] = JSON.parse(stored)
    
    // Sorteer op updatedAt (nieuwste eerst)
    const sortedProjects = projectIndex.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    console.log('📋 Projecten geladen:', sortedProjects.length)
    return sortedProjects
  } catch (error) {
    console.error('❌ Fout bij laden projectenlijst:', error)
    return []
  }
}

// Update project index (interne functie)
function updateProjectIndex(id: string, projectData: ProjectData): void {
  try {
    const indexKey = 'iac_project_index'
    const stored = localStorage.getItem(indexKey)
    let projectIndex: ProjectSummary[] = stored ? JSON.parse(stored) : []
    
    // Zoek bestaand project in index
    const existingIndex = projectIndex.findIndex(p => p.id === id)
    
    const summary: ProjectSummary = {
      id: projectData.id,
      title: projectData.title,
      flow: projectData.flow,
      updatedAt: projectData.updatedAt
    }
    
    if (existingIndex >= 0) {
      // Update bestaand project
      projectIndex[existingIndex] = summary
    } else {
      // Voeg nieuw project toe
      projectIndex.push(summary)
    }
    
    // Beperk tot laatste 50 projecten
    if (projectIndex.length > 50) {
      projectIndex = projectIndex
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 50)
    }
    
    localStorage.setItem(indexKey, JSON.stringify(projectIndex))
  } catch (error) {
    console.error('❌ Fout bij updaten project index:', error)
  }
}

// Verwijder project
export function deleteProject(id: string): boolean {
  try {
    if (typeof window === 'undefined') {
      console.warn('deleteProject: localStorage niet beschikbaar op server-side')
      return false
    }

    const storageKey = `iac_project_${id}`
    localStorage.removeItem(storageKey)
    
    // Update index
    const indexKey = 'iac_project_index'
    const stored = localStorage.getItem(indexKey)
    if (stored) {
      const projectIndex: ProjectSummary[] = JSON.parse(stored)
      const filteredIndex = projectIndex.filter(p => p.id !== id)
      localStorage.setItem(indexKey, JSON.stringify(filteredIndex))
    }
    
    console.log('🗑️ Project verwijderd:', id)
    return true
  } catch (error) {
    console.error('❌ Fout bij verwijderen project:', error)
    return false
  }
}

// Maak nieuw project ID
export function createProjectId(): string {
  return uuidv4()
}

// Cleanup oude projecten (optioneel)
export function cleanupOldProjects(maxAge: number = 30): number {
  try {
    if (typeof window === 'undefined') {
      return 0
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAge)
    
    const projects = listProjects()
    let deletedCount = 0
    
    projects.forEach(project => {
      const projectDate = new Date(project.updatedAt)
      if (projectDate < cutoffDate) {
        deleteProject(project.id)
        deletedCount++
      }
    })
    
    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} oude projecten opgeruimd`)
    }
    
    return deletedCount
  } catch (error) {
    console.error('❌ Fout bij opruimen oude projecten:', error)
    return 0
  }
}