# Agent handoff

Start with [the current progress log](progress-2026-11-21.md). It records the
active objective, completed changes, verification evidence, running commands and
remaining work so another agent can resume after a usage limit or server restart.

The active dependency migration has a separate [source and publication plan](issue-262-dependency-forks.md).

Keep this directory current during ongoing work:

1. Record meaningful changes and results in the dated progress log.
2. Before a handoff, update its **Resume here** section and pending checks.
3. When starting another day, create a new dated log and update this link.
4. Record actual exit codes and coverage limits. Keep earlier results dated;
   never turn pending work or historical evidence into a passing claim.
5. Keep credentials, tokens, environment contents and private runtime data out
   of these files. Link to sanitized local artifacts when useful.

The repository's [AGENTS.md](../../AGENTS.md) still governs implementation.
This handoff is a work log, not additional authorization or a replacement for
current source, tracker and process inspection.
