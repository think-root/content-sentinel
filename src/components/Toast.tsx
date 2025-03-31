import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900',
          text: 'text-green-800 dark:text-green-100',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900',
          text: 'text-red-800 dark:text-red-100',
          border: 'border-red-200 dark:border-red-800'
        };
    }
  };

  const colors = getColors();
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-md border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${colors.text}`}>{message}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            className={`inline-flex rounded-md ${colors.bg} ${colors.text} hover:opacity-75 focus:outline-none`}
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 
