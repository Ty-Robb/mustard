"use client"

import * as React from "react"
import {
  BookOpen,
  Home,
  Settings,
  Search,
  Bookmark,
  MessageSquare,
  Users,
  HelpCircle,
  Bot,
  Brain,
  GraduationCap,
  CreditCard,
  TrendingUp,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
  onLogout?: () => void | Promise<void>
  currentPath?: string
  onNavigate?: (path: string) => void
}

export function AppSidebar({ 
  user, 
  onLogout, 
  currentPath, 
  onNavigate, 
  ...props 
}: AppSidebarProps) {
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: currentPath === "/dashboard",
    },
    {
      title: "Bible Reader",
      url: "/bible-reader",
      icon: BookOpen,
      iconColor: "text-blue-600",
      isActive: currentPath === "/bible-reader",
    },
    {
      title: "AI Chat",
      url: "/chat",
      icon: Bot,
      iconColor: "text-purple-600",
      isActive: currentPath === "/chat",
    },
    {
      title: "Bible Quiz",
      url: "/quiz",
      icon: Brain,
      iconColor: "text-green-600",
      isActive: currentPath?.startsWith("/quiz"),
    },
    {
      title: "Learning",
      url: "/lms-test",
      icon: GraduationCap,
      iconColor: "text-orange-600",
      isActive: currentPath === "/lms-test" || currentPath?.startsWith("/courses"),
      items: [
        {
          title: "Browse Courses",
          url: "/lms-test",
        },
        {
          title: "My Courses",
          url: "/courses/my-courses",
        },
      ],
    },
    {
      title: "Pricing & Payments",
      url: "/pricing",
      icon: CreditCard,
      iconColor: "text-pink-600",
      isActive: currentPath?.startsWith("/pricing") || currentPath?.startsWith("/payments"),
      items: [
        {
          title: "Pricing Survey",
          url: "/pricing/survey",
        },
        {
          title: "Pricing Analysis",
          url: "/pricing/analysis",
        },
        {
          title: "Payment History",
          url: "/payments/history",
        },
      ],
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
      isActive: currentPath === "/search",
      items: [
        {
          title: "Verses",
          url: "/search/verses",
        },
        {
          title: "Topics",
          url: "/search/topics",
        },
        {
          title: "Strong's Numbers",
          url: "/search/strongs",
        },
      ],
    },
    {
      title: "My Library",
      url: "/library",
      icon: Bookmark,
      isActive: currentPath?.startsWith("/library"),
      items: [
        {
          title: "Highlights",
          url: "/library/highlights",
        },
        {
          title: "Notes",
          url: "/library/notes",
        },
        {
          title: "Reading Plans",
          url: "/library/plans",
        },
      ],
    },
    {
      title: "Community",
      url: "/community",
      icon: Users,
      isActive: currentPath?.startsWith("/community"),
      items: [
        {
          title: "Groups",
          url: "/community/groups",
        },
        {
          title: "Discussions",
          url: "/community/discussions",
        },
      ],
    },
  ]

  const navSecondary = [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: MessageSquare,
    },
  ]

  // Use the passed user data or fall back to default
  const userData = user && user.email ? {
    name: user.name || user.email,
    email: user.email,
    avatar: user.avatar || null
  } : {
    name: "Guest User",
    email: "guest@example.com",
    avatar: null
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mustard</span>
                  <span className="truncate text-xs text-muted-foreground">Bible Study App</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
