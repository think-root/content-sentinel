import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../base/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (metaThemeColor) {
        // Updated soft dark theme color
        metaThemeColor.setAttribute('content', '#1a1a1a');
      }
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="h-8 w-8 sm:h-10 sm:w-10"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
      )}
    </Button>
  );
}