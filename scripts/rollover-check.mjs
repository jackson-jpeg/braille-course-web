#!/usr/bin/env node
/**
 * Summer 2027 rollover — DB verification + fix.
 *
 *   node scripts/rollover-check.mjs           # report only (no writes)
 *   node scripts/rollover-check.mjs --fix      # delete stale date rows so
 *                                              # canonical 2027 code defaults apply
 *
 * Requires POSTGRES_PRISMA_URL in the environment (pull from Vercel/Neon).
 */
import { PrismaClient } from '@prisma/client';

const CANONICAL = {
  'course.startDate': '2027-06-07',
  'course.endDate': '2027-07-30',
  'course.balanceDueDate': '2027-05-01',
  'course.sessionCount': '15',
};

const fix = process.argv.includes('--fix');
const p = new PrismaClient();

const rows = await p.courseSettings.findMany();
console.log(`courseSettings rows: ${rows.length}`);
const stale = [];
for (const r of rows) {
  const flag = /2026/.test(r.value) ? '  <-- STALE 2026' : '';
  if (flag) stale.push(r);
  console.log(`  ${r.key} = ${r.value}${flag}`);
}

// Any 2026 enrollments / sessions still around (the other deferred step)?
const oldSessions = await p.classSession.count({ where: { date: { lt: new Date('2027-01-01') } } }).catch(() => null);
if (oldSessions !== null) console.log(`\nClassSession rows dated before 2027: ${oldSessions}`);

if (!stale.length) {
  console.log('\nNo stale 2026 date settings. Backend is on 2027.');
} else if (fix) {
  for (const r of stale) {
    const target = CANONICAL[r.key];
    if (target) {
      await p.courseSettings.update({ where: { key: r.key }, data: { value: target } });
      console.log(`fixed ${r.key} -> ${target}`);
    } else {
      console.log(`left ${r.key} (no canonical mapping — review manually)`);
    }
  }
} else {
  console.log('\nRun again with --fix to correct the stale rows above.');
}

await p.$disconnect();
