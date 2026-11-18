# Teach Braille: what is next

Kept by the working session. The Queue section is the work, top first, one line per item (the foreman's format);
Needs Jackson is what waits on him. The notes below are detail and history. Each item deploys when its checks pass
(merge to `master`). When the queue runs dry, propose the next five toward users and revenue and start the first.

Line rules (Jackson and the line lead, 2026-11-19): full speed. Finish the item in hand, post one FYI line
(`needs-you`, bucket later), release any lock, start the next. Do not ask before testing, merging or deploying this
project's own work; only money, Apple ID steps, credentials and Jackson's product rules go to him. Mac and simulators
only through the foreman's `mac-sim` lock, Xcode Cloud first. Save every mockup, proof or artifact under `Assets/`.

## Queue

- [ ] (2026-11-18: built, teachbraille-ios `c967ea2`, `23cfa46`: `PathTests` pin World 2's 8 stops and its cards, BrailleKit `swift test` 101/101 on the Mac; `World2Tests.swift` (audit, flat, largest text, map, eyes-free map to reward) and a `reward:<stop>` launch route. UI run 05:58Z: 6 of 10 passed; World 2 audit timed out (infra, rerun), World 3 eyes-free game player too weak for 4 choices (fix SliceRun.game, rerun); details docs/sessions/2026-11-17.md, last section (`ios test teachbraille --only TeachBrailleUITests/World2Tests --only TeachBrailleUITests/World3Tests`); tick when green) World 2 (k to t) to World 1's test bar, in the app. Never change grouping or stop ids (saved progress). The website has no Meet the Six (only the unmerged `origin/redesign-oct-2026`): a web version is a new design, proposed to the lead, not built
- [ ] (2026-11-18: (a) merged to `master` (`4bbb3ad`), NOT live: Vercel rate-limited the build until about 2026-11-19 03:36 UTC; `vercel.json` now skips docs-only pushes (`ignoreCommand`, committed locally, unpushed on purpose); push ONCE after the limit lifts, then check /support live. (b) done: promotional text set and read back on 1.1 (live) and 1.1.1; support URL set on 1.1.1 (Apple refuses it on live 1.1, 409, rides with 1.1.1). (c) done: store name "Teach Braille" set and read back on the 1.1.1 app info (`asc-store.rb name`); the on-device display name follows in the next build. (d) plan `teachbraille-ios/docs/1.1.1/APP-PREVIEWS.md`; built (`e94018e`): driver `RecordingTests.testPreviewTour`, cut `scripts/preview-cut.sh`, upload `asc-store.rb preview`. Cut tested on a synthetic clip 2026-11-18 (630 MB peak, checks pass, `966382c`). Next: one `mac-sim` turn per device with `scripts/record.sh` (TB_UDID = the shared simulator), cut, review frames, upload to 1.1.1) App Store listing fixes
- [ ] (merged with the support page, `4bbb3ad`; live with the same push) Site audit fixes: Smart App Banner (`itunes: { appId: '6833681749' }` in `app/layout.tsx`) and a visible Privacy link on the home page (today only "Policies" in the footer); can ride with the support page deploy. Goal: app installs from Safari visitors, and trust
- [ ] (2026-11-18: no product exists; the API cannot make one. Tooling ported from Chirp, teachbraille-ios `b292ad4`: `ci_scripts/ci_post_clone.sh`, `scripts/asc/xcode_cloud.py` (status, setup, start, hours), `docs/xcode-cloud.md` with the click steps. Mac clone `~/teachbraille-ios-cloud` ready; the Create Workflow clicks (they need Jackson for the GitHub grant) are one step on sanger-1's noon item `fdfa8e51` (lead, 2026-11-18). Then: a CI test plan that skips RecordingTests, StoreShotTests and WorldShotTests; `setup`; `start tests`; delete the Mac clone) Xcode Cloud workflow for the iOS app (4.47 of 25 shared hours used this month), then the iOS 27.2 build and tests green there; one Inbox line with the first green run
- [ ] (2026-11-18: built with World 2, `23cfa46`: `PathTests` pin its 5 stops (the course teaches w last, so the range reads "u to w"); `World3Tests` subclasses `World2Tests`; UI run queued with World 2's) World 3 (u to z) to the same test bar
- [ ] (2026-11-18: the studio session `unpossible-studio-ac` owns it and built World 2 into https://unpossible.studio/play/teachbraille/ on its branch `tb-world2` (cells generated from our `lib/braille/ueb.ts` LETTER_CELLS on master; copy checked and approved here). Live when its light duty and Vercel limit lift; the "Teach Braille" rename there waits for 1.1.1's release. Left for us: send it the path of World 2 screenshots from the next `mac-sim` turn. `/root/braille-unpossible` is a clean worktree of this repo on `unpossible-analytics`, already merged to `master`) unpossible.studio: a playable Teach Braille update that shows the new world

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
