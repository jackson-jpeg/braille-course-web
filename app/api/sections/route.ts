import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      orderBy: { label: 'asc' },
      select: {
        id: true,
        label: true,
        maxCapacity: true,
        enrolledCount: true,
        status: true,
      },
    });

    return NextResponse.json(sections);
  } catch (err) {
    console.error('Failed to fetch sections:', (err as Error).message);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}
