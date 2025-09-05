"use client"

import * as React from "react"

// Simple toast types for build compatibility
export type ToastProps = {
  id?: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

export type ToastActionElement = React.ReactElement

// Placeholder components to satisfy the build
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
export const ToastViewport: React.FC = () => null
export const Toast: React.FC<ToastProps> = () => null
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
export const ToastClose: React.FC = () => null
export const ToastAction: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
