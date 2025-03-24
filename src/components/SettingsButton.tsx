import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { useDisclosure } from '../hooks/useDisclosure';

export const SettingsButton: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button
        onClick={onOpen}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="Settings"
      >
        <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <SettingsModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}; 