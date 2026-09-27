export type ScheduledJob = {
  id: string;
  intervalMs: number;
  run: () => Promise<void> | void;
};

export type Scheduler = {
  register: (job: ScheduledJob) => void;
  start: () => void;
  stop: () => void;
};
