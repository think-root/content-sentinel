
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
        <div className="md:block hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-3/6">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Schedule</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Status (Clickable)</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{job.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="overflow-hidden">
                      <p className="whitespace-normal break-words">{job.description}</p>
                    </div>
                  </td>
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
        
        <div className="md:hidden block">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cron Jobs</span>
          </div>
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</span>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">{job.name}</div>
              </div>
              
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</span>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">
                  <p className="whitespace-normal break-words">{job.description}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Schedule</span>
                <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{job.schedule}</div>
              </div>
              
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</span>
                <div className="mt-1">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
