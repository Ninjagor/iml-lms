import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/src/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Create auditor session
    await createSession({
      userId: 'auditor',
      email: 'auditor@example.com',
      name: 'Auditor',
      role: 'auditor',
      status: 'approved',
      sessionVersion: 0,
    });

    return NextResponse.json(
      {
        user: {
          id: 'auditor',
          email: 'auditor@example.com',
          name: 'Auditor',
          role: 'auditor',
          status: 'approved',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auditor login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
