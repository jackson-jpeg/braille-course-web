# Teach Braille: what is next

Kept by the working session. The Queue section is the work, top first, one line per item (the foreman's format);
Needs Jackson is what waits on him. The notes below are detail and history. Each item deploys when its checks pass
(merge to `master`). When the queue runs dry, propose the next five toward users and revenue and start the first.

Line rules (Jackson and the line lead, 2026-11-19): full speed. Finish the item in hand, post one FYI line
(`needs-you`, bucket later), release any lock, start the next. Do not ask before testing, merging or deploying this
project's own work; only money, Apple ID steps, credentials and Jackson's product rules go to him. Mac and simulators
only through the foreman's `mac-sim` lock, Xcode Cloud first. Save every mockup, proof or artifact under `Assets/`.

## Queue

- [x] (2026-11-18 07:39Z GREEN: the 4 red tests rerun and passed on Shared iPhone Pro Max A (teachbraille-ios `966382c`), the other 6 passed at 05:58Z: World 2 and World 3 suites 10/10.) (2026-11-18: built, teachbraille-ios `c967ea2`, `23cfa46`: `PathTests` pin World 2's 8 stops and its cards, BrailleKit `swift test` 101/101 on the Mac; `World2Tests.swift` (audit, flat, largest text, map, eyes-free map to reward) and a `reward:<stop>` launch route. UI run 05:58Z: 6 of 10 passed; World 2 audit timed out (infra, rerun), World 3 eyes-free game player too weak for 4 choices (fix SliceRun.game, rerun); details docs/sessions/2026-11-17.md, last section (`ios test teachbraille --only TeachBrailleUITests/World2Tests --only TeachBrailleUITests/World3Tests`); tick when green. 2026-11-18 07:10Z: player fixed, teachbraille-ios `cdd9a0e` (reads the card through BrailleKit, learns from the miss panel); rerun of the 4 red tests next in the `mac-sim` queue since 06:21Z) World 2 (k to t) to World 1's test bar, in the app. Never change grouping or stop ids (saved progress). The website has no Meet the Six (only the unmerged `origin/redesign-oct-2026`): a web version is a new design, proposed to the lead, not built
- [x] (split 2026-11-18 09:55Z into the five items below; (b) and (c) done: promotional text on 1.1 and 1.1.1, support URL and the store name "Teach Braille" on 1.1.1, each read back; description and review notes on 1.1.1 aligned to "Teach Braille" 10:00Z, lead approved `3cd32b05`) App Store listing fixes
- [ ] (2026-11-18 10:09 to 10:28Z turn: got `mac-sim` at load 6.8; step 1 GREEN, the World 2 studio pictures retaken, reward shot now says "Next up: New teams, o, p" (all four in the Mac's `~/Downloads/TeachBraille-iOS/world2-studio/iphone/`). Step 2 FAILED before any test ran: `TeachBrailleUITests-Runner ... Test crashed with signal kill before establishing connection` (Mac at 10:30Z: load 52 to 71, swap 6.6 of 7 GB, so most likely killed for memory). Partial recording deleted. `preview-turn.sh` exits 75 without starting unless the 1-minute load is under 20 (teachbraille-ios `c2bce75`). 10:49Z attempt got the lock at Mac load 23.5 and stopped unstarted (exit 75, the guard). requeued 10:50Z, then stopped unstarted for the context clear. REQUEUED 11:04Z with `TB_SKIP_STUDIO=1`, second waiter behind simsunday and sogojet (Mac at 11:04Z: load 8.5, swap 7.4 of 8 GB); got the lock 11:29Z at load 32.9, stopped unstarted (exit 75, guard); requeued 11:31Z behind sogojet. 11:46Z turn STARTED at load 7.6, build fine, then FAILED a second time: `Test crashed with signal abrt while preparing to run tests` after ~6 min hung at "Running tests..." (Mac swap 11.9 of 13 GB at 12:04Z: memory again; the load guard does not see memory). Partial recording deleted. PARKED (stopped twice), Inbox `teachbraille-preview-iphone`. Memory guard added (teachbraille-ios `dcb3138`: normal pressure and swap under 6 GB). 14:01Z third try (foreman push) STARTED at load 3.2, pressure normal, swap 3.2 GB; FAILED again before any test: `Timed out waiting for AX loaded notification`, Mac load 22 to 33 right after, i.e. our own build-for-testing raises the load and the runner starts under it. Partial recording deleted. BLOCKED on tooling: `ios test` has no build-only / test-only split for the simulator (only `lib/devicetest/run.py` for devices has `--skip-build`), so the guard cannot run between build and test. Fix proposed to the lead (ios-toolkit is not this project's): an `ios test --without-building` (or build-for-testing first, then wait for load under 10, then test-without-building). Do not retry until then. Old note: requeue with `TB_SKIP_STUDIO=1` (teachbraille-ios `01e9724`: skips the pictures, straight to the recording). If it fails again, requeue when the Mac is quiet: `cd /root/teachbraille-ios && TB_SKIP_STUDIO=1 hub-lock mac-sim --label "teachbraille preview turn iphone" -- bash scripts/preview-turn.sh iphone`. Plan `teachbraille-ios/docs/1.1.1/APP-PREVIEWS.md`) Listing (d1): iPhone preview tour recording
- [ ] (after d1; VPS: `scripts/preview-cut.sh`, then look at the frames) Listing (d2): cut the iPhone preview and review its frames
- [ ] (after d2; same command with `ipad`, same load rule) Listing (d3): iPad preview turn, cut and review
- [ ] (after d3; `asc-store.rb preview <file> IPHONE_67|IPAD_PRO_3GEN_129`, read back; nothing submitted) Listing (d4): upload both previews to 1.1.1
- [ ] (BLOCKED until about 2026-11-19 03:36 UTC, Vercel's 24 h build limit; the lead: no Vercel push tonight. `master` holds the support page `4bbb3ad`, `vercel.json` `ignoreCommand`, the site audit fixes and the Word Game fit `e926824`. PRE-CHECKED 2026-11-18 ~14:20Z on local master `abb69f6`: production build (1822 tests), prettier, lint, tsc, oracle (fixture unchanged), geometry 0 problems in 2875 cells, axe 0, Word Game fit OK, all through heavy; if master has not moved, the night step is only the push and the read-back. Then: production build through heavy, push `master` ONCE, read back /support, the `apple-itunes-app` meta, the footer Privacy link, and `npm run a11y:wordgame-fit -- https://teachbraille.org`) Listing (a): push `master` once and read the site back
- [ ] (merged with the support page, `4bbb3ad`; live with the same push) Site audit fixes: Smart App Banner (`itunes: { appId: '6833681749' }` in `app/layout.tsx`) and a visible Privacy link on the home page (today only "Policies" in the footer); can ride with the support page deploy. Goal: app installs from Safari visitors, and trust
  - BLOCKED 2026-11-18: same Vercel build limit as the item above; it goes live in the same single push after
    about 2026-11-19 03:36 UTC, then read back the `apple-itunes-app` meta and the footer Privacy link.
- [ ] (2026-11-18: no product exists; the API cannot make one. Tooling ported from Chirp, teachbraille-ios `b292ad4`: `ci_scripts/ci_post_clone.sh`, `scripts/asc/xcode_cloud.py` (status, setup, start, hours), `docs/xcode-cloud.md` with the click steps. Mac clone `~/teachbraille-ios-cloud` ready; the Create Workflow clicks (they need Jackson for the GitHub grant) are one step on sanger-1's noon item `fdfa8e51` (lead, 2026-11-18). CI test plan DONE 2026-11-18 ~14:35Z (teachbraille-ios `f142ca5`): scheme `TeachBraille-CI` in project.yml skips RecordingTests, StoreShotTests, WorldShotTests, PlainDotsShotTests, AuditProbeTests, and the "Tests" workflow runs it; unverified until the first cloud run. Then: `setup --dry-run`, `setup`; `start tests`; delete the Mac clone) Xcode Cloud workflow for the iOS app (4.47 of 25 shared hours used this month), then the iOS 27.2 build and tests green there; one Inbox line with the first green run
  - BLOCKED 2026-11-18: waits on the Create Workflow clicks (Jackson's GitHub grant), already in the Inbox as a
    step on the lead's noon item `fdfa8e51`; not filed again.
- [x] (GREEN 2026-11-18 07:39Z with World 2, see above) (2026-11-18: built with World 2, `23cfa46`: `PathTests` pin its 5 stops (the course teaches w last, so the range reads "u to w"); `World3Tests` subclasses `World2Tests`; UI run queued with World 2's) World 3 (u to z) to the same test bar
- [ ] (2026-11-18: the studio session `unpossible-studio-ac` owns it and built World 2 into https://unpossible.studio/play/teachbraille/ on its branch `tb-world2` (cells generated from our `lib/braille/ueb.ts` LETTER_CELLS on master; copy checked and approved here). Live when its light duty and Vercel limit lift; the "Teach Braille" rename there waits for 1.1.1's release. Left for us: send it the path of World 2 screenshots (taken 07:56Z, Mac `~/Downloads/TeachBraille-iOS/world2-studio/iphone`; the reward shot is being retaken in the queued preview turn, then check it and send the path). `/root/braille-unpossible` is a clean worktree of this repo on `unpossible-analytics`, already merged to `master`) unpossible.studio: a playable Teach Braille update that shows the new world
  - 2026-11-18 10:20Z: the reward retake is done and good (names s4, "New teams, o, p"); all four pictures are in
    the Mac's `~/Downloads/TeachBraille-iOS/world2-studio/iphone/`. Waits only on the studio session's return. Do not message the studio session: the lead, 08:45Z, says it is shut down until the afternoon of
    2026-11-19. Send it the path (all four pictures) then.
- [ ] (2026-11-18 08:55Z: every item above is blocked, so five next items went to the lead, Inbox `a2958c1b`:
      1 the iOS app offered at the end of the course, 2 Word Game fits 320 by 568, 3 website World 2 plan,
      4 learner drop-off review, 5 iPad audit for 1.1.1. Lead's answer: 2 now (DONE 2026-11-18 ~09:50Z: merged to `master` locally,
      `e926824`, axe 0 on the production build (the earlier single violation did not recur), fit OK at 320x568,
      375x667, 390x844, 430x932; NOT live: rides in the single push after the Vercel limit; worktree removed); 4 DONE 2026-11-18 ~14:15Z (Jackson approved `d4048fe3`; one read-only aggregate read, `docs/reviews/2026-11-18-learner-dropoff.md`, copied to the Mac: half who open a lesson never finish one, 80 of 129 finishers stop within lessons 1 to 3; four ideas proposed, nothing built); 5 when the Mac allows; 1 is Jackson's `45cd71a2`; 3 waits) Next five

## Needs Jackson

- Inbox `45cd71a2`: approve the one app line at the end of the course.
- Inbox `718cc276`: plug in his iPhone for the 1.1.1 review recording (app-review part 2).
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

1. **Xcode Cloud for Teach Braille iOS** (Jackson, 2026-11-17, Mac disk policy in `CLAUDE.md`; needs no Mac):
   set up or fix the Xcode Cloud workflow (App Store Connect API from the VPS; key path in the Mac's
   `~/.sanger-build/secrets.env`, so find the VPS-side copy or ask) and move the build and simulator tests there.
   Check first what exists (ciProducts / ciWorkflows for app 6833681749). Stay within the 25 free hours; never pay.

2. **When the Mac is back, first job:** rebuild Teach Braille iOS and rerun its tests on the new iOS 27 simulator
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
- [x] (READY 2026-11-18 07:58Z: master merged into the branch (`ec9b55b`, `5a46836`; one conflict: the axe
      page list, now both `/support` and `/world-braille-day`); `scripts/wbd-golive.sh`: `check` runs the
      whole merge list, `merge` merges and pushes master (deploys), `live` reads page, sitemap, geometry and
      axe back from teachbraille.org. First `check` all green: 1922 tests, oracle fixture unchanged, geometry
      0 problems in 2966 cells, axe 0. Branch pushed (`f587724`). When Delaney answers: copy in, commit,
      `check`, `merge`, `live`. If master moves first: `git merge master` on the branch, rerun `check`. 2026-11-18 ~13:40Z: master merged in again (`2c6f610`, pushed; a branch push costs 0 Vercel builds), `check` all green: geometry 0 problems in 2952 cells, axe 0, oracle fixture unchanged. On the way, fixed: `wbd-golive.sh` left next-server running and an orphan from a deleted worktree answered later checks (`43b4143`); master `d5d4ac3` (prettier on session notes), `575bd7c` (check-axe finishes the floating CTA's fade before measuring). The lead holds the merge to master until he has read what changes (the page goes live with the draft copy)) **(2) World Braille Day launch ready to go live the minute Delaney answers** (he emailed her; answers by
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
