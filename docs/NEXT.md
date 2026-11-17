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
         the paid-lessons line, an alphabet sheet or not. Approve there means go live with the draft as is.
         Jackson's reply, 2026-11-17: the lead emailed Delaney the three questions from his Gmail and watches for her
         reply; the lead passes her answers to this session. Do not email her or chase. Keep the branch ready (no
         changes to it meanwhile unless `master` moves under it). When the answers come: new worktree on the branch, put the copy in, run the full "Before every merge" checklist in
         `docs/accuracy/HANDOFF.md` (oracle, build, geometry, axe), merge to `master` (that deploys), live by
         December 15. Then check the live page and the sitemap.
   - [ ] The outreach note waits for Delaney (Jackson, 2026-11-17). Nothing to do until she answers.
**Mac on hold (Jackson, 2026-11-17)** for the macOS update and Xcode 27: start nothing on the Mac and queue no
`mac-sim` jobs until the hold is released. Every simulator and all DerivedData were deleted (approved). Web work
(0b, 0a items 1 and 2) needs no Mac. The 1.1.1 `submit` runs from the Mac (`asc-store.rb`), so it waits for the
hold as well as for Jackson's word.

00. **When the Mac is back, first job:** rebuild Teach Braille iOS and rerun its tests on the new iOS 27 simulator
   (`ios build` / `ios test`, which take `mac-sim`). Details in `teachbraille-ios`'s own docs.
0b. **Site audit fixes, in the next deploy** (Jackson, 2026-11-17; keep the World Braille Day branch separate: own
   worktree and branch off `master`, ship with (1) below or on its own when green):
   - [ ] Smart App Banner: `itunes: { appId: '6833681749' }` in the root `metadata` of `app/layout.tsx` (renders
         `<meta name="apple-itunes-app">`; none today). Test that it renders.
   - [ ] A visible Privacy link on the home page. Today the footer (`components/Footer.tsx`) links only "Policies"
         (`/policies`); check what `/policies` says about the studio tracker and analytics, link it as "Privacy"
         (an anchor if it has a privacy section), and make sure the home page shows it. Test it; no em dashes.
   - [ ] Checks through `heavy`: build, axe. Then merge to `master` (that deploys) and check live.
0a. **Jackson, 2026-11-17 (Sessions message), next work, in this order:**
   - [ ] **(1) The second world of the free practice:** letters k to t with the same Meet the Six mechanic, then u
         to z. Same liblouis checks (`npm run braille:oracle`, inventory registration) and axe pass, all through
         `heavy`, in a worktree. **Deployed when green** (his words; merge to `master` deploys). When it is live, file
         **one** Inbox item with screenshots (`needs-you`, for the lead).
   - [ ] **(2) World Braille Day launch ready to go live the minute Delaney answers** (he emailed her; answers by
         December 5). Prepare everything short of her copy: a script or exact command list for copy in, checks,
         merge, live check of the page and `sitemap.xml`. Keep the branch merge-clean with `master` (rebase or merge
         `master` into it after (1) lands, then rerun checks).
   - [ ] **(3) A Teach Braille playable update on unpossible.studio that shows the new world.** Find where that
         lives first (a worktree `/root/braille-unpossible` on branch `unpossible-analytics` exists and may belong
         to another session: look, do not touch until known). Follow that project's own deploy rules.
1. **iOS 1.1.1: set up, not submitted** (1.1 approved, Jackson, 2026-11-17). Done in App Store Connect the same
   day: `newversion` (PREPARE_FOR_SUBMISSION), `build 202611170158`, `whatsnew` and `notes` (read back identical),
   `autorelease` (AFTER_APPROVAL), review recording attached (COMPLETE). **Left: `submit`, only on Jackson's word in
   the session that runs it.** Original steps, for reference: when Apple approves iOS 1.1, on the Mac (`source ~/.sanger-build/secrets.env && cd ~/teachbraille-ios`):
   `TB_VERSION=1.1.1 ruby scripts/asc/asc-store.rb newversion`, `build 202611170158`, `whatsnew`, `notes`,
   `autorelease`, `attach ~/Downloads/TeachBraille-iOS/review-recording/TeachBraille-App-Review-1.1.1.mp4`. Then
   `submit` only on Jackson's word, given in the session that runs it. Details: `teachbraille-ios/docs/1.1.1/HANDOFF.md`.
   **Apple outage, 2026-11-17** (Jackson, from ~16:45 UTC; App Store Connect and Xcode Cloud down around 19:20 UTC,
   recovery partial): check https://developer.apple.com/system-status/ first. Treat App Store Connect, TestFlight
   or altool 5xx and timeouts as Apple's: retry at 1, 5, 15, 30 min, for up to 3 hours, before calling anything
   broken. Never re-upload a build that already reached processing. No Inbox items for Apple 5xx alone.
2. **Optional**: iPad audit and layout checks for 1.1.1 on a temporary iPad simulator, when the Mac has room.
3. **Optional, needs a request first**: the website's Word Game is 50 px too tall to show board and keyboard together
   at 320 by 568 (fits at 375 by 667 and up). Not changed.
