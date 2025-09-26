import { Settings } from 'lucide-react';
import { Button } from '../base/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../base/tooltip';

interface SettingsButtonProps {
  onOpen: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onOpen }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpen}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};