import { createClient } from '@supabase/supabase-js'

// Supabase configuratie
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Maak Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Functie om anonieme gebruiker-id te verkrijgen of aan te maken
export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side: genereer tijdelijke ID
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Client-side: gebruik localStorage
  const storageKey = 'iac_user'
  let userId = localStorage.getItem(storageKey)
  
  if (!userId) {
    // Genereer nieuwe anonieme gebruiker-id
    userId = `iac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(storageKey, userId)
  }
  
  return userId
}

// Database types voor TypeScript
export interface Project {
  id: string
  flow: string
  data: any
  updated_at: string
}

// Database functies
export const projectsApi = {
  // Haal alle projecten op
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
    
    return data || []
  },

  // Haal een specifiek project op
  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching project:', error)
      return null
    }
    
    return data
  },

  // Maak een nieuw project
  async create(flow: string, data: any): Promise<Project | null> {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([
        {
          flow,
          data,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      throw error
    }
    
    return newProject
  },

  // Update een bestaand project
  async update(id: string, flow: string, data: any): Promise<Project | null> {
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update({
        flow,
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating project:', error)
      throw error
    }
    
    return updatedProject
  },

  // Verwijder een project
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting project:', error)
      return false
    }
    
    return true
  }
}