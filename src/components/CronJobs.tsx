import { useState, useEffect } from 'react';
import { updateCronStatus, updateCronSchedule, CronJob } from '../api/index';
import { X, Pencil, Check, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/date-format';
import { getApiSettings } from '../utils/api-settings';
import { toast, ToastOptions } from 'react-hot-toast';
import cronstrue from 'cronstrue';

const toastOptions: ToastOptions = {
  duration: 4000,
};

interface CronJobsProps {
  jobs: CronJob[];
  loading: boolean;
  onUpdate?: () => void;
}

const validateCronExpression = (cron: string): boolean => {
  if (!cron.trim()) return false;
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|(\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))) (\*|([0-9]|1[0-9]|2[0-3])|(\*\/([0-9]|1[0-9]|2[0-3]))) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|(\*\/([1-9]|1[0-9]|2[0-9]|3[0-1]))) (\*|([1-9]|1[0-2])|(\*\/([1-9]|1[0-2]))) (\*|([0-6])|(\*\/([0-6])))$/;
  return cronRegex.test(cron);
};

const getHumanReadableCron = (cronExpression: string): string => {
  try {
    const { timezone } = getApiSettings();
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');

    if (hour === '*' || minute === '*') {
      return cronstrue.toString(cronExpression, { use24HourTimeFormat: true, verbose: true });
    }

    const utcDate = new Date();
    utcDate.setUTCHours(parseInt(hour));
    utcDate.setUTCMinutes(parseInt(minute));

    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    const localHour = localDate.getHours();
    const localMinute = localDate.getMinutes();

    const localCron = `${localMinute} ${localHour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    const utcText = cronstrue.toString(cronExpression, { use24HourTimeFormat: true });
    const localText = cronstrue.toString(localCron, { use24HourTimeFormat: true });

    return `${utcText} (UTC) / ${localText} (${timezone})`;
  } catch {
    return 'Invalid cron expression';
  }
};

export function CronJobs({ jobs, loading, onUpdate }: CronJobsProps) {
  const [localJobs, setLocalJobs] = useState<CronJob[]>(jobs);
  const [editingSchedule, setEditingSchedule] = useState<{name: string; schedule: string} | null>(null);
  const [scheduleInput, setScheduleInput] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);

  const toggleJobStatus = async (name: string, currentStatus: boolean) => {
    try {
      setLocalJobs(prevJobs => 
        prevJobs.map(job => 
          job.name === name 
            ? {
                ...job,
                is_active: !currentStatus,
                updated_at: new Date().toISOString()
              }
            : job
        )
      );

      await updateCronStatus(name, !currentStatus);
      if (onUpdate) onUpdate();
    } catch {
      setLocalJobs(prevJobs => 
        prevJobs.map(job => 
          job.name === name 
            ? { ...job, is_active: currentStatus }
            : job
        )
      );
      toast.error('Failed to connect to Content Maestro API', {
        ...toastOptions,
        id: 'content-maestro-error'
      });
    }
  };

  const startEditingSchedule = (job: CronJob) => {
    setEditingSchedule({ name: job.name, schedule: job.schedule });
    setScheduleInput(job.schedule);
    setScheduleError(null);
  };

  const handleScheduleChange = (value: string) => {
    setScheduleInput(value);
  };

  const validateAndSaveSchedule = async () => {
    if (!editingSchedule) return;
    
    if (!scheduleInput.trim()) {
      setScheduleError('Schedule cannot be empty');
      return;
    }
    
    if (!validateCronExpression(scheduleInput)) {
      setScheduleError('Invalid cron expression format');
      return;
    }

    const previousSchedule = editingSchedule.schedule;

    try {
      setLocalJobs(prevJobs => 
        prevJobs.map(job => 
          job.name === editingSchedule.name 
            ? {
                ...job,
                schedule: scheduleInput,
                updated_at: new Date().toISOString()
              }
            : job
        )
      );
      
      await updateCronSchedule(editingSchedule.name, scheduleInput);
      setEditingSchedule(null);
      setScheduleError(null);
      if (onUpdate) onUpdate();
    } catch {
      setLocalJobs(prevJobs => 
        prevJobs.map(job => 
          job.name === editingSchedule.name 
            ? { ...job, schedule: previousSchedule }
            : job
        )
      );
      toast.error('Failed to connect to Content Maestro API', {
        ...toastOptions,
        id: 'content-maestro-error'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 relative">
      <div className="flex items-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2">
          <path d="M4 12h16M12 4v16M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cron Jobs</h2>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        Schedule and Status columns are interactive and can be modified
      </p>

      {loading ? (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Last Updated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Last Updated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Schedule</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Status</th>
                </tr>
              </thead>
                {localJobs.length > 0 ? (
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {localJobs.map((job) => (
                      <tr key={job.name} className="group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{job.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="overflow-hidden">
                            <p className="whitespace-normal break-words">{formatDate(job.updated_at)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                          {editingSchedule?.name === job.name ? (
                            <div className="space-y-2 w-full min-h-[36px]">
                              <div className="flex items-center space-x-2">
                                <div className="w-[180px] flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={scheduleInput}
                                    onChange={(e) => handleScheduleChange(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        validateAndSaveSchedule();
                                      }
                                    }}
                                    className={`w-full px-2 py-1 rounded border ${scheduleError
                                      ? 'border-red-300 dark:border-red-600'
                                      : 'border-gray-300 dark:border-gray-600'
                                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none`}
                                    placeholder="Cron schedule"
                                  />
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={validateAndSaveSchedule}
                                      className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                      title="Save schedule"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingSchedule(null);
                                        setScheduleError(null);
                                      }}
                                      className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {scheduleError && (
                                <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {scheduleError}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center min-h-[36px]">
                              <span className="mr-2" title={getHumanReadableCron(job.schedule)}>
                                {job.schedule}
                              </span>
                              <button
                                onClick={() => startEditingSchedule(job)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit schedule"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleJobStatus(job.name, job.is_active)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${job.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            title={job.is_active ? 'Click to turn off' : 'Click to turn on'}
                          >
                            {job.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-6 py-4">
                        <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                          No data available
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )}
            </table>
          </div>
          
          <div className="md:hidden block">
              {localJobs.length > 0 ? (
                localJobs.map((job, index) => (
                  <div key={job.name} className={`bg-white dark:bg-gray-800 ${index !== localJobs.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} p-4 group hover:bg-gray-50 dark:hover:bg-gray-750`}>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</span>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{job.name}</div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Updated</span>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">
                          <p className="whitespace-normal break-words">{formatDate(job.updated_at)}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Schedule</span>
                        <div className="mt-1">
                          {editingSchedule?.name === job.name ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={scheduleInput}
                                  onChange={(e) => handleScheduleChange(e.target.value)}
                                  className={`flex-1 px-2 py-1 rounded border ${scheduleError
                                    ? 'border-red-300 dark:border-red-600'
                                    : 'border-gray-300 dark:border-gray-600'
                                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none`}
                                  placeholder="Cron schedule"
                                />
                                <button
                                  onClick={validateAndSaveSchedule}
                                  className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                  title="Save schedule"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSchedule(null);
                                    setScheduleError(null);
                                  }}
                                  className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              {scheduleError && (
                                <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {scheduleError}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-white font-mono mr-2" title={getHumanReadableCron(job.schedule)}>
                                {job.schedule}
                              </span>
                              <button
                                onClick={() => startEditingSchedule(job)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit schedule"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</span>
                        <div className="mt-1">
                          <button
                            onClick={() => toggleJobStatus(job.name, job.is_active)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${job.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            title={job.is_active ? 'Click to turn off' : 'Click to turn on'}
                          >
                            {job.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No data available
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
