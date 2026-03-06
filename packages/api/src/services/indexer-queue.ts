/**
 * In-memory indexing job queue — wraps index-wallet-core for the admin API.
 * Jobs are processed sequentially (one at a time) to avoid overloading HyperSync.
 */
import { indexWallet } from '@chaincred/indexer/index-wallet-core';

export interface IndexJob {
  id: string;
  address: string;
  status: 'queued' | 'indexing' | 'done' | 'failed';
  progress: string;
  txCount: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

const jobs = new Map<string, IndexJob>();
const queue: string[] = []; // job IDs waiting to be processed
let processing = false;

let jobCounter = 0;

/** Enqueue a wallet for indexing. Returns the job immediately. */
export function enqueueWallet(address: string): IndexJob {
  const normalized = address.toLowerCase();

  // Check if there's already an active job for this address
  for (const job of jobs.values()) {
    if (job.address === normalized && (job.status === 'queued' || job.status === 'indexing')) {
      return job;
    }
  }

  const id = `job_${++jobCounter}_${Date.now()}`;
  const job: IndexJob = {
    id,
    address: normalized,
    status: 'queued',
    progress: 'Waiting in queue...',
    txCount: 0,
    startedAt: Date.now(),
  };

  jobs.set(id, job);
  queue.push(id);

  // Start processing if idle
  if (!processing) {
    processNext();
  }

  return job;
}

/** Get all jobs (most recent first). */
export function getQueue(): IndexJob[] {
  return [...jobs.values()].reverse();
}

/** Process the next queued job. */
async function processNext(): Promise<void> {
  if (queue.length === 0) {
    processing = false;
    return;
  }

  processing = true;
  const jobId = queue.shift()!;
  const job = jobs.get(jobId);
  if (!job) {
    processNext();
    return;
  }

  job.status = 'indexing';
  job.progress = 'Starting...';

  try {
    const result = await indexWallet(job.address, (msg) => {
      job.progress = msg;
    });

    job.status = 'done';
    job.txCount = result.totalTxs;
    job.completedAt = Date.now();
    job.progress = `Done: ${result.totalTxs} txs across ${result.chainsActive} chains`;
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : String(err);
    job.completedAt = Date.now();
    job.progress = `Failed: ${job.error}`;
  }

  // Process next in queue
  processNext();
}
