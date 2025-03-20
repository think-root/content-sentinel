
import { useState } from 'react';
import { Clock } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  active: boolean;
}

export function CronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([
    {
      id: '1',
      name: 'Auto Generation',
      description: 'Automatically generates new posts based on trending github repositories',
      schedule: '0 0 * * *',
      active: true
    },
    {
      id: '2',
      name: 'Auto Posting',
      description: 'Posts github repositories to social media',
      schedule: '0 0 * * 0',
      active: false
    }
  ]);
  
  const toggleJobStatus = (id: string) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, active: !job.active } : job
    ));
  };



  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
      <div className="flex items-center mb-6">
        <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cron Jobs</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status (Clickable)</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{job.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{job.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">{job.schedule}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleJobStatus(job.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {job.active ? 'Active' : 'Inactive'}
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
}
