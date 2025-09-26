import { useEffect, useState } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import { RefreshCw, Check, X, Info } from 'lucide-react';

interface ToastConfigProps {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const ToastConfig = ({ position }: ToastConfigProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const getPosition = () => {
    switch (position) {
      case 'top-left':
        return 'top-left';
      case 'top-center':
        return 'top-center';
      case 'top-right':
        return 'top-right';
      case 'bottom-left':
        return 'bottom-left';
      case 'bottom-center':
        return 'bottom-center';
      case 'bottom-right':
        return 'bottom-right';
      default:
        return 'top-right';
    }
  };

  return (
    <Toaster
      position={getPosition()}
      theme={isDarkMode ? 'dark' : 'light'}
      toastOptions={{
        classNames: {
          toast: `
            group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground 
            group-[.toaster]:border-border group-[.toaster]:shadow-lg
            group-[.toaster]:border group-[.toaster]:rounded-lg
            group-[.toaster]:transition-all group-[.toaster]:duration-200
            group-[.toaster]:backdrop-blur-sm
          `,
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: `
            group-[.toast]:bg-primary group-[.toast]:text-primary-foreground
            group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors
            group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5
            group-[.toast]:text-sm group-[.toast]:font-medium
          `,
          cancelButton: `
            group-[.toast]:bg-muted group-[.toast]:text-muted-foreground
            group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors
            group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5
            group-[.toast]:text-sm group-[.toast]:font-medium
          `,
        },
      }}
    />
  );
};

// Create toast functions that match react-hot-toast API
const toastFunctions = {
  success: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.success(message, {
      id: options?.id,
      duration: options?.duration,
      icon: (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-success">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      ),
    });
  },
  error: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.error(message, {
      id: options?.id,
      duration: options?.duration,
      icon: (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive">
          <X className="h-3.5 w-3.5 text-white" />
        </div>
      ),
    });
  },
  loading: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.loading(message, {
      id: options?.id,
      duration: options?.duration,
      icon: (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary">
          <RefreshCw className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
        </div>
      ),
    });
  },
  dismiss: (id?: string) => {
    sonnerToast.dismiss(id);
  },
  // Default function for direct calls (like toast('message'))
  // This will show an info toast by default
  info: (message: string, options?: { id?: string; duration?: number; icon?: React.ReactNode }) => {
    return sonnerToast(message, {
      id: options?.id,
      duration: options?.duration,
      icon: options?.icon || (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary">
          <Info className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      ),
    });
  },
};

// Create a callable function that can also have methods
export const toast = Object.assign(
  (message: string, options?: { id?: string; duration?: number; icon?: React.ReactNode }) => {
    return toastFunctions.info(message, options);
  },
  toastFunctions
);