-- Drop-off review (Jackson approved Inbox d4048fe3): aggregates only, read-only role, read-only transaction.
BEGIN READ ONLY;
\echo '== span and totals'
SELECT min("createdAt")::date AS first_day, max("createdAt")::date AS last_day,
       count(*) AS events, count(DISTINCT "visitorId") AS visitors
FROM "AnalyticsEvent";
SELECT "eventType", count(*) AS events, count(DISTINCT "visitorId") AS visitors
FROM "AnalyticsEvent" GROUP BY 1 ORDER BY 1;

\echo '== lessons in course order: visitors who started, who completed'
WITH course(pos, slug) AS (VALUES
  (1,'the-braille-cell'),(2,'letters-a-j'),(3,'letters-k-t'),(4,'letters-u-z'),(5,'reading-words'),
  (6,'capitals'),(7,'capital-words'),(8,'numbers'),(9,'numbers-in-text'),(10,'punctuation'),
  (11,'punctuation-more'),(12,'alphabet-wordsigns'),(13,'strong-contractions'),(14,'strong-groupsigns'),
  (15,'lower-groupsigns'),(16,'lower-wordsigns'),(17,'reading-sentences'),(18,'wrap-up'))
SELECT c.pos, c.slug,
  count(DISTINCT e."visitorId") FILTER (WHERE e."eventType"='lesson_start') AS started,
  count(DISTINCT e."visitorId") FILTER (WHERE e."eventType"='lesson_complete') AS completed
FROM course c LEFT JOIN "AnalyticsEvent" e ON e.target = c.slug
GROUP BY c.pos, c.slug ORDER BY c.pos;

\echo '== lesson targets not in the course list (renamed or old slugs)'
SELECT target, count(*) FROM "AnalyticsEvent"
WHERE "eventType" LIKE 'lesson%' AND target NOT IN ('the-braille-cell','letters-a-j','letters-k-t','letters-u-z',
 'reading-words','capitals','capital-words','numbers','numbers-in-text','punctuation','punctuation-more',
 'alphabet-wordsigns','strong-contractions','strong-groupsigns','lower-groupsigns','lower-wordsigns',
 'reading-sentences','wrap-up')
GROUP BY 1 ORDER BY 2 DESC;

\echo '== how far each visitor got: furthest lesson completed (visitors per furthest step)'
WITH course(pos, slug) AS (VALUES
  (1,'the-braille-cell'),(2,'letters-a-j'),(3,'letters-k-t'),(4,'letters-u-z'),(5,'reading-words'),
  (6,'capitals'),(7,'capital-words'),(8,'numbers'),(9,'numbers-in-text'),(10,'punctuation'),
  (11,'punctuation-more'),(12,'alphabet-wordsigns'),(13,'strong-contractions'),(14,'strong-groupsigns'),
  (15,'lower-groupsigns'),(16,'lower-wordsigns'),(17,'reading-sentences'),(18,'wrap-up')),
far AS (SELECT e."visitorId", max(c.pos) AS pos FROM "AnalyticsEvent" e JOIN course c ON c.slug=e.target
        WHERE e."eventType"='lesson_complete' GROUP BY 1)
SELECT pos AS furthest_completed, count(*) AS visitors FROM far GROUP BY 1 ORDER BY 1;

\echo '== visitors who started a lesson but completed none'
SELECT count(DISTINCT "visitorId") FROM "AnalyticsEvent" s WHERE "eventType"='lesson_start'
  AND NOT EXISTS (SELECT 1 FROM "AnalyticsEvent" c WHERE c."visitorId"=s."visitorId" AND c."eventType"='lesson_complete');

\echo '== games: plays and players'
SELECT target, count(*) AS plays, count(DISTINCT "visitorId") AS players
FROM "AnalyticsEvent" WHERE "eventType"='game_play' GROUP BY 1 ORDER BY 2 DESC;

\echo '== lessons-only, games-only, both'
WITH v AS (SELECT "visitorId", bool_or("eventType" LIKE 'lesson%') AS l, bool_or("eventType"='game_play') AS g
           FROM "AnalyticsEvent" GROUP BY 1)
SELECT count(*) FILTER (WHERE l AND NOT g) AS lessons_only, count(*) FILTER (WHERE g AND NOT l) AS games_only,
       count(*) FILTER (WHERE l AND g) AS both FROM v;

\echo '== weekly visitors'
SELECT date_trunc('week',"createdAt")::date AS week, count(DISTINCT "visitorId") AS visitors, count(*) AS events
FROM "AnalyticsEvent" GROUP BY 1 ORDER BY 1;
ROLLBACK;
