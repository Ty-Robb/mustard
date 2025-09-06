"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { 
  MessageSquare, 
  ThumbsUp, 
  Bug, 
  Lightbulb, 
  Heart,
  Star,
  Send
} from "lucide-react"

export default function FeedbackPage() {
  const { toast } = useToast()
  const [feedbackType, setFeedbackType] = useState("general")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    email: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Here you would normally send the feedback to your backend
    toast({
      title: "Thank you for your feedback!",
      description: "We appreciate your input and will review it carefully.",
    })

    // Reset form
    setFormData({ subject: "", message: "", email: "" })
    setRating(0)
    setFeedbackType("general")
  }

  const feedbackTypes = [
    { value: "general", label: "General Feedback", icon: MessageSquare },
    { value: "bug", label: "Report a Bug", icon: Bug },
    { value: "feature", label: "Feature Request", icon: Lightbulb },
    { value: "appreciation", label: "Appreciation", icon: Heart },
  ]

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Help us improve Mustard by sharing your thoughts and suggestions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Stats */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Your Feedback Matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Shape the Future</p>
                  <p className="text-sm text-muted-foreground">
                    Your ideas help us build features you'll love
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bug className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Fix Issues Faster</p>
                  <p className="text-sm text-muted-foreground">
                    Report bugs to help us improve stability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Build Community</p>
                  <p className="text-sm text-muted-foreground">
                    Your voice matters in our community
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Updates</CardTitle>
              <CardDescription>Based on your feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <p className="font-medium">✓ Added date filtering</p>
                <p className="text-muted-foreground">Activity tracker improvements</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">✓ Enhanced AI responses</p>
                <p className="text-muted-foreground">Better formatting and clarity</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">✓ Course creation tools</p>
                <p className="text-muted-foreground">Create and share courses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Send Us Your Feedback</CardTitle>
            <CardDescription>
              Select a category and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div className="space-y-3">
                <Label>Feedback Type</Label>
                <RadioGroup
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                  className="grid grid-cols-2 gap-4"
                >
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.value}>
                        <RadioGroupItem
                          value={type.value}
                          id={type.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={type.value}
                          className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Icon className="h-5 w-5" />
                          {type.label}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <Label>How would you rate your experience?</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Your Feedback</Label>
                <Textarea
                  id="message"
                  placeholder={
                    feedbackType === "bug"
                      ? "Please describe the issue you encountered, including steps to reproduce it..."
                      : feedbackType === "feature"
                      ? "Describe the feature you'd like to see and how it would help you..."
                      : feedbackType === "appreciation"
                      ? "Let us know what you love about Mustard..."
                      : "Share your thoughts, suggestions, or concerns..."
                  }
                  className="min-h-[150px] resize-none"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                />
              </div>

              {/* Email (optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email (optional)
                  <span className="text-sm text-muted-foreground ml-2">
                    If you'd like us to follow up
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg">
                <Send className="mr-2 h-4 w-4" />
                Send Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Resources */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Join the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with other users and share ideas
            </p>
            <Button variant="outline" className="w-full">
              Visit Forums
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Feature Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              See what we're working on next
            </p>
            <Button variant="outline" className="w-full">
              View Roadmap
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Release Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Stay updated with the latest changes
            </p>
            <Button variant="outline" className="w-full">
              What's New
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
