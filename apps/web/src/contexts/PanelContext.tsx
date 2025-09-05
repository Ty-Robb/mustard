'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PanelContextType {
  isLeftPanelCollapsed: boolean;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  isRightPanelCollapsed: boolean;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  isRightPanelLocked: boolean;
  setRightPanelLocked: (locked: boolean) => void;
}

interface PanelHookReturn extends PanelContextType {
  showBothPanels: () => void;
  showLeftPanelOnly: () => void;
  showRightPanelOnly: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [isLeftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [isRightPanelLocked, setRightPanelLocked] = useState(false);

  const value = {
    isLeftPanelCollapsed,
    setLeftPanelCollapsed,
    isRightPanelCollapsed,
    setRightPanelCollapsed,
    isRightPanelLocked,
    setRightPanelLocked,
  };

  return (
    <PanelContext.Provider value={value}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel(): PanelHookReturn {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }

  const showBothPanels = useCallback(() => {
    if (context.isRightPanelLocked) return;
    context.setLeftPanelCollapsed(false);
    context.setRightPanelCollapsed(false);
  }, [context]);

  const showLeftPanelOnly = useCallback(() => {
    context.setLeftPanelCollapsed(false);
    context.setRightPanelCollapsed(true);
  }, [context]);
  
  const showRightPanelOnly = useCallback(() => {
    if (context.isRightPanelLocked) return;
    context.setLeftPanelCollapsed(true);
    context.setRightPanelCollapsed(false);
  }, [context]);
  
  const toggleLeftPanel = useCallback(() => {
    context.setLeftPanelCollapsed(!context.isLeftPanelCollapsed);
  }, [context]);
  
  const toggleRightPanel = useCallback(() => {
    if (context.isRightPanelLocked) return;
    context.setRightPanelCollapsed(!context.isRightPanelCollapsed);
  }, [context]);
  
  return { ...context, showBothPanels, showLeftPanelOnly, showRightPanelOnly, toggleLeftPanel, toggleRightPanel };
}
