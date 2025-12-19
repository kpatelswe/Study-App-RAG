"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types"
import type { ExcalidrawData } from "@/lib/types"
import "@excalidraw/excalidraw/index.css"

interface ExcalidrawWrapperProps {
  whiteboardId: string
  initialData: ExcalidrawData
  onSave: (data: ExcalidrawData) => Promise<void>
}

export function ExcalidrawWrapper({ whiteboardId, initialData, onSave }: ExcalidrawWrapperProps) {
  const [Excalidraw, setExcalidraw] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)

  useEffect(() => {
    import("@excalidraw/excalidraw").then((module) => setExcalidraw(() => module.Excalidraw))
  }, [])

  // Sanitize initial data to ensure collaborators is a Map
  const sanitizedInitialData = useMemo(() => {
    if (!initialData) {
      return { elements: [], appState: { collaborators: new Map() }, files: {} }
    }
    
    return {
      elements: initialData.elements || [],
      appState: {
        ...initialData.appState,
        // Ensure collaborators is always a Map (JSON serialization converts Map to object)
        collaborators: new Map(),
      },
      files: initialData.files || {},
    }
  }, [initialData])

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      // Don't save collaborators as it's runtime state and can't be serialized properly
      const { collaborators, ...serializableAppState } = appState
      const data: ExcalidrawData = {
        elements: elements as any[],
        appState: serializableAppState,
        files,
      }
      onSave(data)
    },
    [onSave],
  )

  if (!Excalidraw) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading whiteboard...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        initialData={sanitizedInitialData}
        onChange={handleChange}
      />
    </div>
  )
}
