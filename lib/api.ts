import { createClient } from "@/lib/supabase/client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error("Not authenticated")
  }
  
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  }
}

export const api = {
  whiteboards: {
    async getAll() {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/whiteboards`, { headers })
      
      if (!response.ok) {
        throw new Error("Failed to fetch whiteboards")
      }
      
      return response.json()
    },

    async get(id: string) {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/whiteboards/${id}`, { headers })
      
      if (!response.ok) {
        throw new Error("Failed to fetch whiteboard")
      }
      
      return response.json()
    },

    async create(data: { title?: string; excalidraw_data?: object }) {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/whiteboards`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create whiteboard")
      }
      
      return response.json()
    },

    async update(id: string, data: { title?: string; excalidraw_data?: object }) {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/whiteboards/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update whiteboard")
      }
      
      return response.json()
    },

    async delete(id: string) {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/whiteboards/${id}`, {
        method: "DELETE",
        headers,
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete whiteboard")
      }
      
      return response.json()
    },
  },
}

