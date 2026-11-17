# Activity tracking is opt-in (2026-11-17)

Jackson's answer to the privacy-audit Inbox item `audit-teachbraille-tracking-optin`: "make it opt-in. Escape means
no, and keep the id only after a yes." Commit `5fb25bb` on `master`, live on https://teachbraille.org.

## What changed

- Anonymous lesson and game events (`/api/track`) are sent only after an explicit yes. The one yes is "Get Started" on
  the last step of the welcome box on `/games`. Before any answer, nothing is sent. This also covers learners who only
  use `/learn` and never see the box: they used to be counted by default and now are not.
- Escape and the close button mean no. They meant yes before. "Skip tracking" still means no.
- `brailleGames_visitorId` is created only after a yes and removed on a no. An id left in a browser by the earlier
  version is removed the next time an event would have been sent without a yes.
- A no no longer stops progress being saved on the device. (The older "Skip tracking" answer did, and browsers that
  gave it are left as they are.)
- The welcome box no longer says "Nothing is sent to any server", which was untrue with tracking on, and its last
  step says what Get Started turns on.
- Policies: the Free Course, browser storage and Do Not Track paragraphs describe opt-in. Effective date November 17.

Code: `lib/progress-storage.ts` (`setTrackingConsent`, `hasActivityConsent`, `removeVisitorId`),
`lib/analytics-track.ts`, `components/OnboardingModal.tsx`, `app/policies/page.tsx`.
Tests: `__tests__/site/onboarding-consent.test.tsx`, `__tests__/lib/learn-analytics.test.ts`.

## To expect

- The admin Learners tab will show fewer learners from now on: only those who say yes.
- Browsers that said yes under the old box stay on, including those where Escape was pressed (it counted as yes
  then). The two cannot be told apart.

## Open, in Jackson's Inbox

`teachbraille-optin-explicit-buttons`: whether the box should end with two equal buttons instead of Get Started
being the yes, and whether to ask everyone who answered before today again.

## Checks (the "Before every merge" list)

- `format:check`: clean for every tracked file after prettier on `__tests__/site/analytics.test.ts` (it arrived
  unformatted in an earlier commit). It still warns on `.claude/settings.local.json`, which is not tracked.
- `lint` (one existing warning), `tsc`: pass. Oracle: 14,771 translations, fixture unchanged.
- `NODE_ENV=production npm run build`: 45 suites, 1,818 tests pass.
- Local production server: geometry 2,868 cells, 0 problems. axe 0 violations.
- After the deploy, against https://teachbraille.org: geometry 2,867 cells, 0 problems. axe reported one contrast
  finding on `/summer` at 1280 px on the first run and 0 violations on the rerun. This change does not touch
  `/summer`; the colours it read look like a link part way through a fade. Worth a look if it shows again.

## Also done in this tree

- `npm ci`: `node_modules` here still held Next 14 and React 18 from July, while `package.json` has asked for Next
  15.5.28 and React 19.3 since October. Local checks before today ran on the old versions; Vercel always installed
  the right ones.
- Playwright's headless Chromium for the locked version (build 1194) was downloaded for the browser checks.
