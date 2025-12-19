export interface Whiteboard {
  id: string
  user_id: string
  title: string
  excalidraw_data: ExcalidrawData
  created_at: string
  updated_at: string
}

export interface ExcalidrawData {
  elements: any[]
  appState: any
  files?: any
}
