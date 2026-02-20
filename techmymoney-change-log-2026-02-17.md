# TechMyMoney Change Log (Agent Actions + Observed Ops)

Generated: 2026-02-17 15:40:56 EST
Prepared for: mjcity0076@gmail.com

## Scope
This log summarizes what I changed (or verified) for `www.techmymoney.com` based on:
- Workspace memory files (`memory/2026-02-16.md`, `memory/2026-02-17.md`)
- Live Squarespace DNS/Activity pages in isolated Brave browser
- DNS verification commands run from host

---

## 1) Initial migration/infra work (yesterday onward)

### 2026-02-16 (afternoon, EST)
- Confirmed Google Cloud project/account context for TechMyMoney migration.
- Pulled WordPress site size from wp-admin Site Health:
  - Total install: ~21.07 GB
  - Uploads: ~6.37 GB
  - DB: ~308 MB
- Pulled source VM disk size (`wordpress-1-vm`) and identified disk headroom risk.
- Recommendation made: resize to at least 60 GB (prefer 80 GB) before full backup/import workflows.

### 2026-02-17 (earlier today, EST)
- Continued migration path to new VM (Debian 12 target path in notes).
- Staged plan: bootstrap new VM -> import backup -> test -> DNS cutover.

---

## 2) DNS changes in this live incident window (today)

> Note: Times below are based on in-chat timestamps and immediate action order.

### ~15:24–15:27 EST (inspection + confirmation)
- Opened Squarespace DNS page for `techmymoney.com`.
- Confirmed current custom A records at that moment:
  - `www -> 34.73.164.168`
  - `@ -> 34.73.164.168`
- Opened Squarespace Activity page:
  - Observed many recent "A DNS Record was changed" entries.
  - Observed one entry: "Nameservers for the domain have changed" (~3 hours earlier).

### ~15:28–15:31 EST (rollback attempt to prior apparent target)
- At your direction, reverted both A records to prior observed working target:
  - `www -> 34.26.227.172`
  - `@ -> 34.26.227.172`
- Verified authoritative nameservers (`ns-cloud-c1..c4.googledomains.com`) all returned `34.26.227.172`.

### ~15:33–15:35 EST (full rollback of my changes)
- At your direction ("rollback everything you did"), reverted DNS changes I had just made.
- Final authoritative DNS after rollback:
  - `www -> 34.73.164.168`
  - `@ -> 34.73.164.168`
- Verified across all four authoritative NS again.

---

## 3) DNS verification evidence captured during session

### Authoritative NS observed for domain
- `ns-cloud-c1.googledomains.com`
- `ns-cloud-c2.googledomains.com`
- `ns-cloud-c3.googledomains.com`
- `ns-cloud-c4.googledomains.com`

### State transitions observed
1. State A (pre-rollback): both records at `34.73.164.168`
2. State B (temporary rollback attempt): both records at `34.26.227.172`
3. State C (final rollback of my edits): both records restored to `34.73.164.168`

---

## 4) Operational conclusion

- DNS was changed multiple times in a short window.
- After requested rollback, authoritative DNS is back to `34.73.164.168` for both `@` and `www`.
- If site is still failing after DNS is stable, root cause is likely server/app/database/runtime path behind `34.73.164.168`, not current DNS mismatch.

---

## 5) Next recommended recovery sequence (when you return)

1. Verify current target server health at `34.73.164.168`:
   - web server process
   - PHP-FPM/stack service
   - DB connectivity
2. Confirm WordPress DB credentials/config on active VM
3. Validate TLS termination path
4. Only after app is healthy, re-check external resolution and browser tests

---

Prepared by mjcitybot
