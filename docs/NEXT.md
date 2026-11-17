# Next (updated 2026-11-17)

In order. The latest session handoff is `docs/handoffs/2026-11-17-session.md`.

1. **When Apple approves iOS 1.1**, on the Mac (`source ~/.sanger-build/secrets.env && cd ~/teachbraille-ios`):
   `TB_VERSION=1.1.1 ruby scripts/asc/asc-store.rb newversion`, `build 202611170158`, `whatsnew`, `notes`,
   `autorelease`, `attach ~/Downloads/TeachBraille-iOS/review-recording/TeachBraille-App-Review-1.1.1.mp4`. Then
   `submit` only on Jackson's word, given in the session that runs it. Details: `teachbraille-ios/docs/1.1.1/HANDOFF.md`.
2. **If Jackson approves the January page** (Inbox `teachbraille-outreach-jan`): build `/world-braille-day` as scoped
   in `docs/outreach/2026-11-17/JANUARY-PAGE-PLAN.md`; live by December 15. Run the full pre-merge checklist in
   `docs/accuracy/HANDOFF.md`.
3. **Optional**: iPad audit and layout checks for 1.1.1 on a temporary iPad simulator, when the Mac has room.
4. **Optional, needs a request first**: the website's Word Game is 50 px too tall to show board and keyboard together
   at 320 by 568 (fits at 375 by 667 and up). Not changed.
