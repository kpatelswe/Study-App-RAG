import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WhiteboardList } from "@/components/whiteboard-list"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default async function WhiteboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: whiteboards } = await supabase
    .from("whiteboards")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  async function handleLogout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Whiteboard App</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <form action={handleLogout}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <WhiteboardList initialWhiteboards={whiteboards || []} />
      </main>
    </div>
  )
}
