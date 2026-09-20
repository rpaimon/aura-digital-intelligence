# Job Watchdog v1 Changelog

- Recover stale processing jobs automatically after 30 minutes.
- Respect each job's existing `max_attempts` limit.
- Increment research/fact-check attempt counters correctly.
- Prioritize queued article writing at the beginning of scheduled cycles.
- Add `staleJobsRecovered` execution diagnostics.
- Preserve Fact Check v7, Originality Guard v1, Quality Gate, and Publishing Engine behavior.
- No database migration required.
