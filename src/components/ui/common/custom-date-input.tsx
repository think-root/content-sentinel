import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/button';
import { Calendar } from '@/components/ui/base/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/base/popover';

interface CustomDateInputProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  placeholder = "Select date"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Get date format from localStorage settings
      const dateFormat = getDateFormatFromSettings();
      
      // Convert format tokens to date-fns format
      const dateFnsFormat = dateFormat
        .replace(/DD/g, 'dd')
        .replace(/dd/g, 'dd')
        .replace(/D/g, 'd')
        .replace(/d/g, 'd')
        .replace(/MMMM/g, 'MMMM')
        .replace(/MMM/g, 'MMM')
        .replace(/MM/g, 'MM')
        .replace(/mm/g, 'MM')
        .replace(/M/g, 'M')
        .replace(/m/g, 'M')
        .replace(/YYYY/g, 'yyyy')
        .replace(/yyyy/g, 'yyyy')
        .replace(/YY/g, 'yy')
        .replace(/yy/g, 'yy');
      
      return format(date, dateFnsFormat);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getDateFormatFromSettings = () => {
    try {
      const settings = localStorage.getItem('api_settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.dateFormat) {
          return parsedSettings.dateFormat
            .replace(/\s*HH:mm:ss/g, '')
            .replace(/\s*H:mm:ss/g, '')
            .replace(/\s*hh:mm:ss/g, '')
            .replace(/\s*h:mm:ss/g, '')
            .replace(/\s*HH:mm/g, '')
            .replace(/\s*H:mm/g, '')
            .replace(/\s*hh:mm/g, '')
            .replace(/\s*h:mm/g, '')
            .replace(/\s*A/g, '')
            .replace(/\s*a/g, '')
            .trim();
        }
      }
    } catch (error) {
      console.error('Error parsing api_settings:', error);
    }
    return 'dd.MM.yyyy';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDisplayDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        {value && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleDateSelect(undefined)}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};