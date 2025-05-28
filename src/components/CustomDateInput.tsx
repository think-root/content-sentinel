import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return 'DD.MM.YYYY';
  };

  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = createLocalDate(dateString);
    const dateFormat = getDateFormatFromSettings();

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const pad = (num: number) => num.toString().padStart(2, '0');
    const getMonthName = (monthIndex: number, short = false) => {
      const months = short
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return months[monthIndex - 1];
    };

    const formattedDate = dateFormat
      .replace(/DD/g, pad(day))
      .replace(/dd/g, pad(day))
      .replace(/D/g, day.toString())
      .replace(/d/g, day.toString())

      .replace(/MMMM/g, getMonthName(month, false))
      .replace(/MMM/g, getMonthName(month, true))
      .replace(/MM/g, pad(month))
      .replace(/mm/g, pad(month))
      .replace(/M/g, month.toString())
      .replace(/m/g, month.toString())

      .replace(/YYYY/g, year.toString())
      .replace(/yyyy/g, year.toString())
      .replace(/YY/g, year.toString().slice(-2))
      .replace(/yy/g, year.toString().slice(-2));

    return formattedDate;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    onChange(dateString);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSelectedDate = (day: Date | null): boolean => {
    if (!day || !value) return false;
    const selectedDate = createLocalDate(value);
    return day.getDate() === selectedDate.getDate() &&
           day.getMonth() === selectedDate.getMonth() &&
           day.getFullYear() === selectedDate.getFullYear();
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              type="button"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400 dark:text-white" />
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              type="button"
            >
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                type="button"
                className={`
                  p-2 text-sm rounded transition-colors
                  ${!day ? 'invisible' : ''}
                  ${day && isSelectedDate(day)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${day && day.toDateString() === new Date().toDateString() && !isSelectedDate(day)
                    ? 'ring-1 ring-blue-500'
                    : ''
                  }
                `}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>

          {value && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                type="button"
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
