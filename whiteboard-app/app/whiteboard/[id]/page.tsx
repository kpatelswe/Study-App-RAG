import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WhiteboardEditor } from "@/components/whiteboard-editor"

type Params = Promise<{ id: string }>

export default async function WhiteboardDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: whiteboard, error } = await supabase.from("whiteboards").select("*").eq("id", id).single()

  if (error || !whiteboard) {
    redirect("/whiteboard")
  }

  return <WhiteboardEditor whiteboard={whiteboard} />
}
