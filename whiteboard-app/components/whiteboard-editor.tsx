"use client"

import { ExcalidrawWrapper } from "@/components/excalidraw-wrapper"
import { ChatSidebar } from "@/components/chat-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Whiteboard, ExcalidrawData } from "@/lib/types"
import { api } from "@/lib/api"
import { ArrowLeft, MessageCircle, X, PanelRightClose, PanelRightOpen } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

interface WhiteboardEditorProps {
  whiteboard: Whiteboard
}

export function WhiteboardEditor({ whiteboard }: WhiteboardEditorProps) {
  const [title, setTitle] = useState(whiteboard.title)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4 bg-white dark:bg-slate-950">
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
        <div className="ml-auto flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving...</span>}
          {saveStatus === "saved" && <span className="text-sm text-green-600">Saved</span>}
          <Button
            variant={isChatOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="gap-2"
          >
            {isChatOpen ? (
              <>
                <PanelRightClose className="h-4 w-4" />
                <span className="hidden sm:inline">Hide Chat</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Study Assistant</span>
              </>
            )}
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full" id="whiteboard-layout">
          <Panel id="canvas-main" defaultSize={isChatOpen ? 70 : 100} minSize={50}>
            <ExcalidrawWrapper
              whiteboardId={whiteboard.id}
              initialData={whiteboard.excalidraw_data}
              onSave={saveWhiteboard}
            />
          </Panel>
          {isChatOpen && (
            <>
              <PanelResizeHandle className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-violet-400 dark:hover:bg-violet-600 transition-colors data-[resize-handle-active]:bg-violet-500" />
              <Panel id="chat-sidebar" defaultSize={30} minSize={20} maxSize={50}>
                <ChatSidebar />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
