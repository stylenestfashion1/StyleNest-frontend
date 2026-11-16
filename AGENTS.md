# WORK RULES (StyleNest Fashion)

Follow these rules for this whole task. Keep replies short. If a rule is unclear, ask once, briefly.

## PRIORITY (when rules seem to conflict)
1) Correct and safe work
2) Honest and complete reporting
3) Saving time/limit

Saving the limit NEVER means skipping a test, a check, a needed file, a security review or part of the task.
It only means less noise: short text, no repeated reading, no pasting big outputs.

---

### 1. PLAN FIRST
- Before coding, give a short plan (max 10 lines): what you will change, which files, how you will test it. Wait for my "ok" on big or risky changes (database, payments, auth, server, deleting anything).

### 2. ONE STEP AT A TIME
- Work in small milestones. Finish, test and report one before starting the next.
- Do not rewrite working code or files I did not ask about.

### 3. PROOF, NOT PROMISES
- Never write "done", "fixed" or "works" without proof.
- Proof = the exact command you ran + only the important lines of its output (e.g. the final "Tests run: X, Failures: 0" line, an HTTP status, one log line). Do not paste full logs or whole files.
- If you could not test something, say so plainly and why.

### 4. TESTS
- Every new feature or bug fix gets a test (or a clear manual check if a test is not possible).
- Run the whole test suite before saying a milestone is finished. All must pass.

### 5. SELF-REVIEW BEFORE REPORTING
- After each milestone, review your own changes once for: security holes, wrong user getting access to data, missing validation, edge cases (empty, duplicate, double click, slow network), money/credit mistakes, errors that leak internals, and anything that breaks existing features.
- Fix what you find, then report: what you checked + what you fixed (short list).

### 6. SAFETY
- Never print or commit passwords, API keys, tokens or .env contents. Check names/lengths only.
- On a shared server: touch only this project's files, service, database and nginx file. No apt upgrade, no MySQL/nginx restart (reload only after "nginx -t"), no pkill. Back up before changing anything.
- Ask before: deleting data, payments/real money, sending messages/emails, changing DNS/accounts/settings, anything that cannot be undone.

### 7. SAVE MY LIMIT (be efficient)
- Read only the files you need; search first (grep) instead of opening whole folders. Do not re-read files you already read unless they changed.
- Batch related commands in one step. Show only the lines that matter.
- No long explanations unless I ask. Short bullet reports.
- Do not run long scans or full-project rewrites unless I ask.
- If doing the task properly needs more reading, testing or time, do it (or tell me what is needed). Never give a partial answer as if it were complete.
- If you stop early or skip anything, list it clearly under "NOT DONE" in the report. Never hide it.

### 8. CHECKLIST (when the project has one)
- Use /Users/abc/Documents/Production-Launch-Checklist-v2.pdf. Only the sections that apply.
- Mark each item PASS / FAIL / N/A with a one-line proof. Never mark PASS without checking.

### 9. FINAL REPORT (end of the task, max ~15 lines)
- What changed (files), how it was tested (proof lines), NOT DONE / NOT TESTED (always present, write "nothing" if so), risks, and what I must do myself (if anything).
- Every claim in the report must match the proof. No guesses written as facts.

