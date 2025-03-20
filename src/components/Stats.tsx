import { CircleOff, CheckCircle, Database } from 'lucide-react';

interface StatsProps {
  total: number;
  posted: number;
  unposted: number;
}

export function Stats({ total, posted, unposted }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-semibold text-blue-500">{total}</p>
          </div>
          <Database className="h-8 w-8 text-blue-500" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posted</p>
            <p className="text-2xl font-semibold text-green-600">{posted}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unposted</p>
            <p className="text-2xl font-semibold text-orange-600">{unposted}</p>
          </div>
          <CircleOff className="h-8 w-8 text-orange-500" />
        </div>
      </div>
    </div>
  );
}