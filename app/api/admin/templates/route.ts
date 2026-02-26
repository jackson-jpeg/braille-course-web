import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.contentTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, title, notes, format, difficulty, instructions } = body;

    if (!label || !title || !notes) {
      return NextResponse.json({ error: 'label, title, and notes are required' }, { status: 400 });
    }

    // Validate email template variables
    const templateFields = [title, notes, instructions];
    const variableRegex = /\{\{[a-zA-Z][a-zA-Z0-9]*\}\}/g;
    const invalidVariableRegex = /\{[^{}]*\}|\{\{[^a-zA-Z][^{}]*\}\}|\{\{[a-zA-Z][^a-zA-Z0-9]*\}\}/g;
    
    for (const field of templateFields) {
      if (typeof field === 'string') {
        const invalidVars = field.match(invalidVariableRegex);
        if (invalidVars) {
          return NextResponse.json({ 
            error: `Invalid template variable format: ${invalidVars.join(', ')}. Use {{variableName}} format.` 
          }, { status: 400 });
        }
      }
    }

    const template = await prisma.contentTemplate.create({
      data: {
        label,
        title,
        notes,
        format: format || 'pptx',
        difficulty: difficulty || 'intermediate',
        instructions: instructions || null,
      },
    });

    return NextResponse.json({
      template: { ...template, createdAt: template.createdAt.toISOString() },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
