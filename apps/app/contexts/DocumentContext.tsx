'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'sermon' | 'bible-study' | 'essay' | 'notes';
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentContextType {
  activeDocument: Document | null;
  isDocumentOpen: boolean;
  openDocument: (document: Document) => void;
  closeDocument: () => void;
  updateDocument: (content: string) => void;
  createDocument: (title: string, content: string, type: Document['type']) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);

  const openDocument = useCallback((document: Document) => {
    setActiveDocument(document);
    setIsDocumentOpen(true);
  }, []);

  const closeDocument = useCallback(() => {
    setIsDocumentOpen(false);
    // Keep the document in memory for a bit before clearing
    setTimeout(() => {
      if (!isDocumentOpen) {
        setActiveDocument(null);
      }
    }, 300);
  }, [isDocumentOpen]);

  const updateDocument = useCallback((content: string) => {
    if (activeDocument) {
      setActiveDocument({
        ...activeDocument,
        content,
        updatedAt: new Date(),
      });
    }
  }, [activeDocument]);

  const createDocument = useCallback((title: string, content: string, type: Document['type']) => {
    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      title,
      content,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    openDocument(newDocument);
  }, [openDocument]);

  return (
    <DocumentContext.Provider
      value={{
        activeDocument,
        isDocumentOpen,
        openDocument,
        closeDocument,
        updateDocument,
        createDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
