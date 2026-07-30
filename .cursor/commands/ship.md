Stage all changes, commit with a conventional commit message, and push to main.

Execute this exact sequence:
1. `git add -A`
2. `git commit -m "<type>(<scope>): <description>"` — infer the type and scope from the changes
3. `git push`

Rules:
- Do this in as few commands as possible, ideally one line.
- Do NOT create branches or PRs.
- Do NOT use PowerShell redirection operators.
- If anything fails, stop immediately and tell me what happened. Do NOT retry.
