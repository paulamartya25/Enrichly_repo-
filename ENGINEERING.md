# Engineering Notes

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Next.js 14 Frontend            │
│   (Vercel — App Router + TailwindCSS)   │
└────────────────┬────────────────────────┘
                 │ REST + SSE
┌────────────────▼────────────────────────┐
│         ASP.NET Core 8 API              │
│  (Render — Minimal APIs + Swagger)      │
│  ┌──────────────────────────────────┐   │
│  │  Background Worker (SKIP LOCKED) │   │
│  │  Stale-Job Reaper (60s interval) │   │
│  └──────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         PostgreSQL 16                    │
│  (Render Managed DB)                    │
└─────────────────────────────────────────┘
```

The backend API and background worker run in the **same process** (hosted as `BackgroundService`). Scaling is achieved by running multiple replicas — the queue mechanism prevents duplicate job execution across replicas.

---

## How Jobs Are Picked Up and Executed

The worker uses **PostgreSQL's `SELECT FOR UPDATE SKIP LOCKED`** as its queue mechanism. No Redis or external message broker is needed.

```sql
-- Worker atomically claims one execution per loop iteration
BEGIN;
SELECT id FROM executions
WHERE status = 'queued'
  AND (locked_until IS NULL OR locked_until < NOW())
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- If found:
UPDATE executions
SET status = 'running',
    worker_id = @workerId,
    locked_until = NOW() + INTERVAL '30 seconds',
    started_at = NOW()
WHERE id = @executionId;
COMMIT;
```

`SKIP LOCKED` means competing workers each claim a **different** row atomically. It's impossible for two workers to double-pick the same execution.

Each worker runs `WORKER_CONCURRENCY` (default 3) tasks concurrently using `Task.WhenAny`.

---

## How Concurrency Is Handled

1. **Worker-level**: `SELECT FOR UPDATE SKIP LOCKED` — database-level mutual exclusion.
2. **Heartbeat**: While a job runs, the worker updates `locked_until = NOW() + 30s` every 15 seconds. If the worker crashes, the heartbeat stops.
3. **Stale-job reaper**: Runs every 60 seconds. Re-queues any execution where `status = 'running' AND locked_until < NOW()`. This recovers from crashed workers.
4. **Idempotent trigger**: `POST /api/jobs/{id}/trigger` checks for an existing `queued` or `running` execution before creating a new one. Double-clicks and race conditions both result in exactly one execution.

---

## Retries and Failures

When an execution fails:
1. Record the error message and logs on the failed execution.
2. Check: `attempt < job.MaxRetries`?
   - **Yes**: Insert a new `Execution` row with `attempt = attempt + 1`, `triggered_by = 'retry'`, `status = 'queued'`. The delay is `RetryDelaySeconds` — implemented by setting `created_at = NOW() + delay` (the worker only picks up rows whose `created_at <= NOW()`).
   - **No**: The execution stays `failed`. The user can manually retry from the UI.

Retry attempts are visible in the execution history with the `retry` badge.

---

## State Machine

```
         trigger/retry
            ↓
         [queued]
            ↓ worker picks up
         [running]
           ↙   ↘
    [succeeded] [failed]
                   ↓ (if retries left, auto)
                [queued] (new execution)

    [queued] → [cancelled]  (manual)
```

Invalid transitions (e.g., cancelling a `running` or `succeeded` execution) return **400 Bad Request**.

---

## Database Decisions

- **JSONB for job config**: Job configurations vary by type (HTTP has URL/method/headers/body, webhook has URL only). JSONB avoids a wide sparse table and allows flexible evolution.
- **Executions as append-only log**: Executions are never updated in-place (except status/heartbeat fields). Each retry is a new row — full audit trail.
- **`locked_until` for heartbeats**: Simpler than a separate heartbeat table. One column on the execution row captures both "this is running" and "it's still alive".
- **Indexes**: `executions(status)` for the worker query, `executions(job_id)` for history lookups, `jobs(user_id)` for authorization filtering.
- **No soft deletes**: Jobs are hard-deleted. Their execution history is cascade-deleted. Simpler and appropriate for this tool.

---

## Product Decisions

1. **No-op job type**: Included as a test/debugging job type — useful for verifying the queue, retry, and concurrency mechanics work without needing an external API.
2. **Cron scheduling**: Supported via `CronExpression` field (Cronos library for parsing). The scheduler checks every 30s for jobs due to run.
3. **Server-Sent Events for real-time**: Simpler than WebSockets for unidirectional status updates. Works well with Vercel's edge network.
4. **Logs as plain text**: Stored in the `executions.logs` column (TEXT). For a production system I'd stream logs to a service like Loki or CloudWatch; for this scale, DB storage is fine.
5. **Single-process worker**: The background worker runs in the API process. In production you'd separate it into a dedicated worker service for independent scaling, but the SKIP LOCKED mechanism already supports that — you'd just run more replicas.

---

## Known Limitations

- **No WebSocket support**: SSE is one-directional. The frontend polls for some data alongside SSE. A full WebSocket implementation would be cleaner for truly real-time UIs.
- **In-memory SSE channel**: The SSE event bus uses an in-memory `Channel<T>`. With multiple API replicas, events from one replica don't propagate to others. Fix: use PostgreSQL `LISTEN/NOTIFY` or Redis pub/sub as the bus.
- **Cron scheduling drift**: The scheduler checks every 30s, so jobs may run up to 30s late. Acceptable for most use cases; for precise scheduling, use a dedicated cron service.
- **No log streaming**: Logs are stored as a single blob after execution completes. Live log streaming during execution would require a different storage approach.
- **No rate limiting**: The API has no rate limiting on job triggers. A bad actor could flood the queue. Fix: add per-user rate limiting with a sliding window.
- **Render free tier cold starts**: The Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30s. The worker cannot run cron jobs reliably on free tier — use a paid plan or an external cron trigger (Render Cron Jobs).

---

## What I Would Improve With More Time

1. **PostgreSQL LISTEN/NOTIFY** for SSE fanout across replicas (replace in-memory channel)
2. **Separate worker service** as a distinct deployable unit with its own replica count
3. **Log streaming** via WebSockets during active executions
4. **Metrics dashboard** — execution counts, success rates, p95 latency per job (using a time-series approach)
5. **Email/Slack notifications** on job failure
6. **Job versioning** — track config changes and which config version was used for each execution
7. **Rate limiting** per user on the trigger endpoint
8. **OAuth** (GitHub, Google) for easier registration
