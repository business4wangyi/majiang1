# Usage

## Quick Start

Run full scan:
```bash
bash <skill-root>/scripts/standards_guard.sh scan
```

Run task gate:
```bash
bash <skill-root>/scripts/standards_guard.sh gate
```

Report output:
`<project-root>/logs/standards-governance-report.md`

Optional custom report path:
```bash
STANDARDS_GUARD_REPORT=<project-root>/logs/standards-governance/<date>-<branch>.md \
bash <skill-root>/scripts/standards_guard.sh scan
```

## Task Integration

For every new task:
1. Before implementation, run `gate` as pre-check.
2. Implement and test changes.
3. Run `gate` as post-check.
4. If decision is `fail`, fix issues first; do not submit.

## Refactor Collaboration

Use this governance skill as the controller and `code-refactoring` as the executor:
1. Governance skill identifies violations and rule basis.
2. Refactoring skill applies minimal structural fixes.
3. Governance skill re-runs `gate` until `pass`.

## Suggested Automation Cadence

1. Task-level: run `gate` after each task completion.
2. Daily-level: run `scan` once per day to monitor backlog.
