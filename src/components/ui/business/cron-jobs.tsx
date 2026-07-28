import { useState, useEffect, useRef } from 'react';
import { updateCronStatus, updateCronSchedule, CronJob } from '@/api/index';
import { X, Pencil, Check, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/date-format';
import { getApiSettings } from '@/utils/api-settings';
import { normalizeTimezoneForIntl } from '@/utils/timezone-mapper';
import { toast } from '@/components/ui/common/toast-config';
import cronstrue from 'cronstrue';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,  
} from '@/components/ui/base/table';
import { Switch } from '@/components/ui/base/switch';
import { Button } from '@/components/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/base/input';
import { Skeleton } from '@/components/ui/common/skeleton';

const toastOptions = {
  duration: 4000,
};

interface CronJobsProps {
  jobs: CronJob[];
  loading: boolean;
  isApiReady?: boolean;
  onJobsUpdate?: (jobs: CronJob[]) => void;
}

// Дзеркалить логіку бекенду (content-maestro/internal/validation/cron.go),
// щоб фронтенд не був суворішим за сервер: підтримує списки (`,`),
// діапазони (`-`), кроки (`*/n`, `a-b/n`) у кожному полі.
const isNumber = (value: string): boolean => /^\d+$/.test(value);

const isInRange = (value: string, min: number, max: number): boolean => {
  const num = Number(value);
  return isNumber(value) && num >= min && num <= max;
};

const isValidRange = (part: string, min: number, max: number): boolean => {
  const [start, end] = part.split('-');
  if (start === undefined || end === undefined) return false;
  if (!isNumber(start) || !isNumber(end)) return false;
  const startNum = Number(start);
  const endNum = Number(end);
  return startNum >= min && endNum <= max && startNum <= endNum;
};

const isValidStep = (part: string, min: number, max: number): boolean => {
  const segments = part.split('/');
  if (segments.length !== 2) return false;
  const [base, step] = segments;
  if (!isNumber(step)) return false;
  if (base === '*') return true;
  return isValidRange(base, min, max);
};

const isValidCronField = (field: string, min: number, max: number): boolean => {
  if (field === '*') return true;

  return field.split(',').every((part) => {
    if (part.includes('/')) return isValidStep(part, min, max);
    if (part.includes('-')) return isValidRange(part, min, max);
    return isInRange(part, min, max);
  });
};

const validateCronExpression = (cron: string): boolean => {
  const fields = cron.trim().split(/\s+/).filter(Boolean);
  if (fields.length !== 5 && fields.length !== 6) return false;

  const ranges: Array<[number, number]> = [
    [0, 59], // minute
    [0, 23], // hour
    [1, 31], // day of month
    [1, 12], // month
    [0, 6],  // day of week
  ];

  return ranges.every(([min, max], i) => isValidCronField(fields[i], min, max));
};

// Current UTC→timezone offset in minutes (DST-aware for the current date).
const getTimezoneOffsetMinutes = (timezone: string): number => {
  const now = new Date();
  const asUTC = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const asTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return Math.round((asTz.getTime() - asUTC.getTime()) / 60000);
};

