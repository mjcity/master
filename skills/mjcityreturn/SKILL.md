---
name: mjcityreturn
description: Roll a website repository back to the previous known-working deploy commit and push it live. Use when the user says commands like "mjcityreturn carbuz", "roll back <site>", "undo latest bad deploy", or asks to restore a site to the version before the newest push.
---

# mjcityreturn

Resolve a site to its git repository, create a safety tag, reset to the previous commit, push, and verify the site URL.

## Inputs
- Site name (example: `carbuz`)
- Optional branch (default: `main`, fallback: `master`)
- Optional deployment model (`repo-pages`, `docs-pages`, or `actions`)

## Workflow
1. Locate the repository path or clone URL for the site.
2. Fetch latest refs and detect default branch (`main` then `master`).
3. Record safety point:
   - `git tag mjcityreturn/<site>/<timestamp> HEAD`
4. Compute rollback target:
   - Default target: `HEAD~1`
   - If user specifies a commit, use that exact commit.
5. Confirm rollback context in one line:
   - current commit, target commit, branch, repo.
6. Execute rollback:
   - `git reset --hard <target>`
   - `git push --force-with-lease origin <branch>`
7. If deployment uses separate publish output (e.g., `/docs`), rebuild/copy publish artifacts as required by that repo’s deploy pattern, commit, and push.
8. Verify by checking:
   - remote branch head equals target
   - live URL responds
9. Report result with:
   - rolled-back commit hash
   - safety tag
   - live URL

## Safety rules
- Never delete tags created by this skill.
- Always create a safety tag before force-pushing.
- Use `--force-with-lease`, never `--force`.
- If branch protection blocks push, stop and report exact blocker.
- If repo has uncommitted local changes, stash first and restore after.

## Site mapping
Keep/update a local mapping file at:
- `skills/mjcityreturn/references/site-map.json`

Example structure:
```json
{
  "carbuz": {
    "repo": "https://github.com/<owner>/carbuz.git",
    "branch": "main",
    "deploy": "repo-pages",
    "liveUrl": "https://<owner>.github.io/carbuz/"
  }
}
```

## Command-style trigger
When user says exactly `mjcityreturn <site>`:
- Treat it as explicit authorization to perform rollback immediately.
- Skip extra confirmation unless repo/deploy target is ambiguous.

## Output format
Return concise status:
- `Site:`
- `Previous commit restored:`
- `Safety tag:`
- `Deployment:`
- `Live URL:`
- `Notes:`
