"use client"

import { SplitScreenLayout } from "@/components/SplitScreenLayout"
import { PanelProvider } from "@/contexts/PanelContext"

export default function TestScrollPage() {
  const leftPanel = (
    <div className="h-full bg-gray-50 p-6">
      <h2 className="text-xl font-bold mb-4">Left Panel - AI Insights</h2>
      <div className="space-y-4">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="p-4 bg-white rounded shadow">
            <p className="text-sm">AI Insight Item {i + 1}</p>
            <p className="text-xs text-gray-500">This is a sample insight that would appear in the left panel. It demonstrates how content scrolls properly.</p>
          </div>
        ))}
      </div>
    </div>
  )

  const rightPanel = (
    <div className="relative h-full">
      <div className="p-6 pb-24">
        <h2 className="text-xl font-bold mb-4">Right Panel - Bible Content</h2>
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="border-b pb-2">
              <span className="font-semibold text-sm">{i + 1}</span>
              <span className="ml-2">
                This is verse {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Navigation Buttons */}
      <div className="fixed bottom-8 right-8 flex gap-2 z-10">
        <button className="px-4 py-2 bg-blue-500 text-white rounded shadow-lg">
          Previous
        </button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded shadow-lg">
          Next
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center px-4">
        <h1 className="text-lg font-semibold">Test Scroll Functionality</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <PanelProvider>
          <SplitScreenLayout
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            defaultState="both"
          />
        </PanelProvider>
      </div>
    </div>
  )
}
