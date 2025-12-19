"use client"

import { ExcalidrawWrapper } from "@/components/excalidraw-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Whiteboard, ExcalidrawData } from "@/lib/types"
import { api } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

interface WhiteboardEditorProps {
  whiteboard: Whiteboard
}

export function WhiteboardEditor({ whiteboard }: WhiteboardEditorProps) {
  const [title, setTitle] = useState(whiteboard.title)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  const saveWhiteboard = useCallback(
    async (data: ExcalidrawData) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus("saving")
        try {
          await api.whiteboards.update(whiteboard.id, { excalidraw_data: data })
          setSaveStatus("saved")
          setTimeout(() => setSaveStatus("idle"), 2000)
        } catch (error) {
          console.error("Failed to save whiteboard:", error)
          setSaveStatus("idle")
        }
      }, 1000)
    },
    [whiteboard.id],
  )

  const updateTitle = async () => {
    setIsSaving(true)
    try {
      await api.whiteboards.update(whiteboard.id, { title })
    } catch (error) {
      console.error("Failed to update title:", error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/whiteboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={updateTitle}
          className="max-w-md font-semibold"
          placeholder="Whiteboard title"
        />
        <div className="ml-auto flex items-center gap-2">
          {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving...</span>}
          {saveStatus === "saved" && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </header>
      <div className="flex-1">
        <ExcalidrawWrapper
          whiteboardId={whiteboard.id}
          initialData={whiteboard.excalidraw_data}
          onSave={saveWhiteboard}
        />
      </div>
    </div>
  )
}
