"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Search, 
  BookOpen, 
  MessageSquare, 
  Video, 
  FileText,
  HelpCircle,
  Lightbulb,
  Shield,
  Zap,
  Users,
  Mail,
  Phone,
  ExternalLink
} from "lucide-react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign Up' button on the homepage and follow the registration process. You can sign up using your email or Google account."
        },
        {
          question: "How do I navigate the Bible reader?",
          answer: "Use the book, chapter, and verse selectors at the top of the Bible reader. You can also use keyboard shortcuts: arrow keys to navigate between chapters."
        },
        {
          question: "Can I use Mustard offline?",
          answer: "Currently, Mustard requires an internet connection for most features. We're working on offline support for future releases."
        }
      ]
    },
    {
      category: "Bible Study Features",
      questions: [
        {
          question: "How do I highlight verses?",
          answer: "Select the text you want to highlight, then choose a color from the popup menu. Your highlights are automatically saved."
        },
        {
          question: "Can I add notes to verses?",
          answer: "Yes! Click on any verse number to add a note. You can also attach notes to your highlights."
        },
        {
          question: "How do reading plans work?",
          answer: "Choose from our pre-made reading plans or create your own. The app will track your progress and send reminders if enabled."
        }
      ]
    },
    {
      category: "AI Assistant",
      questions: [
        {
          question: "What can the AI assistant help with?",
          answer: "The AI can help with Bible study questions, provide context and commentary, generate study guides, create quizzes, and offer insights on specific passages."
        },
        {
          question: "Is the AI theologically neutral?",
          answer: "The AI aims to provide balanced, scholarly perspectives and will often present multiple viewpoints on theological topics."
        },
        {
          question: "Can I save AI conversations?",
          answer: "Yes, all your AI chat conversations are automatically saved and can be accessed from your chat history."
        }
      ]
    },
    {
      category: "Learning & Courses",
      questions: [
        {
          question: "How do I enroll in a course?",
          answer: "Browse available courses in the Learning section, click on a course to view details, then click 'Enroll' to start learning."
        },
        {
          question: "Can I create my own courses?",
          answer: "Yes! Navigate to 'My Courses' and click 'Create New Course'. You can add lessons, quizzes, and resources."
        },
        {
          question: "How is progress tracked?",
          answer: "Your progress is automatically tracked as you complete lessons and quizzes. You can view your progress on the course page."
        }
      ]
    },
    {
      category: "Account & Privacy",
      questions: [
        {
          question: "How do I change my password?",
          answer: "Go to Settings > Account, and click 'Change Password'. You'll need to enter your current password and a new one."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account from Settings > Account > Delete Account. This action is permanent and cannot be undone."
        },
        {
          question: "Is my data private?",
          answer: "Yes, we take privacy seriously. Your personal data, notes, and highlights are private by default. You control what you share."
        }
      ]
    }
  ]

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Find answers to your questions and learn how to use Mustard
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search for help..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="tutorials">Video Tutorials</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchQuery && filteredFaqs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No results found for "{searchQuery}"
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {(searchQuery ? filteredFaqs : faqs).map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-6">
                      <h3 className="font-semibold mb-3 text-lg">{category.category}</h3>
                      {category.questions.map((item, index) => (
                        <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>{item.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </div>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Bible Study Basics
                </CardTitle>
                <CardDescription>
                  Learn the fundamentals of using Mustard for Bible study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Navigating the Bible reader</li>
                  <li>• Using highlights and notes</li>
                  <li>• Creating reading plans</li>
                  <li>• Searching for verses</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  AI Assistant Guide
                </CardTitle>
                <CardDescription>
                  Make the most of the AI-powered features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Asking effective questions</li>
                  <li>• Understanding AI responses</li>
                  <li>• Creating study materials</li>
                  <li>• Generating presentations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Discover powerful tools for deeper study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Strong's concordance lookup</li>
                  <li>• Cross-references</li>
                  <li>• Original language tools</li>
                  <li>• Export and sharing options</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Community Features
                </CardTitle>
                <CardDescription>
                  Connect and learn with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Joining study groups</li>
                  <li>• Sharing insights</li>
                  <li>• Discussion forums</li>
                  <li>• Collaborative studies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Tutorials
              </CardTitle>
              <CardDescription>
                Step-by-step video guides to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Getting Started Series</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Introduction to Mustard (5:23)
                    </li>
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Your First Bible Study (8:45)
                    </li>
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Using the AI Assistant (6:12)
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Advanced Tutorials</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Creating Custom Courses (10:15)
                    </li>
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Advanced Search Techniques (7:30)
                    </li>
                    <li className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Collaboration Features (9:00)
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline">
                  View All Tutorials
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat Support
                </CardTitle>
                <CardDescription>
                  Chat with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Available Monday-Friday, 9 AM - 5 PM EST
                </p>
                <Button className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Live Chat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
                <CardDescription>
                  Send us an email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours
                </p>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  support@mustard.app
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit a Request
              </CardTitle>
              <CardDescription>
                Describe your issue and we'll help you resolve it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Brief description of your issue" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Technical Issue</option>
                    <option>Account Problem</option>
                    <option>Feature Request</option>
                    <option>Billing Question</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                    placeholder="Please provide as much detail as possible..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