// Shift an (hour, minute) pair by an offset, wrapping within a single day.
const shiftToLocal = (hour: number, minute: number, offsetMinutes: number) => {
  const total = (((hour * 60 + minute + offsetMinutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

// Convert the minute+hour fields of a cron expression to local time, shifting
// EVERY value in the hour field (single values, comma lists and ranges), not
// just the first one. Returns null when the fields can't be reliably localized
// (steps, wildcards, multi-value minutes, or ranges that would cross midnight).
const localizeCronTimeFields = (
  minuteField: string,
  hourField: string,
  offsetMinutes: number
): { minute: string; hour: string } | null => {
  if (!isNumber(minuteField)) return null;
  if (hourField === '*' || hourField.includes('/')) return null;

  const minute = Number(minuteField);
  const shiftedHours: string[] = [];
  let shiftedMinute: number | null = null;

  for (const token of hourField.split(',')) {
    if (token.includes('-')) {
      const [start, end] = token.split('-');
      if (!isNumber(start) || !isNumber(end)) return null;
      const a = shiftToLocal(Number(start), minute, offsetMinutes);
      const b = shiftToLocal(Number(end), minute, offsetMinutes);
      // A shifted range that wraps past midnight would reorder its bounds.
      if (a.hour > b.hour) return null;
      shiftedMinute ??= a.minute;
      shiftedHours.push(`${a.hour}-${b.hour}`);
    } else {
      if (!isNumber(token)) return null;
      const s = shiftToLocal(Number(token), minute, offsetMinutes);
      shiftedMinute ??= s.minute;
      shiftedHours.push(String(s.hour));
    }
  }

  return { minute: String(shiftedMinute ?? minute), hour: shiftedHours.join(',') };
};

const getHumanReadableCron = (cronExpression: string): string => {
  try {
    const { timezone } = getApiSettings();
    const normalizedTimezone = normalizeTimezoneForIntl(timezone);
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');

    if (hour === '*' || minute === '*') {
      return cronstrue.toString(cronExpression, { use24HourTimeFormat: true, verbose: true });
    }

    const offsetMinutes = getTimezoneOffsetMinutes(normalizedTimezone);
    const localized = localizeCronTimeFields(minute, hour, offsetMinutes);
    const utcText = cronstrue.toString(cronExpression, { use24HourTimeFormat: true });

    if (!localized) {
      // Can't reliably localize (steps, wildcards, midnight-crossing ranges).
      return `${utcText} (UTC)`;
    }

    const localCron = `${localized.minute} ${localized.hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    const localText = cronstrue.toString(localCron, { use24HourTimeFormat: true });

    return `${utcText} (UTC) / ${localText} (${timezone})`;
  } catch {
    return 'Invalid cron expression';
  }
};

export const CronJobs = ({ jobs, loading, isApiReady = true, onJobsUpdate }: CronJobsProps) => {
  const [localJobs, setLocalJobs] = useState<CronJob[]>(jobs);
  const [editingSchedule, setEditingSchedule] = useState<{name: string; schedule: string} | null>(null);
  const [scheduleInput, setScheduleInput] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSchedule) {
      setTimeout(() => {
        scheduleInputRef.current?.focus();
      }, 50);
    }
  }, [editingSchedule]);

  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);

  const toggleJobStatus = async (name: string, currentStatus: boolean) => {
    try {
      const updatedJobs = localJobs.map(job =>
        job.name === name
          ? {
              ...job,
              is_active: !currentStatus,
              updated_at: new Date().toISOString()
            }
          : job
      );

      setLocalJobs(updatedJobs);
      if (onJobsUpdate) onJobsUpdate(updatedJobs);

      await updateCronStatus(name, !currentStatus);
      toast.success(`Job "${name}" ${!currentStatus ? 'activated' : 'deactivated'} successfully`, {
        ...toastOptions,
        id: `status-update-${name}`
      });
    } catch {
      setLocalJobs(prevJobs => {
        const revertedJobs = prevJobs.map(job =>
          job.name === name
            ? { ...job, is_active: currentStatus }
            : job
        );
        if (onJobsUpdate) onJobsUpdate(revertedJobs);
        return revertedJobs;
      });
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
      const updatedJobs = localJobs.map(job =>
        job.name === editingSchedule.name
          ? {
              ...job,
              schedule: scheduleInput,
              updated_at: new Date().toISOString()
            }
          : job
      );

      setLocalJobs(updatedJobs);
      if (onJobsUpdate) onJobsUpdate(updatedJobs);

      await updateCronSchedule(editingSchedule.name, scheduleInput);
      setEditingSchedule(null);
      setScheduleError(null);
      toast.success(`Schedule for "${editingSchedule.name}" updated successfully`, {
        ...toastOptions,
        id: `schedule-update-${editingSchedule.name}`
      });
    } catch {
      setLocalJobs(prevJobs => {
        const revertedJobs = prevJobs.map(job =>
          job.name === editingSchedule.name
            ? { ...job, schedule: previousSchedule }
            : job
        );
        if (onJobsUpdate) onJobsUpdate(revertedJobs);
        return revertedJobs;
      });
      toast.error('Failed to connect to Content Maestro API', {
        ...toastOptions,
        id: 'content-maestro-error'
      });
    }
  };

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/6">Name</TableHead>
          <TableHead className="w-2/6">Last Updated</TableHead>
          <TableHead className="w-2/6">Schedule</TableHead>
          <TableHead className="w-1/6 text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localJobs.length > 0 ? (
          localJobs.map((job) => (
            <TableRow key={job.name} className="group">
              <TableCell className="font-medium">{job.name}</TableCell>
              <TableCell>
                <div className="overflow-hidden">
                  <p className="whitespace-normal break-words">{formatDate(job.updated_at)}</p>
                </div>
              </TableCell>
              <TableCell className="font-mono">
                {editingSchedule?.name === job.name ? (
                  <div className="space-y-2 w-full min-h-[36px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-[180px] flex items-center space-x-2">
                        <Input
                          type="text"
                          value={scheduleInput}
                          autoFocus
                          onChange={(e) => handleScheduleChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              validateAndSaveSchedule();
                            } else if (e.key === 'Escape') {
                              setEditingSchedule(null);
                              setScheduleError(null);
                            }
                          }}
                          variant={scheduleError ? 'error' : 'default'}
                          placeholder="Cron schedule"
                          ref={scheduleInputRef}
                        />
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={validateAndSaveSchedule}
                            className="h-8 w-8 p-0 text-success hover:text-success/80"
                            title="Save schedule"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSchedule(null);
                              setScheduleError(null);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {scheduleError && (
                      <div className="flex items-center text-xs text-destructive">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingSchedule(job)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit schedule"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={job.is_active}
                  onCheckedChange={() => toggleJobStatus(job.name, job.is_active)}
                  className="data-[state=checked]:bg-success mt-[5px]"
                  title={job.is_active ? 'Click to turn off' : 'Click to turn on'}
                />
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No data available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {localJobs.length > 0 ? (
        localJobs.map((job, index) => (
          <div key={job.name} className={`bg-card border ${index !== localJobs.length - 1 ? 'border-b' : ''} p-4 group hover:bg-muted/50`}>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Name</div>
                <div className="text-sm font-medium">{job.name}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Last Updated</div>
                <div className="text-sm">
                  <p className="whitespace-normal break-words">{formatDate(job.updated_at)}</p>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Schedule</div>
                <div>
                  {editingSchedule?.name === job.name ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          value={scheduleInput}
                          autoFocus
                          onChange={(e) => handleScheduleChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              validateAndSaveSchedule();
                            } else if (e.key === 'Escape') {
                              setEditingSchedule(null);
                              setScheduleError(null);
                            }
                          }}
                          variant={scheduleError ? 'error' : 'default'}
                          placeholder="Cron schedule"
                          ref={scheduleInputRef}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={validateAndSaveSchedule}
                          className="h-8 w-8 p-0 text-success hover:text-success/80"
                          title="Save schedule"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSchedule(null);
                            setScheduleError(null);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {scheduleError && (
                        <div className="flex items-center text-xs text-destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {scheduleError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm font-mono mr-2" title={getHumanReadableCron(job.schedule)}>
                        {job.schedule}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditingSchedule(job)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit schedule"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Status</div>
                <div>
                  <Switch
                    checked={job.is_active}
                    onCheckedChange={() => toggleJobStatus(job.name, job.is_active)}
                    className="data-[state=checked]:bg-success mt-[5px]"
                    title={job.is_active ? 'Click to turn off' : 'Click to turn on'}
                  />
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No data available
        </div>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/6">Name</TableHead>
          <TableHead className="w-2/6">Last Updated</TableHead>
          <TableHead className="w-2/6">Schedule</TableHead>
          <TableHead className="w-1/6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-1/4" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderApiNotReady = () => (
    <div className="text-center text-muted-foreground">
      Data could not be loaded because API keys are not configured
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M4 12h16M12 4v16M6.5 6.5l11 11M17.5 6.5l-11 11" />
          </svg>
          Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isApiReady ? (
          renderApiNotReady()
        ) : loading ? (
          renderLoadingState()
        ) : (
          <>
            <div className="hidden md:block">
              {renderDesktopView()}
            </div>
            <div className="md:hidden block">
              {renderMobileView()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};