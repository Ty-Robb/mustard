"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "next-themes"
import { Bell, Globe, Lock, Palette, User, BookOpen, Brain } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    dailyVerse: true,
    studyReminders: true,
    communityUpdates: false,
  })
  const [privacy, setPrivacy] = useState({
    profileVisibility: "friends",
    showActivity: true,
    shareHighlights: false,
  })
  const [biblePreferences, setBiblePreferences] = useState({
    defaultVersion: "NIV",
    fontSize: "medium",
    lineSpacing: "normal",
    showVerseNumbers: true,
    showChapterNumbers: true,
  })

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="bible">Bible</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Mustard looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="gmt">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-verse">Daily verse</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily Bible verse
                  </p>
                </div>
                <Switch
                  id="daily-verse"
                  checked={notifications.dailyVerse}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, dailyVerse: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="study-reminders">Study reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for your reading plans
                  </p>
                </div>
                <Switch
                  id="study-reminders"
                  checked={notifications.studyReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, studyReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="community-updates">Community updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates from groups and discussions
                  </p>
                </div>
                <Switch
                  id="community-updates"
                  checked={notifications.communityUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, communityUpdates: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile visibility</Label>
                <Select
                  value={privacy.profileVisibility}
                  onValueChange={(value) =>
                    setPrivacy({ ...privacy, profileVisibility: value })
                  }
                >
                  <SelectTrigger id="profile-visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-activity">Show activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see your reading activity
                  </p>
                </div>
                <Switch
                  id="show-activity"
                  checked={privacy.showActivity}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, showActivity: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-highlights">Share highlights</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your highlights
                  </p>
                </div>
                <Switch
                  id="share-highlights"
                  checked={privacy.shareHighlights}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, shareHighlights: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bible" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Bible Reading Preferences
              </CardTitle>
              <CardDescription>
                Customize your Bible reading experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-version">Default Bible version</Label>
                <Select
                  value={biblePreferences.defaultVersion}
                  onValueChange={(value) =>
                    setBiblePreferences({ ...biblePreferences, defaultVersion: value })
                  }
                >
                  <SelectTrigger id="default-version">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIV">NIV</SelectItem>
                    <SelectItem value="ESV">ESV</SelectItem>
                    <SelectItem value="KJV">KJV</SelectItem>
                    <SelectItem value="NKJV">NKJV</SelectItem>
                    <SelectItem value="NLT">NLT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size">Font size</Label>
                <Select
                  value={biblePreferences.fontSize}
                  onValueChange={(value) =>
                    setBiblePreferences({ ...biblePreferences, fontSize: value })
                  }
                >
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="line-spacing">Line spacing</Label>
                <Select
                  value={biblePreferences.lineSpacing}
                  onValueChange={(value) =>
                    setBiblePreferences({ ...biblePreferences, lineSpacing: value })
                  }
                >
                  <SelectTrigger id="line-spacing">
                    <SelectValue placeholder="Select spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="verse-numbers">Show verse numbers</Label>
                  <p className="text-sm text-muted-foreground">
                    Display verse numbers in the text
                  </p>
                </div>
                <Switch
                  id="verse-numbers"
                  checked={biblePreferences.showVerseNumbers}
                  onCheckedChange={(checked) =>
                    setBiblePreferences({ ...biblePreferences, showVerseNumbers: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chapter-numbers">Show chapter numbers</Label>
                  <p className="text-sm text-muted-foreground">
                    Display chapter numbers in the text
                  </p>
                </div>
                <Switch
                  id="chapter-numbers"
                  checked={biblePreferences.showChapterNumbers}
                  onCheckedChange={(checked) =>
                    setBiblePreferences({ ...biblePreferences, showChapterNumbers: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  className="resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Preferences
              </CardTitle>
              <CardDescription>
                Configure AI assistant behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-model">Preferred AI model</Label>
                <Select defaultValue="gemini-pro">
                  <SelectTrigger id="ai-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-style">Response style</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger id="ai-style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}
