import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';

interface ToasterConfigProps {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const ToasterConfig = ({ position }: ToasterConfigProps) => {
  return (
    <Toaster
      position={position}
      toastOptions={{
        success: {
          icon: (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          duration: 5000,
        },
        error: {
          icon: (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          duration: 5000,
        },
        loading: {
          icon: (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
              <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
            </div>
          ),
          duration: 3000,
        },
      }}
    >
      {(t) => (
        <div 
          onClick={() => {
            toast.dismiss(t.id);
            if (t.style) {
              t.style.animation = 'custom-exit 0.3s ease forwards';
            }
          }}
          onTouchStart={() => {
            toast.dismiss(t.id);
            if (t.style) {
              t.style.animation = 'custom-exit 0.3s ease forwards';
            }
          }}
          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
        >
          <ToastBar
            toast={t}
            style={{
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              boxShadow: 'var(--toast-shadow)',
              animation: t.visible
                ? 'custom-enter 0.3s ease'
                : 'custom-exit 0.3s ease forwards',
            }}
          />
        </div>
      )}
    </Toaster>
  );
};