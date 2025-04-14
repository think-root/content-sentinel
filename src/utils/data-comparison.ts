import type { Repository } from '../types';
import type { CronJob } from '../api/index';

export const compareRepositories = (
  newData: {
    repositories: Repository[];
    stats: { all: number; posted: number; unposted: number };
  },
  cachedData: {
    repositories: Repository[];
    stats: { all: number; posted: number; unposted: number };
  }
): { hasChanges: boolean; newCount: number; updatedCount: number } => {
  const statsChanged =
    newData.stats.all !== cachedData.stats.all ||
    newData.stats.posted !== cachedData.stats.posted ||
    newData.stats.unposted !== cachedData.stats.unposted;

  const cachedRepoMap = new Map<number, Repository>();
  cachedData.repositories.forEach(repo => {
    cachedRepoMap.set(repo.id, repo);
  });

  let newCount = 0;
  let updatedCount = 0;

  newData.repositories.forEach(newRepo => {
    const cachedRepo = cachedRepoMap.get(newRepo.id);

    if (!cachedRepo) {
      newCount++;
    } else {
      const isUpdated =
        newRepo.posted !== cachedRepo.posted ||
        newRepo.date_posted !== cachedRepo.date_posted ||
        newRepo.date_added !== cachedRepo.date_added ||
        newRepo.text !== cachedRepo.text ||
        newRepo.url !== cachedRepo.url;

      if (isUpdated) {
        updatedCount++;
      }
    }
  });

  return {
    hasChanges: statsChanged || newCount > 0 || updatedCount > 0,
    newCount,
    updatedCount
  };
};

export const comparePreviews = (
  newData: {
    latestPost?: Repository;
    nextPost?: Repository;
  },
  cachedData: {
    latestPost?: Repository;
    nextPost?: Repository;
  }
): boolean => {
  const latestPostChanged = !areRepositoriesEqual(newData.latestPost, cachedData.latestPost);
  const nextPostChanged = !areRepositoriesEqual(newData.nextPost, cachedData.nextPost);

  return latestPostChanged || nextPostChanged;
};

const areRepositoriesEqual = (
  repo1?: Repository,
  repo2?: Repository
): boolean => {
  if (!repo1 && !repo2) return true;
  if (!repo1 || !repo2) return false;

  return (
    repo1.id === repo2.id &&
    repo1.text === repo2.text &&
    repo1.url === repo2.url &&
    repo1.posted === repo2.posted &&
    repo1.date_added === repo2.date_added &&
    repo1.date_posted === repo2.date_posted
  );
};

export const compareCronJobs = (
  newJobs: CronJob[],
  cachedJobs: CronJob[]
): boolean => {
  if (newJobs.length !== cachedJobs.length) return true;

  const cachedJobsMap = new Map<string, CronJob>();
  cachedJobs.forEach(job => {
    cachedJobsMap.set(job.name, job);
  });

  for (const newJob of newJobs) {
    const cachedJob = cachedJobsMap.get(newJob.name);

    if (!cachedJob ||
        newJob.is_active !== cachedJob.is_active ||
        newJob.schedule !== cachedJob.schedule ||
        newJob.updated_at !== cachedJob.updated_at) {
      return true;
    }
  }

  return false;
};
