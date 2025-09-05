"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { 
  User, 
  Mail, 
  Calendar,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Edit,
  Camera,
  Shield,
  Award,
  TrendingUp,
  Heart
} from "lucide-react"

export default function ProfilePage() {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: currentUser?.displayName || "",
    bio: "",
    location: "",
    website: ""
  })

  const handleSaveProfile = () => {
    // Here you would save the profile data to your backend
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })
    setIsEditing(false)
  }

  // Mock data for demonstration
  const stats = {
    daysActive: 45,
    versesRead: 1234,
    notesCreated: 89,
    highlightsMade: 156,
    coursesCompleted: 3,
    quizzesTaken: 12,
    currentStreak: 7,
    longestStreak: 21
  }

  const achievements = [
    { id: 1, name: "First Steps", description: "Complete your first Bible reading", icon: BookOpen, earned: true },
    { id: 2, name: "Note Taker", description: "Create 10 notes", icon: Edit, earned: true },
    { id: 3, name: "Highlighter", description: "Make 50 highlights", icon: Target, earned: true },
    { id: 4, name: "Consistent Reader", description: "7-day reading streak", icon: Trophy, earned: true },
    { id: 5, name: "Scholar", description: "Complete 5 courses", icon: Award, earned: false },
    { id: 6, name: "Community Leader", description: "Help 10 community members", icon: Heart, earned: false },
  ]

  const recentActivity = [
    { date: "Today", action: "Read John 3:16-21", type: "reading" },
    { date: "Yesterday", action: "Completed 'Introduction to Psalms' course", type: "course" },
    { date: "2 days ago", action: "Added note to Romans 8:28", type: "note" },
    { date: "3 days ago", action: "Highlighted verses in Matthew 5", type: "highlight" },
    { date: "1 week ago", action: "Started 'Life of Jesus' reading plan", type: "plan" },
  ]

  return (
    <div className="container max-w-6xl py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser?.photoURL || ""} />
                  <AvatarFallback className="text-2xl">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full p-2"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="City, Country"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          placeholder="https://..."
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h1 className="text-2xl font-bold">{currentUser?.displayName || "User"}</h1>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {currentUser?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Member since {new Date().getFullYear()}
                        </span>
                      </div>
                    </div>
                    {profileData.bio && (
                      <p className="text-muted-foreground">{profileData.bio}</p>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.versesRead}</p>
                  <p className="text-sm text-muted-foreground">Verses Read</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Reading Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Reading Progress
                </CardTitle>
                <CardDescription>Your Bible reading journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Old Testament</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>New Testament</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    You've read {stats.versesRead} verses across 42 books
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Current Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Current Goals
                </CardTitle>
                <CardDescription>Track your spiritual goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily Reading</span>
                  <Badge variant="secondary">{stats.currentStreak} days</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Complete Genesis</span>
                  <Badge variant="secondary">78%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memorize 10 verses</span>
                  <Badge variant="secondary">6/10</Badge>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Manage Goals
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Your latest accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {achievements.filter(a => a.earned).slice(0, 3).map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div key={achievement.id} className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions in Mustard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="p-2 bg-muted rounded-full">
                      {activity.type === "reading" && <BookOpen className="h-4 w-4" />}
                      {activity.type === "course" && <Trophy className="h-4 w-4" />}
                      {activity.type === "note" && <Edit className="h-4 w-4" />}
                      {activity.type === "highlight" && <Target className="h-4 w-4" />}
                      {activity.type === "plan" && <Calendar className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                All Achievements
              </CardTitle>
              <CardDescription>
                Unlock achievements by using Mustard regularly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${
                        achievement.earned
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/50 border-muted opacity-60"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        achievement.earned ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          achievement.earned ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.earned && (
                          <p className="text-xs text-primary mt-1">Earned!</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Days Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.daysActive}</p>
                <p className="text-xs text-muted-foreground">Total days using Mustard</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Verses Read</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.versesRead}</p>
                <p className="text-xs text-muted-foreground">Across all Bible versions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.notesCreated}</p>
                <p className="text-xs text-muted-foreground">Personal insights saved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.highlightsMade}</p>
                <p className="text-xs text-muted-foreground">Important verses marked</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reading Trends
              </CardTitle>
              <CardDescription>Your reading patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Current Streak</span>
                    <span className="font-bold">{stats.currentStreak} days</span>
                  </div>
                  <Progress value={(stats.currentStreak / 30) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Longest Streak</span>
                    <span className="font-bold">{stats.longestStreak} days</span>
                  </div>
                  <Progress value={(stats.longestStreak / 30) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Courses Completed</p>
                    <p className="text-xl font-bold">{stats.coursesCompleted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                    <p className="text-xl font-bold">{stats.quizzesTaken}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
