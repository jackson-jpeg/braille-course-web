# Teach Braille: what is next

Kept by the working session. `## Queue` is the work, top first, one line per item (the foreman's format); `## Needs
Jackson` is what waits on him. The notes below are detail and history. Each item deploys when its checks pass
(merge to `master`). When the queue runs dry, propose the next five toward users and revenue and start the first.

**PAUSED (Jackson, 2026-11-18): studio at 90% of the weekly Claude limit. Start nothing until the lead wakes this session after the reset (2026-11-19 11:00 UTC).**

## Queue

- [ ] (started 2026-11-18: found that "Meet the Six" is not on the live site's `master`; it is in the iOS app, `teachbraille-ios` docs/slice-1, docs/rollout-2, docs/1.1 and `Tests/TeachBrailleUITests/SliceTests.swift`, and on the web only on the unmerged branch `origin/redesign-oct-2026`, `components/games/DotQuest.tsx`. Read those first to learn where world 1, a to j, lives and whether world 2 belongs in the app, the web redesign, or both; if it is still unclear, ask the lead in one line and build in the app meanwhile) Practice world 2, letters k to t: the same Meet the Six mechanic and quality bar as a to j (every question enumerated and tested in `lib/games/`, `brailleInventory()` registered, `braille:oracle` clean, geometry and axe through `heavy`), in a worktree, deployed when green; one Inbox item with screenshots once live. Goal: learners who finish a to j have somewhere to go next
- [ ] Site audit fixes, in the same deploy if ready: Smart App Banner (`itunes: { appId: '6833681749' }` in `app/layout.tsx`) and a visible Privacy link on the home page (today only "Policies" in the footer). Goal: app installs from Safari visitors, and trust
- [ ] Xcode Cloud workflow for the iOS app (none on record; 22 of 25 free hours left), then the iOS 27.2 build and tests green there; one Inbox line with the first green run. Unblocks 1.1.1 and later releases without holding the Mac
- [ ] Practice world 3, letters u to z, the same way, after world 2 is live. Completes the alphabet in the free practice
- [ ] unpossible.studio: a playable Teach Braille update that shows the new world (find where the studio site lives first; `/root/braille-unpossible` may be another session's). Goal: reach for the free practice and the app

## Needs Jackson

- iOS 1.1.1 is set up in App Store Connect; `submit` only on his word, given in the session that runs it.
- World Braille Day stays as is until Delaney's answers (due December 5, through the lead); then copy in, checks, merge.

## Notes (detail for the queue; older items below)

1. [ ] **Practice world 2, letters k to t** (Jackson: build it now, same quality bar as a to j, same Meet the Six
   mechanic). Find how world 1 (a to j) is built and tested first and match it: every question enumerated and tested
   in `lib/games/`, `brailleInventory()` registered, `npm run braille:oracle` clean, geometry and axe through `heavy`,
   worktree, then merge to `master` (deploys) when green. Ship the site audit fixes (item 0b: app banner, home
   Privacy link) in the same deploy if ready. One Inbox item with screenshots once it is live.
2. [ ] **iOS on the 27.2 SDK, in Xcode Cloud** (lead via sanger-75, 2026-11-18: plain unit and simulator tests go to
   Xcode Cloud first; `mac-sim` is only for XCUITest recordings and hinge tests). The `ios test` run on the Mac was
   stopped 23 min in, before any test ran. No Xcode Cloud workflow is on record for Teach Braille (no `ci_scripts`;
   API not queried): set one up (item 000), run the tests there (POST /v1/ciBuildRuns), then one Inbox line with the
   first green run.
3. [ ] **Xcode Cloud workflow** for the iOS app, builds and simulator tests (item 000).
4. [ ] **Practice world 3, letters u to z**, the same way, after world 2 is live.
5. [ ] **unpossible.studio**: a playable Teach Braille update showing the new world (item 0a (3)).

Waiting, not to start: World Braille Day stays as is until Delaney's answers (due December 5, through the lead);
the iOS 1.1.1 `submit` needs Jackson's word in the session that runs it.


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
**Mac released (Jackson, 2026-11-18):** macOS 27.2.1, Xcode 27, iOS 27.2 runtimes; four shared simulators
(Shared iPhone Pro Max A/B, Shared iPad, Shared iPhone Duo). Use them through `mac-sim` with
`IOS_SIM_DEVICE="Shared iPhone Pro Max A"` (the app's own setting is `auto`). Follow the Mac disk policy in CLAUDE.md.

000. **Xcode Cloud for Teach Braille iOS** (Jackson, 2026-11-17, Mac disk policy in `CLAUDE.md`; needs no Mac):
   set up or fix the Xcode Cloud workflow (App Store Connect API from the VPS; key path in the Mac's
   `~/.sanger-build/secrets.env`, so find the VPS-side copy or ask) and move the build and simulator tests there.
   Check first what exists (ciProducts / ciWorkflows for app 6833681749). Stay within the 25 free hours; never pay.

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
