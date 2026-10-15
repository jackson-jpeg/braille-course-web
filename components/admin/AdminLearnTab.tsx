'use client';

import { useState, useEffect, useCallback } from 'react';
import { SkeletonCards } from './AdminSkeleton';

interface LearnAnalytics {
  days: number;
  totals: { uniqueLearners: number; lessonStarts: number; lessonCompletes: number; gamePlays: number };
  perGame: { gameId: string; label: string; plays: number; players: number }[];
  perLesson: { slug: string; title: string; starts: number; completes: number; learners: number }[];
  dailyTrend: { date: string; learners: number }[];
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

export default function AdminLearnTab() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<LearnAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/learn-analytics?days=${days}`);
      const json = await res.json();
      if (res.ok) setData(json);
      else setError(true);
    } catch (err) {
      console.error('Failed to load learn analytics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const maxTrend = data ? Math.max(...data.dailyTrend.map((d) => d.learners), 1) : 1;
  const maxGamePlays = data ? Math.max(...data.perGame.map((g) => g.plays), 1) : 1;
  const labelEvery = data ? Math.ceil(data.dailyTrend.length / 6) : 1;

  const hasAnyData =
    data &&
    (data.totals.uniqueLearners > 0 ||
      data.totals.lessonStarts > 0 ||
      data.totals.gamePlays > 0 ||
      data.totals.lessonCompletes > 0);

  return (
    <>
      {/* ── Range toggle ── */}
      <div className="admin-overview-toggle">
        {RANGES.map((r) => (
          <button
            key={r.days}
            className={`admin-overview-toggle-btn ${range === r.days ? 'admin-overview-toggle-active' : ''}`}
            onClick={() => setRange(r.days)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <div className="admin-analytics-section">
          <p className="admin-roster-empty">Couldn&apos;t load engagement data. Try again in a moment.</p>
        </div>
      ) : !hasAnyData ? (
        <div className="admin-analytics-section">
          <h3>Free Course &amp; Games Engagement</h3>
          <p className="admin-roster-empty">
            No learner activity recorded in this window yet. Anonymous plays and lesson activity from the free course at{' '}
            <code>/learn</code> and the practice games will show up here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Headline metrics ── */}
          <div className="admin-overview-metrics">
            <div className="admin-overview-card">
              <div className="admin-overview-card-value">{data!.totals.uniqueLearners.toLocaleString()}</div>
              <div className="admin-overview-card-label">Unique Learners</div>
              <div className="admin-overview-card-trend">Last {data!.days} days</div>
            </div>
            <div className="admin-overview-card">
              <div className="admin-overview-card-value">{data!.totals.gamePlays.toLocaleString()}</div>
              <div className="admin-overview-card-label">Game Plays</div>
            </div>
            <div className="admin-overview-card admin-overview-card-green">
              <div className="admin-overview-card-value">{data!.totals.lessonStarts.toLocaleString()}</div>
              <div className="admin-overview-card-label">Lessons Started</div>
            </div>
            <div className="admin-overview-card admin-overview-card-gold">
              <div className="admin-overview-card-value">{data!.totals.lessonCompletes.toLocaleString()}</div>
              <div className="admin-overview-card-label">Lessons Completed</div>
            </div>
          </div>

          {/* ── Daily active learners trend ── */}
          <div className="admin-analytics-section">
            <h3>Active Learners Per Day</h3>
            <div className="admin-bar-chart">
              {data!.dailyTrend.map((d, i) => {
                const label = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div key={d.date} className="admin-bar-col" title={`${label}: ${d.learners} learners`}>
                    <div
                      className="admin-bar"
                      style={{ height: `${d.learners > 0 ? Math.max((d.learners / maxTrend) * 100, 3) : 0}%` }}
                    />
                    <span className="admin-bar-label">{i % labelEvery === 0 ? label : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Top games ── */}
          {data!.perGame.length > 0 && (
            <div className="admin-analytics-section">
              <h3>Games by Plays</h3>
              <div className="admin-hbar-chart">
                {data!.perGame.map((g) => (
                  <div key={g.gameId} className="admin-hbar-row">
                    <span className="admin-hbar-label">{g.label}</span>
                    <div className="admin-hbar-track">
                      <div
                        className="admin-hbar-fill admin-hbar-fill-navy"
                        style={{ width: `${(g.plays / maxGamePlays) * 100}%` }}
                      />
                    </div>
                    <span className="admin-hbar-count">
                      {g.plays.toLocaleString()}
                      <span className="admin-hbar-subcount"> · {g.players.toLocaleString()} players</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-lesson breakdown ── */}
          {data!.perLesson.length > 0 && (
            <div className="admin-analytics-section">
              <h3>Course Lessons</h3>
              <table className="admin-progress-overview-table">
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Learners</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.perLesson.map((l) => {
                    const pct = l.starts > 0 ? Math.round((l.completes / l.starts) * 100) : 0;
                    return (
                      <tr key={l.slug}>
                        <td>{l.title}</td>
                        <td>{l.learners.toLocaleString()}</td>
                        <td>{l.starts.toLocaleString()}</td>
                        <td>{l.completes.toLocaleString()}</td>
                        <td>
                          <div className="admin-mini-progress">
                            <div className="admin-mini-progress-track">
                              <div className="admin-mini-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="admin-mini-progress-pct">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
