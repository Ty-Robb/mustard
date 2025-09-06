"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname, useRouter } from "next/navigation"
import { BibleProvider, useBible } from "@/contexts/BibleContext"
import { PanelProvider } from "@/contexts/PanelContext"
import { BibleHeaderNavigation } from "@/components/bible/BibleHeaderNavigation"
import { BreadcrumbProvider, useBreadcrumb } from "@/contexts/BreadcrumbContext"
import { Home, Library, BookOpen } from "lucide-react"

function DynamicBreadcrumb({ pathname }: { pathname: string | null }) {
  const { breadcrumbs } = useBreadcrumb()
  
  // Default breadcrumb logic if no custom breadcrumbs are set
  if (breadcrumbs.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-3 w-3 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathname && pathname !== '/dashboard' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {pathname.split('/').pop()?.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  
  // Use custom breadcrumbs
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink href={crumb.href} className="flex items-center gap-1">
                  {crumb.icon}
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1">
                  {crumb.icon}
                  {crumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/signin")
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/signin")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  // Check if we're on a Bible-related page
  const isBiblePage = pathname?.includes('/bible-reader') || pathname?.includes('/dashboard')

  return (
    <BreadcrumbProvider>
      <BibleProvider>
        <PanelProvider>
          <SidebarProvider>
          <AppSidebar
            user={{
              name: currentUser.displayName || currentUser.email || "User",
              email: currentUser.email || "",
              avatar: currentUser.photoURL,
            }}
            onLogout={handleLogout}
            currentPath={pathname}
            onNavigate={handleNavigate}
          />
          <SidebarInset className="flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {isBiblePage ? (
                <BibleHeaderContent />
              ) : (
                <DynamicBreadcrumb pathname={pathname} />
              )}
            </header>
            <div className="flex-1 flex flex-col overflow-hidden">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
        </PanelProvider>
      </BibleProvider>
    </BreadcrumbProvider>
  )
}

function BibleHeaderContent() {
  const bibleContext = useBible()
  
  return (
    <BibleHeaderNavigation
      selectedBible={bibleContext.selectedBible}
      onBibleChange={bibleContext.setSelectedBible}
      books={bibleContext.books}
      selectedBook={bibleContext.selectedBook}
      onBookChange={bibleContext.setSelectedBook}
      selectedChapter={bibleContext.selectedChapter}
      onChapterChange={bibleContext.setSelectedChapter}
      loading={bibleContext.loading}
    />
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
}
