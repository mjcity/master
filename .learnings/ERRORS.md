# ERRORS

## [ERR-20260318-001] browser.start

**Logged**: 2026-03-19T00:25:51Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Browser tool failed to start isolated browser due to gateway timeout.

### Error
```
timed out. Restart the OpenClaw gateway (OpenClaw.app menubar, or `openclaw gateway`). Do NOT retry the browser tool — it will keep failing. Use an alternative approach or inform the user that the browser is currently unavailable.
```

### Context
- Operation attempted: `browser` tool with `action="start"` and `target="host"`
- Intent: open isolated OpenClaw-managed browser for user request
- Environment: OpenClaw webchat session on localhost

### Suggested Fix
Restart OpenClaw gateway, then retry browser start/open actions.

### Metadata
- Reproducible: unknown
- Related Files: none

---
## [ERR-20260321-001] windows-ssh-auth

**Logged**: 2026-03-22T03:16:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
Failed to connect to Windows host for Claw3D post-install configuration due to missing SSH credentials.

### Error
```
ssh -o BatchMode=yes -o StrictHostKeyChecking=no anyae@192.168.50.30 "hostname"
anyae@192.168.50.30: Permission denied (publickey,password,keyboard-interactive).
```

### Context
Attempted to complete Claw3D integration and model configuration on remote Windows machine after user requested "go finish it".

### Suggested Fix
Obtain valid SSH password (or key) for `anyae@192.168.50.30`, then run configuration scripts and validate end-to-end.

### Metadata
- Reproducible: yes
- Related Files: /tmp/start_claw3d_node.ps1

---
