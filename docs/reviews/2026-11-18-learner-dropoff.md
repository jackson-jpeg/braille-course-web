# Teach Braille: where learners stop (2026-11-18)

Jackson approved one read-only look at the anonymous learner events (Inbox `d4048fe3`). Read once, on
2026-11-18 at about 14:10 UTC, with the read-only role `hub_readonly` (it can read only `AnalyticsEvent`),
inside a read-only transaction. Only totals were read: no single learner's rows were printed or kept.
The queries are in `docs/reviews/2026-11-18-learner-dropoff.sql`.

## What the numbers mean

- **Started** a lesson: opened its page (counted again on every open, so one person can start many times).
- **Completed** a lesson: solved every item in its drill (or pressed finish on the wrap-up).
- **A game play**: one finished round. Speed Match rounds last seconds, so it has far more plays than any
  other game.
- **A visitor**: one browser. Clearing the browser, or a second device, counts as a new visitor.
- **Since November 17 counting is opt-in**: only people who press "Get Started" in the welcome box on
  `/games` are counted. Before that everyone was counted. The week of November 16 (28 visitors) is low for
  that reason, not because fewer people came.

## Totals, October 15 to November 18

- 344 visitors, 8,446 events.
- 256 opened at least one lesson. **127 of them (half) never completed one.**
- 129 completed at least one lesson. **6 reached the end** (completed the wrap-up).
- 151 played a game. 88 visitors only played games and never opened a lesson; 193 only used lessons.

| Week of                     | Visitors | Events |
| --------------------------- | -------- | ------ |
| Oct 12                      | 46       | 473    |
| Oct 19                      | 78       | 1,646  |
| Oct 26                      | 72       | 1,891  |
| Nov 2                       | 63       | 1,722  |
| Nov 9                       | 120      | 1,887  |
| Nov 16 (opt-in from Nov 17) | 28       | 827    |

## Lesson by lesson

| #   | Lesson              | Opened | Completed | Completed, of opened |
| --- | ------------------- | ------ | --------- | -------------------- |
| 1   | The braille cell    | 171    | 106       | 62%                  |
| 2   | Letters a to j      | 127    | 69        | 54%                  |
| 3   | Letters k to t      | 81     | 43        | 53%                  |
| 4   | Letters u to z      | 57     | 30        | 53%                  |
| 5   | Reading words       | 57     | 29        | 51%                  |
| 6   | Capitals            | 54     | 24        | 44%                  |
| 7   | Capital words       | 45     | 20        | 44%                  |
| 8   | Numbers             | 46     | 18        | 39%                  |
| 9   | Numbers in text     | 38     | 12        | 32%                  |
| 10  | Punctuation         | 34     | 12        | 35%                  |
| 11  | More punctuation    | 34     | 8         | 24%                  |
| 12  | Alphabet wordsigns  | 47     | 16        | 34%                  |
| 13  | Strong contractions | 37     | 15        | 41%                  |
| 14  | Strong groupsigns   | 35     | 12        | 34%                  |
| 15  | Lower groupsigns    | 28     | 6         | 21%                  |
| 16  | Lower wordsigns     | 25     | 5         | 20%                  |
| 17  | Reading sentences   | 27     | 8         | 30%                  |
| 18  | Wrap-up             | 24     | 6         | 25%                  |

**Where people stop** (the furthest lesson each learner completed):

- 41 stopped after lesson 1, 27 after lesson 2, 12 after lesson 3: **80 of the 129 who completed anything
  stopped within the first three lessons.**
- Past lesson 4 it thins out slowly: 1 to 6 people stop at each later lesson.
- Lesson 12 (alphabet wordsigns) is opened by more people (47) than lessons 9 to 11, so some people jump
  ahead to contractions.

## What stands out

1. **The first visit is where most people are lost.** Half of those who open a lesson never finish one, and
   lesson 1 loses 38% of the people who open it. Small changes here count the most.
2. **Lessons 1 to 3 are where finishers stop.** Fewer than 1 in 4 who finish lesson 1 go on past lesson 3.
3. **Lessons 11, 15 and 16 have the lowest completion** (20 to 24%): more punctuation, lower groupsigns and
   lower wordsigns. They may be long, or hard to finish in one sitting.
4. **88 people play games and never open a lesson.** Games are a way in that does not lead to the course.

## Ideas to try (proposals only, nothing built)

1. Look at lesson 1 from a first-time visitor's side: how long the drill is, and whether it is clear what
   "done" means. Then decide on one change and measure the next 4 weeks against these numbers.
2. At the end of lessons 1, 2 and 3, a clear next step ("Next: letters a to j, about N minutes").
3. On `/games`, after a few rounds, one line pointing to lesson 1.
4. Look at lessons 11, 15 and 16 for length; splitting a long drill would raise the finish rate there.

With opt-in counting, later numbers will be smaller and come only from people who said yes, so compare
rates (completed of opened), not head counts.
