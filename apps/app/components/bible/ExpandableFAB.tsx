"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  X,
  Type,
  LineChart,
  Sun,
  Moon,
  Palette,
  MessageSquare,
  Highlighter,
  Bookmark,
  Focus,
  Maximize2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ExpandableFABProps {
  // Chapter navigation
  onPreviousChapter: () => void
  onNextChapter: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  
  // Panel controls
  isLeftPanelCollapsed: boolean
  toggleLeftPanel: () => void
  onViewHighlights?: () => void
  onViewChatHistory?: () => void
  
  // Reading preferences (these will be managed by parent component)
  fontSize: number
  onFontSizeChange: (size: number) => void
  lineSpacing: number
  onLineSpacingChange: (spacing: number) => void
  theme: 'light' | 'dark' | 'sepia'
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void
  
  // Additional features
  onBookmark?: () => void
  onFocusMode?: () => void
  onFullScreen?: () => void
}

type MenuItem = {
  id: string
  icon: any
  label: string
} & (
  | {
      type?: never
      onClick: () => void
      disabled?: boolean
      control?: never
    }
  | {
      type: 'control'
      control: React.ReactNode
      onClick?: never
      disabled?: never
    }
)

type MenuSection = {
  id: string
  type: 'section'
  label: string
  items: MenuItem[]
}

export function ExpandableFAB({
  onPreviousChapter,
  onNextChapter,
  canGoPrevious,
  canGoNext,
  isLeftPanelCollapsed,
  toggleLeftPanel,
  onViewHighlights,
  onViewChatHistory,
  fontSize,
  onFontSizeChange,
  lineSpacing,
  onLineSpacingChange,
  theme,
  onThemeChange,
  onBookmark,
  onFocusMode,
  onFullScreen,
}: ExpandableFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const menuItems: MenuSection[] = [
    // Chapter Navigation Section
    {
      id: 'nav-section',
      type: 'section',
      label: 'Navigation',
      items: [
        {
          id: 'chapter-nav',
          type: 'control',
          icon: ChevronLeft,
          label: 'Chapter Navigation',
          control: (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onPreviousChapter}
                disabled={!canGoPrevious}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Chapter</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onNextChapter}
                disabled={!canGoNext}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ],
    },
    // Panel Controls Section
    {
      id: 'panel-section',
      type: 'section',
      label: 'Panels',
      items: [
        {
          id: 'toggle-insights',
          icon: isLeftPanelCollapsed ? PanelLeftOpen : PanelLeftClose,
          label: 'Toggle AI Insights',
          onClick: toggleLeftPanel,
        },
        {
          id: 'highlights',
          icon: Highlighter,
          label: 'View Highlights',
          onClick: () => {
            if (isLeftPanelCollapsed) toggleLeftPanel()
            onViewHighlights?.()
          },
        },
        {
          id: 'chat-history',
          icon: MessageSquare,
          label: 'Chat History',
          onClick: () => {
            if (isLeftPanelCollapsed) toggleLeftPanel()
            onViewChatHistory?.()
          },
        },
      ],
    },
    // Reading Controls Section
    {
      id: 'reading-section',
      type: 'section',
      label: 'Reading',
      items: [
        {
          id: 'font-size',
          type: 'control',
          icon: Type,
          label: 'Font Size',
          control: (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                className="h-6 w-6 p-0"
              >
                A-
              </Button>
              <span className="text-xs w-8 text-center">{fontSize}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                className="h-6 w-6 p-0"
              >
                A+
              </Button>
            </div>
          ),
        },
        {
          id: 'line-spacing',
          type: 'control',
          icon: LineChart,
          label: 'Line Spacing',
          control: (
            <div className="flex items-center gap-1">
              {[1.5, 1.75, 2, 2.5].map((spacing) => (
                <Button
                  key={spacing}
                  size="sm"
                  variant={lineSpacing === spacing ? "default" : "ghost"}
                  onClick={() => onLineSpacingChange(spacing)}
                  className="h-6 w-8 p-0 text-xs"
                >
                  {spacing}x
                </Button>
              ))}
            </div>
          ),
        },
        {
          id: 'theme',
          type: 'control',
          icon: Palette,
          label: 'Theme',
          control: (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={theme === 'light' ? "default" : "ghost"}
                onClick={() => onThemeChange('light')}
                className="h-6 w-6 p-0"
              >
                <Sun className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={theme === 'dark' ? "default" : "ghost"}
                onClick={() => onThemeChange('dark')}
                className="h-6 w-6 p-0"
              >
                <Moon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={theme === 'sepia' ? "default" : "ghost"}
                onClick={() => onThemeChange('sepia')}
                className="h-6 px-2 text-xs"
              >
                Sepia
              </Button>
            </div>
          ),
        },
      ],
    },
    // Additional Features Section
    {
      id: 'features-section',
      type: 'section',
      label: 'Features',
      items: [
        {
          id: 'bookmark',
          icon: Bookmark,
          label: 'Bookmark',
          onClick: onBookmark || (() => {}),
          disabled: !onBookmark,
        },
        {
          id: 'focus-mode',
          icon: Focus,
          label: 'Focus Mode',
          onClick: onFocusMode || (() => {}),
          disabled: !onFocusMode,
        },
        {
          id: 'fullscreen',
          icon: Maximize2,
          label: 'Full Screen',
          onClick: onFullScreen || (() => {}),
          disabled: !onFullScreen,
        },
      ],
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
          "absolute bottom-16 right-0 bg-background border rounded-xl shadow-2xl p-2 min-w-[340px] max-h-[500px] overflow-y-auto transition-all duration-300 transform origin-bottom-right",
          isExpanded
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {menuItems.map((section, index) => (
          <div key={section.id} className="mb-2 last:mb-0">
            {index > 0 && <div className="h-px bg-border my-2" />}
            <div className="px-2 py-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.label}
              </h3>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                if (item.type === 'control') {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center">
                        {item.control}
                      </div>
                    </div>
                  )
                }
                
                return (
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
                )
              })}
            </div>
          </div>
        ))}
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
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isExpanded ? 'Close Menu' : 'Open Menu'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
