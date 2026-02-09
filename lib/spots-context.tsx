'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface Section {
  id: string;
  label: string;
  maxCapacity: number;
  enrolledCount: number;
  status: string;
}

interface SpotsContextValue {
  sections: Section[];
  totalRemaining: number;
  totalSpots: number;
  stale: boolean;
  lastUpdated: Date | null;
  refreshSections: () => Promise<void>;
}

const SpotsContext = createContext<SpotsContextValue | null>(null);

export function SpotsProvider({
  initialSections,
  children,
}: {
  initialSections: Section[];
  children: ReactNode;
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const totalSpots = sections.reduce((sum, s) => sum + s.maxCapacity, 0);
  const totalRemaining = sections.reduce(
    (sum, s) => sum + Math.max(0, s.maxCapacity - s.enrolledCount),
    0
  );

  const refreshSections = useCallback(async () => {
    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) {
          setSections(data);
          setStale(false);
          setLastUpdated(new Date());
        }
      } else if (mountedRef.current) {
        setStale(true);
      }
    } catch {
      if (mountedRef.current) {
        setStale(true);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const interval = setInterval(refreshSections, 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshSections]);

  return (
    <SpotsContext.Provider value={{ sections, totalRemaining, totalSpots, stale, lastUpdated, refreshSections }}>
      {children}
    </SpotsContext.Provider>
  );
}

export function useSpots() {
  const ctx = useContext(SpotsContext);
  if (!ctx) throw new Error('useSpots must be used within a SpotsProvider');
  return ctx;
}
