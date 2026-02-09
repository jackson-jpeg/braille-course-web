'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface CalendarSession {
  id: string;
  sectionLabel: string;
  title: string;
  date: string;
  sessionNum: number;
}

interface CalendarEmail {
  id: string;
  subject: string;
  scheduledFor: string;
}

interface CalendarAssignment {
  id: string;
  title: string;
  sectionLabel: string;
  dueDate: string;
}

interface Props {
  onNavigate: (tab: string) => void;
}

export default function AdminCalendarView({ onNavigate }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [emails, setEmails] = useState<CalendarEmail[]>([]);
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/calendar');
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
        setEmails(data.scheduledEmails || []);
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    // Pad to fill last row
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [year, month]);

  function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Build lookup maps
  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {};
    sessions.forEach((s) => {
      const key = dateKey(new Date(s.date));
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const emailsByDate = useMemo(() => {
    const map: Record<string, CalendarEmail[]> = {};
    emails.forEach((e) => {
      const key = dateKey(new Date(e.scheduledFor));
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [emails]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, CalendarAssignment[]> = {};
    assignments.forEach((a) => {
      const key = dateKey(new Date(a.dueDate));
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [assignments]);

  const todayStr = dateKey(new Date());

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Upcoming events (next 5)
  const upcoming = useMemo(() => {
    const now = new Date();
    const events: { date: string; label: string; type: string; action: () => void }[] = [];

    sessions.forEach((s) => {
      if (new Date(s.date) >= now) {
        events.push({
          date: s.date,
          label: `${s.sectionLabel}: ${s.title}`,
          type: 'session',
          action: () => onNavigate('students'),
        });
      }
    });
    emails.forEach((e) => {
      if (new Date(e.scheduledFor) >= now) {
        events.push({
          date: e.scheduledFor,
          label: e.subject,
          type: 'email',
          action: () => onNavigate('emails'),
        });
      }
    });
    assignments.forEach((a) => {
      if (new Date(a.dueDate) >= now) {
        events.push({
          date: a.dueDate,
          label: `${a.sectionLabel}: ${a.title} due`,
          type: 'assignment',
          action: () => onNavigate('students'),
        });
      }
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return events.slice(0, 5);
  }, [sessions, emails, assignments, onNavigate]);

  const sectionColors: Record<string, string> = {
    'Section A': 'var(--navy)',
    'Section B': 'var(--sage-dark)',
  };

  if (loading) {
    return <p style={{ padding: '12px 0', color: '#6b7280', fontSize: '0.9rem' }}>Loading calendar&hellip;</p>;
  }

  return (
    <div className="admin-calendar">
      <div className="admin-calendar-nav">
        <button className="admin-calendar-nav-btn" onClick={prevMonth}>&larr;</button>
        <span className="admin-calendar-month">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button className="admin-calendar-nav-btn" onClick={nextMonth}>&rarr;</button>
      </div>

      <div className="admin-calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="admin-calendar-dow">{d}</div>
        ))}

        {calendarDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="admin-calendar-cell admin-calendar-cell-empty" />;

          const dk = dateKey(day);
          const isToday = dk === todayStr;
          const daySessions = sessionsByDate[dk] || [];
          const dayEmails = emailsByDate[dk] || [];
          const dayAssignments = assignmentsByDate[dk] || [];
          const hasEvents = daySessions.length > 0 || dayEmails.length > 0 || dayAssignments.length > 0;

          return (
            <div key={dk} className={`admin-calendar-cell ${isToday ? 'admin-calendar-cell-today' : ''}`}>
              <span className="admin-calendar-day-num">{day.getDate()}</span>
              {hasEvents && (
                <div className="admin-calendar-dots">
                  {daySessions.map((s) => (
                    <button
                      key={s.id}
                      className="admin-calendar-dot"
                      style={{ background: sectionColors[s.sectionLabel] || 'var(--navy)' }}
                      title={`${s.sectionLabel}: ${s.title}`}
                      onClick={() => onNavigate('students')}
                    />
                  ))}
                  {dayEmails.map((e) => (
                    <button
                      key={e.id}
                      className="admin-calendar-dot admin-calendar-dot-email"
                      title={`Email: ${e.subject}`}
                      onClick={() => onNavigate('emails')}
                    >
                      <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2"/>
                        <path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  ))}
                  {dayAssignments.map((a) => (
                    <button
                      key={a.id}
                      className="admin-calendar-dot admin-calendar-dot-assignment"
                      title={`Due: ${a.title} (${a.sectionLabel})`}
                      onClick={() => onNavigate('students')}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div className="admin-calendar-upcoming">
          <h4 className="admin-calendar-upcoming-title">Upcoming</h4>
          {upcoming.map((ev, i) => (
            <button key={i} className="admin-calendar-upcoming-item" onClick={ev.action}>
              <span className={`admin-calendar-upcoming-dot admin-calendar-upcoming-dot-${ev.type}`} />
              <span className="admin-calendar-upcoming-date">
                {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="admin-calendar-upcoming-label">{ev.label}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && sessions.length === 0 && emails.length === 0 && assignments.length === 0 && (
        <div className="admin-empty-state" style={{ padding: '24px 0' }}>
          <p className="admin-empty-state-title">No events scheduled</p>
          <p className="admin-empty-state-sub">Sessions, emails, and assignments will appear here.</p>
        </div>
      )}
    </div>
  );
}
