import type { ScheduledJob, Scheduler } from "./types";

export class IntervalScheduler implements Scheduler {
  private readonly jobs = new Map<string, ScheduledJob>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  register(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Scheduled job already registered: ${job.id}`);
    }

    this.jobs.set(job.id, job);
  }

  start(): void {
    for (const job of this.jobs.values()) {
      if (this.timers.has(job.id)) {
        continue;
      }

      const timer = setInterval(() => {
        void job.run();
      }, job.intervalMs);

      this.timers.set(job.id, timer);
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }

    this.timers.clear();
  }
}
