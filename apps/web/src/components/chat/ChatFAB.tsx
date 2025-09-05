"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  Plus,
  History,
  Settings,
  MessageSquare,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ChatFABProps {
  onNewChat: () => void
  onViewHistory: () => void
  onSettings?: () => void
}

export function ChatFAB({
  onNewChat,
  onViewHistory,
  onSettings,
}: ChatFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const menuItems = [
    {
      id: 'new-chat',
      icon: Plus,
      label: 'New Chat',
      onClick: () => {
        onNewChat()
        setIsExpanded(false)
      },
    },
    {
      id: 'history',
      icon: History,
      label: 'Chat History',
      onClick: () => {
        onViewHistory()
        setIsExpanded(false)
      },
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        onSettings?.()
        setIsExpanded(false)
      },
      disabled: !onSettings,
    },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-20">
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={toggleExpanded}
        />
      )}

      {/* Expanded Menu */}
      <div
        className={cn(
          "absolute bottom-16 right-0 bg-background border rounded-xl shadow-2xl p-2 min-w-[200px] transition-all duration-300 transform origin-bottom-right",
          isExpanded
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              disabled={item.disabled}
              className="w-full justify-start px-3 py-2 h-auto font-medium hover:bg-accent/50 transition-colors"
            >
              <item.icon className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main FAB Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={toggleExpanded}
              className="shadow-lg h-14 w-14"
            >
              {isExpanded ? (
                <X className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isExpanded ? 'Close Menu' : 'Chat Options'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
