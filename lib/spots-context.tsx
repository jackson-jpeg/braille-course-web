'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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
        setSections(data);
      }
    } catch {
      // Silently fail — keep existing data
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshSections, 30_000);
    return () => clearInterval(interval);
  }, [refreshSections]);

  return (
    <SpotsContext.Provider value={{ sections, totalRemaining, totalSpots, refreshSections }}>
      {children}
    </SpotsContext.Provider>
  );
}

export function useSpots() {
  const ctx = useContext(SpotsContext);
  if (!ctx) throw new Error('useSpots must be used within a SpotsProvider');
  return ctx;
}
