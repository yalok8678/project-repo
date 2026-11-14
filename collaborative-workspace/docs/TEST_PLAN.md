# Test plan and results template

## Automated check
Run `cd server && npm test`. The included Node test checks role capability rules. Run `npx prisma validate` after configuring `DATABASE_URL`.

## Manual functional tests
- [ ] Register two distinct users.
- [ ] Create a workspace as user A.
- [ ] Add user B by registered email.
- [ ] Open the same page in two separate browser profiles.
- [ ] Type concurrently from both profiles; confirm text converges.
- [ ] Confirm online cursor/presence indicators.
- [ ] Save a snapshot, make edits, restore the snapshot.
- [ ] Add a comment as commenter.
- [ ] Confirm viewer cannot edit or comment.
- [ ] Restart collaboration server and verify persisted document reloads.

## Results to record before submission
| Metric | How to measure | Result |
|---|---|---|
| Concurrent editors | Browser sessions editing same room | Fill in |
| Update latency | Record keystroke to remote render over 20 trials | Fill in |
| Reconnect behavior | Disconnect/reconnect network | Fill in |
| Persistence | Restart collab service and reopen page | Pass/Fail |
| Authorization | Try forbidden action as viewer | Pass/Fail |

Do not invent performance numbers. Record measurements from your own test run and environment.
