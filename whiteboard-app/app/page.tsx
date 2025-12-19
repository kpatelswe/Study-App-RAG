import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Pencil, Save, Sparkles, Zap, Lock, Palette, Grid3x3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Canvas
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="pt-24">
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-sm font-medium text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <span>Powered by Excalidraw & Supabase</span>
              </div>

              {/* Main headline */}
              <h2 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
                Your Ideas,
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Beautifully Sketched
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                Create stunning diagrams, sketches, and visual concepts with an infinite canvas. Your creativity,
                automatically saved.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6"
                >
                  <Link href="/auth/sign-up">
                    Start Creating Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-2 bg-transparent">
                  <Link href="/auth/login">View Demo</Link>
                </Button>
              </div>

              {/* Visual preview mockup */}
              <div className="pt-12">
                <div className="relative mx-auto max-w-5xl">
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-20" />
                  <div className="relative rounded-2xl border-2 border-border bg-card p-4 shadow-2xl">
                    <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {/* Mock drawing elements */}
                      <div className="absolute top-8 left-8 w-32 h-32 border-4 border-indigo-400 rounded-lg rotate-6" />
                      <div className="absolute top-16 right-16 w-24 h-24 bg-purple-400 rounded-full opacity-60" />
                      <div className="absolute bottom-12 left-1/3 w-40 h-1 bg-pink-400" />
                      <div className="absolute bottom-12 left-1/3 w-1 h-20 bg-pink-400" />
                      <Grid3x3 className="h-32 w-32 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to create</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for seamless creativity and collaboration
            </p>
          </div>

          {/* Bento grid layout */}
          <div className="grid md:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {/* Large feature card */}
            <Card className="md:col-span-4 md:row-span-2 border-2 hover:border-indigo-200 transition-colors group">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Pencil className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Infinite Creative Canvas</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Draw, sketch, diagram, and brainstorm with powerful Excalidraw tools. Create arrows, shapes, text,
                    and freehand drawings with an intuitive interface that gets out of your way.
                  </p>
                </div>
                <div className="mt-8 aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <Palette className="h-24 w-24 text-indigo-300" />
                </div>
              </CardContent>
            </Card>

            {/* Small feature card */}
            <Card className="md:col-span-2 border-2 hover:border-green-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Lightning Fast</h3>
                <p className="text-muted-foreground">Instant auto-save ensures your work is never lost</p>
              </CardContent>
            </Card>

            {/* Small feature card */}
            <Card className="md:col-span-2 border-2 hover:border-purple-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground">Bank-level security with row-level access control</p>
              </CardContent>
            </Card>

            {/* Medium feature card */}
            <Card className="md:col-span-3 border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Save className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Cloud Sync</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access your whiteboards from anywhere. All changes sync instantly to Supabase with automatic
                  versioning.
                </p>
              </CardContent>
            </Card>

            {/* Medium feature card */}
            <Card className="md:col-span-3 border-2 hover:border-amber-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Rich Media Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add images, links, and embed content directly into your whiteboards for rich, interactive diagrams.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold text-white text-balance">
                Ready to bring your ideas to life?
              </h3>
              <p className="text-xl text-indigo-100 text-pretty">
                Join thousands of creators who trust Canvas for their visual thinking
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
                <Link href="/auth/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Canvas. Powered by Excalidraw & Supabase.</p>
        </div>
      </footer>
    </div>
  )
}
