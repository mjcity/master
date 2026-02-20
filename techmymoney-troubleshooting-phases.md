# TechMyMoney Website Troubleshooting Phases

## Phase 0 — Freeze changes
1. Stop DNS edits until app health is confirmed.
2. Keep DNS fixed to known target while diagnosing.

## Phase 1 — Identify failure mode
3. Confirm visible symptom (timeout, TLS, DB error, login failure).
4. Classify likely layer: web server, PHP, DB, DNS, TLS, plugin/theme, resource exhaustion.

## Phase 2 — Server health checks
5. Verify service states: Apache/Nginx, PHP-FPM, DB service.
6. Review logs: web error log, PHP-FPM log, WP/debug logs.
7. Check resource pressure: disk, inodes, memory/OOM, CPU load.

## Phase 3 — WordPress integrity
8. Validate wp-config DB settings and table prefix.
9. Test DB connectivity from host.
10. Confirm WP tables/content are present.
11. If needed, isolate plugin/theme crash path.

## Phase 4 — Network + TLS + routing
12. Verify vhost/docroot mapping.
13. Validate certificate and chain for both root and www.
14. Check redirect rules for loops/mismatch.

## Phase 5 — Safety discipline
15. Snapshot/backup before risky edits.
16. Apply one change at a time, verify each step.
17. Keep timestamped change log.

## Phase 6 — Validation
18. Validate DNS from authoritative + public resolvers.
19. Test homepage, key pages, and wp-admin.
20. Observe stability for 10–15 minutes post-fix.

## Phase 7 — Post-incident hardening
21. Remove temporary hacks.
22. Add/verify monitoring + alerts.
23. Write root-cause + prevention notes.

## Incident Pitfalls & Lessons (2026-02-17)
- Rapid DNS switching caused confusion and stale-cache symptoms.
- Browser tabs can show stale network errors after DNS flips.
- Authoritative DNS checks are required before conclusions.
- Rollbacks must be explicit and verified on all authoritative nameservers.
- Activity logs may show “changed” events but not old/new values inline.
- Keep backups/snapshots before each risky infrastructure edit.
- Keep one canonical incident log with timestamps and what changed.
