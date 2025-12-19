"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Whiteboard } from "@/lib/types"
import { api } from "@/lib/api"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface WhiteboardListProps {
  initialWhiteboards: Whiteboard[]
}

export function WhiteboardList({ initialWhiteboards }: WhiteboardListProps) {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>(initialWhiteboards)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createWhiteboard = async () => {
    setIsCreating(true)
    try {
      const { whiteboard } = await api.whiteboards.create({ title: "Untitled Whiteboard" })
      router.push(`/whiteboard/${whiteboard.id}`)
    } catch (error) {
      console.error("Failed to create whiteboard:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const deleteWhiteboard = async (id: string) => {
    try {
      await api.whiteboards.delete(id)
      setWhiteboards(whiteboards.filter((wb) => wb.id !== id))
    } catch (error) {
      console.error("Failed to delete whiteboard:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Whiteboards</h2>
          <p className="text-muted-foreground">Create and manage your whiteboards</p>
        </div>
        <Button onClick={createWhiteboard} disabled={isCreating} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          {isCreating ? "Creating..." : "New Whiteboard"}
        </Button>
      </div>

      {whiteboards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pencil className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No whiteboards yet</CardTitle>
            <CardDescription className="text-center mb-6">
              Create your first whiteboard to start drawing and collaborating
            </CardDescription>
            <Button onClick={createWhiteboard} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              Create Whiteboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {whiteboards.map((whiteboard) => (
            <Card key={whiteboard.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg truncate">{whiteboard.title}</CardTitle>
                <CardDescription>Updated {new Date(whiteboard.updated_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={`/whiteboard/${whiteboard.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
                <Button variant="destructive" size="icon" onClick={() => deleteWhiteboard(whiteboard.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
