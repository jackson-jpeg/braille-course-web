# Teach Braille: what is next

Kept by the working session. The Queue section is the work, top first, one line per item (the foreman's format);
Needs Jackson is what waits on him. The notes below are detail and history. Each item deploys when its checks pass
(merge to `master`). When the queue runs dry, propose the next five toward users and revenue and start the first.

Line rules (Jackson and the line lead, 2026-11-19): full speed. Finish the item in hand, post one FYI line
(`needs-you`, bucket later), release any lock, start the next. Do not ask before testing, merging or deploying this
project's own work; only money, Apple ID steps, credentials and Jackson's product rules go to him. Mac and simulators
only through the foreman's `mac-sim` lock, Xcode Cloud first. Save every mockup, proof or artifact under `Assets/`.

## Queue

- [ ] (from Xcode Cloud Tests run 1, 2026-11-19 19:03Z to 20:42Z, 99 min, FAILED: 56 of 58 passed; the 2 failures are `AuditTests.testEveryWorldMap` and `SliceTests.testAuditEveryScreen`, every issue "Contrast failed" on secondary labels ("done", "0 of 6 lessons done", lesson and game names on the map, "New teams"). Both passed with 0 failures on the Mac at the 1.1 handoff, so first find what differs in the cloud (simulator device or runtime, appearance, the audit itself): download the run's result bundle and look at the flagged frames before touching any color. Do not loosen the audit) Xcode Cloud: why the contrast audit fails only in the cloud
- [x] (DONE 2026-11-19 ~10:45Z: `ffbd2f3`, lead `e81e4852`) Bingo pill target-size: html `scroll-padding-top: 60px`, and `a11y:axe` also checks /learn/wrap-up after Mark this lesson complete. Checks through heavy: production build 1827, prettier, lint, geometry 0 in 2868 cells, axe 0 (the 1280px /learn/lower-wordsigns flag seen once on live did not recur), Word Game fit OK x4. The pill loop was dropped: axe passes a focus or anchor scroll on live WITHOUT the fix, so no check can hold the CSS; said so to the lead
- [x] (DONE 2026-11-19 ~08:55Z: `1f19795`, checks through heavy: jest 1827 in the production build, prettier, lint, tsc, oracle fixture unchanged, geometry 0 in 2875 cells, axe 0, Word Game fit OK x4; pushed once; live 404 read back for the Privacy link) Footer on the 404 page too (Jackson `f2e07040` "every page"): worktree `/root/braille-footer`, branch `footer-banner-deploy`, `app/not-found.tsx` renders Footer, the trust test now walks `not-found.tsx` too; UNCOMMITTED. Next: jest trust test, then the full "Before every merge" checks through heavy, ff `master`, push once, read back a 404 URL for the Privacy link, remove the worktree
- [x] (MOVED to Needs Jackson 2026-11-19 08:56Z: blocked on the Mac's swap, lead item `teachbraille-preview-swap`) Listing (d1) to (d4): preview turn
- [x] (MOVED to Needs Jackson 2026-11-19 ~14:30Z: held by peak hours until 19:00Z, lead item `teachbraille-preview-peak`; a timer in this session starts it at 19:01Z) Listing (d1) to (d4): preview turn, after 19:00Z

- [x] (2026-11-18 07:39Z GREEN: the 4 red tests rerun and passed on Shared iPhone Pro Max A (teachbraille-ios `966382c`), the other 6 passed at 05:58Z: World 2 and World 3 suites 10/10.) (2026-11-18: built, teachbraille-ios `c967ea2`, `23cfa46`: `PathTests` pin World 2's 8 stops and its cards, BrailleKit `swift test` 101/101 on the Mac; `World2Tests.swift` (audit, flat, largest text, map, eyes-free map to reward) and a `reward:<stop>` launch route. UI run 05:58Z: 6 of 10 passed; World 2 audit timed out (infra, rerun), World 3 eyes-free game player too weak for 4 choices (fix SliceRun.game, rerun); details docs/sessions/2026-11-17.md, last section (`ios test teachbraille --only TeachBrailleUITests/World2Tests --only TeachBrailleUITests/World3Tests`); tick when green. 2026-11-18 07:10Z: player fixed, teachbraille-ios `cdd9a0e` (reads the card through BrailleKit, learns from the miss panel); rerun of the 4 red tests next in the `mac-sim` queue since 06:21Z) World 2 (k to t) to World 1's test bar, in the app. Never change grouping or stop ids (saved progress). The website has no Meet the Six (only the unmerged `origin/redesign-oct-2026`): a web version is a new design, proposed to the lead, not built
- [x] (split 2026-11-18 09:55Z into the five items below; (b) and (c) done: promotional text on 1.1 and 1.1.1, support URL and the store name "Teach Braille" on 1.1.1, each read back; description and review notes on 1.1.1 aligned to "Teach Braille" 10:00Z, lead approved `3cd32b05`) App Store listing fixes
- [x] (moved to Needs Jackson with d1, blocked on the ios-toolkit split; MOVED to Needs Jackson 2026-11-19 ~04:00Z, blocked on ios-toolkit; d2 to d4 wait on it) Listing (d1): iPhone preview tour recording
- [x] (moved to Needs Jackson with d1, blocked on the ios-toolkit split; after d1; VPS: `scripts/preview-cut.sh`, then look at the frames) Listing (d2): cut the iPhone preview and review its frames
- [x] (moved to Needs Jackson with d1, blocked on the ios-toolkit split; after d2; same command with `ipad`, same load rule) Listing (d3): iPad preview turn, cut and review
- [x] (moved to Needs Jackson with d1, blocked on the ios-toolkit split; after d3; `asc-store.rb preview <file> IPHONE_67|IPAD_PRO_3GEN_129`, read back; nothing submitted) Listing (d4): upload both previews to 1.1.1
- [x] (DONE 2026-11-19 07:50Z: `ignoreCommand` dropped (`35215f4`), pushed `b0011d7..35215f4` 07:47Z, LIVE 07:50Z; /support 200, `apple-itunes-app` meta and footer Privacy link read back on 8 live pages. The ignoreCommand was the likely cause of the failed deploy.) (2026-11-19 03:47Z: PUSHED once, `4bbb3ad..4be4982`. Vercel deploy `dpl_FgNCeqaNBtpX2dzb2UE7s1mjA9XH` FAILED in the same second it was made ("Deployment has failed", not the rate-limit message). Live site unchanged: /support 404, no `apple-itunes-app` meta, no footer Privacy link, no app line. Logs not read: `npx vercel inspect --logs` was denied by the Claude Code permission check. Likely (unverified) cause: the new `ignoreCommand` in `vercel.json` (`eb5167f`) diffs against `VERCEL_GIT_PREVIOUS_SHA` (`0ac73c5`), which a shallow clone may not hold, so `git diff` exits 128 and Vercel fails the deploy. Proposed fix, waiting on the owner's okay for a second push: only diff when that commit is present, and build otherwise, e.g. `git cat-file -e \"$VERCEL_GIT_PREVIOUS_SHA^{commit}\" 2>/dev/null && git diff --quiet ...`, or drop the ignoreCommand. Read the logs first.) (Earlier: BLOCKED until about 2026-11-19 03:36 UTC, Vercel's 24 h build limit; the lead: no Vercel push tonight. `master` holds the support page `4bbb3ad`, `vercel.json` `ignoreCommand`, the site audit fixes and the Word Game fit `e926824`. 2026-11-18 ~23:55Z master moved: the course-end app line `76a788e` (Jackson `45cd71a2`) is merged and RE-CHECKED on it: production build (1825 tests), prettier, lint, tsc, oracle (fixture unchanged), geometry 0 problems in 2872 cells, axe 0, Word Game fit OK at all four sizes, all through heavy; on the push also read back the line on https://teachbraille.org/learn/wrap-up after Mark this lesson complete. Earlier PRE-CHECK 2026-11-18 ~14:20Z on local master `abb69f6`: production build (1822 tests), prettier, lint, tsc, oracle (fixture unchanged), geometry 0 problems in 2875 cells, axe 0, Word Game fit OK, all through heavy; if master has not moved, the night step is only the push and the read-back. Then: production build through heavy, push `master` ONCE, read back /support, the `apple-itunes-app` meta, the footer Privacy link, and `npm run a11y:wordgame-fit -- https://teachbraille.org`) Listing (a): push `master` once and read the site back
- [x] (LIVE 2026-11-19 07:50Z with `35215f4`) (merged with the support page, `4bbb3ad`; live with the same push) Site audit fixes: Smart App Banner (`itunes: { appId: '6833681749' }` in `app/layout.tsx`) and a visible Privacy link on the home page (today only "Policies" in the footer); can ride with the support page deploy. Goal: app installs from Safari visitors, and trust
  - BLOCKED 2026-11-18: same Vercel build limit as the item above; it goes live in the same single push after
    about 2026-11-19 03:36 UTC, then read back the `apple-itunes-app` meta and the footer Privacy link.
- [x] (MOVED to Needs Jackson 2026-11-19 08:58Z: `setup` denied by the Claude Code permission check, lead item `teachbraille-xcode-cloud-setup`) Xcode Cloud workflow for the iOS app
- [x] (GREEN 2026-11-18 07:39Z with World 2, see above) (2026-11-18: built with World 2, `23cfa46`: `PathTests` pin its 5 stops (the course teaches w last, so the range reads "u to w"); `World3Tests` subclasses `World2Tests`; UI run queued with World 2's) World 3 (u to z) to the same test bar
- [x] (MOVED to Needs Jackson 2026-11-19 09:00Z: waits for the afternoon, the lead's order not to message the studio session before then) unpossible.studio: send World 2 pictures
- [x] (MOVED to Needs Jackson 2026-11-19 09:01Z: 3 waits on the lead, 5 on the Mac swap) Next five
- [x] (MOVED to Needs Jackson 2026-11-19 09:01Z: proposal with the lead, `teachbraille-bingo-pill-target`) Bingo Beginner pill target-size

## Needs Jackson

- **WAITS until 19:00Z UTC 2026-11-19 (peak hours, not a Jackson decision; lead item `teachbraille-preview-peak`)**: (UNBLOCKED 2026-11-19 14:21Z: Jackson restarted the Mac 14:17Z, swap 0 MB, `mac-sim` free. OFF-PEAK ONLY: start after 19:00Z. Check swap first (`ssh macbook "sysctl vm.swapusage"`, under 6144), then `cd /root/teachbraille-ios && git checkout preview-turn-split && TB_SKIP_STUDIO=1 hub-lock mac-sim --label "teachbraille preview turn iphone" -- bash scripts/preview-turn.sh iphone`, then d2 to d4 as in Needs Jackson. Do not push teachbraille-ios) Listing (d1) to (d4): preview turn, after 19:00Z
  - 2026-11-19 14:22Z: foreman sent it during peak (weekday 13:00 to 19:00 UTC); held, not started. Not a stop:
    it starts after 19:00Z.
  - BLOCKED until 19:00Z UTC today by the peak-hours rule (`/root/CLAUDE.md`: weekdays 13:00 to 19:00 UTC no
    simulator jobs unless Jackson himself asked; `heavy` holds new jobs until 19:00 too). Not a Jackson item and not
    filed: the block lifts by itself. Tried: 14:21Z swap 0 MB (`sysctl vm.swapusage`), `mac-sim` free, Mac awake.
    A timer in this session wakes it at 19:00Z to check swap and start. Nothing else in the Queue is open.
  - 2026-11-19 19:01Z to 19:34Z: three tries, NOT RUN, each refused by the script's own guards after it got
    `mac-sim` behind another project's test: load 26.5 (19:11Z), load 31.2 (19:24Z), swap 6649 MB (19:34Z). With the
    lock free the Mac sat at load ~25 (a VM, Spotlight, Mail). Guards not raised. Filed to the lead
    (`teachbraille-preview-contention`): needs a quiet Mac window. Next try: when the lead names one, or after 23:00Z.

- **WAITS on the lead (09:01Z)**: of the Next five, 1, 2, 4 are done; 3 (website World 2 plan) waits on the lead; 5 (iPad audit for 1.1.1) needs the Mac, held by the same swap block as the preview turn. Return when the lead answers or swap reads under 6144. The item: (2026-11-18 08:55Z: every item above is blocked, so five next items went to the lead, Inbox `a2958c1b`:
  1 the iOS app offered at the end of the course, 2 Word Game fits 320 by 568, 3 website World 2 plan,
  4 learner drop-off review, 5 iPad audit for 1.1.1. Lead's answer: 2 now (DONE 2026-11-18 ~09:50Z: merged to `master` locally,
  `e926824`, axe 0 on the production build (the earlier single violation did not recur), fit OK at 320x568,
  375x667, 390x844, 430x932; NOT live: rides in the single push after the Vercel limit; worktree removed); 4 DONE 2026-11-18 ~14:15Z (Jackson approved `d4048fe3`; one read-only aggregate read, `docs/reviews/2026-11-18-learner-dropoff.md`, copied to the Mac: half who open a lesson never finish one, 80 of 129 finishers stop within lessons 1 to 3; four ideas proposed, nothing built); 5 when the Mac allows; 1 DONE 2026-11-18 ~23:55Z (Jackson approved `45cd71a2`): merged to local `master` `76a788e`, the approved sentence after "Explore the practice games any time." once the last lesson is finished, linked to the App Store (`lib/app-store.ts`), held by `__tests__/course/app-line.test.tsx`; NOT live: rides the single push; 3 waits) Next five

- **WAITS until the afternoon of 2026-11-19 (the lead, 2026-11-18 08:45Z: do not message the studio session before then)**: at 09:00Z `unpossible-studio-ac` is up and idle, not messaged. From 12:00Z UTC, return it to the Queue and send it the path of all four pictures (Mac `~/Downloads/TeachBraille-iOS/world2-studio/iphone/`). The item: (2026-11-18: the studio session `unpossible-studio-ac` owns it and built World 2 into https://unpossible.studio/play/teachbraille/ on its branch `tb-world2` (cells generated from our `lib/braille/ueb.ts` LETTER_CELLS on master; copy checked and approved here). Live when its light duty and Vercel limit lift; the "Teach Braille" rename there waits for 1.1.1's release. Left for us: send it the path of World 2 screenshots (taken 07:56Z, Mac `~/Downloads/TeachBraille-iOS/world2-studio/iphone`; the reward shot is being retaken in the queued preview turn, then check it and send the path). `/root/braille-unpossible` is a clean worktree of this repo on `unpossible-analytics`, already merged to `master`) unpossible.studio: a playable Teach Braille update that shows the new world
  - 2026-11-18 10:20Z: the reward retake is done and good (names s4, "New teams, o, p"); all four pictures are in
    the Mac's `~/Downloads/TeachBraille-iOS/world2-studio/iphone/`. Waits only on the studio session's return. Do not message the studio session: the lead, 08:45Z, says it is shut down until the afternoon of
    2026-11-19. Send it the path (all four pictures) then.

- **SETUP DONE 2026-11-19 ~14:45Z (Jackson yes, 86e57e61, closed by fyi 3f86b60f)**: TestFlight `4f7f6063` (scheme TeachBraille) and Tests `6ffc67f5` (TeachBraille-CI) created, manual only; Default disabled. Pushes to teachbraille-ios no longer start builds. Done 20:45Z: Tests run 1 FAILED (56 of 58, contrast audit only, Queue item), 1.65 h (17.63 of 25 shared), Mac clone deleted. Was: **BLOCKED, waits on the lead or Jackson to allow `xcode_cloud.py setup` (lead item `teachbraille-xcode-cloud-setup`, filed 08:58Z)**: the auto-mode permission check denied it ~00:55Z; not retried, not routed around (a foreman send is not approval). Return to the Queue once allowed: `setup`, then `start tests`, then delete the Mac clone `~/teachbraille-ios-cloud`. The item: (2026-11-18: no product exists; the API cannot make one. Tooling ported from Chirp, teachbraille-ios `b292ad4`: `ci_scripts/ci_post_clone.sh`, `scripts/asc/xcode_cloud.py` (status, setup, start, hours), `docs/xcode-cloud.md` with the click steps. Mac clone `~/teachbraille-ios-cloud` ready; the Create Workflow clicks (they need Jackson for the GitHub grant) are one step on sanger-1's noon item `fdfa8e51` (lead, 2026-11-18). CI test plan DONE 2026-11-18 ~14:35Z (teachbraille-ios `f142ca5`): scheme `TeachBraille-CI` in project.yml skips RecordingTests, StoreShotTests, WorldShotTests, PlainDotsShotTests, AuditProbeTests, and the "Tests" workflow runs it; unverified until the first cloud run. Then: `setup --dry-run`, `setup`; `start tests`; delete the Mac clone) Xcode Cloud workflow for the iOS app (4.47 of 25 shared hours used this month), then the iOS 27.2 build and tests green there; one Inbox line with the first green run
  - BLOCKED 2026-11-18: waits on the Create Workflow clicks (Jackson's GitHub grant), already in the Inbox as a
    step on the lead's noon item `fdfa8e51`; not filed again.
  - 2026-11-18 ~23:15Z: `status` and `setup --dry-run` both say no product. The API lists 6 products
    (ScreenReceipts, LeftSaid, Chirp, KegFold, PlotSlop, SimSunday) and 9 repositories, none for Teach Braille.
    Expected: the lead corrected at ~23:20Z that Jackson has NOT started the Create Workflow yet (the earlier
    "clicks are done" was a suggested prompt, not his message). Step `teachbraille` not confirmed. Waits for the
    lead to say he has done the clicks; then `status`, `setup --dry-run`.
  - 2026-11-19 ~00:55Z: the product EXISTS (TeachBraille `f51782f6`, repo `teachbraille-ios` `59b4ebec`, workflow
    Default `ECB65507`, enabled, AUTOMATIC START on any branch change, 0 runs). Step `teachbraille` CONFIRMED on
    /api/system/xcode-setup. `setup --dry-run` clean (would create TestFlight and Tests on `TeachBraille-CI`,
    disable Default). The real `setup` was DENIED by the Claude Code auto-mode permission check
    (Destructive or Unwanted Actions); not retried, not worked around; waits on Jackson or the lead to allow it.
    Until Default is disabled, DO NOT push teachbraille-ios: any push starts a Default build and spends shared
    hours. The yellow warning on the scheme: `TeachBraille.xcodeproj` is not in git (`ci_post_clone.sh` makes
    it with xcodegen), so Apple cannot read the scheme when it looks at the repo; expected, proven or not only
    by the first run (no other app has a green cloud run yet; ScreenReceipts' first three failed 00:20 to 00:36Z).

- **BLOCKED 08:56Z, waits on a Mac restart (lead item `teachbraille-preview-swap`)**: swap 7214 MB at 08:56Z, guard 6144. A restart is not one of the Jackson-lane reasons, so it is filed to the lead, not his Inbox. Return it to the Queue when swap reads under 6144 (`ssh macbook "sysctl vm.swapusage"`). The item: (2026-11-19 08:51Z NOT RUN: `preview-turn.sh` refused at its own guard, "Mac swap in use 7270 MB is not under 6144 MB" (exit 75); retry off-peak when the Mac's swap has fallen, same command; 08:53Z still 7246 MB used, not retried; check `ssh macbook "sysctl vm.swapusage"` first, and the next off-peak window is after 19:00Z. BLOCKED 08:54Z: swap 7230 MB with NO simulator booted and `mac-sim` free, so it is held by something else on the Mac and rarely falls before a restart; the guard (`TB_MAX_SWAP_MB`, 6144) exists because two turns died at 6.6 GB on 2026-11-18, so not raised. Filed to the lead, ref `teachbraille-preview-swap`: recommend a Mac restart, then run off-peak. Do not resend until the lead answers or swap reads under 6144) (unblocked 2026-11-19 07:55Z: ios-toolkit `20b2237` pushed, `ios test --build-only / --without-building / --settle-load N`; teachbraille-ios `3a730f8`, since 11:08Z on its own branch `preview-turn-split` (local main reset to origin/main; NOT pushed until Jackson allows the Xcode Cloud setup, lead 86e57e61) makes `scripts/preview-turn.sh` build once, wait for the Mac's load under 10, then record and test without building) Listing (d1) to (d4): requeue the preview turn, off-peak only (not weekdays 13:00 to 19:00 UTC): `cd /root/teachbraille-ios && TB_SKIP_STUDIO=1 hub-lock mac-sim --label "teachbraille preview turn iphone" -- bash scripts/preview-turn.sh iphone`, then d2 to d4 as in Needs Jackson below

- **DONE 2026-11-19 07:50Z (the lead, 07:11Z: footer first, then the split): footer Privacy link and Smart App Banner LIVE on every page (`35215f4`); 404 page follow-up in the Queue.** Was: **Waits on the ios-toolkit split (Jackson's own order), moved out of the Queue 2026-11-19 05:30Z** so the
  foreman stops resending it. Start it the moment the lead says the split landed or that the deploy may go first
  (lead item `teachbraille-footer-banner-order`). The full item:
  - [ ] (BLOCKED, by Jackson's own order, until the lead's ios-toolkit split lands (`ios test --help` shows `--without-building`); rechecked 05:28Z and 05:29Z, not there; filed to the lead `teachbraille-footer-banner-order`. Tried: nothing else, on purpose: the foreman approves nothing and cannot override his order.) (Jackson, Inbox `f2e07040`, 2026-11-19 ~05:05Z: "After the ios-toolkit split, add a footer link to the privacy page on every teachbraille.org page, and the Smart App Banner meta tag ... on every page. ... Deploy, check one page at 390 wide, one fyi line. Off-peak only." Off-peak = not weekdays 13:00 to 19:00 UTC. ORDER: start after the ios-toolkit split lands (`ios test --help` shows `--without-building`; not there at 05:09Z). STATE: the banner (`itunes: { appId: '6833681749' }` in `app/layout.tsx`, so every page) and the footer Privacy link (`components/Footer.tsx`) are already on origin/master, NOT live because the 03:47Z Vercel deploy failed (item (a) below). Every page uses Footer except `app/admin/page.tsx` (private, leave it), `app/summer/checkout/page.tsx` and `app/summer/success/page.tsx` (add Footer there, worktree). PLAN: worktree; Footer on the two summer pages; a test that every public page renders the Privacy link and the layout has the itunes meta; fix the Vercel `ignoreCommand` (item (a)); full production build and the "Before every merge" checks through heavy; push once (this is Jackson's okay to deploy); read back the meta and the footer Privacy link on https://teachbraille.org at 390 wide (plus /support, the app line on /learn/wrap-up, Word Game fit); one `needs-you --lane fyi` line) Footer Privacy link and Smart App Banner on every page, deployed
    - WAITING 2026-11-19 05:28Z (foreman push 1): the ios-toolkit split has still not landed (`ios test --help` has
      no `--without-building`; ios-toolkit HEAD `3254d00`). Jackson's own order puts this after it, and the foreman
      approves nothing, so not started. The lead holds the split (`teachbraille-preview-split`). Every other Queue
      item is blocked too (see each).

- **Listing (d1) to (d4): UNBLOCKED 2026-11-19 07:55Z (split pushed, ios-toolkit `20b2237`); requeue item at the top of the Queue.** Was: BLOCKED on tooling, filed for the lead (`teachbraille-preview-split`,
  2026-11-19). Three Mac tries failed before any test ran (memory kill, abrt, then `Timed out waiting for AX loaded
notification`), the third because our own build-for-testing raises the Mac load and the test runner starts under it.
  `ios test` has no build-only / test-only split for the simulator (checked 2026-11-19 ~04:00Z, still none), so
  `preview-turn.sh` cannot wait for a quiet Mac between build and test. Needs: `ios test --without-building` (or
  build-for-testing, wait for load under 10, then test-without-building) in ios-toolkit. Then requeue:
  `cd /root/teachbraille-ios && TB_SKIP_STUDIO=1 hub-lock mac-sim --label "teachbraille preview turn iphone" -- bash scripts/preview-turn.sh iphone`.
  Full history of the tries: git history of this file (the d1 Queue line before 2026-11-19).

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

In order. The latest session handoff is `docs/sessions/2026-11-19.md` (before it, `docs/sessions/2026-11-18.md`).

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
