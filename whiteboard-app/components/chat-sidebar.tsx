"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import { 
  Upload, 
  Send, 
  FileText, 
  Loader2, 
  X, 
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
  timestamp: Date
}

interface UploadedFile {
  name: string
  status: "uploading" | "processing" | "ready" | "error"
  eventId?: string
}

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        continue
      }

      const fileEntry: UploadedFile = {
        name: file.name,
        status: "uploading"
      }
      setUploadedFiles(prev => [...prev, fileEntry])

      try {
        const result = await api.rag.uploadPdf(file)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: "processing", eventId: result.event_id }
              : f
          )
        )

        // Poll for completion
        const checkStatus = async () => {
          try {
            const status = await api.rag.pollStatus(result.event_id)
            if (status.status === "Completed" || status.status === "Succeeded" || status.status === "Success" || status.status === "Finished") {
              setUploadedFiles(prev => 
                prev.map(f => 
                  f.eventId === result.event_id 
                    ? { ...f, status: "ready" }
                    : f
                )
              )
            } else if (status.status === "Failed" || status.status === "Cancelled") {
              setUploadedFiles(prev => 
                prev.map(f => 
                  f.eventId === result.event_id 
                    ? { ...f, status: "error" }
                    : f
                )
              )
            } else {
              // Still processing, check again
              setTimeout(checkStatus, 2000)
            }
          } catch {
            // Assume still processing on error
            setTimeout(checkStatus, 2000)
          }
        }
        setTimeout(checkStatus, 1000)
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: "error" }
              : f
          )
        )
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    scrollToBottom()

    try {
      const result = await api.rag.query(input.trim())
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName))
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Study Assistant</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Upload PDFs and ask questions</p>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800">
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
            isDragging 
              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
              : "border-slate-300 dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <div className="flex flex-col items-center justify-center py-4 px-2">
            <Upload className={cn(
              "h-6 w-6 mb-1.5 transition-colors",
              isDragging ? "text-violet-500" : "text-slate-400"
            )} />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Drop PDFs here or click to upload
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {uploadedFiles.map((file) => (
              <div 
                key={file.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">
                  {file.name}
                </span>
                {file.status === "uploading" && (
                  <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin flex-shrink-0" />
                )}
                {file.status === "processing" && (
                  <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin flex-shrink-0" />
                )}
                {file.status === "ready" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full px-3">
        <div className="py-3 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                <MessageCircle className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No messages yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">
                Upload a PDF and ask questions about your study materials
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/20">
                      <p className="text-xs opacity-70 mb-1">Sources:</p>
                      {message.sources.map((source, i) => (
                        <span key={i} className="text-xs opacity-70 block truncate">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            disabled={isLoading}
            className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 border-0 focus-visible:ring-violet-500"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}


