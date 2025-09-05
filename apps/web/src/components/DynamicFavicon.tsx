'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function DynamicFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Function to update favicon
    const updateFavicon = (isDark: boolean) => {
      const favicon = isDark ? '/favicondarkmode.ico' : '/favicon.ico';
      
      // Find existing favicon link or create new one
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      
      link.href = favicon;
    };

    // Check if we should use dark mode favicon
    const isDarkMode = resolvedTheme === 'dark';
    updateFavicon(isDarkMode);
  }, [resolvedTheme]);

  // This component doesn't render anything
  return null;
}
