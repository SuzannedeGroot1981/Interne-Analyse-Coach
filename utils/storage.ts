// Storage utilities voor localStorage projectbeheer
// Eenvoudige implementatie met lijst en actieve project tracking

// bewaar lijst én activeId in localStorage
const KEY_LIST = "iac_projects";
const KEY_ACTIVE = "iac_active";

export interface Project {
  id: string
  data: any
}

export function listProjects(): Project[] {
  if (typeof window === 'undefined') {
    console.warn('listProjects: localStorage niet beschikbaar op server-side')
    return []
  }
  
  try {
    const stored = localStorage.getItem(KEY_LIST)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('❌ Fout bij laden projectenlijst:', error)
    return []
  }
}

export function saveProject(id: string, data: any): boolean {
  if (typeof window === 'undefined') {
    console.warn('saveProject: localStorage niet beschikbaar op server-side')
    return false
  }

  try {
    const list = listProjects()
    const idx = list.findIndex(p => p.id === id)
    
    if (idx > -1) {
      list[idx].data = data
    } else {
      list.push({ id, data })
    }
    
    localStorage.setItem(KEY_LIST, JSON.stringify(list))
    console.log('💾 Project opgeslagen:', id)
    return true
  } catch (error) {
    console.error('❌ Fout bij opslaan project:', error)
    return false
  }
}

export function loadProject(id: string): any {
  if (typeof window === 'undefined') {
    console.warn('loadProject: localStorage niet beschikbaar op server-side')
    return null
  }

  try {
    const project = listProjects().find(p => p.id === id)
    if (project) {
      console.log('📖 Project geladen:', id)
      return project.data
    }
    
    console.warn('📂 Project niet gevonden:', id)
    return null
  } catch (error) {
    console.error('❌ Fout bij laden project:', error)
    return null
  }
}

export function setActive(id: string): void {
  if (typeof window === 'undefined') {
    console.warn('setActive: localStorage niet beschikbaar op server-side')
    return
  }

  try {
    localStorage.setItem(KEY_ACTIVE, id)
    console.log('🎯 Actief project ingesteld:', id)
  } catch (error) {
    console.error('❌ Fout bij instellen actief project:', error)
  }
}

export function getActive(): string | null {
  if (typeof window === 'undefined') {
    console.warn('getActive: localStorage niet beschikbaar op server-side')
    return null
  }

  try {
    return localStorage.getItem(KEY_ACTIVE)
  } catch (error) {
    console.error('❌ Fout bij ophalen actief project:', error)
    return null
  }
}

export function clearActive(): void {
  if (typeof window === 'undefined') {
    console.warn('clearActive: localStorage niet beschikbaar op server-side')
    return
  }

  try {
    localStorage.removeItem(KEY_ACTIVE)
    console.log('🗑️ Actief project gewist')
  } catch (error) {
    console.error('❌ Fout bij wissen actief project:', error)
  }
}

// Verwijder project
export function deleteProject(id: string): boolean {
  if (typeof window === 'undefined') {
    console.warn('deleteProject: localStorage niet beschikbaar op server-side')
    return false
  }

  try {
    const list = listProjects()
    const filteredList = list.filter(p => p.id !== id)
    localStorage.setItem(KEY_LIST, JSON.stringify(filteredList))
    
    // Clear active als dit het actieve project was
    if (getActive() === id) {
      clearActive()
    }
    
    console.log('🗑️ Project verwijderd:', id)
    return true
  } catch (error) {
    console.error('❌ Fout bij verwijderen project:', error)
    return false
  }
}

// Maak nieuw project ID (eenvoudige implementatie)
export function createProjectId(): string {
  return `iac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper types voor backwards compatibility
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

// Backwards compatibility functies
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  const storageKey = 'iac_user'
  let userId = localStorage.getItem(storageKey)
  
  if (!userId) {
    userId = createProjectId()
    localStorage.setItem(storageKey, userId)
    console.log('🆔 Nieuwe gebruiker-ID gegenereerd:', userId)
  }
  
  return userId
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
      // Check if project has updatedAt in data
      const projectDate = project.data?.updatedAt ? new Date(project.data.updatedAt) : new Date(0)
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