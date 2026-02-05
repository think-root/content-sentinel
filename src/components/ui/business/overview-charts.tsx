import { useMemo, useState, useEffect } from 'react';
import { 
  ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../layout/card';
import { Skeleton } from '../common/skeleton';
import { 
  Activity, ArrowUpRight, ArrowDownRight, CalendarPlus, CalendarClock
} from 'lucide-react';
import { type CronJob, type CronJobHistory } from '../../../api/index';
import type { ApiConfig } from '../../../api/api-configs';
import type { TimeRange } from '../../../hooks/useOverviewHistory';
import { useRepositoryTrends } from '../../../hooks/useRepositoryTrends';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface OverviewChartsProps {
  posted: number;
  unposted: number;
  statsLoading?: boolean;
  cronJobs?: CronJob[];
  cronJobsLoading?: boolean;
  apiConfigs?: ApiConfig[];
  apiConfigsLoading?: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  historyData: CronJobHistory[];
  historyLoading: boolean;
}

export function OverviewCharts({
  posted,
  unposted,
  statsLoading = false,
  historyData,
  historyLoading,
  timeRange,
  setTimeRange
}: OverviewChartsProps) {
  // Local state removed, using props from parent hook

  // --- Derived Stats (Memoized) ---

  const [trendSortBy, setTrendSortBy] = useState<'date_added' | 'date_posted'>(() => {
    const saved = localStorage.getItem('repository_trends_sort');
    return (saved === 'date_added' || saved === 'date_posted') ? saved : 'date_added';
  });

  useEffect(() => {
    localStorage.setItem('repository_trends_sort', trendSortBy);
  }, [trendSortBy]);

  const totalRepos = posted + unposted;
  const isMobile = useIsMobile();


  // Chart Data Preparation
  
  // 1. Job Performance (Horizontal Bar)
  const jobPerformanceData = useMemo(() => {
    const stats: Record<string, { name: string; success: number; failed: number; partial: number }> = {};
    historyData.forEach(job => {
      if (!stats[job.name]) stats[job.name] = { name: job.name, success: 0, failed: 0, partial: 0 };
      if (job.status === 1) stats[job.name].success++;
      else if (job.status === 0) stats[job.name].failed++;
      else if (job.status === 2) stats[job.name].partial++; 
    });
    return Object.values(stats);
  }, [historyData]);

  // 2. Timeline Activity (Area Chart)
  const timelineData = useMemo(() => {
    const groupedDetails: Record<string, { date: string; success: number; failed: number; partial: number }> = {};
    
    // Fill in gaps if needed, but for now lets just group existing data
    
    historyData.forEach(job => {
      const dateObj = new Date(job.timestamp);
      // Grouping granularity based on timeRange
      let key = '';
      let displayDate = '';

      if (timeRange === '24h') {
        // Hourly
        key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}-${dateObj.getHours()}`;
        displayDate = `${dateObj.getHours()}:00`;
      } else {
        // Daily
        key = dateObj.toLocaleDateString();
        displayDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }

      if (!groupedDetails[key]) groupedDetails[key] = { date: displayDate, success: 0, failed: 0, partial: 0 };
      
      if (job.status === 1) groupedDetails[key].success++;
      else if (job.status === 0) groupedDetails[key].failed++;
      else if (job.status === 2) groupedDetails[key].partial++;
    });

    return Object.values(groupedDetails);
  }, [historyData, timeRange]);

  // 3. KPI Calculations based on History Range
  const periodStats = useMemo(() => {
    const total = historyData.length;
    const success = historyData.filter(h => h.status === 1).length;
    const failed = historyData.filter(h => h.status === 0).length;
    const partial = historyData.filter(h => h.status === 2).length;

    // Success rate usually counts full success, but depends on business logic. 
    // Let's count partial as 0.5 or just exclude?
    // Usually rate = (success + partial) / total is optimistic, success / total is strict.
    // User wants to see partials, let's keep strict success rate but maybe tooltip explains?
    // Let's stick to strict success for the big number.
    const rate = total > 0 ? (success / total) * 100 : 0;
    
    // Parse logs for business metrics
    let collectedCount = 0;
    let postedCount = 0;

    historyData.forEach(h => {
      // Allow partials to count for metrics if they did something
      if (h.status !== 1 && h.status !== 2) return;

      if (h.name === 'collect') {
        const match = h.output?.match(/collected\s+(\d+)/i) || h.output?.match(/(\d+)\s+repo/i);
        if (match && match[1]) {
          collectedCount += parseInt(match[1], 10);
        }
      } else if (h.name === 'message') {
        // For message, assuming each success/partial run is a post action
        postedCount++;
      }
    });

    return {
      total,
      success,
      failed,
      partial,
      rate: rate.toFixed(1),
      collected: collectedCount,
      posted: postedCount
    };
  }, [historyData]);

  // 4. Repository Tech Trends
  const { trends, loading: trendsLoading, error: trendsError } = useRepositoryTrends(timeRange, true, trendSortBy);

  const isLoading = statsLoading || historyLoading; 


  // Render Helpers
  const CustomTooltip = ({ active, payload, label }: any) => { // Type 'any' for quick recharts tooltip props
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-md shadow-md p-2 text-xs">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="capitalize">{p.name}:</span>
              <span className="font-mono font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Time Range Filter - Moved to top right, no header */}
      <div className="flex justify-center sm:justify-end pb-2">
        <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
          {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '3 Months'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && historyData.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ) : (
        <>
            {/* KPI Cards - Only Dynamic Ones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Repos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Repositories</p>
                    <h3 className="text-3xl font-bold mt-2">{totalRepos}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                {/* Static Stats */}
                <div className="mt-4 flex items-center text-xs text-muted-foreground border-b border-border/50 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span>{posted} posted</span>
                  </div>
                  <span className="mx-2">•</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                    <span>{unposted} pending</span>
                  </div>
                </div>
                {/* Dynamic Period Stats */}
                <div className="flex items-center text-xs font-medium">
                  <span className="text-muted-foreground mr-1">Last {timeRange}:</span>
                   <span className="text-success">+{periodStats.collected} collected</span>
                   <span className="mx-1.5 text-muted-foreground">|</span>
                   <span className="text-primary">+{periodStats.posted} posted</span>
                </div>
              </CardContent>
            </Card>

            {/* Execution Success Rate (Dynamic) */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate ({timeRange})</p>
                    <h3 className="text-3xl font-bold mt-2">{periodStats.rate}%</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${Number(periodStats.rate) > 90 ? 'bg-success/10 text-success' : Number(periodStats.rate) > 70 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                    {Number(periodStats.rate) > 90 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" /> }
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <span className="text-success font-medium">{periodStats.success}</span>&nbsp;success
                    <span className="mx-1">/</span>
                    <span className="text-warning font-medium">{periodStats.partial}</span>&nbsp;partial
                  <span className="mx-1">/</span>
                  <span className="text-destructive font-medium">{periodStats.failed}</span>&nbsp;failed
                </div>
              </CardContent>
              </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Main Trend Chart */}
            <Card className="lg:col-span-2 h-full flex flex-col focus:outline-none focus-visible:outline-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Cron Trends</CardTitle>
                <CardDescription>Job execution trends over time</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                <div className="h-full w-full outline-none [&_*]:outline-none [&_*]:focus:outline-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                          <linearGradient id="colorPartial" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                          </linearGradient>
                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => Math.floor(value).toString()} // Integer only
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                        <Area
                          type="monotone"
                          dataKey="success"
                          stroke="hsl(var(--success))"
                          fillOpacity={1}
                          fill="url(#colorSuccess)"
                        name="Success"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                          dataKey="partial"
                          stroke="hsl(var(--warning))"
                          fillOpacity={1}
                          fill="url(#colorPartial)"
                          name="Partial"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone" 
                        dataKey="failed" 
                        stroke="hsl(var(--destructive))" 
                        fillOpacity={1} 
                        fill="url(#colorFailed)" 
                        name="Failed"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Charts */}
            <div className="flex flex-col h-full">
              {/* Job Performance Breakdown */}
              <Card className="flex-1 flex flex-col focus:outline-none focus-visible:outline-none">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Cron Health</CardTitle>
                    <CardDescription>Job performance breakdown by status</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                   <div className="h-full w-full outline-none [&_*]:outline-none [&_*]:focus:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobPerformanceData} layout="vertical" barSize={24} margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={60} 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          content={<CustomTooltip />} 
                          cursor={{ fill: 'transparent' }}
                        />
                        <Bar 
                          dataKey="success" 
                          stackId="a" 
                          fill="hsl(var(--success))" 
                          radius={[4, 0, 0, 4]} 
                          name="Success" 
                        />
                        <Bar 
                            dataKey="partial"
                            stackId="a"
                            fill="hsl(var(--warning))"
                            name="Partial"
                          />
                          <Bar 
                          dataKey="failed" 
                          stackId="a" 
                          fill="hsl(var(--destructive))" 
                          radius={[0, 4, 4, 0]} 
                          name="Failed" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

            {/* Repository Tech Trends */}
            <Card className="flex flex-col focus:outline-none focus-visible:outline-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">Repository Tech Trends</CardTitle>
                  <CardDescription>
                    Top technologies by {trendSortBy === 'date_added' ? 'date added' : 'date posted'}
                  </CardDescription>
                </div>
                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setTrendSortBy('date_added')}
                    className={`p-1.5 rounded-md transition-all ${trendSortBy === 'date_added'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    title="Sort by Date Added"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span className="sr-only">Date Added</span>
                  </button>
                  <button
                    onClick={() => setTrendSortBy('date_posted')}
                    className={`p-1.5 rounded-md transition-all ${trendSortBy === 'date_posted'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    title="Sort by Date Posted"
                  >
                    <CalendarClock className="h-4 w-4" />
                    <span className="sr-only">Date Posted</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="min-h-[300px]">
                {trendsLoading && trends.length === 0 ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : trendsError ? (
                  <div className="h-full w-full flex items-center justify-center text-destructive">
                    <p className="text-sm font-medium">Failed to load trends</p>
                  </div>
                ) : trends.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No technology trends found for this period</p>
                  </div>
                ) : (
                  <div className="h-[400px] w-full outline-none [&_*]:outline-none [&_*]:focus:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trends.slice(0, 15)}
                        layout="vertical"
                              margin={{ top: 5, right: 30, left: isMobile ? 10 : 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis
                          type="number"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          dataKey="keyword"
                          type="category"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                                width={isMobile ? 80 : 100}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-popover border border-border rounded-md shadow-md p-2 text-xs">
                                  <p className="font-semibold mb-1">{label}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Count:</span>
                                    <span className="font-mono font-bold text-foreground">{payload[0].value}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.9}
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

        </>
      )}
    </div>
  );
}
