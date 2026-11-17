# Next (updated 2026-11-17)

In order. The latest session handoff is `docs/handoffs/2026-11-17-world-braille-day.md`.

0. **`/world-braille-day`: built, waiting on Delaney's copy** (Jackson approved the build, Inbox, 2026-11-17: "Build
   the /world-braille-day page as scoped. The outreach note waits for Delaney."). Branch `world-braille-day`, pushed,
   latest `6de8b71`. Review page: https://claude.ai/artifact/Qdmre6tGd3F4GooD5Bi3QA. Do not open a PR without asking.
   - [x] Page, name box, printable card, classroom paths, teachers and app sections.
   - [x] Long-name fit fix (`18ea5ad`); sitemap entry, December-January home link, scroll region and hint for long
         rows on phones, axe now also checks a long name (`6de8b71`). All checks green (handoff, "Third session").
   - [x] Review page with screenshots and the print card; worktree removed.
   - [ ] **Waiting on Jackson's Inbox `teachbraille-wbd-copy`** (due December 5): Delaney's paragraph, keep or drop
         the paid-lessons line, an alphabet sheet or not. Approve there means go live with the draft as is. When the
         answer comes: new worktree on the branch, put the copy in, run the full "Before every merge" checklist in
         `docs/accuracy/HANDOFF.md` (oracle, build, geometry, axe), merge to `master` (that deploys), live by
         December 15. Then check the live page and the sitemap.
   - [ ] The outreach note waits for Delaney (Jackson, 2026-11-17). Nothing to do until she answers.
1. **When Apple approves iOS 1.1**, on the Mac (`source ~/.sanger-build/secrets.env && cd ~/teachbraille-ios`):
   `TB_VERSION=1.1.1 ruby scripts/asc/asc-store.rb newversion`, `build 202611170158`, `whatsnew`, `notes`,
   `autorelease`, `attach ~/Downloads/TeachBraille-iOS/review-recording/TeachBraille-App-Review-1.1.1.mp4`. Then
   `submit` only on Jackson's word, given in the session that runs it. Details: `teachbraille-ios/docs/1.1.1/HANDOFF.md`.
2. **Optional**: iPad audit and layout checks for 1.1.1 on a temporary iPad simulator, when the Mac has room.
3. **Optional, needs a request first**: the website's Word Game is 50 px too tall to show board and keyboard together
   at 320 by 568 (fits at 375 by 667 and up). Not changed.
