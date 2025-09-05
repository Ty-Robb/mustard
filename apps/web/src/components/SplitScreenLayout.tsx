'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { usePanel } from '@/contexts/PanelContext';
import type {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';

interface SplitScreenLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultState?: 'both' | 'left' | 'right';
  leftPanelDefaultSize?: number;
  rightPanelDefaultSize?: number;
}

export function SplitScreenLayout({
  leftPanel,
  rightPanel,
  defaultState = 'right',
  leftPanelDefaultSize = 35,
  rightPanelDefaultSize = 65,
}: SplitScreenLayoutProps) {
  const {
    isLeftPanelCollapsed,
    setLeftPanelCollapsed,
    isRightPanelCollapsed,
    setRightPanelCollapsed,
  } = usePanel();
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  // This effect sets the initial state and reacts to changes in defaultState.
  useEffect(() => {
    switch (defaultState) {
      case 'left':
        setLeftPanelCollapsed(false);
        setRightPanelCollapsed(true);
        break;
      case 'right':
        setLeftPanelCollapsed(true);
        setRightPanelCollapsed(false);
        break;
      case 'both':
      default:
        setLeftPanelCollapsed(false);
        setRightPanelCollapsed(false);
        break;
    }
  }, [defaultState, setLeftPanelCollapsed, setRightPanelCollapsed]);

  // These effects handle programmatic collapsing/expanding from external controls (e.g., a button)
  useEffect(() => {
    const panel = leftPanelRef.current;
    const panelGroup = panelGroupRef.current;
    if (panel && panelGroup) {
      if (isLeftPanelCollapsed && !panel.isCollapsed()) {
        panel.collapse();
      } else if (!isLeftPanelCollapsed && panel.isCollapsed()) {
        panel.expand();
        // When expanding the left panel, ensure both panels are visible with proper sizes
        // Use setTimeout to ensure the panel has expanded before setting layout
        setTimeout(() => {
          if (!isRightPanelCollapsed && panelGroup) {
            panelGroup.setLayout([leftPanelDefaultSize, rightPanelDefaultSize]);
          }
        }, 0);
      } else if (!isLeftPanelCollapsed && !isRightPanelCollapsed) {
        // If both panels should be visible but layout might be wrong, fix it
        const currentLayout = panelGroup.getLayout();
        if (currentLayout[0] === 0 || currentLayout[1] === 0) {
          panelGroup.setLayout([leftPanelDefaultSize, rightPanelDefaultSize]);
        }
      }
    }
  }, [isLeftPanelCollapsed, isRightPanelCollapsed, leftPanelDefaultSize, rightPanelDefaultSize]);

  useEffect(() => {
    const panel = rightPanelRef.current;
    const panelGroup = panelGroupRef.current;
    if (panel && panelGroup) {
      if (isRightPanelCollapsed && !panel.isCollapsed()) {
        panel.collapse();
      } else if (!isRightPanelCollapsed && panel.isCollapsed()) {
        panel.expand();
        // When expanding the right panel, ensure both panels are visible with proper sizes
        // Use setTimeout to ensure the panel has expanded before setting layout
        setTimeout(() => {
          if (!isLeftPanelCollapsed && panelGroup) {
            panelGroup.setLayout([leftPanelDefaultSize, rightPanelDefaultSize]);
          }
        }, 0);
      } else if (!isLeftPanelCollapsed && !isRightPanelCollapsed) {
        // If both panels should be visible but layout might be wrong, fix it
        const currentLayout = panelGroup.getLayout();
        if (currentLayout[0] === 0 || currentLayout[1] === 0) {
          panelGroup.setLayout([leftPanelDefaultSize, rightPanelDefaultSize]);
        }
      }
    }
  }, [isRightPanelCollapsed, isLeftPanelCollapsed, leftPanelDefaultSize, rightPanelDefaultSize]);

  return (
    <ResizablePanelGroup
      ref={panelGroupRef}
      direction="horizontal"
      className="h-full"
      onLayout={(sizes: number[]) => {
        // This callback syncs the state when the user drags the handle.
        setLeftPanelCollapsed(sizes[0] === 0);
        setRightPanelCollapsed(sizes[1] === 0);
      }}
    >
      <ResizablePanel
        ref={leftPanelRef}
        id="left-panel"
        defaultSize={defaultState === 'right' ? 0 : defaultState === 'left' ? 100 : leftPanelDefaultSize}
        minSize={30}
        collapsible
        collapsedSize={0}
      >
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        ref={rightPanelRef}
        id="right-panel"
        defaultSize={defaultState === 'left' ? 0 : defaultState === 'right' ? 100 : rightPanelDefaultSize}
        minSize={30}
        collapsible
        collapsedSize={0}
      >
        {rightPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
