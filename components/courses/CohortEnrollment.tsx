import { prisma } from '@/lib/prisma';
import { SpotsProvider } from '@/lib/spots-context';
import EnrollmentForm from '@/components/EnrollmentForm';
import SpotsBadge from '@/components/SpotsBadge';
import Eyebrow from '@/components/ui/Eyebrow';
import type { Cohort } from '@/lib/cohort';

/** Public enrollment (Stripe embedded checkout). Rendered only when lib/cohort.ts has a NEXT_COHORT. */
export default async function CohortEnrollment({ cohort }: { cohort: Cohort }) {
  let sections: { id: string; label: string; maxCapacity: number; enrolledCount: number; status: string }[] = [];
  try {
    sections = await prisma.section.findMany({ orderBy: { label: 'asc' } });
  } catch {
    // Database unavailable — the form shows its sold-out / waitlist state.
  }
  return (
    <SpotsProvider initialSections={sections}>
      <section className="section" id="enroll" aria-labelledby="enroll-h">
        <div className="wrap-narrow stack">
          <Eyebrow>Enroll</Eyebrow>
          <h2 id="enroll-h">Reserve your spot: {cohort.name}</h2>
          <p className="lead">{cohort.dates}</p>
          <p className="chip chip--tomato">
            <SpotsBadge variant="hero-chip" />
          </p>
          <div className="tile enroll-tile">
            <EnrollmentForm />
          </div>
        </div>
      </section>
    </SpotsProvider>
  );
}
