"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Search, Bookmark, Users, TrendingUp, Activity, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BibleReader } from "@/components/bible/BibleReader"
import { useBible } from "@/contexts/BibleContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { ActivityTracker } from "@/components/dashboard/ActivityTracker"

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const {
    books,
    selectedBook,
    chapterContent,
    loading,
    error,
  } = useBible()

  const currentBook = books.find(b => b.id === selectedBook)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your Bible study today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up! You're on fire 🔥
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verses Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highlights</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Across 5 different books
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Active communities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tracker */}
      <ActivityTracker />

      {/* Main Content Area with Tabs */}
      <Tabs defaultValue="read" className="space-y-4">
        <TabsList>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="study">Study Tools</TabsTrigger>
          <TabsTrigger value="highlights">My Highlights</TabsTrigger>
          <TabsTrigger value="plans">Reading Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="space-y-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Quick Access</h3>
                  <p className="text-muted-foreground">
                    Use the Bible navigation in the header to select a version, book, and chapter.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => router.push('/bible-reader')}
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Open Full Reader
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Today's Verse
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Search className="h-4 w-4" />
                      Search Scriptures
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bible Content Preview */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Current Reading</CardTitle>
                <CardDescription>
                  {currentBook ? `${currentBook.name}` : 'Select a book to start reading'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 max-h-[500px] overflow-auto">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : chapterContent ? (
                  <BibleReader
                    chapter={chapterContent}
                    bookName={currentBook?.name || ""}
                    highlights={[]}
                    onHighlight={(verseId, color) => {
                      console.log("Highlight:", verseId, color)
                      // TODO: Implement highlight saving
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Select a book and chapter to start reading</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="study" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Tools</CardTitle>
              <CardDescription>
                Enhanced Bible study features coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cross References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      See related verses and passages
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Commentaries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Expert insights and explanations
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Word Studies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Original language analysis
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Highlights</CardTitle>
              <CardDescription>
                Your saved verses and notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your highlights will appear here once you start marking verses.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading Plans</CardTitle>
              <CardDescription>
                Structured Bible reading programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bible in a Year</CardTitle>
                    <Badge>Popular</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Read through the entire Bible in 365 days
                    </p>
                    <Button className="mt-4" size="sm">Start Plan</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">New Testament in 90 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Focus on the life and teachings of Jesus
                    </p>
                    <Button className="mt-4" size="sm">Start Plan</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}
