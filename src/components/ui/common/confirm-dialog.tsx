import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../base/alert-dialog"
import { AlertTriangle, X } from "lucide-react"
import { useEffect } from "react"

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const variantStyles = {
    danger: {
      icon: 'text-destructive',
      confirmButton: 'bg-destructive hover:bg-destructive/90 text-white',
      border: 'border-destructive/20'
    },
    warning: {
      icon: 'text-warning',
      confirmButton: 'bg-warning hover:bg-warning/90 text-warning-foreground',
      border: 'border-warning/20'
    },
    info: {
      icon: 'text-primary',
      confirmButton: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      border: 'border-border'
    }
  };

  const styles = variantStyles[variant];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <AlertDialogContent className={`border ${styles.border}`}>
        <AlertDialogHeader className="relative">
          {/* Close button */}
          <button
            type="button"
            className="absolute right-0 top-0 rounded-md bg-background text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" />
          </button>

          {/* Icon and title */}
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
              variant === 'danger' ? 'bg-destructive/10' :
              variant === 'warning' ? 'bg-warning/10' :
              'bg-muted'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
            </div>
            
            <div className="flex-1">
              <AlertDialogTitle className="text-base font-semibold leading-6 text-foreground">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                {message}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 sm:mt-4">
          <AlertDialogAction
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
          <AlertDialogCancel
            className="mt-3 sm:mt-0 sm:mr-3"
            onClick={onCancel}
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}